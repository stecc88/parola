import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ParolaMascot } from '@/components/shared/ParolaMascot'

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-surface-secondary p-6 animate-fade-in">
      <Card className="w-full max-w-sm bg-surface text-center shadow-xl">
        <ParolaMascot mood="pensieroso" className="mx-auto mb-4 animate-float-slow" />
        <h1 className="text-xl font-semibold text-ink-primary">Pagina non trovata</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Questa pagina non esiste o si è spostata altrove.
        </p>
        <Link href="/" className="mt-5 inline-block">
          <Button>Torna alla home</Button>
        </Link>
      </Card>
    </main>
  )
}
