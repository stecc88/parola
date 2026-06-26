import Link from 'next/link'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { requireApprovedTeacher } from '@/lib/teacher/guard'
import { getStudentsOverview, getPendingPersonalizedCount } from '../classes/actions'
import { buildClassDashboard } from '@/lib/analytics/classDashboard'
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  Trophy,
  Target,
  FileClock
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/teacher/dashboard', label: 'Dashboard' },
  { href: '/teacher/classes', label: 'Le mie classi' },
  { href: '/account', label: 'Account' }
]

const CATEGORIA_LABEL: Record<string, string> = {
  grammatica: 'Grammatica',
  lessico: 'Lessico',
  sintassi: 'Sintassi',
  coerenza: 'Coerenza',
  ortografia: 'Ortografia'
}

function iniziali(nome: string, cognome: string) {
  return `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase()
}

export default async function TeacherDashboardPage() {
  await requireApprovedTeacher()

  const [righe, pendingPersonalizzati] = await Promise.all([
    getStudentsOverview(),
    getPendingPersonalizedCount()
  ])

  const d = buildClassDashboard(righe)
  const maxLivello = Math.max(1, ...d.distribuzioneLivelli.map((l) => l.conteggio))
  const maxErrori = Math.max(1, ...Object.values(d.erroriTotaliPerCategoria))
  const medaglie = ['🥇', '🥈', '🥉']

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">
        <h1 className="mb-6 text-xl font-semibold text-ink-primary">Dashboard</h1>

        {d.studentiTotali === 0 ? (
          <Card className="border-dashed text-center text-sm text-ink-tertiary">
            Non hai ancora studenti. Condividi il tuo codice insegnante da{' '}
            <Link href="/teacher/classes" className="text-brand-400 underline">
              Le mie classi
            </Link>
            .
          </Card>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="animate-fade-in-up text-center transition-shadow hover:shadow-md">
                <Users className="mx-auto mb-1 h-5 w-5 text-info-text" strokeWidth={1.75} />
                <p className="text-2xl font-semibold text-ink-primary">{d.studentiTotali}</p>
                <p className="text-xs text-ink-tertiary">Studenti totali</p>
              </Card>
              <Card className="animate-fade-in-up delay-1 text-center transition-shadow hover:shadow-md">
                <Activity className="mx-auto mb-1 h-5 w-5 text-brand-400" strokeWidth={1.75} />
                <p className="text-2xl font-semibold text-ink-primary">
                  {d.mediaClasse !== null ? `${d.mediaClasse}%` : '—'}
                </p>
                <p className="text-xs text-ink-tertiary">Media classe</p>
              </Card>
              <Card className="animate-fade-in-up delay-2 text-center transition-shadow hover:shadow-md">
                <TrendingUp className="mx-auto mb-1 h-5 w-5 text-success-text" strokeWidth={1.75} />
                <p className="text-2xl font-semibold text-ink-primary">
                  {d.inMiglioramento.length}
                </p>
                <p className="text-xs text-ink-tertiary">In miglioramento</p>
              </Card>
              <Card className="animate-fade-in-up delay-3 text-center transition-shadow hover:shadow-md">
                <Activity className="mx-auto mb-1 h-5 w-5 text-warning-text" strokeWidth={1.75} />
                <p className="text-2xl font-semibold text-ink-primary">{d.attivi7gg}</p>
                <p className="text-xs text-ink-tertiary">Attivi 7gg</p>
              </Card>
            </div>

            {pendingPersonalizzati > 0 && (
              <Card className="mb-6 flex items-center gap-3 bg-info-bg">
                <FileClock className="h-5 w-5 shrink-0 text-info-text" />
                <p className="text-sm text-info-text">
                  <strong>{pendingPersonalizzati}</strong> esercizi personalizzati generati,
                  ancora senza risposta dello studente.
                </p>
              </Card>
            )}

            <Card className="mb-6">
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">
                Distribuzione livelli CILS nella classe
              </h2>
              <div className="space-y-2">
                {d.distribuzioneLivelli.map((l) => (
                  <div key={l.livello} className="flex items-center gap-3">
                    <span className="w-6 shrink-0 text-xs font-medium text-ink-secondary">
                      {l.livello}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-tertiary">
                      <div
                        className="h-full rounded-full bg-brand-400 transition-all duration-700"
                        style={{ width: `${(l.conteggio / maxLivello) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs text-ink-tertiary">
                      {l.conteggio}
                    </span>
                  </div>
                ))}
              </div>
              {d.studentiSenzaCorrezioni > 0 && (
                <p className="mt-3 text-xs text-ink-tertiary">
                  {d.studentiSenzaCorrezioni} studenti senza testi ancora corretti.
                </p>
              )}
            </Card>

            {d.studentiARischio.length > 0 && (
              <Card className="mb-6 border-danger-text/30 bg-danger-bg">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-danger-text">
                  <AlertTriangle className="h-4 w-4" /> Studenti a rischio (
                  {d.studentiARischio.length})
                </h2>
                <div className="space-y-2">
                  {d.studentiARischio.map((s) => (
                    <Link key={s.studentId} href={`/teacher/students/${s.studentId}`}>
                      <div className="flex items-center gap-3 rounded-md bg-surface p-2 hover:bg-surface-tertiary">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger-text/15 text-xs font-semibold text-danger-text">
                          {iniziali(s.nome, s.cognome)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink-primary">
                            {s.nome} {s.cognome}
                          </p>
                          <p className="truncate text-xs text-danger-text">
                            {s.motiviAttenzione.join(' · ')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {d.topClasse.length > 0 && (
              <Card className="mb-6">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-primary">
                  <Trophy className="h-4 w-4 text-warning-text" /> Top della classe
                </h2>
                <div className="space-y-2">
                  {d.topClasse.map((s, i) => (
                    <Link key={s.studentId} href={`/teacher/students/${s.studentId}`}>
                      <div className="flex items-center gap-3 rounded-md bg-surface-secondary p-2 hover:bg-surface-tertiary">
                        <span className="text-lg">{medaglie[i]}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink-primary">
                            {s.nome} {s.cognome}
                          </p>
                          <p className="text-xs text-ink-tertiary">
                            {s.livelloAttuale ?? '—'} · {s.totaleAttivita} test
                            {s.totaleAttivita === 1 ? 'o' : 'i'}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-success-bg px-3 py-1 text-sm font-semibold text-success-text">
                          {s.mediaGenerale}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {d.studentiConObiettivo > 0 && (
              <Card className="mb-6">
                <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-primary">
                  <Target className="h-4 w-4 text-brand-400" /> Obiettivi CILS della classe
                </h2>
                <p className="mb-3 text-xs text-ink-tertiary">
                  {d.studentiConObiettivo} studenti con obiettivo impostato
                </p>

                <p className="mb-1 text-xs font-medium text-ink-tertiary">
                  Distribuzione obiettivi
                </p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {d.distribuzioneObiettivi.map((o) => (
                    <span
                      key={o.livello}
                      className="rounded-full bg-guided-bg px-3 py-1 text-xs text-guided-text"
                    >
                      {o.livello}: {o.conteggio} studente{o.conteggio === 1 ? '' : 'i'}
                    </span>
                  ))}
                </div>

                {d.quasiAllObiettivo.length > 0 && (
                  <>
                    <p className="mb-1 text-xs font-medium text-ink-tertiary">
                      Quasi all&apos;obiettivo
                    </p>
                    <div className="space-y-2">
                      {d.quasiAllObiettivo.map((s) => (
                        <Link key={s.studentId} href={`/teacher/students/${s.studentId}`}>
                          <div className="flex items-center gap-3 rounded-md bg-surface-secondary p-2 hover:bg-surface-tertiary">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-400/15 text-xs font-semibold text-brand-400">
                              {iniziali(s.nome, s.cognome)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-ink-primary">
                                {s.nome} {s.cognome}
                              </p>
                              <p className="text-xs text-ink-tertiary">
                                {s.livelloAttuale} → {s.livelloTarget} · {s.mediaGenerale}/100
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            )}

            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <Card>
                <h2 className="mb-2 text-sm font-semibold text-ink-primary">
                  Rispetto consegna (classe)
                </h2>
                <p className="text-3xl font-semibold text-ink-primary">
                  {d.consegnaMediaClasse !== null ? `${d.consegnaMediaClasse}%` : '—'}
                </p>
                <p className="text-xs text-ink-tertiary">
                  media su scritture libere con consegna valutata
                </p>
              </Card>

              <Card>
                <h2 className="mb-2 text-sm font-semibold text-ink-primary">
                  Tempo medio alla prima correzione
                </h2>
                <p className="text-3xl font-semibold text-ink-primary">
                  {d.tempoMedioPrimaCorrezioneGiorni !== null
                    ? `${d.tempoMedioPrimaCorrezioneGiorni}g`
                    : '—'}
                </p>
                <p className="text-xs text-ink-tertiary">
                  dall&apos;iscrizione alla prima scrittura corretta
                  {d.studentiMaiIniziato.length > 0 &&
                    ` · ${d.studentiMaiIniziato.length} non hanno ancora iniziato`}
                </p>
              </Card>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <Card>
                <h2 className="mb-2 text-sm font-semibold text-ink-primary">
                  Errori più comuni della classe
                </h2>
                {(() => {
                  const totale = Object.values(d.erroriTotaliPerCategoria).reduce(
                    (a, b) => a + b,
                    0
                  )
                  if (totale === 0) {
                    return <p className="text-sm text-ink-tertiary">Nessun dato ancora.</p>
                  }
                  return (
                    <div className="space-y-1.5">
                      {Object.entries(d.erroriTotaliPerCategoria)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, n]) => (
                          <div key={cat} className="flex items-center gap-2">
                            <span className="w-20 shrink-0 text-xs text-ink-secondary">
                              {CATEGORIA_LABEL[cat]}
                            </span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-tertiary">
                              <div
                                className="h-full rounded-full bg-warning-text"
                                style={{ width: `${(n / maxErrori) * 100}%` }}
                              />
                            </div>
                            <span className="w-5 shrink-0 text-right text-xs text-ink-tertiary">
                              {n}
                            </span>
                          </div>
                        ))}
                    </div>
                  )
                })()}
              </Card>

              {d.studentiMaiIniziato.length > 0 && (
                <Card>
                  <h2 className="mb-2 text-sm font-semibold text-ink-primary">
                    Iscritti ma non ancora partiti
                  </h2>
                  <div className="space-y-1.5">
                    {d.studentiMaiIniziato.map((s) => (
                      <Link key={s.studentId} href={`/teacher/students/${s.studentId}`}>
                        <p className="truncate text-sm text-ink-secondary hover:text-ink-primary">
                          {s.nome} {s.cognome}
                        </p>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <Card className="mb-6">
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">
                Punteggi medi per studente
              </h2>
              <div className="space-y-1.5">
                {righe
                  .filter((r) => r.mediaGenerale !== null)
                  .sort((a, b) => (b.mediaGenerale ?? 0) - (a.mediaGenerale ?? 0))
                  .map((r) => (
                    <Link key={r.studentId} href={`/teacher/students/${r.studentId}`}>
                      <div className="flex items-center gap-2 hover:opacity-80">
                        <span className="w-28 shrink-0 truncate text-xs text-ink-secondary">
                          {r.nome}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-tertiary">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              (r.mediaGenerale ?? 0) >= 60 ? 'bg-success-text' : 'bg-danger-text'
                            }`}
                            style={{ width: `${r.mediaGenerale}%` }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-right text-xs text-ink-tertiary">
                          {r.mediaGenerale}
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">Riepilogo attività</h2>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-success-text">
                    <TrendingUp className="h-4 w-4" /> In miglioramento ({d.inMiglioramento.length})
                  </p>
                  <p className="text-xs text-ink-secondary">
                    {d.inMiglioramento.length === 0
                      ? "Nessuno ancora — serve più di un'attività valutata per misurarlo."
                      : d.inMiglioramento.map((s) => `${s.nome} ${s.cognome}`).join(', ')}
                  </p>
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink-secondary">
                    <Minus className="h-4 w-4" /> Stabili ({d.stabili.length})
                  </p>
                  <p className="text-xs text-ink-secondary">
                    {d.stabili.length === 0
                      ? '—'
                      : d.stabili.map((s) => `${s.nome} ${s.cognome}`).join(', ')}
                  </p>
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-danger-text">
                    <TrendingDown className="h-4 w-4" /> In calo / a rischio ({d.inCalo.length})
                  </p>
                  <p className="text-xs text-ink-secondary">
                    {d.inCalo.length === 0
                      ? '—'
                      : d.inCalo.map((s) => `${s.nome} ${s.cognome}`).join(', ')}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </main>
    </>
  )
}
