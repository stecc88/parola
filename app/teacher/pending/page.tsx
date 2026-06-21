import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { LogoutButton } from '@/components/shared/LogoutButton'

const STATUS_MESSAGE: Record<string, string> = {
  pending:
    'La tua registrazione come insegnante è in attesa di approvazione da parte di un amministratore. Riceverai accesso non appena verrà confermata.',
  rejected:
    'La tua registrazione come insegnante non è stata approvata. Contatta la scuola per maggiori informazioni.',
  disabled: 'Il tuo account insegnante è stato disabilitato. Contatta un amministratore.'
}

export default async function TeacherPendingPage() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, teacher_status')
    .eq('id', userData.user.id)
    .single()

  // Si ya está aprobado (o no es teacher), no tiene nada que hacer acá.
  if (profile?.role !== 'teacher' || profile.teacher_status === 'approved') {
    redirect('/')
  }

  const message =
    STATUS_MESSAGE[profile.teacher_status ?? 'pending'] ?? STATUS_MESSAGE.pending

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-secondary p-6">
      <Card className="w-full max-w-sm bg-surface text-center">
        <ParolaMascot mood="pensieroso" className="mx-auto mb-4 h-16 w-16" />
        <h1 className="mb-2 text-lg font-semibold text-ink-primary">
          Account in attesa
        </h1>
        <p className="text-sm text-ink-secondary">{message}</p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </Card>
    </main>
  )
}
