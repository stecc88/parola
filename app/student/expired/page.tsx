import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { LogoutButton } from '@/components/shared/LogoutButton'

export default async function StudentExpiredPage() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, student_status, subscription_end_at')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'student') redirect('/')
  if (profile.student_status !== 'approved' && profile.student_status !== null) {
    redirect('/student/pending')
  }

  const isExpired =
    profile.subscription_end_at && new Date(profile.subscription_end_at) < new Date()
  if (!isExpired) redirect('/student/progress')

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
          Il tuo accesso è scaduto il <strong>{scadenza}</strong>. Contatta il tuo insegnante per
          rinnovare l&apos;abbonamento e riottenere l&apos;accesso alla piattaforma.
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </Card>
    </main>
  )
}
