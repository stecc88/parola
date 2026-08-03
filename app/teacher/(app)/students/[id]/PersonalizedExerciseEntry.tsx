'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { deletePersonalizedExercise } from './actions'
import type { EsercizioItem, PersonalizedExerciseRow } from './actions'

const TIPO_LABEL: Record<string, string> = {
  scrittura: 'Scrittura libera',
  completamento: 'Completamento',
  scelta_multipla: 'Scelta multipla',
  abbinamento: 'Abbinamento',
  trasformazione: 'Trasformazione di frasi'
}

interface Props {
  esercizio: PersonalizedExerciseRow
  studentId: string
  dataLabel: string
  statoNode: React.ReactNode
}

export function PersonalizedExerciseEntry({ esercizio, studentId, dataLabel, statoNode }: Props) {
  const [espanso, setEspanso] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const items: EsercizioItem[] = esercizio.items ?? []

  function handleDelete() {
    setDeleteError(null)
    startTransition(async () => {
      try {
        await deletePersonalizedExercise(esercizio.id, studentId)
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : 'Errore inatteso.')
        setConfirmingDelete(false)
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-3 p-3">
        <button onClick={() => setEspanso((v) => !v)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-ink-primary">
            {esercizio.titolo}{' '}
            <span className="ml-1 text-xs text-ink-tertiary">{espanso ? '▾' : '▸'}</span>
          </p>
          <p className="text-xs text-ink-tertiary">
            {TIPO_LABEL[esercizio.tipo_esercizio] ?? esercizio.tipo_esercizio} · {dataLabel}
          </p>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {statoNode}

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
              className="rounded-lg p-1.5 text-ink-tertiary transition-colors hover:bg-danger-bg hover:text-danger-text"
              aria-label="Elimina questo esercizio"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {deleteError && (
        <p className="px-3 pb-2 text-xs text-danger-text">{deleteError}</p>
      )}

      {espanso && (
        <div className="border-t border-border p-4 space-y-3 text-sm">
          <div>
            <p className="mb-1 font-semibold text-ink-primary">Teoria</p>
            <p className="whitespace-pre-line text-ink-secondary">{esercizio.teoria}</p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-ink-primary">Spiegazione</p>
            <p className="text-ink-secondary">{esercizio.spiegazione}</p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-ink-primary">Esempio</p>
            <p className="whitespace-pre-line text-ink-secondary">{esercizio.esempio}</p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-ink-primary">Consegna data allo studente</p>
            <p className="text-ink-secondary">{esercizio.consegna}</p>
          </div>

          {items.length > 0 && (
            <div>
              <p className="mb-2 font-semibold text-ink-primary">Domande ({items.length})</p>
              <div className="space-y-2">
                {items.map((item, i) => {
                  const rispostaStudente = esercizio.risposte_studente?.[i]
                  const corretta =
                    rispostaStudente !== undefined &&
                    rispostaStudente.trim().toLowerCase() ===
                      item.risposta_corretta.trim().toLowerCase()
                  return (
                    <div key={i} className="rounded-lg bg-surface-secondary p-2">
                      <p className="text-ink-primary">
                        {i + 1}. {item.domanda}
                      </p>
                      {item.opzioni.length > 0 && (
                        <p className="text-xs text-ink-tertiary">
                          Opzioni: {item.opzioni.join(' · ')}
                        </p>
                      )}
                      <p className="text-xs text-success-text">
                        Risposta corretta: {item.risposta_corretta}
                      </p>
                      {rispostaStudente !== undefined && (
                        <p className={`text-xs ${corretta ? 'text-success-text' : 'text-danger-text'}`}>
                          Risposta dello studente: {rispostaStudente || '(vuota)'}{' '}
                          {corretta ? '✓' : '✗'}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
