'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { assignStudentToClass } from './actions'

export function AssignStudentSelect({
  membershipId,
  classi
}: {
  membershipId: string
  classi: { id: string; nome: string }[]
}) {
  const [classId, setClassId] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (classi.length === 0) {
    return <span className="text-xs text-ink-tertiary">Crea prima una classe</span>
  }

  function handleAssign() {
    if (!classId) return
    startTransition(async () => {
      try {
        await assignStudentToClass(membershipId, classId)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Errore inatteso.')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-brand-400"
      >
        <option value="">Assegna a...</option>
        {classi.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      <Button
        disabled={!classId || pending}
        onClick={handleAssign}
        className="px-2 py-1 text-xs"
      >
        {pending ? '...' : 'Assegna'}
      </Button>
      {error && <span className="text-xs text-danger-text">{error}</span>}
    </div>
  )
}
