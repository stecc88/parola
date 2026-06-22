'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Crea la submission con el texto del estudiante (valutazione_ia=NULL).
 * Devuelve el id para que el cliente luego llame a /api/gemini/evaluate.
 * Separado en dos pasos a propósito: ver comentario en
 * app/api/gemini/evaluate/route.ts.
 */
export async function createScritturaLiberaSubmission(testo: string, consegna?: string) {
  const supabase = createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    throw new Error('Non autenticato.')
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      student_id: userData.user.id,
      tipo: 'scrittura_libera',
      testo_studente: testo,
      consegna: consegna && consegna.trim().length > 0 ? consegna.trim() : null
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error('Errore creando la submission.')
  }

  return data.id as string
}
