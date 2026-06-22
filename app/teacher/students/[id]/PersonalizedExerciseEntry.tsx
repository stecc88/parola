'use client'

import { useState } from 'react'
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
  dataLabel: string
  statoNode: React.ReactNode
}

export function PersonalizedExerciseEntry({ esercizio, dataLabel, statoNode }: Props) {
  const [espanso, setEspanso] = useState(false)
  const items: EsercizioItem[] = esercizio.items ?? []

  return (
    <div className="rounded-md bg-surface-secondary p-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setEspanso((v) => !v)} className="flex-1 text-left">
          <p className="text-sm font-medium text-ink-primary">
            {esercizio.titolo}{' '}
            <span className="ml-1 text-xs text-ink-tertiary">{espanso ? '▾' : '▸'}</span>
          </p>
          <p className="text-xs text-ink-tertiary">
            {TIPO_LABEL[esercizio.tipo_esercizio] ?? esercizio.tipo_esercizio} · {dataLabel}
          </p>
        </button>
        {statoNode}
      </div>

      {espanso && (
        <div className="mt-3 space-y-3 rounded-md bg-surface p-3 text-sm">
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
              <p className="mb-2 font-semibold text-ink-primary">
                Domande ({items.length})
              </p>
              <div className="space-y-2">
                {items.map((item, i) => {
                  const rispostaStudente = esercizio.risposte_studente?.[i]
                  const corretta =
                    rispostaStudente !== undefined &&
                    rispostaStudente.trim().toLowerCase() ===
                      item.risposta_corretta.trim().toLowerCase()
                  return (
                    <div key={i} className="rounded-md bg-surface-secondary p-2">
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
                        <p
                          className={`text-xs ${corretta ? 'text-success-text' : 'text-danger-text'}`}
                        >
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
