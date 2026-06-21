import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Guard server-side para TODO lo bajo /admin/*. Antes de esto, un usuario
 * no-admin que navegaba a /admin/users disparaba el Server Action
 * getTeachers() (que sí valida con assertIsAdmin), pero el error se
 * propagaba como un 500 feo en vez de una redirección limpia — porque
 * nada chequeaba el rol ANTES de renderizar la página.
 *
 * Este layout corre primero, en el servidor, para cualquier ruta bajo
 * /admin: si no es admin, redirige antes de que se monte nada.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return <>{children}</>
}
