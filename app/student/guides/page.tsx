import Link from 'next/link'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { GUIDES } from '@/lib/guides'

const NAV_ITEMS = [
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' },
  { href: '/student/personalized', label: 'Per te' },
  { href: '/student/progress', label: 'I miei progressi' }
]

export default function GuidesPage() {
  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6 animate-fade-in">
        <div className="mb-6 flex items-center gap-3">
          <ParolaMascot mood="neutro" />
          <div>
            <h1 className="text-xl font-semibold text-ink-primary">Guide di scrittura</h1>
            <p className="text-sm text-ink-secondary">
              Scegli un tipo di testo e scrivi seguendo una consegna guidata.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/student/write?guida=${g.slug}`}>
              <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-surface-tertiary">
                <h2 className="font-semibold text-ink-primary">{g.titolo}</h2>
                <p className="mt-1 text-sm text-ink-secondary">{g.descrizione}</p>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
