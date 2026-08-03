'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { startEsercizio15, submitEsercizio15 } from './actions'
import type { SituazioniB2, ValutazioneCloze } from '@/lib/gemini/prompts/struttura'
import { cn } from '@/lib/utils'
import { RisultatoFooter } from './RisultatoFooter'

type Stato = 'idle' | 'generando' | 'rispondendo' | 'pronto' | 'errore'

export function Esercizio15() {
  const [stato, setStato] = useState<Stato>('idle')
  const [esercizio, setEsercizio] = useState<SituazioniB2 | null>(null)
  const [risposte, setRisposte] = useState<Record<string, string>>({})
  const [risultato, setRisultato] = useState<ValutazioneCloze | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  async function handleStart() {
    setErrore(null)
    setStato('generando')
    try {
      const data = await startEsercizio15()
      setEsercizio(data)
      setRisposte({})
      setRisultato(null)
      setStato('rispondendo')
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore generando l\'esercizio.')
      setStato('errore')
    }
  }

  async function handleSubmit() {
    if (!esercizio) return
    const arr = esercizio.domande.map((d) => ({ id: d.id, opzione_scelta: risposte[d.id] ?? '' }))
    try {
      const val = await submitEsercizio15(esercizio, arr)
      setRisultato(val)
      setStato('pronto')
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore durante la valutazione.')
      setStato('errore')
    }
  }

  if (stato === 'idle') {
    return (
      <Card className="text-center">
        <p className="mb-2 text-sm font-medium text-ink-primary">Situazioni comunicative — Formato B2</p>
        <p className="mb-4 text-sm text-ink-secondary">
          Per ogni espressione, scegli la situazione comunicativa corretta tra le opzioni. Formato tipico degli standard internazionali di lingua italiana — livello B2.
        </p>
        <Button onClick={handleStart}>Inizia esercizio</Button>
      </Card>
    )
  }

  if (stato === 'generando') {
    return <Card role="status" aria-live="polite" className="text-center text-sm text-ink-tertiary">Generazione esercizio in corso...</Card>
  }

  if (stato === 'pronto' && risultato && esercizio) {
    const corretti = risultato.risultati.filter((r) => r.corretto).length
    const totale = risultato.risultati.length
    return (
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-primary">Punteggio: {corretti}/{totale}</p>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${corretti >= Math.round(totale * 0.7) ? 'bg-success-bg text-success-text' : corretti >= Math.round(totale * 0.5) ? 'bg-warning-bg text-warning-text' : 'bg-danger-bg text-danger-text'}`}>
            {corretti >= Math.round(totale * 0.7) ? 'Ottimo' : corretti >= Math.round(totale * 0.5) ? 'Sufficiente' : 'Da rivedere'}
          </span>
        </div>
        <div className="space-y-3">
          {risultato.risultati.map((r, i) => {
            const domanda = esercizio.domande.find((d) => d.id === r.numero.toString()) ?? esercizio.domande[i]
            return (
              <div key={r.numero} className={`rounded-md p-3 text-sm ${r.corretto ? 'bg-success-bg' : 'bg-danger-bg'}`}>
                <p className="mb-1 text-xs text-ink-tertiary italic">{domanda?.espressione}</p>
                <p className={`font-medium ${r.corretto ? 'text-success-text' : 'text-danger-text'}`}>
                  {r.corretto ? `✓ "${r.risposta_corretta}"` : `✗ Hai scelto: "${r.risposta_studente}" → "${r.risposta_corretta}"`}
                </p>
                <p className="mt-1 text-xs text-ink-secondary">{r.feedback}</p>
              </div>
            )
          })}
        </div>
        <RisultatoFooter corretti={corretti} totale={totale} tipo={15} />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleStart}>Nuovo esercizio</Button>
        </div>
      </Card>
    )
  }

  if (!esercizio) return null

  const compilate = Object.keys(risposte).length

  return (
    <Card>
      <p className="mb-3 text-xs font-medium text-ink-secondary uppercase tracking-wide">
        Per ogni espressione, scegli la situazione comunicativa corretta
      </p>
      <div className="space-y-5">
        {esercizio.domande.map((d) => (
          <div key={d.id} className="rounded-md border border-border p-4">
            <p className="mb-3 text-sm font-medium text-ink-primary italic">"{d.espressione}"</p>
            <div className="flex flex-col gap-2">
              {d.opzioni.map((op) => (
                <button
                  key={op}
                  onClick={() => setRisposte((p) => ({ ...p, [d.id]: op }))}
                  className={cn(
                    'rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    risposte[d.id] === op
                      ? 'border-brand-400 bg-brand-400 text-white'
                      : 'border-border bg-surface text-ink-primary hover:bg-surface-secondary'
                  )}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {errore && <p role="alert" className="mt-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">{errore}</p>}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-ink-tertiary">{compilate}/{esercizio.domande.length} risposte inserite</p>
        <Button onClick={handleSubmit} disabled={compilate < esercizio.domande.length}>
          Consegna
        </Button>
      </div>
    </Card>
  )
}
