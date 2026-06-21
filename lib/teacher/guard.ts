import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Verifica que el usuario autenticado sea un profesor con teacher_status
 * 'approved'. Si no lo es (pending/rejected/disabled, o no es profesor),
 * redirige a /teacher/pending o /login según corresponda.
 *
 * Debe llamarse al inicio de TODA página bajo /teacher/* que muestre
 * datos o permita acciones — no alcanza con bloquear solo la redirección
 * inicial desde la home, porque alguien podría entrar directo por URL.
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
