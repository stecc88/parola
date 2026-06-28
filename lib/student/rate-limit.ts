import { createClient } from '@/lib/supabase/server'

/**
 * Rate limiting basato su DB (senza infrastruttura esterna come Redis/Upstash).
 * Conta le submissions dello studente negli ultimi `windowMinutes` e rifiuta
 * se supera `maxPerWindow`. Sufficiente per i volumi di una piattaforma
 * scolastica; se il traffico cresce, migrare a Upstash Ratelimit senza
 * cambiare la firma di questa funzione.
 */
export async function checkSubmissionRateLimit(
  studentId: string,
  { maxPerWindow = 10, windowMinutes = 5 }: { maxPerWindow?: number; windowMinutes?: number } = {}
): Promise<void> {
  const supabase = createClient()
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

  const { count, error } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .gte('created_at', since)

  if (error) {
    // Se il check fallisce per un errore interno, non blocchiamo lo studente.
    console.error('Errore nel rate limit check:', error)
    return
  }

  if ((count ?? 0) >= maxPerWindow) {
    throw new Error(
      `Hai raggiunto il limite di ${maxPerWindow} richieste ogni ${windowMinutes} minuti. Riprova più tardi.`
    )
  }
}
