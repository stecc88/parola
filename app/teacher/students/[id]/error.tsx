'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function StudentDetailError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Errore nella pagina dettaglio studente:', error)
  }, [error])

  return (
    <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">
      <Card className="text-center">
        <h1 className="mb-2 text-lg font-semibold text-ink-primary">
          Qualcosa è andato storto
        </h1>
        <p className="mb-4 text-sm text-ink-secondary">
          Si è verificato un errore temporaneo (può capitare se il servizio IA è
          momentaneamente sovraccarico). Riprova.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>Riprova</Button>
          <Link href="/teacher/classes">
            <Button variant="secondary">Torna alle classi</Button>
          </Link>
        </div>
      </Card>
    </main>
  )
}
