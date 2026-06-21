import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { tryAutoJoinFromMetadata, hasActiveMembership } from '@/app/student/join-class/actions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'

export default async function HomePage() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    return <LandingPage />
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

function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-secondary p-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex flex-col items-center gap-4">
          <ParolaMascot mood="felice" className="h-20 w-20" />
          <div>
            <h1 className="text-3xl font-semibold text-ink-primary">Parola</h1>
            <p className="mt-2 text-ink-secondary">
              Impara l&apos;italiano e preparati a superare standard
              internazionali di lingua italiana, con un feedback dettagliato
              su ogni testo che scrivi.
            </p>
          </div>
        </div>

        <Card className="bg-surface text-left">
          <ul className="space-y-2 text-sm text-ink-secondary">
            <li>✓ Scrittura libera con valutazione immediata</li>
            <li>✓ Esercizi di grammatica e struttura</li>
            <li>✓ Guide di scrittura per ogni tipo di testo</li>
            <li>✓ Monitora i tuoi progressi nel tempo</li>
          </ul>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login" className="w-full sm:w-auto">
            <Button className="w-full">Accedi</Button>
          </Link>
          <Link href="/registrati" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">
              Registrati
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
