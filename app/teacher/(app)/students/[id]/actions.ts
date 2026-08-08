'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedTeacherActionUserId } from '@/lib/teacher/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEsercizioPersonalizzato, type ErroreSubmission } from '@/lib/gemini/prompts/generatore'
import { GeminiError, isQuotaExhausted } from '@/lib/gemini/client'
import { checkGenerationRateLimit } from '@/lib/teacher/rate-limit'
import { computeStudentStats, type SubmissionRow } from '@/lib/analytics/studentStats'
import type { TipoEsercizioPersonalizzato } from '@/lib/gemini/schema'

export interface EsercizioItem {
  domanda: string
  opzioni: string[]
  risposta_corretta: string
  spiegazione_risposta: string
}

export interface PersonalizedExerciseRow {
  id: string
  tipo_esercizio: TipoEsercizioPersonalizzato
  titolo: string
  teoria: string
  spiegazione: string
  esempio: string
  consegna: string
  items: EsercizioItem[] | null
  submission_id: string | null
  risposte_studente: string[] | null
  punteggio_chiuso: number | null
  completato_at: string | null
  seen_by_teacher: boolean
  created_at: string
}

/**
 * Genera un esercizio personalizzato per uno studente, basato sulle sue
 * aree di miglioramento e categorie di errore più frequenti (calcolate
 * dalle sue submissions valutate). Salva il risultato in
 * personalized_exercises, visibile allo studente da /student/personalized.
 *
 * tipoEsercizio: se omesso/null, lascia che sia l'IA a scegliere il tipo
 * più adatto in base alle difficoltà rilevate.
 */
export async function generatePersonalizedExercise(
  studentId: string,
  tipoEsercizio?: TipoEsercizioPersonalizzato,
  erroriSubmission?: ErroreSubmission[]
) {
  const teacherId = await requireApprovedTeacherActionUserId()
  await checkGenerationRateLimit(teacherId)
  const supabase = createClient()

  // RLS (is_active_teacher_of) garantisce comunque che questa query veda
  // solo dati di uno studente effettivamente attivo sotto questo docente;
  // qui leggiamo anche per costruire il profilo di debolezze.
  const { data: profile } = await supabase
    .from('profiles')
    .select('livello_target')
    .eq('id', studentId)
    .eq('role', 'student')
    .single()

  if (!profile) {
    throw new Error('Studente non trovato o non assegnato a te.')
  }

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, tipo, created_at, consegna, valutazione_ia')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(30)

  const stats = computeStudentStats((submissions as SubmissionRow[]) ?? [])

  const categorieFrequenti = Object.entries(stats.erroriPerCategoria)
    .filter(([, conteggio]) => conteggio > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([categoria]) => categoria)

  let esercizio
  try {
    esercizio = await generateEsercizioPersonalizzato({
      livelloTarget: profile.livello_target ?? undefined,
      areeDiMiglioramento: stats.areeMiglioramentoFrequenti.map((a) => a.testo),
      categorieErroriFrequenti: categorieFrequenti,
      erroriSubmissionSpecifica: erroriSubmission,
      tipoEsercizio
    })
  } catch (err) {
    console.error('Errore generando esercizio personalizzato:', err)
    if (err instanceof GeminiError && isQuotaExhausted(err)) {
      throw new Error(
        "Il servizio IA ha raggiunto il limite giornaliero di richieste gratuite. Riprova più tardi (si resetta a mezzanotte, fuso orario USA/Pacifico) oppure passa a un piano a pagamento su Google AI Studio."
      )
    }
    throw new Error(
      "L'IA è temporaneamente sovraccarica e non ha potuto generare l'esercizio. Riprova tra qualche istante."
    )
  }

  const { error: insertError } = await supabase.from('personalized_exercises').insert({
    student_id: studentId,
    teacher_id: teacherId,
    tipo_esercizio: esercizio.tipo_esercizio,
    titolo: esercizio.titolo,
    teoria: esercizio.teoria,
    spiegazione: esercizio.spiegazione,
    esempio: esercizio.esempio,
    consegna: esercizio.consegna,
    items: esercizio.items.length > 0 ? esercizio.items : null,
    seen_by_student: false
  })

  if (insertError) {
    console.error('Errore salvando esercizio personalizzato:', insertError)
    throw new Error("Errore salvando l'esercizio personalizzato.")
  }

  revalidatePath(`/teacher/students/${studentId}`)
}

export async function getPersonalizedExercisesForStudent(
  studentId: string
): Promise<PersonalizedExerciseRow[]> {
  const teacherId = await requireApprovedTeacherActionUserId()
  const supabase = createClient()

  // Verifica che lo studente sia attivo sotto questo docente prima di restituire
  // gli esercizi — la RLS filtra per teacher_id ma non richiede una membership
  // attiva, quindi un docente potrebbe altrimenti vedere esercizi storici di
  // studenti già riassegnati ad altri.
  const { data: membership } = await supabase
    .from('class_memberships')
    .select('id')
    .eq('student_id', studentId)
    .eq('teacher_id', teacherId)
    .is('left_at', null)
    .maybeSingle()

  if (!membership) return []

  const { data, error } = await supabase
    .from('personalized_exercises')
    .select(
      'id, tipo_esercizio, titolo, teoria, spiegazione, esempio, consegna, items, submission_id, risposte_studente, punteggio_chiuso, completato_at, seen_by_teacher, created_at'
    )
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore caricando gli esercizi personalizzati:', error)
    return []
  }

  return (data ?? []) as PersonalizedExerciseRow[]
}

