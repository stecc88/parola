import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVerifiedAuth } from '@/lib/auth/verifiedRequest'

/**
 * Verifica che l'utente autenticato sia un docente con teacher_status
 * 'approved'. Se non lo è (pending/rejected/disabled, o non è docente),
 * reindirizza a /teacher/pending o /login secondo il caso.
 *
 * Va chiamata all'inizio di OGNI pagina sotto /teacher/* che mostri dati
 * o permetta azioni — non è sufficiente bloccare solo il reindirizzamento
 * iniziale dalla home, perché qualcuno potrebbe accedere direttamente via URL.
 *
 * middleware.ts esegue già esattamente questo stesso controllo prima di
 * arrivare qui e inoltra il risultato via header verificato — se presente
 * lo riusiamo per evitare una seconda auth.getUser() + query su profiles
 * identica. Se manca (es. sviluppo locale senza middleware, o un path
 * fuori dal suo matcher) rifacciamo il controllo pieno: nessuna perdita
 * di sicurezza, solo un fast path quando il lavoro è già stato fatto.
 */
export async function requireApprovedTeacher(): Promise<string> {
  const verified = getVerifiedAuth()
  if (verified) {
    if (verified.role !== 'teacher' || verified.teacherStatus !== 'approved') {
      redirect('/teacher/pending')
    }
    if (verified.subscriptionEndAt && new Date(verified.subscriptionEndAt) < new Date()) {
      redirect('/teacher/expired')
    }
    return verified.userId
  }

  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, teacher_status, subscription_end_at')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'teacher' || profile.teacher_status !== 'approved') {
    redirect('/teacher/pending')
  }

  if (profile.subscription_end_at && new Date(profile.subscription_end_at) < new Date()) {
    redirect('/teacher/expired')
  }

  return userData.user.id
}

/**
 * Variante per Server Actions (non per pagine): lancia un Error invece
 * di redirigere. In precedenza le Server Actions del docente verificavano
 * solo "è loggato" e delegavano tutta l'autorizzazione alle policy RLS
 * (teacher_id = auth.uid()) — ma quelle policy non considerano
 * teacher_status. Risultato: un docente DISABILITATO con sessione aperta
 * poteva continuare a creare classi, generare esercizi, ecc. — le pagine
 * lo reindirizzavano a /teacher/pending, ma le Server Actions continuavano
 * a funzionare se invocate direttamente.
 */
export async function requireApprovedTeacherActionUserId(): Promise<string> {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, teacher_status, subscription_end_at')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'teacher' || profile.teacher_status !== 'approved') {
    throw new Error('Il tuo account insegnante non è attivo.')
  }

  if (profile.subscription_end_at && new Date(profile.subscription_end_at) < new Date()) {
    throw new Error('Il tuo abbonamento è scaduto. Contatta l\'amministratore per rinnovarlo.')
  }

  return userData.user.id
}
