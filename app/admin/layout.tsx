import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Guard server-side per tutto ciò che sta sotto /admin/*. Prima di questo,
 * un utente non-admin che navigava su /admin/users attivava il Server Action
 * getTeachers() (che valida con assertIsAdmin), ma l'errore si propagava
 * come un brutto 500 invece di un redirect pulito — perché nulla verificava
 * il ruolo PRIMA di renderizzare la pagina.
 *
 * Questo layout gira per primo, sul server, per qualsiasi route sotto
 * /admin: se non è admin, fa il redirect prima che venga montato qualcosa.
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
