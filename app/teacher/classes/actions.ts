'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedTeacherActionUserId } from '@/lib/teacher/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  computeStudentStats,
  classifyTrend,
  type SubmissionRow,
  type CategoriaErrore
} from '@/lib/analytics/studentStats'

export async function createClass(nome: string) {
  const supabase = createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    throw new Error('Non autenticato.')
  }

  // Difesa in profondità: la pagina blocca già i docenti non approvati,
  // ma questa Server Action è invocabile indipendentemente dalla pagina.
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

  // invite_code viene generato automaticamente dal trigger set_invite_code.
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

  // Verifica che la classe appartenga al docente prima di modificarla.
  const { data: classe } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', userData.user.id)
    .single()

  if (!classe) throw new Error('Classe non trovata.')

  // Scollega gli studenti prima di cancellare: la FK class_memberships.class_id
  // è ON DELETE RESTRICT di proposito, per evitare cancellazioni accidentali.
  await supabase
    .from('class_memberships')
    .update({ class_id: null })
    .eq('class_id', classId)
    .eq('teacher_id', userData.user.id)

  const { error } = await supabase.from('classes').delete().eq('id', classId)

  if (error) throw new Error('Errore eliminando la classe.')
  revalidatePath('/teacher/classes')
}

export async function getTeacherUnseenCount(): Promise<number | null> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, teacher_status')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'teacher' || profile.teacher_status !== 'approved') return null

  const [{ count: consegne }, { count: traguardi }] = await Promise.all([
    supabase
      .from('personalized_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', userData.user.id)
      .eq('seen_by_teacher', false)
      .or('submission_id.not.is.null,completato_at.not.is.null'),
    supabase
      .from('level_achievements')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', userData.user.id)
      .eq('seen_by_teacher', false)
  ])

  return (consegne ?? 0) + (traguardi ?? 0)
}

export interface NotificaTraguardo {
  id: string
  student_id: string
  nome: string
  cognome: string
  livello: string
  created_at: string
}

export async function getUnseenLevelAchievements(): Promise<NotificaTraguardo[]> {
  await requireApprovedTeacherActionUserId()
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await supabase
    .from('level_achievements')
    .select('id, student_id, livello, created_at, profiles!student_id(nome, cognome)')
    .eq('teacher_id', userData.user.id)
    .eq('seen_by_teacher', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore caricando i traguardi:', error)
    return []
  }

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      student_id: row.student_id,
      livello: row.livello,
      nome: profile?.nome ?? '',
      cognome: profile?.cognome ?? '',
      created_at: row.created_at
    }
  })
}

export async function markLevelAchievementSeenByTeacher(achievementId: string): Promise<void> {
  await requireApprovedTeacherActionUserId()
  const admin = createAdminClient()
  await admin
    .from('level_achievements')
    .update({ seen_by_teacher: true })
    .eq('id', achievementId)
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
  livelloTarget: string | null
  livelloAttuale: string | null
  trend: 'miglioramento' | 'stabile' | 'calo' | null
  consegnaPercentuale: number | null
  erroriPerCategoria: Record<CategoriaErrore, number>
  ultimoAccesso: string | null
  mediaGenerale: number | null
  totaleAttivita: number
  ultimaAttivitaAt: string | null
  giorniSenzaAttivita: number | null
  giorniPrimaCorrezione: number | null
  richiedeAttenzione: boolean
  motiviAttenzione: string[]
}

/**
 * Vista d'insieme di TUTTI gli studenti attivi del docente.
 * Refactored da N+1 a batch: 3 query totali indipendentemente dal numero
 * di studenti (memberships+profiles, submissions IN(...), listUsers).
 * Il precedente pattern (1 query per studente per submissions + 1 auth
 * call per studente) causava timeout con classi >30 studenti.
 */
