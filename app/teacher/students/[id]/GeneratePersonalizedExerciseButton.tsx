'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { generatePersonalizedExercise } from './actions'

export function GeneratePersonalizedExerciseButton({ studentId }: { studentId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleClick() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      try {
        await generatePersonalizedExercise(studentId)
        setSuccess(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore inatteso.')
      }
    })
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={pending} className="text-sm">
        {pending ? 'Generazione in corso...' : '✨ Genera esercizio personalizzato'}
      </Button>
      {pending && (
        <p className="mt-2 text-xs text-ink-tertiary">
          L&apos;IA sta analizzando le difficoltà ricorrenti dello studente. Può richiedere
          qualche secondo.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-danger-text">{error}</p>}
      {success && (
        <p className="mt-2 text-xs text-success-text">
          Esercizio generato — lo trovi qui sotto e nello spazio dello studente.
        </p>
      )}
    </div>
  )
}
