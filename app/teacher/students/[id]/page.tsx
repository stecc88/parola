import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedTeacher } from '@/lib/teacher/guard'
import { EvolutionChart } from '@/components/teacher/EvolutionChart'
import {
  computeStudentStats,
  type SubmissionRow,
  type CategoriaErrore
} from '@/lib/analytics/studentStats'

const NAV_ITEMS = [{ href: '/teacher/classes', label: 'Le mie classi' }]

const CATEGORIA_LABEL: Record<CategoriaErrore, string> = {
  grammatica: 'Grammatica',
  lessico: 'Lessico',
  sintassi: 'Sintassi',
  coerenza: 'Coerenza',
  ortografia: 'Ortografia'
}

const TIPO_LABEL: Record<string, string> = {
  scrittura_libera: 'Scrittura libera',
  esercizio_struttura_1: 'Completa la frase',
  esercizio_struttura_2: 'Riordina le parole',
  esercizio_struttura_3: 'Scegli la preposizione',
  esercizio_struttura_4: 'Trasforma la frase'
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  await requireApprovedTeacher()
  const supabase = createClient()

  // Grazie alla RLS policy profiles_select_by_teacher (basata su
  // is_active_teacher_of), questa query restituisce dati SOLO se lo
  // studente è effettivamente attivo sotto questo insegnante. Se è di un
  // altro insegnante (o ha lasciato), torna null e mostriamo 404 — non c'è
  // bisogno di un controllo manuale aggiuntivo qui.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nome, cognome, livello_target')
    .eq('id', params.id)
    .eq('role', 'student')
    .single()

  if (!profile) {
    notFound()
  }

  // Stessa logica: submissions_select_by_active_teacher filtra già per noi.
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('id, tipo, created_at, consegna, valutazione_ia')
    .eq('student_id', params.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore caricando le submissions dello studente:', error)
  }

  const stats = computeStudentStats((submissions as SubmissionRow[]) ?? [])

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6">
        <Link href="/teacher/classes" className="text-sm text-brand-400 underline">
          ← Tutte le classi
        </Link>

        <div className="mt-2 mb-6">
          <h1 className="text-xl font-semibold text-ink-primary">
            {profile.nome} {profile.cognome}
          </h1>
          {profile.livello_target && (
            <p className="text-sm text-ink-tertiary">
              Livello target: {profile.livello_target}
            </p>
          )}
        </div>

        {stats.totaleAttivita === 0 ? (
          <Card className="border-dashed text-center text-sm text-ink-tertiary">
            Questo studente non ha ancora svolto nessuna attività.
          </Card>
        ) : (
          <>
            {/* Riepilogo numerico */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="text-center">
                <p className="text-2xl font-semibold text-ink-primary">
                  {stats.totaleAttivita}
                </p>
                <p className="text-xs text-ink-tertiary">Attività totali</p>
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
                  Livello stimato attuale
                  {stats.livelloPrecedente && stats.livelloPrecedente !== stats.livelloAttuale && (
                    <span className="ml-1 text-ink-tertiary">
                      (prima: {stats.livelloPrecedente})
                    </span>
                  )}
                </p>
              </Card>
              <Card className="text-center">
                <p className="text-2xl font-semibold text-ink-primary">
                  {stats.consegna.percentuale !== null ? `${stats.consegna.percentuale}%` : '—'}
                </p>
                <p className="text-xs text-ink-tertiary">
                  Consegne rispettate
                  {stats.consegna.totali > 0 && (
                    <span className="ml-1">
                      ({stats.consegna.rispettate}/{stats.consegna.totali})
                    </span>
                  )}
                </p>
              </Card>
            </div>

            {/* Evoluzione nel tempo */}
            <Card className="mb-6">
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">
                Evoluzione del punteggio nel tempo
              </h2>
              <EvolutionChart punti={stats.evoluzione} />
            </Card>

            {/* Punti di forza / aree di miglioramento ricorrenti */}
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <Card>
                <h2 className="mb-3 text-sm font-semibold text-success-text">
                  Punti di forza ricorrenti
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
                  Aree di miglioramento ricorrenti
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

            {/* Distribuzione errori per categoria */}
            <Card className="mb-6">
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">
                Errori per categoria
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
                      Nessun errore registrato nelle attività valutate finora.
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
            </Card>

            {/* Storico attività */}
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">Storico attività</h2>
              <div className="space-y-2">
                {(submissions ?? []).map((s) => {
                  const v =
                    s.valutazione_ia && typeof s.valutazione_ia === 'object'
                      ? (s.valutazione_ia as Record<string, unknown>)
                      : null
                  const punteggio =
                    typeof v?.punteggio_complessivo === 'number'
                      ? v.punteggio_complessivo
                      : typeof v?.punteggio === 'number'
                        ? v.punteggio
                        : null
                  const rispettoConsegna = v?.rispetto_consegna as
                    | { rispetta_consegna: boolean }
                    | null
                    | undefined

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
                      <div className="flex items-center gap-2">
                        {rispettoConsegna && (
                          <span
                            className={`text-xs ${
                              rispettoConsegna.rispetta_consegna
                                ? 'text-success-text'
                                : 'text-warning-text'
                            }`}
                            title={
                              rispettoConsegna.rispetta_consegna
                                ? 'Consegna rispettata'
                                : 'Consegna non completamente rispettata'
                            }
                          >
                            {rispettoConsegna.rispetta_consegna ? '✓' : '⚠'}
                          </span>
                        )}
                        {punteggio !== null ? (
                          <span className="rounded-full bg-info-bg px-3 py-1 text-sm font-medium text-info-text">
                            {punteggio}%
                          </span>
                        ) : (
                          <span className="text-xs text-ink-tertiary">In attesa</span>
                        )}
                      </div>
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
