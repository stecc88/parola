import Link from 'next/link'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { createClient } from '@/lib/supabase/server'
import { getMyPersonalizedExercises, markPersonalizedExercisesSeenByStudent } from './actions'
import { hasActiveMembership } from '@/app/student/join-class/actions'

const NAV_ITEMS = [
  { href: '/student/progress', label: 'I miei progressi' },
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' },
  { href: '/student/personalized', label: 'Per te' },
  { href: '/account', label: 'Account' }
]

export default async function PersonalizedExercisesPage() {
  const esercizi = await getMyPersonalizedExercises()
  const haInsegnante = await hasActiveMembership()
  const supabase = createClient()

  // Side-effect deliberato: visitare questa pagina marca come "viste" le
  // notifiche in attesa — stesso pattern già usato per il docente.
  await markPersonalizedExercisesSeenByStudent()

  const submissionIds = esercizi
    .map((e) => e.submission_id)
    .filter((id): id is string => !!id)

  let punteggiPerSubmission: Record<string, number | null> = {}
  if (submissionIds.length > 0) {
    const { data: relatedSubmissions } = await supabase
      .from('submissions')
      .select('id, valutazione_ia')
      .in('id', submissionIds)

    punteggiPerSubmission = Object.fromEntries(
      (relatedSubmissions ?? []).map((s) => {
        const v = s.valutazione_ia as Record<string, unknown> | null
        const punteggio = typeof v?.punteggio_complessivo === 'number' ? v.punteggio_complessivo : null
        return [s.id, punteggio]
      })
    )
  }

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">
        {/* Hero */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-brand-600 to-coral-600 p-6 text-white shadow-glow-brand">
          <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-6 bottom-0 h-32 w-32 rounded-full bg-sunshine-400/20 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <ParolaMascot mood="felice" className="h-14 w-14 animate-float-slow drop-shadow-lg" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Esercizi per te</h1>
              <p className="mt-0.5 text-sm text-white/80">
                Creati dal tuo insegnante in base agli errori nei tuoi testi — mirati esattamente su ciò che devi migliorare.
              </p>
            </div>
          </div>
        </div>

        {/* Come funziona */}
        <Card className="mb-6 bg-surface-secondary">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary mb-3">Come funziona</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex items-start gap-2 text-sm text-ink-secondary">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-600">1</span>
              <span>Scrivi un testo libero o un esercizio</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-ink-secondary">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-600">2</span>
              <span>Il tuo insegnante vede le correzioni dell&apos;IA e genera un esercizio mirato</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-ink-secondary">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-600">3</span>
              <span>L&apos;esercizio compare qui — svolgilo e il professore vede i tuoi progressi</span>
            </div>
          </div>
        </Card>

        {esercizi.length === 0 ? (
          <Card className="border-dashed py-10 text-center">
            <ParolaMascot mood="pensieroso" className="mx-auto mb-3 animate-float-slow" />
            {haInsegnante ? (
              <>
                <p className="font-medium text-ink-secondary">Nessun esercizio ancora.</p>
                <p className="mt-1 text-xs text-ink-tertiary">
                  Scrivi un testo in <Link href="/student/write" className="text-brand-400 underline">Scrittura libera</Link> e il tuo insegnante potrà crearti un esercizio personalizzato.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-ink-secondary">Nessun insegnante collegato.</p>
                <p className="mt-1 text-xs text-ink-tertiary">
                  Gli esercizi personalizzati vengono creati dal tuo insegnante.{' '}
                  <Link href="/student/join-class" className="text-brand-400 underline">
                    Hai un codice classe? Inseriscilo qui.
                  </Link>
                </p>
              </>
            )}
          </Card>
        ) : (
          <div className="space-y-2">
            {esercizi.map((e) => {
              const isScrittura = e.tipo_esercizio === 'scrittura'
              const punteggio = e.submission_id ? punteggiPerSubmission[e.submission_id] : null

              let statoNode
              if (isScrittura) {
                statoNode = e.submission_id ? (
                  punteggio !== null ? (
                    <span className="rounded-full bg-info-bg px-3 py-1 text-sm font-medium text-info-text">
                      {punteggio}%
                    </span>
                  ) : (
                    <span className="text-xs text-ink-tertiary">In valutazione</span>
                  )
                ) : (
                  <span className="rounded-full bg-guided-bg px-3 py-1 text-xs font-medium text-guided-text">
                    Da svolgere
                  </span>
                )
              } else {
                statoNode = e.completato_at ? (
                  <span className="rounded-full bg-info-bg px-3 py-1 text-sm font-medium text-info-text">
                    {e.punteggio_chiuso}%
                  </span>
                ) : (
                  <span className="rounded-full bg-guided-bg px-3 py-1 text-xs font-medium text-guided-text">
                    Da svolgere
                  </span>
                )
              }

              const isNuovo = !e.seen_by_student

              return (
                <Link key={e.id} href={`/student/personalized/${e.id}`}>
                  <Card
                    className={`flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-surface-tertiary ${
                      isNuovo ? 'border-brand-400 bg-brand-400/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isNuovo && (
                        <span className="shrink-0 rounded-full bg-brand-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Nuovo
                        </span>
                      )}
                      <div>
                        <p className={`text-sm font-medium ${isNuovo ? 'text-ink-primary' : 'text-ink-primary'}`}>
                          {e.titolo}
                        </p>
                        <p className="text-xs text-ink-tertiary">
                          {new Date(e.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    {statoNode}
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
