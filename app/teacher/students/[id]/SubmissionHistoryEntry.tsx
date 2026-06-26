'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { deleteSubmission } from './actions'

interface Props {
  id: string
  studentId: string
  tipoLabel: string
  dataLabel: string
  testo: string
  punteggio: number | null
  rispettaConsegna: boolean | null
  testoIncollato?: boolean
  secondiScrittura?: number | null
}

export function SubmissionHistoryEntry({
  id,
  studentId,
  tipoLabel,
  dataLabel,
  testo,
  punteggio,
  rispettaConsegna,
  testoIncollato,
  secondiScrittura
}: Props) {
  const [espanso, setEspanso] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteSubmission(id, studentId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore inatteso.')
        setConfirmingDelete(false)
      }
    })
  }

  return (
    <div className="rounded-md bg-surface-secondary p-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setEspanso((v) => !v)}
          className="flex-1 text-left"
        >
          <p className="text-sm font-medium text-ink-primary">
            {tipoLabel} <span className="ml-1 text-xs text-ink-tertiary">{espanso ? '▾' : '▸'}</span>
          </p>
          <p className="text-xs text-ink-tertiary">{dataLabel}</p>
        </button>

        <div className="flex items-center gap-2">
          {rispettaConsegna !== null && (
            <span
              className={`text-xs ${rispettaConsegna ? 'text-success-text' : 'text-warning-text'}`}
              title={rispettaConsegna ? 'Consegna rispettata' : 'Consegna non completamente rispettata'}
            >
              {rispettaConsegna ? '✓' : '⚠'}
            </span>
          )}
          {punteggio !== null ? (
            <span className="rounded-full bg-info-bg px-3 py-1 text-sm font-medium text-info-text">
              {punteggio}%
            </span>
          ) : (
            <span className="text-xs text-ink-tertiary">In attesa</span>
          )}
        </div>
      </div>

      {espanso && (
        <div className="mt-3 rounded-md bg-surface p-3">
          <p className="whitespace-pre-line text-sm text-ink-primary">{testo}</p>
          {(testoIncollato || secondiScrittura !== null) && (
            <p
              className="mt-2 text-xs text-ink-tertiary"
              title="Informazione neutra sul modo in cui è stato prodotto il testo — non è un'indicazione di plagio o di uso di IA, solo un dato in più da considerare se ritieni utile farlo."
            >
              ℹ️{' '}
              {testoIncollato && 'Contiene testo incollato'}
              {testoIncollato && secondiScrittura ? ' · ' : ''}
              {secondiScrittura !== null &&
                secondiScrittura !== undefined &&
                `Tempo sulla pagina: ${
                  secondiScrittura < 60
                    ? `${secondiScrittura}s`
                    : `${Math.round(secondiScrittura / 60)} min`
                }`}
            </p>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-end gap-2">
        {confirmingDelete ? (
          <>
            <span className="text-xs text-danger-text">Eliminare definitivamente?</span>
            <Button
              variant="danger"
              disabled={pending}
              onClick={handleDelete}
              className="px-2 py-1 text-xs"
            >
              {pending ? '...' : 'Sì, elimina'}
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
          >
            Elimina
          </button>
        )}
        {error && <span className="text-xs text-danger-text">{error}</span>}
      </div>
    </div>
  )
}
