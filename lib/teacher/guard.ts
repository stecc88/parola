import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Verifica che l'utente autenticato sia un docente con teacher_status
 * 'approved'. Se non lo è (pending/rejected/disabled, o non è docente),
 * reindirizza a /teacher/pending o /login secondo il caso.
 *
 * Va chiamata all'inizio di OGNI pagina sotto /teacher/* che mostri dati
 * o permetta azioni — non è sufficiente bloccare solo il reindirizzamento
 * iniziale dalla home, perché qualcuno potrebbe accedere direttamente via URL.
 */
export async function requireApprovedTeacher(): Promise<string> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, teacher_status')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'teacher' || profile.teacher_status !== 'approved') {
    redirect('/teacher/pending')
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
    .select('role, teacher_status')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'teacher' || profile.teacher_status !== 'approved') {
    throw new Error('Il tuo account insegnante non è attivo.')
  }

  return userData.user.id
}
