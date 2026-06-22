'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEsercizioPersonalizzato } from '@/lib/gemini/prompts/generatore'
import { computeStudentStats, type SubmissionRow } from '@/lib/analytics/studentStats'

export interface PersonalizedExerciseRow {
  id: string
  titolo: string
  teoria: string
  spiegazione: string
  esempio: string
  consegna: string
  submission_id: string | null
  seen_by_teacher: boolean
  created_at: string
}

/**
 * Genera un esercizio personalizzato per uno studente, basato sulle sue
 * aree di miglioramento e categorie di errore più frequenti (calcolate
 * dalle sue submissions valutate). Salva il risultato in
 * personalized_exercises, visibile allo studente da /student/personalized.
 */
export async function generatePersonalizedExercise(studentId: string) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

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
      categorieErroriFrequenti: categorieFrequenti
    })
  } catch (err) {
    console.error('Errore generando esercizio personalizzato:', err)
    throw new Error(
      "L'IA è temporaneamente sovraccarica e non ha potuto generare l'esercizio. Riprova tra qualche istante."
    )
  }

  const { error: insertError } = await supabase.from('personalized_exercises').insert({
    student_id: studentId,
    teacher_id: userData.user.id,
    titolo: esercizio.titolo,
    teoria: esercizio.teoria,
    spiegazione: esercizio.spiegazione,
    esempio: esercizio.esempio,
    consegna: esercizio.consegna
  })

  if (insertError) {
    throw new Error('Errore salvando l\'esercizio personalizzato.')
  }

  revalidatePath(`/teacher/students/${studentId}`)
}

export async function getPersonalizedExercisesForStudent(
  studentId: string
): Promise<PersonalizedExerciseRow[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('personalized_exercises')
    .select(
      'id, titolo, teoria, spiegazione, esempio, consegna, submission_id, seen_by_teacher, created_at'
    )
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore caricando gli esercizi personalizzati:', error)
    return []
  }

  return data ?? []
}

/**
 * Marca come "letti" tutti gli esercizi personalizzati consegnati di
 * questo studente — chiamata quando il docente visita la sua pagina di
 * dettaglio, così la notifica smette di apparire.
 */
export async function markPersonalizedExercisesSeen(studentId: string) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return

  await supabase
    .from('personalized_exercises')
    .update({ seen_by_teacher: true })
    .eq('student_id', studentId)
    .eq('teacher_id', userData.user.id)
    .eq('seen_by_teacher', false)
    .not('submission_id', 'is', null)
}

/**
 * Data dell'ultimo accesso dello studente, letta da auth.users tramite
 * service role (non accessibile via RLS normale). Va chiamata SOLO dopo
 * aver già verificato — tramite una query soggetta a RLS, come
 * profiles_select_by_teacher — che questo studente è effettivamente
 * attivo sotto il docente corrente: questa funzione di per sé non fa
 * alcun controllo di autorizzazione, perché il service role bypassa RLS.
 */
export async function getLastSignInForStudent(studentId: string): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.getUserById(studentId)
    if (error || !data.user) return null
    return data.user.last_sign_in_at ?? null
  } catch (err) {
    console.error('Errore recuperando ultimo accesso:', err)
    return null
  }
}

/**
 * Elimina permanentemente una submission. Si appoggia sulla RLS
 * submissions_delete_by_active_teacher (is_active_teacher_of) — un
 * docente non può eliminare submission di studenti che non sono suoi.
 *
 * ATTENZIONE: cancellazione reale, non reversibile (vedi nota in
 * migrazione 0009 sul cambio di design rispetto all'immutabilità
 * storica originale).
 */
export async function deleteSubmission(submissionId: string, studentId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('submissions').delete().eq('id', submissionId)

  if (error) {
    throw new Error("Errore eliminando lo scritto. Potrebbe non essere più tuo da gestire.")
  }

  revalidatePath(`/teacher/students/${studentId}`)
}
