'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { moveStudentToClass } from './actions'

export function MoveStudentSelect({
  membershipId,
  classi
}: {
  membershipId: string
  classi: { id: string; nome: string }[]
}) {
  const [targetId, setTargetId] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (classi.length === 0) {
    return <span className="text-xs text-ink-tertiary">Nessun'altra classe</span>
  }

  function handleMove() {
    if (!targetId) return
    startTransition(async () => {
      try {
        await moveStudentToClass(membershipId, targetId)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Errore inatteso.')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-brand-400"
      >
        <option value="">Sposta in...</option>
        {classi.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      <Button
        variant="secondary"
        disabled={!targetId || pending}
        onClick={handleMove}
        className="px-2 py-1 text-xs"
      >
        {pending ? '...' : 'Sposta'}
      </Button>
      {error && <span className="text-xs text-danger-text">{error}</span>}
    </div>
  )
}
