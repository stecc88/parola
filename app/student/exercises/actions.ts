'use server'

import { createClient } from '@/lib/supabase/server'
import {
  generateEsercizioStruttura1,
  evaluateEsercizioStruttura1,
  type FraseDaCompletare
} from '@/lib/gemini/prompts/struttura'

export async function startEsercizioStruttura1(): Promise<FraseDaCompletare> {
  // Livello fijo por ahora (no hay todavía noción de nivel objetivo por
  // estudiante en el modelo de datos); placeholder razonable: B1.
  return generateEsercizioStruttura1('B1')
}

export async function submitEsercizioStruttura1(
  frasi: FraseDaCompletare['frasi'],
  risposte: { id: string; risposta_studente: string }[]
) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  const valutazione = await evaluateEsercizioStruttura1(frasi, risposte)

  // Se persiste como submission para mantener el historial, igual que
  // scrittura_libera. testo_studente guarda las respuestas concatenadas
  // por trazabilidad simple (no hay columna estructurada dedicada todavía).
  await supabase.from('submissions').insert({
    student_id: userData.user.id,
    tipo: 'esercizio_struttura_1',
    testo_studente: risposte.map((r) => `${r.id}: ${r.risposta_studente}`).join(' | '),
    valutazione_ia: valutazione,
    valutazione_completed_at: new Date().toISOString()
  })

  return valutazione
}
