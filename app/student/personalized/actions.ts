'use server'

import { createClient } from '@/lib/supabase/server'
import type { TipoEsercizioPersonalizzato } from '@/lib/gemini/schema'

export interface EsercizioItem {
  domanda: string
  opzioni: string[]
  risposta_corretta: string
  spiegazione_risposta: string
}

export interface PersonalizedExerciseDetail {
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
  created_at: string
}

const SELECT_FIELDS =
  'id, tipo_esercizio, titolo, teoria, spiegazione, esempio, consegna, items, submission_id, risposte_studente, punteggio_chiuso, completato_at, created_at'

export async function getMyPersonalizedExercises(): Promise<PersonalizedExerciseDetail[]> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await supabase
    .from('personalized_exercises')
    .select(SELECT_FIELDS)
    .eq('student_id', userData.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore caricando gli esercizi personalizzati:', error)
    return []
  }

  return (data ?? []) as PersonalizedExerciseDetail[]
}

export async function getPersonalizedExerciseById(
  id: string
): Promise<PersonalizedExerciseDetail | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('personalized_exercises')
    .select(SELECT_FIELDS)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as PersonalizedExerciseDetail
}

export async function getSubmissionValutazione(
  submissionId: string
): Promise<{ valutazione: unknown | null; testo: string } | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('submissions')
    .select('valutazione_ia, testo_studente')
    .eq('id', submissionId)
    .single()

  if (!data) return null
  return { valutazione: data.valutazione_ia ?? null, testo: data.testo_studente }
}

/**
 * Crea la submission per la consegna pratica di un esercizio personalizzato
 * di tipo "scrittura" e collega submission_id sull'esercizio. La
 * valutazione Gemini vera e propria avviene poi chiamando
 * /api/gemini/evaluate, esattamente come per la scrittura libera.
 */
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
    .update({ submission_id: submission.id, seen_by_teacher: false })
    .eq('id', exerciseId)
    .eq('student_id', userData.user.id)

  if (updateError) {
    throw new Error("Risposta salvata, ma errore collegando l'esercizio.")
  }

  return submission.id
}

/**
 * Corregge localmente le risposte di un esercizio a risposta chiusa
 * (completamento, scelta_multipla, abbinamento, trasformazione) — nessuna
 * chiamata a Gemini necessaria, il confronto è deterministico
 * (case-insensitive, spazi ai lati ignorati).
 */
export async function submitClosedExerciseAnswers(
  exerciseId: string,
  risposte: string[]
): Promise<{ punteggio: number }> {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  const { data: esercizio, error: fetchError } = await supabase
    .from('personalized_exercises')
    .select('items, student_id')
    .eq('id', exerciseId)
    .single()

  if (fetchError || !esercizio || !esercizio.items) {
    throw new Error('Esercizio non trovato.')
  }

  const items = esercizio.items as EsercizioItem[]
  const corretti = items.reduce((count, item, i) => {
    const risposta = (risposte[i] ?? '').trim().toLowerCase()
    const giusta = item.risposta_corretta.trim().toLowerCase()
    return risposta === giusta ? count + 1 : count
  }, 0)

  const punteggio = items.length > 0 ? Math.round((corretti / items.length) * 100) : 0

  const { error: updateError } = await supabase
    .from('personalized_exercises')
    .update({
      risposte_studente: risposte,
      punteggio_chiuso: punteggio,
      completato_at: new Date().toISOString(),
      seen_by_teacher: false
    })
    .eq('id', exerciseId)
    .eq('student_id', userData.user.id)

  if (updateError) {
    throw new Error('Errore salvando le risposte.')
  }

  return { punteggio }
}
