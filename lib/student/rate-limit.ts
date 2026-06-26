import { createClient } from '@/lib/supabase/server'

/**
 * Rate limiting simple basado en DB (sin infraestructura externa como
 * Redis/Upstash). Cuenta cuántas submissions creó el estudiante en los
 * últimos `windowMinutes` y rechaza si supera `maxPerWindow`.
 *
 * Suficiente para el volumen esperado de esta app (escuela, no escala
 * masiva). Si el volumen crece, migrar a un rate limiter dedicado
 * (ej. Upstash Ratelimit) sin cambiar la firma de esta función.
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
    // Si falla el chequeo, no bloqueamos al estudiante por un problema
    // nuestro — solo lo logueamos.
    console.error('Errore nel rate limit check:', error)
    return
  }

  if ((count ?? 0) >= maxPerWindow) {
    throw new Error(
      `Hai raggiunto il limite di ${maxPerWindow} richieste ogni ${windowMinutes} minuti. Riprova più tardi.`
    )
  }
}
