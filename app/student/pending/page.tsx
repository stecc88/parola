import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { LogoutButton } from '@/components/shared/LogoutButton'

const STATUS_MESSAGE: Record<string, string> = {
  pending:
    'Il tuo account è in attesa di approvazione da parte del tuo insegnante. Riceverai accesso non appena lo avrà confermato.',
  rejected:
    'La tua registrazione non è stata approvata dal tuo insegnante. Contatta il tuo insegnante per maggiori informazioni.',
  disabled:
    'Il tuo account è stato disabilitato. Contatta il tuo insegnante per maggiori informazioni.'
}

export default async function StudentPendingPage() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, student_status')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'student' || profile.student_status === 'approved' || profile.student_status === null) {
    redirect('/')
  }

  const message = STATUS_MESSAGE[profile.student_status ?? 'pending'] ?? STATUS_MESSAGE.pending

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-surface-secondary p-6 animate-fade-in">
      <Card className="w-full max-w-sm bg-surface text-center shadow-xl">
        <ParolaMascot mood="pensieroso" className="mx-auto mb-4 h-16 w-16" />
        <h1 className="mb-2 text-lg font-semibold text-ink-primary">Account in attesa</h1>
        <p className="text-sm text-ink-secondary">{message}</p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </Card>
    </main>
  )
}
