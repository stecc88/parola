import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { tryAutoJoinFromMetadata, hasActiveMembership } from '@/app/student/join-class/actions'

export default async function HomePage() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/admin/users')
  }

  if (profile?.role === 'teacher') {
    redirect('/teacher/classes')
  }

  // Estudiante: si no tiene membership activa, intenta el join automático
  // con el invite_code guardado en metadata (caso confirmación de email
  // activada, donde el join no se pudo hacer durante el signup porque
  // todavía no había sesión). Si falla o no había código, lo manda a
  // unirse manualmente.
  if (!(await hasActiveMembership())) {
    const joined = await tryAutoJoinFromMetadata()
    if (!joined) {
      redirect('/student/join-class')
    }
  }

  redirect('/student/write')
}
