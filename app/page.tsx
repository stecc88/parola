import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  switch (profile?.role) {
    case 'admin':
      redirect('/admin/users')
    case 'teacher':
      redirect('/teacher/classes')
    default:
      redirect('/student/write')
  }
}
