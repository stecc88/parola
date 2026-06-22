'use server'

import { createClient } from '@/lib/supabase/server'

export interface PersonalizedExerciseDetail {
  id: string
  titolo: string
  teoria: string
  spiegazione: string
  esempio: string
  consegna: string
  submission_id: string | null
  created_at: string
}

export async function getMyPersonalizedExercises(): Promise<PersonalizedExerciseDetail[]> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await supabase
    .from('personalized_exercises')
    .select('id, titolo, teoria, spiegazione, esempio, consegna, submission_id, created_at')
    .eq('student_id', userData.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore caricando gli esercizi personalizzati:', error)
    return []
  }

  return data ?? []
}

export async function getPersonalizedExerciseById(
  id: string
): Promise<PersonalizedExerciseDetail | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('personalized_exercises')
    .select('id, titolo, teoria, spiegazione, esempio, consegna, submission_id, created_at')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Crea la submission per la consegna pratica di un esercizio personalizzato
 * e collega submission_id sull'esercizio. La valutazione Gemini vera e
 * propria avviene poi chiamando /api/gemini/evaluate, esattamente come per
 * la scrittura libera — qui ci occupiamo solo del salvataggio + collegamento.
 */
export async function getSubmissionValutazione(submissionId: string): Promise<unknown | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('submissions')
    .select('valutazione_ia')
    .eq('id', submissionId)
    .single()

  return data?.valutazione_ia ?? null
}

export async function submitPersonalizedExerciseResponse(
  exerciseId: string,
  testo: string,
  consegna: string
): Promise<string> {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  const { data: submission, error: insertError } = await supabase
    .from('submissions')
    .insert({
      student_id: userData.user.id,
      tipo: 'scrittura_libera',
      testo_studente: testo,
      consegna
    })
    .select('id')
    .single()

  if (insertError || !submission) {
    throw new Error('Errore salvando la risposta.')
  }

  const { error: updateError } = await supabase
    .from('personalized_exercises')
    .update({ submission_id: submission.id })
    .eq('id', exerciseId)
    .eq('student_id', userData.user.id)

  if (updateError) {
    throw new Error('Risposta salvata, ma errore collegando l\'esercizio.')
  }

  return submission.id
}
