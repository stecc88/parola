'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedTeacherActionUserId } from '@/lib/teacher/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeStudentStats, type SubmissionRow } from '@/lib/analytics/studentStats'

export async function createClass(nome: string) {
  const supabase = createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    throw new Error('Non autenticato.')
  }

  // Defensa en profundidad: la página ya bloquea el acceso a profesores
  // no aprobados, pero esta Server Action es invocable independientemente
  // de la página, así que se vuelve a verificar acá.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, teacher_status')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'teacher' || profile.teacher_status !== 'approved') {
    throw new Error('Il tuo account insegnante non è ancora approvato.')
  }

  if (!nome.trim()) {
    throw new Error('Il nome della classe è obbligatorio.')
  }

  // invite_code se autogenera por trigger (set_invite_code), no se pasa acá.
  const { error } = await supabase.from('classes').insert({
    teacher_id: userData.user.id,
    nome: nome.trim()
  })

  if (error) throw new Error('Errore creando la classe.')
  revalidatePath('/teacher/classes')
}

/**
 * Asigna un estudiante sin clase (class_id NULL) a una classe concreta
 * del profesor. A diferencia de moveStudentToClass (que cierra/reabre la
 * membership), acá alcanza con un UPDATE directo porque el teacher_id ya
 * es el mismo — no hay cambio de "dueño", solo de classe.
 */
export async function assignStudentToClass(membershipId: string, classId: string) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')
  await requireApprovedTeacherActionUserId()

  const { data: targetClass } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', userData.user.id)
    .single()

  if (!targetClass) throw new Error('Classe non valida.')

  const { error } = await supabase
    .from('class_memberships')
    .update({ class_id: classId })
    .eq('id', membershipId)
    .eq('teacher_id', userData.user.id)

  if (error) throw new Error('Errore assegnando lo studente.')
  revalidatePath('/teacher/classes')
}

export async function getTeacherInviteCode(): Promise<string | null> {
  await requireApprovedTeacherActionUserId()
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data } = await supabase
    .from('profiles')
    .select('invite_code')
    .eq('id', userData.user.id)
    .single()

  return data?.invite_code ?? null
}

export interface UnassignedStudent {
  membership_id: string
  student_id: string
  nome: string
  cognome: string
}

export async function getUnassignedStudents(): Promise<UnassignedStudent[]> {
  await requireApprovedTeacherActionUserId()
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await supabase
    .from('class_memberships')
    .select('id, student_id, profiles!student_id(nome, cognome)')
    .eq('teacher_id', userData.user.id)
    .is('class_id', null)
    .is('left_at', null)

  if (error) {
    console.error('Errore caricando gli studenti non assegnati:', error)
    return []
  }

  return (data ?? []).map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return {
      membership_id: m.id,
      student_id: m.student_id,
      nome: profile?.nome ?? '',
      cognome: profile?.cognome ?? ''
    }
  })
}

export async function renameClass(classId: string, nuovoNome: string) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')
  await requireApprovedTeacherActionUserId()

  if (!nuovoNome.trim()) {
    throw new Error('Il nome della classe è obbligatorio.')
  }

  const { error } = await supabase
    .from('classes')
    .update({ nome: nuovoNome.trim() })
    .eq('id', classId)
    .eq('teacher_id', userData.user.id)

  if (error) throw new Error('Errore rinominando la classe.')
  revalidatePath('/teacher/classes')
  revalidatePath(`/teacher/classes/${classId}`)
}

/**
 * Elimina una classe. Los studenti que estuvieran en ella NO se pierden:
 * vuelven al estado "sin classe assegnata" (class_id = NULL), igual que
 * cuando se unen por primera vez con el codice del profesor.
 */
export async function deleteClass(classId: string) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')
  await requireApprovedTeacherActionUserId()

  // Verificar que la classe sea del profesor antes de tocar nada.
  const { data: classe } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', userData.user.id)
    .single()

  if (!classe) throw new Error('Classe non trovata.')

  // Liberar a los studenti antes de borrar (la FK class_memberships.class_id
  // tiene ON DELETE RESTRICT a propósito, para que un delete accidental no
  // se lleve studenti puestos sin querer — por eso lo hacemos explícito acá).
  await supabase
    .from('class_memberships')
    .update({ class_id: null })
    .eq('class_id', classId)
    .eq('teacher_id', userData.user.id)

  const { error } = await supabase.from('classes').delete().eq('id', classId)

  if (error) throw new Error('Errore eliminando la classe.')
  revalidatePath('/teacher/classes')
}

export interface NotificaConsegna {
  id: string
  titolo: string
  student_id: string
  nome: string
  cognome: string
  created_at: string
}

/**
 * Notifiche per il docente: esercizi personalizzati che lo studente ha
 * consegnato e che il docente non ha ancora visto (seen_by_teacher=false).
 * Si "leggono" automaticamente visitando /teacher/students/[id] di quello
 * studente (vedi markPersonalizedExercisesSeen).
 */
