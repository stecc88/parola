import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { tryAutoJoinFromMetadata, hasActiveMembership } from '@/app/student/join-class/actions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { PenLine, ListChecks, BookOpen, TrendingUp } from 'lucide-react'

export default async function HomePage() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    return <LandingPage />
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, teacher_status')
    .eq('id', data.user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/admin/users')
  }

  if (profile?.role === 'teacher') {
    redirect(profile.teacher_status === 'approved' ? '/teacher/classes' : '/teacher/pending')
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

const FEATURES = [
  {
    icon: PenLine,
    titolo: 'Scrittura libera',
    descrizione: 'Scrivi un testo e ricevi una correzione dettagliata, errore per errore.'
  },
  {
    icon: ListChecks,
    titolo: 'Esercizi di struttura',
    descrizione: 'Completa frasi, riordina parole, scegli la preposizione giusta.'
  },
  {
    icon: BookOpen,
    titolo: 'Guide di scrittura',
    descrizione: 'Una consegna per ogni tipo di testo: lettera, email, racconto, articolo.'
  },
  {
    icon: TrendingUp,
    titolo: 'I tuoi progressi',
    descrizione: 'Vedi come cambia il tuo punteggio nel tempo, attività dopo attività.'
  }
]

function LandingPage() {
  return (
    <main className="min-h-screen bg-surface">
      {/* Hero: textura de cuaderno sutil tras el titular, único elemento
          de firma visual de la página — el resto se mantiene contenido. */}
      <section className="notebook-lines border-b border-border bg-surface-secondary px-6 py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <ParolaMascot mood="felice" className="mb-6 h-16 w-16" />

          <span className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-brand-400">
            Italiano per adolescenti
          </span>

          <h1 className="font-display text-4xl italic text-ink-primary sm:text-5xl">
            Parola
          </h1>

          <p className="mt-5 max-w-md text-balance text-ink-secondary">
            Scrivi, sbaglia, migliora. Un quaderno digitale che corregge i
            tuoi testi e ti prepara a superare standard internazionali di
            lingua italiana.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/registrati">
              <Button className="w-full sm:w-auto">Inizia a scrivere</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" className="w-full sm:w-auto">
                Ho già un account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Cosa puoi fare */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center font-display text-2xl italic text-ink-primary">
            Cosa puoi fare
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <Card key={f.titolo} className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-guided-bg text-guided-accent">
                  <f.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-medium text-ink-primary">{f.titolo}</h3>
                  <p className="mt-1 text-sm text-ink-secondary">{f.descrizione}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Per gli insegnanti */}
      <section className="border-t border-border bg-surface-secondary px-6 py-14">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="font-display text-xl italic text-ink-primary">
            Sei un insegnante?
          </h2>
          <p className="mt-2 max-w-sm text-sm text-ink-secondary">
            Crea le tue classi, condividi un codice di accesso e segui i
            progressi di ogni studente.
          </p>
          <Link href="/registrati" className="mt-5">
            <Button variant="secondary">Registra la tua classe</Button>
          </Link>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-ink-tertiary">
        Parola — uno spazio per scrivere, sbagliare, migliorare.
      </footer>
    </main>
  )
}
