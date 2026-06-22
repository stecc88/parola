import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { EvolutionChart } from '@/components/teacher/EvolutionChart'
import {
  computeStudentStats,
  type SubmissionRow,
  type CategoriaErrore
} from '@/lib/analytics/studentStats'

const NAV_ITEMS = [
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' },
  { href: '/student/personalized', label: 'Per te' },
  { href: '/student/progress', label: 'I miei progressi' }
]

const TIPO_LABEL: Record<string, string> = {
  scrittura_libera: 'Scrittura libera',
  esercizio_struttura_1: 'Completa la frase',
  esercizio_struttura_2: 'Riordina le parole',
  esercizio_struttura_3: 'Scegli la preposizione',
  esercizio_struttura_4: 'Trasforma la frase'
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

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, tipo, created_at, consegna, valutazione_completed_at, valutazione_ia')
    .eq('student_id', userData.user?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(50)

  const stats = computeStudentStats((submissions as SubmissionRow[]) ?? [])

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6 animate-fade-in">
        <h1 className="mb-6 text-xl font-semibold text-ink-primary">I miei progressi</h1>

        {stats.totaleAttivita === 0 ? (
          <Card className="border-dashed text-center text-sm text-ink-tertiary">
            Nessuna attività ancora. Inizia con la scrittura libera o un esercizio.
          </Card>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="text-center">
                <p className="text-2xl font-semibold text-ink-primary">{stats.totaleAttivita}</p>
                <p className="text-xs text-ink-tertiary">Attività totali</p>
              </Card>
              <Card className="text-center">
                <p className="text-2xl font-semibold text-ink-primary">{stats.valutate}</p>
                <p className="text-xs text-ink-tertiary">Valutate</p>
              </Card>
              <Card className="text-center">
                <p className="text-2xl font-semibold text-ink-primary">
                  {stats.mediaGenerale !== null ? `${stats.mediaGenerale}%` : '—'}
                </p>
                <p className="text-xs text-ink-tertiary">Punteggio medio</p>
              </Card>
              <Card className="text-center">
                <p className="text-2xl font-semibold text-ink-primary">
                  {stats.livelloAttuale ?? '—'}
                </p>
                <p className="text-xs text-ink-tertiary">
                  Livello stimato
                  {stats.livelloPrecedente && stats.livelloPrecedente !== stats.livelloAttuale && (
                    <span className="ml-1">(prima: {stats.livelloPrecedente})</span>
                  )}
                </p>
              </Card>
            </div>

            <Card className="mb-6">
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">
                La tua evoluzione nel tempo
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
                            className="h-full rounded-full bg-brand-400"
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
                {(submissions ?? []).map((s) => {
                  const punteggio = extractPunteggio(s.valutazione_ia)
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-md bg-surface-secondary p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink-primary">
                          {TIPO_LABEL[s.tipo] ?? s.tipo}
                        </p>
                        <p className="text-xs text-ink-tertiary">
                          {new Date(s.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {punteggio !== null ? (
                        <span className="rounded-full bg-info-bg px-3 py-1 text-sm font-medium text-info-text">
                          {punteggio}%
                        </span>
                      ) : (
                        <span className="text-xs text-ink-tertiary">In attesa di valutazione</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </>
        )}
      </main>
    </>
  )
}