export async function getUnseenDeliveries(): Promise<NotificaConsegna[]> {
  await requireApprovedTeacherActionUserId()
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await supabase
    .from('personalized_exercises')
    .select('id, titolo, student_id, created_at, profiles!student_id(nome, cognome)')
    .eq('teacher_id', userData.user.id)
    .eq('seen_by_teacher', false)
    .or('submission_id.not.is.null,completato_at.not.is.null')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore caricando le notifiche:', error)
    return []
  }

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      titolo: row.titolo,
      student_id: row.student_id,
      nome: profile?.nome ?? '',
      cognome: profile?.cognome ?? '',
      created_at: row.created_at
    }
  })
}

export interface StudentOverviewRow {
  studentId: string
  nome: string
  cognome: string
  classeNome: string | null
  ultimoAccesso: string | null
  mediaGenerale: number | null
  totaleAttivita: number
  ultimaAttivitaAt: string | null
  giorniSenzaAttivita: number | null
  richiedeAttenzione: boolean
  motiviAttenzione: string[]
}

/**
 * Vista d'insieme di TUTTI gli studenti attivi del docente (assegnati a
 * una classe o non), con statistiche aggregate e un flag "richiede
 * attenzione" calcolato su 3 criteri pedagogici semplici:
 *   1. Inattivo da più di 7 giorni (mai entrato, o ultimo accesso vecchio)
 *   2. Media generale sotto il 60% (su attività già valutate)
 *   3. Nessuna attività consegnata negli ultimi 14 giorni, pur essendo
 *      iscritto da più tempo di quello
 *
 * Query N+1 deliberata (un giro per studente per submissions + ultimo
 * accesso): accettabile per il volume tipico di un singolo docente: non
 * ottimizzare prematuramente per migliaia di studenti.
 */
export async function getStudentsOverview(): Promise<StudentOverviewRow[]> {
  await requireApprovedTeacherActionUserId()
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data: memberships, error } = await supabase
    .from('class_memberships')
    .select('student_id, joined_at, profiles!student_id(nome, cognome), classes(nome)')
    .eq('teacher_id', userData.user.id)
    .is('left_at', null)

  if (error) {
    console.error('Errore caricando la vista studenti:', error)
    return []
  }

  const admin = createAdminClient()
  const oraMs = Date.now()

  const righe = await Promise.all(
    (memberships ?? []).map(async (m) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      const classe = Array.isArray(m.classes) ? m.classes[0] : m.classes

      const [{ data: submissions }, lastSignInResult] = await Promise.all([
        supabase
          .from('submissions')
          .select('id, tipo, created_at, consegna, valutazione_ia')
          .eq('student_id', m.student_id)
          .order('created_at', { ascending: false })
          .limit(50),
        admin.auth.admin.getUserById(m.student_id).catch(() => null)
      ])

      const stats = computeStudentStats((submissions as SubmissionRow[]) ?? [])
      const ultimoAccesso = lastSignInResult?.data?.user?.last_sign_in_at ?? null
      const ultimaAttivitaAt = submissions?.[0]?.created_at ?? null

      const giorniSenzaAccesso = ultimoAccesso
        ? Math.floor((oraMs - new Date(ultimoAccesso).getTime()) / 86_400_000)
        : null
      const giorniDaIscrizione = Math.floor(
        (oraMs - new Date(m.joined_at).getTime()) / 86_400_000
      )
      const giorniSenzaAttivita = ultimaAttivitaAt
        ? Math.floor((oraMs - new Date(ultimaAttivitaAt).getTime()) / 86_400_000)
        : giorniDaIscrizione

      const motivi: string[] = []
      if (giorniSenzaAccesso === null || giorniSenzaAccesso > 7) {
        motivi.push('Inattivo da più di 7 giorni')
      }
      if (stats.mediaGenerale !== null && stats.mediaGenerale < 60) {
        motivi.push('Media sotto il 60%')
      }
      if (giorniDaIscrizione > 14 && giorniSenzaAttivita !== null && giorniSenzaAttivita > 14) {
        motivi.push('Nessuna consegna negli ultimi 14 giorni')
      }

      return {
        studentId: m.student_id,
        nome: profile?.nome ?? '',
        cognome: profile?.cognome ?? '',
        classeNome: classe?.nome ?? null,
        ultimoAccesso,
        mediaGenerale: stats.mediaGenerale,
        totaleAttivita: stats.totaleAttivita,
        ultimaAttivitaAt,
        giorniSenzaAttivita,
        richiedeAttenzione: motivi.length > 0,
        motiviAttenzione: motivi
      } satisfies StudentOverviewRow
    })
  )

  // Chi richiede attenzione prima, poi per media crescente (i più in
  // difficoltà — anche tra chi non ne ha bisogno — restano comunque visibili
  // in alto).
  return righe.sort((a, b) => {
    if (a.richiedeAttenzione !== b.richiedeAttenzione) {
      return a.richiedeAttenzione ? -1 : 1
    }
    const mediaA = a.mediaGenerale ?? 100
    const mediaB = b.mediaGenerale ?? 100
    return mediaA - mediaB
  })
}
