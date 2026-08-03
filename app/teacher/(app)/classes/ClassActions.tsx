'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { renameClass, deleteClass } from './actions'

export function ClassActions({
  classId,
  nomeAttuale,
  /** Si true, después de eliminar redirige a /teacher/classes (uso en detalle). */
  redirectAfterDelete = false
}: {
  classId: string
  nomeAttuale: string
  redirectAfterDelete?: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [nome, setNome] = useState(nomeAttuale)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleRename(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await renameClass(classId, nome)
        setEditing(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore inatteso.')
      }
    })
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteClass(classId)
        if (redirectAfterDelete) {
          router.push('/teacher/classes')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore inatteso.')
        setConfirmingDelete(false)
      }
    })
  }

  if (editing) {
    return (
      <form onSubmit={handleRename} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm outline-none focus:border-brand-400"
        />
        <Button type="submit" disabled={pending} className="px-2 py-1 text-xs">
          Salva
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="px-2 py-1 text-xs"
          onClick={() => {
            setEditing(false)
            setNome(nomeAttuale)
          }}
        >
          Annulla
        </Button>
        {error && <span className="text-xs text-danger-text">{error}</span>}
      </form>
    )
  }

  if (confirmingDelete) {
    return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs text-danger-text">Eliminare questa classe?</span>
        <Button variant="danger" disabled={pending} onClick={handleDelete} className="px-2 py-1 text-xs">
          {pending ? '...' : 'Sì, elimina'}
        </Button>
        <Button
          variant="ghost"
          className="px-2 py-1 text-xs"
          onClick={() => setConfirmingDelete(false)}
        >
          No
        </Button>
        {error && <span className="text-xs text-danger-text">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-ink-secondary hover:text-ink-primary"
      >
        Rinomina
      </button>
      <button
        onClick={() => setConfirmingDelete(true)}
        className="text-xs text-ink-secondary hover:text-danger-text"
      >
        Elimina
      </button>
    </div>
  )
}
