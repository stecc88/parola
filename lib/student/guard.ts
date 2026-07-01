import { createClient } from '@/lib/supabase/server'

/**
 * Variante per Server Actions (non per pagine): verifica che l'utente sia
 * loggato E sia uno studente con student_status 'approved' (o NULL —
 * caso legacy di chi si è iscritto con codice docente prima della
 * migrazione 0012, vedi commento in quella migrazione). Lancia un Error
 * invece di redirigere.
 *
 * Senza questo, uno studente DISABILITATO con sessione aperta poteva
 * continuare a generare esercizi, scrivere e inviare testi — il
 * middleware bloccava solo il RENDERING delle pagine, non le Server
 * Actions invocate direttamente.
 */
export async function requireApprovedStudentActionUserId(): Promise<string> {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, student_status, subscription_end_at')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'student') {
    throw new Error('Non autorizzato.')
  }

  if (profile.student_status !== null && profile.student_status !== 'approved') {
    throw new Error('Il tuo account non è ancora attivo. Contatta il tuo insegnante.')
  }

  if (profile.subscription_end_at && new Date(profile.subscription_end_at) < new Date()) {
    throw new Error('Il tuo accesso è scaduto. Contatta il tuo insegnante per rinnovarlo.')
  }

  return userData.user.id
}