/**
 * Marca come "letti" tutti gli esercizi personalizzati consegnati di
 * questo studente (sia di tipo scrittura, sia a risposta chiusa) —
 * chiamata quando il docente visita la sua pagina di dettaglio, così la
 * notifica smette di apparire.
 */
export async function markPersonalizedExercisesSeen(studentId: string) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return

  const { error } = await supabase
    .from('personalized_exercises')
    .update({ seen_by_teacher: true })
    .eq('student_id', studentId)
    .eq('teacher_id', userData.user.id)
    .eq('seen_by_teacher', false)
    .or('submission_id.not.is.null,completato_at.not.is.null')

  if (error) {
    console.error('Errore marcando esercizi come visti dal docente:', error)
  }
}

export async function markLevelAchievementsSeenByTeacher(studentId: string) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return

  const admin = createAdminClient()
  await admin
    .from('level_achievements')
    .update({ seen_by_teacher: true })
    .eq('student_id', studentId)
    .eq('teacher_id', userData.user.id)
    .eq('seen_by_teacher', false)
}

/**
 * Data dell'ultimo accesso dello studente, letta da profiles.last_sign_in_at
 * (sincronizzato da auth.users via trigger — migrazione 0035). Prima
 * serviva il client admin per leggere auth.users (non accessibile via RLS
 * normale) con una verifica di ownership manuale a monte; ora basta una
 * query col client dell'utente — la RLS (profiles_select_by_teacher,
 * basata su is_active_teacher_of) restituisce la riga solo se lo studente
 * è effettivamente attivo sotto il docente corrente, senza bisogno di
 * controlli manuali né di bypassare RLS.
 */
export async function getLastSignInForStudent(studentId: string): Promise<string | null> {
  await requireApprovedTeacherActionUserId()
  const supabase = createClient()

  const { data } = await supabase
    .from('profiles')
    .select('last_sign_in_at')
    .eq('id', studentId)
    .maybeSingle()

  return (data as { last_sign_in_at?: string | null } | null)?.last_sign_in_at ?? null
}

export interface TeacherClassOption {
  id: string
  nome: string
}

/**
 * Classe attuale dello studente sotto questo docente (se ne ha una) e
 * lista delle classi del docente tra cui scegliere — usati dal selettore
 * di classe nella pagina di dettaglio studente.
 *
 * Chiamata direttamente dal render della pagina (non da un form): un
 * errore qui non va MAI propagato, altrimenti fa cadere l'intera pagina
 * di dettaglio studente (schermata generica "Server Components render"
 * senza dettagli, in produzione). Meglio mostrare il selettore vuoto che
 * rompere tutto il resto della pagina.
 */
export async function getClassAssignmentOptions(studentId: string): Promise<{
  currentClassId: string | null
  currentClassNome: string | null
  classi: TeacherClassOption[]
}> {
  const fallback = { currentClassId: null, currentClassNome: null, classi: [] }

  try {
    const teacherId = await requireApprovedTeacherActionUserId()
    const supabase = createClient()

    const [{ data: membership, error: membershipError }, { data: classi, error: classiError }] =
      await Promise.all([
        supabase
          .from('class_memberships')
          .select('class_id, classes(nome)')
          .eq('student_id', studentId)
          .eq('teacher_id', teacherId)
          .is('left_at', null)
          .maybeSingle(),
        supabase.from('classes').select('id, nome').eq('teacher_id', teacherId).order('nome', { ascending: true })
      ])

    if (membershipError) {
      console.error('Errore caricando la membership dello studente:', membershipError)
    }
    if (classiError) {
      console.error('Errore caricando le classi del docente:', classiError)
    }

    const classeAttuale = membership
      ? Array.isArray(membership.classes)
        ? membership.classes[0]
        : membership.classes
      : null

    return {
      currentClassId: membership?.class_id ?? null,
      currentClassNome: (classeAttuale as { nome?: string } | null)?.nome ?? null,
      classi: classi ?? []
    }
  } catch (err) {
    console.error('Errore imprevisto caricando le opzioni di classe:', err)
    return fallback
  }
}

/**
 * Assegna lo studente a un'altra classe dello stesso docente, o lo lascia
 * senza classe (classId null) — stesso stato "senza classe assegnata" che
 * ha uno studente appena iscritto col codice del docente prima di essere
 * smistato. Un semplice UPDATE basta perché il teacher_id non cambia mai
 * qui (a differenza di una riassegnazione a un altro docente).
 */
