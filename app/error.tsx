'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { ParolaMascot } from '@/components/shared/ParolaMascot'

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="it">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
          <ParolaMascot mood="pensieroso" className="h-16 w-16" />
          <h1 className="text-xl font-semibold text-ink-primary">Qualcosa è andato storto</h1>
          <p className="max-w-xs text-sm text-ink-secondary">
            Si è verificato un errore inatteso. Prova a ricaricare la pagina.
          </p>
          <Button onClick={reset}>Riprova</Button>
        </main>
      </body>
    </html>
  )
}
