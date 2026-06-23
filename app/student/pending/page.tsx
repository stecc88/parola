import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { LogoutButton } from '@/components/shared/LogoutButton'
import Link from 'next/link'

const STATUS_MESSAGE: Record<string, string> = {
  pending:
    'Il tuo account è in attesa di approvazione da parte di un amministratore. Riceverai accesso non appena verrà confermato.',
  rejected: 'La tua registrazione non è stata approvata. Contatta un amministratore per maggiori informazioni.'
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

        {profile.student_status === 'pending' && (
          <div className="mt-4 rounded-md bg-info-bg p-3 text-sm text-info-text">
            Hai un codice insegnante? Puoi usarlo per accedere subito, senza aspettare
            l&apos;approvazione.
            <Link href="/student/join-class" className="mt-2 block">
              <Button variant="secondary" className="w-full">
                Inserisci un codice insegnante
              </Button>
            </Link>
          </div>
        )}

        <div className="mt-4">
          <LogoutButton />
        </div>
      </Card>
    </main>
  )
}
