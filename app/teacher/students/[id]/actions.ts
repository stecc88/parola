'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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

  const esercizio = await generateEsercizioPersonalizzato({
    livelloTarget: profile.livello_target ?? undefined,
    areeDiMiglioramento: stats.areeMiglioramentoFrequenti.map((a) => a.testo),
    categorieErroriFrequenti: categorieFrequenti
  })

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
    .select('id, titolo, teoria, spiegazione, esempio, consegna, submission_id, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore caricando gli esercizi personalizzati:', error)
    return []
  }

  return data ?? []
}
