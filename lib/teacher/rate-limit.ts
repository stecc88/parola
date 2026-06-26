import { createClient } from '@/lib/supabase/server'

/**
 * Limita cuántos ejercicios personalizados puede generar un docente en
 * una ventana de tiempo — evita que un click accidental múltiple (o un
 * uso entusiasta) agote en minutos la cuota gratuita de Gemini, que es
 * compartida por toda la plataforma.
 */
export async function checkGenerationRateLimit(
  teacherId: string,
  { maxPerWindow = 8, windowMinutes = 10 }: { maxPerWindow?: number; windowMinutes?: number } = {}
): Promise<void> {
  const supabase = createClient()
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

  const { count, error } = await supabase
    .from('personalized_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacherId)
    .gte('created_at', since)

  if (error) {
    console.error('Errore nel controllo del rate limit di generazione:', error)
    return
  }

  if ((count ?? 0) >= maxPerWindow) {
    throw new Error(
      `Hai generato già ${maxPerWindow} esercizi negli ultimi ${windowMinutes} minuti. Attendi qualche minuto prima di generarne altri — questo aiuta a non esaurire la cuota IA condivisa.`
    )
  }
}
