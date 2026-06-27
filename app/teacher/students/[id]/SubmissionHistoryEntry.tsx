'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { deleteSubmission, generatePersonalizedExercise } from './actions'
import type { ErroreSubmission } from '@/lib/gemini/prompts/generatore'
import type { TipoEsercizioPersonalizzato } from '@/lib/gemini/schema'

const TIPO_GRAMMATICA_OPTIONS: { value: TipoEsercizioPersonalizzato; label: string }[] = [
  { value: 'completamento', label: 'Completamento (riempi lo spazio)' },
  { value: 'scelta_multipla', label: 'Scelta multipla' },
  { value: 'trasformazione', label: 'Trasformazione di frasi' },
  { value: 'abbinamento', label: 'Abbinamento' },
]

interface Errore {
  testo_originale: string
  correzione: string
  categoria: string
  spiegazione: string
}

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
  errori?: Errore[]
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
  secondiScrittura,
  errori
}: Props) {
  const [espanso, setEspanso] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletePending, startDeleteTransition] = useTransition()

  const [generateSuccess, setGenerateSuccess] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generatePending, startGenerateTransition] = useTransition()
  const [tipoSelezionato, setTipoSelezionato] = useState<TipoEsercizioPersonalizzato>('completamento')

  function handleDelete() {
    setDeleteError(null)
    startDeleteTransition(async () => {
      try {
        await deleteSubmission(id, studentId)
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : 'Errore inatteso.')
        setConfirmingDelete(false)
      }
    })
  }

  function handleGenerateFromSubmission() {
    setGenerateError(null)
    setGenerateSuccess(false)
    startGenerateTransition(async () => {
      try {
        await generatePersonalizedExercise(
          studentId,
          tipoSelezionato,
          errori as ErroreSubmission[]
        )
        setGenerateSuccess(true)
      } catch (err) {
        setGenerateError(err instanceof Error ? err.message : 'Errore inatteso.')
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
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-surface p-3">
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

          {errori && errori.length > 0 && (
            <div className="rounded-md bg-surface p-3">
              <p className="mb-2 text-xs font-semibold text-ink-secondary">
                Errori rilevati ({errori.length})
              </p>
              <ul className="space-y-1">
                {errori.map((e, i) => (
                  <li key={i} className="text-xs text-ink-secondary">
                    <span className="text-danger-text line-through">{e.testo_originale}</span>
                    {' → '}
                    <span className="text-success-text">{e.correzione}</span>
                    <span className="ml-1 text-ink-tertiary">({e.categoria})</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 border-t border-border pt-3">
                {generateSuccess ? (
                  <p className="text-xs text-success-text">
                    ✓ Esercizio generato — lo trovi in cima e nello spazio dello studente.
                  </p>
                ) : (
                  <>
                    <p className="mb-2 text-xs font-semibold text-ink-primary">
                      Genera un esercizio di grammatica da questi errori
                    </p>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {TIPO_GRAMMATICA_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setTipoSelezionato(opt.value)}
                          disabled={generatePending}
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                            tipoSelezionato === opt.value
                              ? 'border-brand-400 bg-brand-400 text-white'
                              : 'border-border bg-surface text-ink-secondary hover:border-brand-400 hover:text-brand-400'
                          } disabled:opacity-60`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={handleGenerateFromSubmission}
                      disabled={generatePending}
                      className="text-xs"
                    >
                      {generatePending
                        ? 'Generazione in corso...'
                        : '✨ Genera esercizio'}
                    </Button>
                    {generatePending && (
                      <p className="mt-1 text-xs text-ink-tertiary">
                        L&apos;IA sta costruendo un esercizio sugli errori di questo testo…
                      </p>
                    )}
                  </>
                )}
                {generateError && (
                  <p className="mt-1 text-xs text-danger-text">{generateError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-end gap-2">
        {confirmingDelete ? (
          <>
            <span className="text-xs text-danger-text">Eliminare definitivamente?</span>
            <Button
              variant="danger"
              disabled={deletePending}
              onClick={handleDelete}
              className="px-2 py-1 text-xs"
            >
              {deletePending ? '...' : 'Sì, elimina'}
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
        {deleteError && <span className="text-xs text-danger-text">{deleteError}</span>}
      </div>
    </div>
  )
}
