import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'

const NAV_ITEMS = [
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' }
]

export default function ExercisesPage() {
  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <ParolaMascot mood="pensieroso" />
          <div>
            <h1 className="text-xl font-semibold text-ink-primary">
              Esercizi di analisi delle strutture
            </h1>
            <p className="text-sm text-ink-secondary">
              4 tipi di esercizio per allenare la struttura della lingua.
            </p>
          </div>
        </div>

        <Card className="border-dashed text-center text-sm text-ink-tertiary">
          Questa sezione è in fase di sviluppo. Il contratto dei 4 tipi di
          esercizio non è ancora stato definito.
        </Card>
      </main>
    </>
  )
}
