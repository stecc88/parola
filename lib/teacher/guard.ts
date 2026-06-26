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

/**
 * Variante para Server Actions (no para páginas): lanza un Error en vez
 * de redirigir. Antes, las Server Actions del profesor solo verificaban
 * "está logueado" y dejaban toda la autorización a las políticas RLS
 * (teacher_id = auth.uid()) — pero esas políticas no contemplan
 * teacher_status. Resultado: un profesor DESHABILITADO con una sesión ya
 * abierta podía seguir creando clases, generando ejercicios, etc. — las
 * páginas le redirigían a /teacher/pending, pero las acciones del
 * servidor en sí seguían funcionando si las invocaba directamente.
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
