import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { LogoutButton } from '@/components/shared/LogoutButton'

export default async function TeacherExpiredPage() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, teacher_status, subscription_end_at')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'teacher') redirect('/')
  if (profile.teacher_status !== 'approved') redirect('/teacher/pending')

  const isExpired =
    profile.subscription_end_at && new Date(profile.subscription_end_at) < new Date()
  if (!isExpired) redirect('/teacher/dashboard')

  const scadenza = new Date(profile.subscription_end_at!).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-surface-secondary p-6 animate-fade-in"
    >
      <Card className="w-full max-w-sm bg-surface text-center shadow-xl">
        <ParolaMascot mood="pensieroso" className="mx-auto mb-4 h-16 w-16" />
        <h1 className="mb-2 text-lg font-semibold text-ink-primary">Abbonamento scaduto</h1>
        <p className="text-sm text-ink-secondary">
          Il tuo abbonamento è scaduto il <strong>{scadenza}</strong>. Contatta l&apos;amministratore
          della piattaforma per rinnovarlo e riottenere l&apos;accesso.
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </Card>
    </main>
  )
}
