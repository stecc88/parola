import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { createClient } from '@/lib/supabase/server'
import { EvolutionChart } from '@/components/teacher/EvolutionChart'
import { ListChecks, CheckCircle2, TrendingUp, GraduationCap } from 'lucide-react'
import {
  computeStudentStats,
  type SubmissionRow,
  type CategoriaErrore
} from '@/lib/analytics/studentStats'
import { StudentSubmissionEntry } from './StudentSubmissionEntry'

const NAV_ITEMS = [
  { href: '/student/progress', label: 'I miei progressi' },
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' },
  { href: '/student/personalized', label: 'Per te' },
  { href: '/account', label: 'Account' }
]

const TIPO_LABEL: Record<string, string> = {
  scrittura_libera: 'Scrittura libera',
  esercizio_struttura_1: 'Completa la frase',
  esercizio_struttura_2: 'Riordina le parole',
  esercizio_struttura_3: 'Scegli la preposizione',
  esercizio_struttura_4: 'Trasforma la frase',
  esercizio_struttura_5: 'Completamento lessicale',
  esercizio_struttura_6: 'Situazioni comunicative'
}

const CATEGORIA_LABEL: Record<CategoriaErrore, string> = {
  grammatica: 'Grammatica',
  lessico: 'Lessico',
  sintassi: 'Sintassi',
  coerenza: 'Coerenza',
  ortografia: 'Ortografia'
}

function extractPunteggio(valutazione: unknown): number | null {
  if (!valutazione || typeof valutazione !== 'object') return null
  const v = valutazione as Record<string, unknown>
  if (typeof v.punteggio_complessivo === 'number') return v.punteggio_complessivo
  if (Array.isArray(v.risultati)) {
    const risultati = v.risultati as { corretto: boolean }[]
    if (risultati.length === 0) return null
    const corretti = risultati.filter((r) => r.corretto).length
    return Math.round((corretti / risultati.length) * 100)
  }
  return null
}

