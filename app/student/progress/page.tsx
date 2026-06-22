import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'

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

function extractPunteggio(valutazione: unknown): number | null {
  if (!valutazione || typeof valutazione !== 'object') return null
  const v = valutazione as Record<string, unknown>

  // Forma de scrittura_libera (esaminatore)
  if (typeof v.punteggio_complessivo === 'number') return v.punteggio_complessivo

  // Forma de esercizi di struttura: % de risultati corretti
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
    .select('id, tipo, created_at, valutazione_completed_at, valutazione_ia')
    .eq('student_id', userData.user?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(50)

  const totale = submissions?.length ?? 0
  const valutate = submissions?.filter((s) => s.valutazione_ia).length ?? 0
  const punteggi = (submissions ?? [])
    .map((s) => extractPunteggio(s.valutazione_ia))
    .filter((p): p is number => p !== null)
  const media = punteggi.length > 0
    ? Math.round(punteggi.reduce((a, b) => a + b, 0) / punteggi.length)
    : null

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="mb-6 text-xl font-semibold text-ink-primary">I miei progressi</h1>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card className="text-center">
            <p className="text-2xl font-semibold text-ink-primary">{totale}</p>
            <p className="text-xs text-ink-tertiary">Attività totali</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-semibold text-ink-primary">{valutate}</p>
            <p className="text-xs text-ink-tertiary">Valutate</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-semibold text-ink-primary">
              {media !== null ? `${media}%` : '—'}
            </p>
            <p className="text-xs text-ink-tertiary">Punteggio medio</p>
          </Card>
        </div>

        {!submissions || submissions.length === 0 ? (
          <Card className="border-dashed text-center text-sm text-ink-tertiary">
            Nessuna attività ancora. Inizia con la scrittura libera o un esercizio.
          </Card>
        ) : (
          <div className="space-y-2">
            {submissions.map((s) => {
              const punteggio = extractPunteggio(s.valutazione_ia)
              return (
                <Card key={s.id} className="flex items-center justify-between">
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
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
