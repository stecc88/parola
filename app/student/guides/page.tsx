import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'

const NAV_ITEMS = [
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' }
]

export default function GuidesPage() {
  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <ParolaMascot mood="neutro" />
          <div>
            <h1 className="text-xl font-semibold text-ink-primary">Guide di scrittura</h1>
            <p className="text-sm text-ink-secondary">
              Modalità guidata per imparare a scrivere diversi tipi di testo.
            </p>
          </div>
        </div>

        <Card className="border-dashed text-center text-sm text-ink-tertiary">
          Questa sezione è in fase di sviluppo.
        </Card>
      </main>
    </>
  )
}
