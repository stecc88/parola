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
        <h1 className="mb-2 text-xl font-semibold text-ink-primary">Esercizi per te</h1>
        <p className="mb-6 text-sm text-ink-secondary">
          Esercizi creati dal tuo insegnante apposta per aiutarti sui punti su cui stai
          lavorando.
        </p>

        {esercizi.length === 0 ? (
          <Card className="border-dashed text-center text-sm text-ink-tertiary">
            <ParolaMascot mood="pensieroso" className="mx-auto mb-2" />
            {haInsegnante ? (
              'Il tuo insegnante non ha ancora creato esercizi personalizzati per te.'
            ) : (
              <>
                Gli esercizi personalizzati richiedono un insegnante che li generi su misura
                per te.{' '}
                <Link href="/student/join-class" className="text-brand-400 underline">
                  Hai un codice insegnante? Inseriscilo qui.
                </Link>
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
