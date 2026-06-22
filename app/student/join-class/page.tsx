'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { joinClassWithCode } from './actions'

export default function JoinClassPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await joinClassWithCode(code)
        router.push('/student/write')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Errore inatteso.')
      }
    })
  }

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-surface-secondary p-6 animate-fade-in">
      <Card className="w-full max-w-sm bg-surface">
        <div className="mb-6 flex flex-col items-center gap-3">
          <ParolaMascot mood="incoraggiante" />
          <h1 className="text-xl font-semibold text-ink-primary">Unisciti al tuo insegnante</h1>
          <p className="text-center text-sm text-ink-secondary">
            Inserisci il codice del tuo insegnante. Ti assegnerà a una classe in seguito.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="es. A3F7K9"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-center text-sm uppercase tracking-widest outline-none focus:border-brand-400"
          />

          {error && (
            <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
              {error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Verifica in corso...' : 'Unisciti'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