export default async function ProgressPage() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()

  const [{ data: allSubmissions }, { data: profile }] = await Promise.all([
    supabase
      .from('submissions')
      .select('id, tipo, created_at, consegna, valutazione_completed_at, valutazione_ia, testo_studente')
      .eq('student_id', userData.user?.id ?? '')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('nome').eq('id', userData.user?.id ?? '').single()
  ])

  // Stats calcolate su TUTTE le submission per non perdere la storia
  // pedagogica. La UI mostra solo le ultime 5.
  const stats = computeStudentStats((allSubmissions as SubmissionRow[]) ?? [])
  const submissions = (allSubmissions ?? []).slice(0, 5)

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">
        {/* Hero */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-violet-600 to-coral-600 p-6 text-white shadow-glow-brand">
          <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-sunshine-400/20 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute right-1/3 top-0 h-24 w-24 rounded-full bg-violet-400/20 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <ParolaMascot mood="felice" className="h-16 w-16 animate-float-slow drop-shadow-lg" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Ciao{profile?.nome ? `, ${profile.nome}` : ''}! 👋
              </h1>
              <p className="mt-0.5 text-sm text-white/80">Ecco come stai andando con il tuo italiano.</p>
            </div>
          </div>
        </div>

        {stats.totaleAttivita === 0 ? (
          <Card className="border-dashed py-10 text-center text-sm text-ink-tertiary">
            <ParolaMascot mood="incoraggiante" className="mx-auto mb-3 animate-float-slow" />
            <p className="font-medium text-ink-secondary">Nessuna attività ancora.</p>
            <p className="mt-1 text-xs">Inizia con la scrittura libera o un esercizio.</p>
          </Card>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="animate-fade-in-up text-center !p-4">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-info-bg">
                  <ListChecks className="h-4 w-4 text-info-text" strokeWidth={2} />
                </div>
                <p className="text-2xl font-bold text-ink-primary">{stats.totaleAttivita}</p>
                <p className="mt-0.5 text-xs text-ink-tertiary">Attività totali</p>
              </Card>
              <Card className="animate-fade-in-up delay-1 text-center !p-4">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-success-bg">
                  <CheckCircle2 className="h-4 w-4 text-success-text" strokeWidth={2} />
                </div>
                <p className="text-2xl font-bold text-ink-primary">{stats.valutate}</p>
                <p className="mt-0.5 text-xs text-ink-tertiary">Valutate</p>
              </Card>
              <Card className="animate-fade-in-up delay-2 text-center !p-4">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100">
                  <TrendingUp className="h-4 w-4 text-brand-600" strokeWidth={2} />
                </div>
                <p className="text-2xl font-bold text-ink-primary">
                  {stats.mediaGenerale !== null ? `${stats.mediaGenerale}%` : '—'}
                </p>
                <p className="mt-0.5 text-xs text-ink-tertiary">Punteggio medio</p>
              </Card>
              <Card className="animate-fade-in-up delay-3 text-center !p-4">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-warning-bg">
                  <GraduationCap className="h-4 w-4 text-warning-text" strokeWidth={2} />
                </div>
                <p className="text-2xl font-bold text-ink-primary">
                  {stats.livelloAttuale ?? '—'}
                </p>
                <p className="mt-0.5 text-xs text-ink-tertiary">
                  Livello stimato
                  {stats.livelloPrecedente && stats.livelloPrecedente !== stats.livelloAttuale && (
                    <span className="ml-1">(prima: {stats.livelloPrecedente})</span>
                  )}
                </p>
              </Card>
            </div>

            <Card className="mb-6">
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">
                📈 La tua evoluzione nel tempo
              </h2>
              <EvolutionChart punti={stats.evoluzione} />
            </Card>

            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <Card>
                <h2 className="mb-3 text-sm font-semibold text-success-text">
                  I tuoi punti di forza ricorrenti
                </h2>
                {stats.puntiForzaFrequenti.length === 0 ? (
                  <p className="text-sm text-ink-tertiary">Non ci sono ancora dati.</p>
                ) : (
                  <ul className="space-y-2">
                    {stats.puntiForzaFrequenti.map((v, i) => (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-2 text-sm text-ink-primary"
                      >
                        <span>{v.testo}</span>
                        {v.conteggio > 1 && (
                          <span className="shrink-0 rounded-full bg-success-bg px-2 py-0.5 text-xs text-success-text">
                            ×{v.conteggio}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <h2 className="mb-3 text-sm font-semibold text-warning-text">
                  Su cosa lavorare ora
                </h2>
                {stats.areeMiglioramentoFrequenti.length === 0 ? (
                  <p className="text-sm text-ink-tertiary">Non ci sono ancora dati.</p>
                ) : (
                  <ul className="space-y-2">
                    {stats.areeMiglioramentoFrequenti.map((v, i) => (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-2 text-sm text-ink-primary"
                      >
                        <span>{v.testo}</span>
                        {v.conteggio > 1 && (
                          <span className="shrink-0 rounded-full bg-warning-bg px-2 py-0.5 text-xs text-warning-text">
                            ×{v.conteggio}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <Card className="mb-6">
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">
                I tuoi errori per categoria
              </h2>
              {(() => {
                const max = Math.max(1, ...Object.values(stats.erroriPerCategoria))
                const totaleErrori = Object.values(stats.erroriPerCategoria).reduce(
                  (a, b) => a + b,
                  0
                )
                if (totaleErrori === 0) {
                  return (
                    <p className="text-sm text-ink-tertiary">
                      Nessun errore registrato nelle attività valutate finora — ottimo!
                    </p>
                  )
                }
                return (
                  <div className="space-y-2">
                    {Object.entries(stats.erroriPerCategoria).map(([categoria, conteggio]) => (
                      <div key={categoria} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs text-ink-secondary">
                          {CATEGORIA_LABEL[categoria as CategoriaErrore]}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-tertiary">
                          <div
                            className="h-full rounded-full bg-brand-400 transition-all duration-700"
                            style={{ width: `${(conteggio / max) * 100}%` }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right text-xs text-ink-tertiary">
                          {conteggio}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })()}
              <p className="mt-3 text-xs text-ink-tertiary">
                Chiedi al tuo insegnante un esercizio personalizzato sulla categoria dove sbagli
                di più — lo trovi in &quot;Per te&quot; una volta creato.
              </p>
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">Storico attività</h2>
              <div className="space-y-2">
                {(submissions ?? []).map((s) => (
                  <StudentSubmissionEntry
                    key={s.id}
                    id={s.id}
                    tipo={s.tipo}
                    tipoLabel={TIPO_LABEL[s.tipo] ?? s.tipo}
                    dataLabel={new Date(s.created_at).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    punteggio={extractPunteggio(s.valutazione_ia)}
                    testo={s.testo_studente ?? null}
                    valutazione={s.valutazione_ia ?? null}
                    consegna={s.consegna ?? null}
                  />
                ))}
              </div>
            </Card>
          </>
        )}
      </main>
    </>
  )
}
