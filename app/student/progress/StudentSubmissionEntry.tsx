'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { deleteOwnSubmission } from './actions'

interface Props {
  id: string
  tipoLabel: string
  dataLabel: string
  punteggio: number | null
}

export function StudentSubmissionEntry({ id, tipoLabel, dataLabel, punteggio }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteOwnSubmission(id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore inatteso.')
        setConfirmingDelete(false)
      }
    })
  }

  return (
    <div className="flex items-center justify-between rounded-md bg-surface-secondary p-3">
      <div>
        <p className="text-sm font-medium text-ink-primary">{tipoLabel}</p>
        <p className="text-xs text-ink-tertiary">{dataLabel}</p>
      </div>

      <div className="flex items-center gap-3">
        {punteggio !== null ? (
          <span className="rounded-full bg-info-bg px-3 py-1 text-sm font-medium text-info-text">
            {punteggio}%
          </span>
        ) : (
          <span className="text-xs text-ink-tertiary">In attesa di valutazione</span>
        )}

        {confirmingDelete ? (
          <>
            <span className="text-xs text-danger-text">Eliminare?</span>
            <Button
              variant="danger"
              disabled={pending}
              onClick={handleDelete}
              className="px-2 py-1 text-xs"
            >
              {pending ? '...' : 'Sì'}
            </Button>
            <Button
              variant="ghost"
              className="px-2 py-1 text-xs"
              onClick={() => setConfirmingDelete(false)}
            >
              No
            </Button>
          </>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="text-xs text-ink-tertiary hover:text-danger-text"
            title="Elimina questo scritto"
          >
            Elimina
          </button>
        )}

        {error && <span className="text-xs text-danger-text">{error}</span>}
      </div>
    </div>
  )
}
