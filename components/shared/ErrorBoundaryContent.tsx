'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ParolaMascot } from '@/components/shared/ParolaMascot'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
  contesto: string
  tornaHref?: string
  tornaLabel?: string
}

/**
 * Contenuto condiviso per gli error.tsx delle varie route — evita errori
 * non gestiti (es. Gemini sovraccarico) che rompono l'intero albero React
 * invece di mostrare un messaggio gestito con possibilità di riprovare.
 */
export function ErrorBoundaryContent({
  error,
  reset,
  contesto,
  tornaHref = '/',
  tornaLabel = 'Torna alla home'
}: Props) {
  useEffect(() => {
    console.error(`Errore in ${contesto}:`, error)
  }, [error, contesto])

  return (
    <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">
      <Card className="text-center shadow-xl">
        <ParolaMascot mood="pensieroso" className="mx-auto mb-3" />
        <h1 className="mb-2 text-lg font-semibold text-ink-primary">
          Qualcosa è andato storto
        </h1>
        <p className="mb-4 text-sm text-ink-secondary">
          Si è verificato un errore temporaneo (può capitare se il servizio IA è
          momentaneamente sovraccarico). Riprova.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>Riprova</Button>
          <Link href={tornaHref}>
            <Button variant="secondary">{tornaLabel}</Button>
          </Link>
        </div>
      </Card>
    </main>
  )
}
