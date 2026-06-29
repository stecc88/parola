import { createClient } from '@/lib/supabase/server'

/**
 * Rate limiting atomico via RPC Postgres (migrazione 0026).
 * Un singolo upsert incrementa il contatore e controlla il limite in
 * un'unica istruzione — nessuna finestra di TOCTOU tra check e insert.
 * Se il DB è irraggiungibile o l'RPC fallisce per motivi interni,
 * non blocchiamo lo studente (best-effort).
 */
export async function checkSubmissionRateLimit(
  studentId: string,
  { maxPerWindow = 10, windowMinutes = 5 }: { maxPerWindow?: number; windowMinutes?: number } = {}
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.rpc('check_submission_rate_limit_atomic', {
    p_student_id: studentId,
    p_window_minutes: windowMinutes,
    p_max: maxPerWindow
  })

  if (!error) return

  // L'RPC solleva 'rate_limit_exceeded' quando il limite è superato
  if (error.message?.includes('rate_limit_exceeded')) {
    throw new Error('Troppe richieste. Riprova fra qualche minuto.')
  }

  // Qualsiasi altro errore (DB down, permessi) — non blocchiamo lo studente
  console.error('Errore nel rate limit check:', error)
}
