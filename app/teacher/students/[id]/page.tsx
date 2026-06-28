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
import { valutazioneEsaminatoreSchema } from '@/lib/gemini/schema'
import {
  getPersonalizedExercisesForStudent,
  getLastSignInForStudent,
  markPersonalizedExercisesSeen,
  type PersonalizedExerciseRow
} from './actions'
import { GeneratePersonalizedExerciseButton } from './GeneratePersonalizedExerciseButton'
import { SubmissionHistoryEntry } from './SubmissionHistoryEntry'
import { PersonalizedExerciseEntry } from './PersonalizedExerciseEntry'
import { ListChecks, TrendingUp, GraduationCap, Target } from 'lucide-react'
import { ExportReportButton } from './ExportReportButton'

const NAV_ITEMS = [
  { href: '/teacher/dashboard', label: 'Dashboard' },
  { href: '/teacher/classes', label: 'Le mie classi' },
  { href: '/account', label: 'Account' }
]

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
  esercizio_struttura_4: 'Trasforma la frase',
  esercizio_struttura_5: 'Completamento lessicale',
  esercizio_struttura_6: 'Situazioni comunicative'
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
    .select(
      'id, tipo, created_at, consegna, testo_studente, valutazione_ia, testo_incollato, secondi_scrittura'
    )
    .eq('student_id', params.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore caricando le submissions dello studente:', error)
  }

  const stats = computeStudentStats((submissions as SubmissionRow[]) ?? [])

  // Side-effect deliberato: visitare questa pagina marca come "lette" le
  // consegne in attesa — stesso pattern di qualsiasi notifica in-app.
  await markPersonalizedExercisesSeen(params.id)

  const [personalizedExercises, ultimoAccesso] = await Promise.all([
    getPersonalizedExercisesForStudent(params.id),
    getLastSignInForStudent(params.id)
  ])
  const submissionIds = personalizedExercises
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
        <Link href="/teacher/classes" className="text-sm text-brand-400 underline">
          ← Tutte le classi
        </Link>

        <div className="mt-2 mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink-primary">
              {profile.nome} {profile.cognome}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-ink-tertiary">
              {profile.livello_target && <span>Livello target: {profile.livello_target}</span>}
              <span>
                Ultimo accesso:{' '}
                {ultimoAccesso
                  ? new Date(ultimoAccesso).toLocaleString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'mai'}
              </span>
            </div>
          </div>
          {stats.totaleAttivita > 0 && (
            <ExportReportButton
              nomeCompleto={`${profile.nome} ${profile.cognome}`}
              livelloTarget={profile.livello_target}
              stats={stats}
              ultimoAccesso={ultimoAccesso}
            />
          )}
        </div>

        <Card className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-primary">Esercizi personalizzati</h2>
          </div>
          <p className="mb-3 text-xs text-ink-tertiary">
            Genera un esercizio su misura (teoria, spiegazione, esempio e consegna pratica)
            basato sulle aree di miglioramento e gli errori più frequenti di questo studente.
          </p>
          <GeneratePersonalizedExerciseButton studentId={params.id} />

          {personalizedExercises.length > 0 && (
            <div className="mt-4 space-y-2">
              {personalizedExercises.map((e: PersonalizedExerciseRow) => {
                const isScrittura = e.tipo_esercizio === 'scrittura'
                const punteggio = e.submission_id ? punteggiPerSubmission[e.submission_id] : null

                let statoNode: React.ReactNode
                if (isScrittura) {
                  statoNode = e.submission_id ? (
                    punteggio !== null ? (
                      <span className="rounded-full bg-info-bg px-3 py-1 text-sm font-medium text-info-text">
                        {punteggio}%
                      </span>
                    ) : (
                      <span className="text-xs text-ink-tertiary">Consegnato, in valutazione</span>
                    )
                  ) : (
                    <span className="text-xs text-warning-text">In attesa dello studente</span>
                  )
                } else {
                  statoNode = e.completato_at ? (
                    <span className="rounded-full bg-info-bg px-3 py-1 text-sm font-medium text-info-text">
                      {e.punteggio_chiuso}%
                    </span>
                  ) : (
                    <span className="text-xs text-warning-text">In attesa dello studente</span>
                  )
                }

                return (
                  <PersonalizedExerciseEntry
                    key={e.id}
                    esercizio={e}
                    dataLabel={new Date(e.created_at).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                    statoNode={statoNode}
                  />
                )
              })}
            </div>
          )}
        </Card>

        {stats.totaleAttivita === 0 ? (
          <Card className="border-dashed text-center text-sm text-ink-tertiary">
            Questo studente non ha ancora svolto nessuna attività.
          </Card>
        ) : (
          <>
            {/* Riepilogo numerico */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="animate-fade-in-up text-center transition-shadow hover:shadow-md">
                <ListChecks className="mx-auto mb-1 h-5 w-5 text-info-text" strokeWidth={1.75} />
                <p className="text-2xl font-semibold text-ink-primary">
                  {stats.totaleAttivita}
                </p>
                <p className="text-xs text-ink-tertiary">Attività totali</p>
              </Card>
              <Card className="animate-fade-in-up delay-1 text-center transition-shadow hover:shadow-md">
                <TrendingUp className="mx-auto mb-1 h-5 w-5 text-success-text" strokeWidth={1.75} />
                <p className="text-2xl font-semibold text-ink-primary">
                  {stats.mediaGenerale !== null ? `${stats.mediaGenerale}%` : '—'}
                </p>
                <p className="text-xs text-ink-tertiary">Punteggio medio</p>
              </Card>
              <Card className="animate-fade-in-up delay-2 text-center transition-shadow hover:shadow-md">
                <GraduationCap className="mx-auto mb-1 h-5 w-5 text-brand-400" strokeWidth={1.75} />
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
              <Card className="animate-fade-in-up delay-3 text-center transition-shadow hover:shadow-md">
                <Target className="mx-auto mb-1 h-5 w-5 text-warning-text" strokeWidth={1.75} />
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
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">
                Storico attività e produzione scritta
              </h2>
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

                  const errori = Array.isArray(v?.errori)
                    ? (v.errori as Array<{
                        testo_originale: string
                        correzione: string
                        categoria: string
                        spiegazione: string
                      }>)
                    : undefined

                  const valutazioneParsed = valutazioneEsaminatoreSchema.safeParse(s.valutazione_ia)
                  const valutazioneCompleta = valutazioneParsed.success ? valutazioneParsed.data : null

                  return (
                    <SubmissionHistoryEntry
                      key={s.id}
                      id={s.id}
                      studentId={params.id}
                      tipoLabel={TIPO_LABEL[s.tipo] ?? s.tipo}
                      dataLabel={new Date(s.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      testo={s.testo_studente}
                      punteggio={punteggio}
                      rispettaConsegna={rispettoConsegna ? rispettoConsegna.rispetta_consegna : null}
                      testoIncollato={s.testo_incollato}
                      secondiScrittura={s.secondi_scrittura}
                      errori={errori}
                      valutazioneCompleta={valutazioneCompleta}
                    />
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
