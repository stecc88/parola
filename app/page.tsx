import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { tryAutoJoinFromMetadata, hasActiveMembership } from '@/app/student/join-class/actions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { PenLine, ListChecks, BookOpen, TrendingUp, Sparkles, ShieldCheck, Users, UserPlus, FileEdit, BarChart3 } from 'lucide-react'

export default async function HomePage() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    return <LandingPage />
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, teacher_status, student_status')
    .eq('id', data.user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/admin/users')
  }

  if (profile?.role === 'teacher') {
    redirect(profile.teacher_status === 'approved' ? '/teacher/classes' : '/teacher/pending')
  }

  if (!(await hasActiveMembership())) {
    const joined = await tryAutoJoinFromMetadata()
    if (!joined) {
      // Senza un insegnante, lo studente è "indipendente": se è pending
      // (registrato senza codice, in attesa di un admin) va alla pagina
      // di attesa; se è approved (admin lo ha già confermato, o caso
      // legacy) può usare comunque la scrittura libera e gli esercizi di
      // struttura, che non richiedono un insegnante.
      if (profile?.student_status === 'pending') {
        redirect('/student/pending')
      }
      if (profile?.student_status === 'rejected') {
        redirect('/student/pending')
      }
    }
  }

  redirect('/student/progress')
}

const FEATURES = [
  {
    icon: PenLine,
    titolo: 'Scrittura libera',
    descrizione: 'Scrivi un testo e ricevi una correzione dettagliata, errore per errore.',
    accent: 'bg-info-bg text-info-text'
  },
  {
    icon: ListChecks,
    titolo: 'Esercizi su misura',
    descrizione: 'Completamento, scelta multipla, abbinamento — generati sui tuoi punti debili.',
    accent: 'bg-guided-bg text-guided-text'
  },
  {
    icon: BookOpen,
    titolo: 'Guide di scrittura',
    descrizione: 'Una consegna per ogni tipo di testo: lettera, email, racconto, articolo.',
    accent: 'bg-success-bg text-success-text'
  },
  {
    icon: TrendingUp,
    titolo: 'I tuoi progressi',
    descrizione: 'Grafici, punti di forza e aree di miglioramento, attività dopo attività.',
    accent: 'bg-warning-bg text-warning-text'
  }
]

const HOW_IT_WORKS = [
  {
    numero: '1',
    icon: UserPlus,
    titolo: 'Crea il tuo account',
    descrizione: 'In meno di un minuto, come studente o come insegnante. Nessuna carta richiesta.'
  },
  {
    numero: '2',
    icon: FileEdit,
    titolo: 'Scrivi o assegna',
    descrizione: 'Lo studente scrive un testo, l\u2019insegnante crea esercizi su misura — l\u2019IA si occupa della correzione.'
  },
  {
    numero: '3',
    icon: BarChart3,
    titolo: 'Vedi i progressi crescere',
    descrizione: 'Grafici, punti di forza ricorrenti e aree su cui lavorare, attività dopo attività.'
  }
]

const TRUST = [
  { icon: Sparkles, testo: 'Correzioni dettagliate generate da IA' },
  { icon: Users, testo: 'Pensato per docenti e studenti' },
  { icon: ShieldCheck, testo: 'I tuoi dati restano privati' }
]