export async function updateStudentClass(studentId: string, classId: string | null) {
  const teacherId = await requireApprovedTeacherActionUserId()
  const supabase = createClient()

  if (classId) {
    const { data: targetClass } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('teacher_id', teacherId)
      .single()

    if (!targetClass) throw new Error('Classe non valida.')
  }

  const { data: membership } = await supabase
    .from('class_memberships')
    .select('id')
    .eq('student_id', studentId)
    .eq('teacher_id', teacherId)
    .is('left_at', null)
    .maybeSingle()

  if (!membership) throw new Error('Studente non trovato o non assegnato a te.')

  const { error } = await supabase
    .from('class_memberships')
    .update({ class_id: classId })
    .eq('id', membership.id)

  if (error) throw new Error('Errore aggiornando la classe dello studente.')

  revalidatePath('/teacher/classes')
  revalidatePath(`/teacher/students/${studentId}`)
  if (classId) revalidatePath(`/teacher/classes/${classId}`)
}

/**
 * Elimina PERMANENTEMENTE l'account di uno studente e tutti i suoi dati
 * (submissions, esercizi personalizzati, iscrizioni) — stessa logica
 * distruttiva di admin/users/actions.ts:deleteStudentCompletely, ma
 * invocabile direttamente dal docente proprietario dello studente.
 *
 * Usa il client admin (service role) perché non esiste una policy RLS di
 * delete su submissions/class_memberships (vedi migrazione 0002): la
 * verifica di ownership qui sotto (membership attiva docente↔studente) è
 * quindi l'UNICA barriera che impedisce a un docente di eliminare
 * l'account di uno studente che non è il suo — va mantenuta anche se in
 * futuro si aggiungessero policy di delete più permissive.
 */
export async function deleteStudentAsTeacher(
  studentId: string,
  confirmName: string,
  expectedName: string
) {
  const teacherId = await requireApprovedTeacherActionUserId()

  if (confirmName.trim() !== expectedName.trim()) {
    throw new Error('Il nome non corrisponde. Eliminazione annullata.')
  }

  const admin = createAdminClient()

  const { data: membership } = await admin
    .from('class_memberships')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .is('left_at', null)
    .maybeSingle()

  if (!membership) throw new Error('Studente non trovato o non assegnato a te.')

  const { error: exercisesError } = await admin
    .from('personalized_exercises')
    .delete()
    .eq('student_id', studentId)
  if (exercisesError) throw new Error('Errore eliminando gli esercizi personalizzati.')

  const { error: submissionsError } = await admin
    .from('submissions')
    .delete()
    .eq('student_id', studentId)
  if (submissionsError) throw new Error('Errore eliminando le submissions.')

  const { error: membershipsError } = await admin
    .from('class_memberships')
    .delete()
    .eq('student_id', studentId)
  if (membershipsError) throw new Error('Errore eliminando le iscrizioni.')

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(studentId)
  if (deleteUserError) throw new Error("Errore eliminando l'account.")

  revalidatePath('/teacher/classes')
  revalidatePath('/teacher/dashboard')
}

/**
 * Elimina un esercizio personalizzato. Solo il docente che lo ha creato
 * può eliminarlo — la RLS (teacher_id = auth.uid()) lo garantisce a
 * livello di DB. L'esercizio sparisce anche dalla vista dello studente.
 */
export async function deletePersonalizedExercise(exerciseId: string, studentId: string) {
  const teacherId = await requireApprovedTeacherActionUserId()
  const supabase = createClient()

  // Verifica esplicita di ownership prima del delete — difesa in profondità
  // rispetto alla sola RLS, per garantire che teacherId == esercizio.teacher_id
  // anche in caso di bug di caching o sessione compromessa.
  const { data: exercise } = await supabase
    .from('personalized_exercises')
    .select('teacher_id, student_id')
    .eq('id', exerciseId)
    .single()

  if (!exercise || exercise.teacher_id !== teacherId) {
    throw new Error("Esercizio non trovato o non hai i permessi per eliminarlo.")
  }

  if (exercise.student_id !== studentId) {
    throw new Error("Incongruenza tra studente ed esercizio.")
  }

  const { error } = await supabase
    .from('personalized_exercises')
    .delete()
    .eq('id', exerciseId)

  if (error) {
    throw new Error("Errore eliminando l'esercizio. Riprova.")
  }

  revalidatePath(`/teacher/students/${studentId}`)
}

export async function deleteSubmission(submissionId: string, studentId: string) {
  const teacherId = await requireApprovedTeacherActionUserId()
  const supabase = createClient()

  // Verifica esplicita di ownership prima del delete — difesa in profondità
  // rispetto alla sola RLS, allineata al pattern di deletePersonalizedExercise.
  const { data: membership } = await supabase
    .from('class_memberships')
    .select('id')
    .eq('student_id', studentId)
    .eq('teacher_id', teacherId)
    .is('left_at', null)
    .maybeSingle()

  if (!membership) {
    throw new Error("Studente non trovato o non appartiene alla tua classe.")
  }

  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submissionId)
    .eq('student_id', studentId)

  if (error) {
    throw new Error("Errore eliminando lo scritto.")
  }

  revalidatePath(`/teacher/students/${studentId}`)
}
