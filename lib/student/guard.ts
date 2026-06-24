import { createClient } from '@/lib/supabase/server'

/**
 * Variante para Server Actions (no para páginas): verifica que el usuario
 * esté logueado Y sea un estudiante con student_status 'approved' (o
 * NULL — caso legacy de quien se unió con código de profesor antes de la
 * migración 0012, ver comentario en esa migración). Lanza un Error en
 * vez de redirigir.
 *
 * Sin esto, un estudiante DESHABILITADO con una sesión ya abierta podía
 * seguir generando ejercicios, escribiendo y enviando textos — el
 * middleware solo bloqueaba el RENDERIZADO de las páginas, no las Server
 * Actions invocadas directamente.
 */
export async function requireApprovedStudentActionUserId(): Promise<string> {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, student_status')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'student') {
    throw new Error('Non autorizzato.')
  }

  if (profile.student_status !== null && profile.student_status !== 'approved') {
    throw new Error('Il tuo account non è attivo. Contatta un amministratore.')
  }

  return userData.user.id
}