export async function getStudentsOverview(): Promise<StudentOverviewRow[]> {
  await requireApprovedTeacherActionUserId()
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  // Query 1: memberships + profiles + classi (unica JOIN)
  const { data: memberships, error } = await supabase
    .from('class_memberships')
    .select('student_id, joined_at, profiles!student_id(nome, cognome, livello_target), classes(nome)')
    .eq('teacher_id', userData.user.id)
    .is('left_at', null)

  if (error) {
    console.error('Errore caricando la vista studenti:', error)
    return []
  }

  if (!memberships || memberships.length === 0) return []

  const studentIds = memberships.map((m) => m.student_id)
  const admin = createAdminClient()
  const oraMs = Date.now()

  // Query 2 + 3 in parallelo: tutte le submissions (IN) + listUsers per last_sign_in
  const [{ data: allSubmissions }, { data: authUsers }] = await Promise.all([
    supabase
      .from('submissions')
      .select('id, student_id, tipo, created_at, consegna, valutazione_ia, valutazione_completed_at')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }).catch((err) => {
      console.error('Errore recuperando last_sign_in (non bloccante):', err)
      return { data: { users: [] } }
    })
  ])

  // Mappa in-memory: student_id → submissions (già ordinate desc per created_at)
  const submissionsByStudent = new Map<string, SubmissionRow[]>()
  for (const s of allSubmissions ?? []) {
    const list = submissionsByStudent.get(s.student_id) ?? []
    list.push(s as SubmissionRow)
    submissionsByStudent.set(s.student_id, list)
  }

  // Mappa in-memory: student_id → last_sign_in_at
  const lastSignInMap = new Map<string, string | null>()
  for (const u of authUsers?.users ?? []) {
    if (studentIds.includes(u.id)) {
      lastSignInMap.set(u.id, u.last_sign_in_at ?? null)
    }
  }

  // Calcolo statistiche interamente in-memory (zero ulteriori roundtrip)
  const righe: StudentOverviewRow[] = memberships.map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    const classe = Array.isArray(m.classes) ? m.classes[0] : m.classes
    const submissions = submissionsByStudent.get(m.student_id) ?? []

    const stats = computeStudentStats(submissions)
    const ultimoAccesso = lastSignInMap.get(m.student_id) ?? null
    const ultimaAttivitaAt = submissions[0]?.created_at ?? null

    const dateCorrezioni = submissions
      .map((s) => (s as { valutazione_completed_at?: string | null }).valutazione_completed_at)
      .filter((d): d is string => !!d)
    const primaCorrezioneAt =
      dateCorrezioni.length > 0 ? dateCorrezioni.reduce((min, d) => (d < min ? d : min)) : null
    const giorniPrimaCorrezione = primaCorrezioneAt
      ? Math.floor(
          (new Date(primaCorrezioneAt).getTime() - new Date(m.joined_at).getTime()) / 86_400_000
        )
      : null

    const giorniSenzaAccesso = ultimoAccesso
      ? Math.floor((oraMs - new Date(ultimoAccesso).getTime()) / 86_400_000)
      : null
    const giorniDaIscrizione = Math.floor((oraMs - new Date(m.joined_at).getTime()) / 86_400_000)
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
      livelloTarget: profile?.livello_target ?? null,
      livelloAttuale: stats.livelloAttuale,
      trend: classifyTrend(stats.evoluzione),
      consegnaPercentuale: stats.consegna.percentuale,
      erroriPerCategoria: stats.erroriPerCategoria,
      ultimoAccesso,
      mediaGenerale: stats.mediaGenerale,
      totaleAttivita: stats.totaleAttivita,
      ultimaAttivitaAt,
      giorniSenzaAttivita,
      giorniPrimaCorrezione,
      richiedeAttenzione: motivi.length > 0,
      motiviAttenzione: motivi
    } satisfies StudentOverviewRow
  })

  return righe.sort((a, b) => {
    if (a.richiedeAttenzione !== b.richiedeAttenzione) return a.richiedeAttenzione ? -1 : 1
    return (a.mediaGenerale ?? 100) - (b.mediaGenerale ?? 100)
  })
}

/**
 * Cuántos ejercicios personalizados generó este docente que el alumno
 * todavía no resolvió (sin submission_id de scrittura ni completato_at
 * de tipo cerrado) — útil para saber si vale la pena recordarle a algún
 * alumno que tiene tarea pendiente.
 */
export async function getPendingPersonalizedCount(): Promise<number> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return 0

  const { count } = await supabase
    .from('personalized_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', userData.user.id)
    .is('submission_id', null)
    .is('completato_at', null)

  return count ?? 0
}
