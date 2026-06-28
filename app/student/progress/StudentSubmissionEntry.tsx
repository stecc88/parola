'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ValutazioneCard } from '@/components/shared/ValutazioneCard'
import { deleteOwnSubmission } from './actions'
import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'
import { cn } from '@/lib/utils'

interface Props {
  id: string
  tipo: string
  tipoLabel: string
  dataLabel: string
  punteggio: number | null
  testo: string | null
  valutazione: unknown
  consegna: string | null
}

function isEsaminatoreValutazione(v: unknown): v is ValutazioneEsaminatore {
  if (!v || typeof v !== 'object') return false
  const val = v as Record<string, unknown>
  return (
    typeof val.punteggio_complessivo === 'number' &&
    typeof val.feedback_generale === 'string' &&
    Array.isArray(val.errori)
  )
}

export function StudentSubmissionEntry({
  id, tipo, tipoLabel, dataLabel, punteggio, testo, valutazione, consegna
}: Props) {
  const [expanded, setExpanded] = useState(false)
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

  const hasDetail = !!(testo || valutazione)

  return (
    <div className={cn(
      'rounded-xl border border-border bg-surface transition-all duration-300',
      expanded && 'shadow-card-hover'
    )}>
      {/* Row header */}
      <div
        className={cn(
          'flex items-center gap-3 p-3',
          hasDetail && 'cursor-pointer select-none hover:bg-surface-secondary rounded-xl',
          expanded && 'rounded-b-none border-b border-border'
        )}
        onClick={() => hasDetail && setExpanded(v => !v)}
        role={hasDetail ? 'button' : undefined}
        tabIndex={hasDetail ? 0 : undefined}
        onKeyDown={hasDetail ? (e) => e.key === 'Enter' && setExpanded(v => !v) : undefined}
        aria-expanded={hasDetail ? expanded : undefined}
      >
        {/* Score badge */}
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
          punteggio !== null
            ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400'
            : 'bg-surface-tertiary text-ink-tertiary'
        )}>
          {punteggio !== null ? `${punteggio}%` : '—'}
        </div>

        {/* Labels */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-primary">{tipoLabel}</p>
          <p className="text-xs text-ink-tertiary">{dataLabel}</p>
        </div>

        {/* Right controls */}
        <div
          className="flex shrink-0 items-center gap-2"
          onClick={e => e.stopPropagation()}
        >
          {confirmingDelete ? (
            <>
              <span className="text-xs text-danger-text">Eliminare?</span>
              <Button variant="danger" disabled={pending} onClick={handleDelete} className="px-2 py-1 text-xs">
                {pending ? '...' : 'Sì'}
              </Button>
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setConfirmingDelete(false)}>
                No
              </Button>
            </>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded-lg p-1.5 text-ink-tertiary transition-colors hover:bg-danger-bg hover:text-danger-text"
              title="Elimina questo scritto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {hasDetail && (
            <div className="text-ink-tertiary">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="px-3 pb-2 text-xs text-danger-text">{error}</p>
      )}

      {/* Expanded detail */}
      {expanded && hasDetail && (
        <div className="p-4 space-y-4">
          {consegna && (
            <div className="rounded-xl bg-surface-secondary p-3 text-sm text-ink-secondary border border-border">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Consegna</p>
              <p>{consegna}</p>
            </div>
          )}

          {isEsaminatoreValutazione(valutazione) && testo ? (
            <ValutazioneCard
              valutazione={valutazione}
              submissionId={id}
              testo={testo}
            />
          ) : testo ? (
            <div className="rounded-xl bg-surface-secondary p-3 text-sm text-ink-primary border border-border whitespace-pre-wrap">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Il tuo testo</p>
              {testo}
            </div>
          ) : null}

          {valutazione && !isEsaminatoreValutazione(valutazione) && (() => {
            const v = valutazione as Record<string, unknown>
            if (!Array.isArray(v.risultati)) return null
            const risultati = v.risultati as { corretto: boolean; risposta_studente?: string; risposta_corretta?: string; feedback?: string }[]
            const corretti = risultati.filter(r => r.corretto).length
            return (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                  Risultati — {corretti}/{risultati.length} corretti
                </p>
                {risultati.map((r, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-lg p-3 text-sm border',
                      r.corretto
                        ? 'bg-success-bg border-success-text/20 text-success-text'
                        : 'bg-danger-bg border-danger-text/20 text-danger-text'
                    )}
                  >
                    {r.risposta_studente && (
                      <p><span className="font-medium">Risposta:</span> {r.risposta_studente}</p>
                    )}
                    {!r.corretto && r.risposta_corretta && (
                      <p className="mt-0.5"><span className="font-medium">Corretta:</span> {r.risposta_corretta}</p>
                    )}
                    {r.feedback && <p className="mt-0.5 text-xs opacity-80">{r.feedback}</p>}
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
