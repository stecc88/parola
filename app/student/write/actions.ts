'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedStudentActionUserId } from '@/lib/student/guard'

const valutazioneErroriSchema = z.object({
  errori: z.array(z.object({ categoria: z.string() })).optional()
})

/**
 * Crea la submission con el texto del estudiante (valutazione_ia=NULL).
 * Devuelve el id para que el cliente luego llame a /api/gemini/evaluate.
 * Separado en dos pasos a propósito: ver comentario en
 * app/api/gemini/evaluate/route.ts.
 */
export async function createScritturaLiberaSubmission(
  testo: string,
  consegna?: string,
  segnali?: { testoIncollato: boolean; secondiScrittura: number | null }
) {
  const supabase = createClient()
  const userId = await requireApprovedStudentActionUserId()

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      student_id: userId,
      tipo: 'scrittura_libera',
      testo_studente: testo,
      consegna: consegna && consegna.trim().length > 0 ? consegna.trim() : null,
      testo_incollato: segnali?.testoIncollato ?? false,
      secondi_scrittura: segnali?.secondiScrittura ?? null
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error('Errore creando la submission.')
  }

  return data.id as string
}

/**
 * Punteggio dell'ultima scrittura libera valutata PRIMA di quella corrente
 * (escludendola esplicitamente), per mostrare allo studente un confronto
 * "rispetto alla tua ultima volta" subito nel risultato — più motivante e
 * concreto di un punteggio isolato senza contesto.
 */
export async function getPreviousScritturaScore(
  excludeSubmissionId: string
): Promise<number | null> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data } = await supabase
    .from('submissions')
    .select('id, valutazione_ia, created_at')
    .eq('student_id', userData.user.id)
    .eq('tipo', 'scrittura_libera')
    .not('valutazione_ia', 'is', null)
    .neq('id', excludeSubmissionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const v = data?.valutazione_ia as Record<string, unknown> | null | undefined
  return typeof v?.punteggio_complessivo === 'number' ? v.punteggio_complessivo : null
}

/**
 * Quante volte, nello storico GIÀ valutato dello studente (submissions
 * precedenti, non quella corrente), è comparsa ciascuna categoria di
 * errore. Serve per mostrare nel feedback se un errore è un caso isolato
 * o un pattern ricorrente — informazione che aiuta lo studente a
 * prioritizzare su cosa lavorare.
 */
export async function getMyPastErrorCategoryCounts(
  excludeSubmissionId: string
): Promise<Record<string, number>> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return {}

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, valutazione_ia')
    .eq('student_id', userData.user.id)
    .eq('tipo', 'scrittura_libera')
    .not('valutazione_ia', 'is', null)
    .neq('id', excludeSubmissionId)
    .order('created_at', { ascending: false })
    .limit(30)

  const conteggi: Record<string, number> = {}
  for (const s of submissions ?? []) {
    const parsed = valutazioneErroriSchema.safeParse(s.valutazione_ia)
    if (!parsed.success) {
      console.error('valutazione_ia con struttura inattesa, ignorata:', parsed.error.message)
      continue
    }
    for (const errore of parsed.data.errori ?? []) {
      conteggi[errore.categoria] = (conteggi[errore.categoria] ?? 0) + 1
    }
  }
  return conteggi
}