function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Parola',
    description:
      "Piattaforma di allenamento per l'italiano, con correzioni generate dall'IA ed esercizi personalizzati, per chi si prepara a superare standard internazionali di lingua italiana.",
    url: 'https://parola-puce.vercel.app',
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student'
    }
  }

  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <ParolaMascot mood="neutro" className="h-9 w-9" />
          <span className="font-semibold text-ink-primary">Parola</span>
        </Link>
        <Link href="/login">
          <Button variant="secondary" className="px-4 py-1.5 text-sm">
            Accedi
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="notebook-lines relative border-b border-border bg-gradient-to-b from-surface-secondary via-surface-secondary to-surface px-6 py-24 sm:py-28">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>
        {/* Blob decorativi, puramente estetici, ispirati alla palette del brand */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-brand-400/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 top-32 h-64 w-64 rounded-full bg-sunshine-400/20 blur-3xl"
        />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="animate-fade-in-up">
            <ParolaMascot mood="felice" className="mb-6 h-20 w-20 animate-float-slow" />
          </div>

          <span className="animate-fade-in-up delay-1 mb-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-brand-400 shadow-sm ring-1 ring-border">
            <Sparkles className="h-3.5 w-3.5" />
            Allenamento per esami internazionali di italiano
          </span>

          <h1 className="animate-fade-in-up delay-2 font-display text-5xl italic text-ink-primary sm:text-6xl">
            Parola
          </h1>

          <p className="animate-fade-in-up delay-3 mt-5 max-w-md text-balance text-base text-ink-secondary sm:text-lg">
            Scrivi, sbaglia, migliora. Un quaderno digitale che corregge i
            tuoi testi e ti prepara a superare standard internazionali di
            lingua italiana.
          </p>

          <div className="animate-fade-in-up delay-4 mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/registrati">
              <Button className="w-full px-8 py-3 text-base sm:w-auto">
                Inizia a scrivere — gratis
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" className="w-full px-8 py-3 text-base sm:w-auto">
                Ho già un account
              </Button>
            </Link>
          </div>

          <div className="animate-fade-in delay-4 mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-tertiary">
            {TRUST.map((t) => (
              <span key={t.testo} className="inline-flex items-center gap-1.5">
                <t.icon className="h-3.5 w-3.5 text-brand-400" strokeWidth={1.75} />
                {t.testo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center font-display text-2xl italic text-ink-primary">
            Come funziona
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => {
              const delayClass = ['delay-1', 'delay-2', 'delay-3'][i] ?? ''
              return (
                <div
                  key={step.numero}
                  className={`animate-fade-in-up ${delayClass} flex flex-col items-center text-center`}
                >
                  <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-md">
                    <step.icon className="h-6 w-6" strokeWidth={1.75} />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-sunshine-400 text-xs font-bold text-ink-primary ring-2 ring-surface">
                      {step.numero}
                    </span>
                  </div>
                  <h3 className="font-medium text-ink-primary">{step.titolo}</h3>
                  <p className="mt-1 text-sm text-ink-secondary">{step.descrizione}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Cosa puoi fare */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl italic text-ink-primary">Cosa puoi fare</h2>
            <p className="mt-2 text-sm text-ink-secondary">
              Tutto quello che serve per scrivere meglio in italiano, in un solo posto.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f, i) => {
              const delayClass = ['delay-1', 'delay-2', 'delay-3', 'delay-4'][i] ?? ''
              return (
                <Card
                  key={f.titolo}
                  className={`animate-fade-in-up ${delayClass} flex items-start gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${f.accent}`}
                  >
                    <f.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-medium text-ink-primary">{f.titolo}</h3>
                    <p className="mt-1 text-sm text-ink-secondary">{f.descrizione}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Per gli insegnanti */}
      <section className="relative overflow-hidden border-t border-border bg-gradient-to-br from-brand-800 to-brand-600 px-6 py-16 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sunshine-400/20 blur-3xl"
        />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="font-display text-2xl italic sm:text-3xl">Sei un insegnante?</h2>
          <p className="mt-3 max-w-md text-sm text-white/85 sm:text-base">
            Crea le tue classi, condividi un codice di accesso, monitora i
            progressi di ogni studente e genera esercizi personalizzati con
            l&apos;IA, su misura per ognuno.
          </p>
          <Link href="/registrati" className="mt-6">
            <Button className="bg-white px-8 py-3 text-base text-brand-800 shadow-lg hover:bg-sunshine-50 hover:text-brand-800">
              Registra la tua classe
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <ParolaMascot mood="neutro" className="h-8 w-8" />
            <span className="font-semibold text-ink-primary">Parola</span>
          </div>
          <nav className="flex gap-5 text-sm text-ink-secondary">
            <Link href="/login" className="hover:text-ink-primary">
              Accedi
            </Link>
            <Link href="/registrati" className="hover:text-ink-primary">
              Registrati
            </Link>
            <Link href="/privacy" className="hover:text-ink-primary">
              Privacy
            </Link>
            <Link href="/termini" className="hover:text-ink-primary">
              Termini
            </Link>
          </nav>
          <p className="text-xs text-ink-tertiary">
            © {new Date().getFullYear()} Parola — uno spazio per scrivere, sbagliare, migliorare.
          </p>
        </div>
      </footer>
    </main>
  )
}
