'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { startEsercizio11, submitEsercizio11 } from './actions'
import type { ClozeTestoB2, ValutazioneCloze } from '@/lib/gemini/prompts/struttura'
import { RisultatoFooter } from './RisultatoFooter'
import { cn } from '@/lib/utils'

type Stato = 'idle' | 'generando' | 'rispondendo' | 'pronto' | 'errore'

export function Esercizio11() {
  const [stato, setStato] = useState<Stato>('idle')
  const [esercizio, setEsercizio] = useState<ClozeTestoB2 | null>(null)
  const [risposte, setRisposte] = useState<Record<number, string>>({})
  const [risultato, setRisultato] = useState<ValutazioneCloze | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  async function handleStart() {
    setErrore(null)
    setStato('generando')
    try {
      const data = await startEsercizio11()
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
    const arr = esercizio.lacune.map((l) => ({ numero: l.numero, opzione_scelta: risposte[l.numero] ?? '' }))
    try {
      const val = await submitEsercizio11(esercizio, arr)
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
        <p className="mb-2 text-sm font-medium text-ink-primary">Cloze lessicale su testo — Formato B1</p>
        <p className="mb-4 text-sm text-ink-secondary">
          Un brano con ~15 lacune. Per ogni lacuna scegli una delle quattro opzioni lessicali proposte.
        </p>
        <Button onClick={handleStart}>Inizia esercizio</Button>
      </Card>
    )
  }

  if (stato === 'generando') {
    return <Card role="status" aria-live="polite" className="text-center text-sm text-ink-tertiary">Generazione brano in corso...</Card>
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
        <div className="mb-5 rounded-md bg-surface-secondary p-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-tertiary">{esercizio.titolo}</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-primary">{esercizio.testo_con_lacune}</p>
        </div>
        <div className="space-y-2">
          {risultato.risultati.map((r) => (
            <div key={r.numero} className={`rounded-md p-3 text-sm ${r.corretto ? 'bg-success-bg' : 'bg-danger-bg'}`}>
              <div className="flex flex-wrap items-start justify-between gap-1">
                <p className={`font-medium ${r.corretto ? 'text-success-text' : 'text-danger-text'}`}>
                  [{r.numero}] {r.corretto ? `✓ "${r.risposta_corretta}"` : `✗ Hai scelto: "${r.risposta_studente}" → "${r.risposta_corretta}"`}
                </p>
                {r.struttura_testata && (
                  <span className="rounded bg-surface-secondary px-2 py-0.5 text-xs text-ink-tertiary">
                    {r.struttura_testata}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-secondary">{r.feedback}</p>
            </div>
          ))}
        </div>
        <RisultatoFooter corretti={corretti} totale={totale} tipo={11} />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleStart}>Nuovo brano</Button>
        </div>
      </Card>
    )
  }

  if (!esercizio) return null

  const compilate = Object.keys(risposte).length

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-ink-primary">{esercizio.titolo}</h2>
      <div className="mb-6 rounded-md bg-surface-secondary p-4 text-sm leading-relaxed text-ink-primary whitespace-pre-wrap">
        {esercizio.testo_con_lacune}
      </div>
      <p className="mb-3 text-xs font-medium text-ink-secondary uppercase tracking-wide">
        Scegli la parola corretta per ogni lacuna
      </p>
      <div className="space-y-4">
        {esercizio.lacune.map((l) => (
          <div key={l.numero}>
            <p className="mb-1.5 text-xs font-mono text-ink-secondary">[{l.numero}]</p>
            <div className="flex flex-wrap gap-2">
              {l.opzioni.map((op) => (
                <button
                  key={op}
                  onClick={() => setRisposte((p) => ({ ...p, [l.numero]: op }))}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm transition-colors',
                    risposte[l.numero] === op
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
        <p className="text-xs text-ink-tertiary">{compilate}/{esercizio.lacune.length} risposte inserite</p>
        <Button onClick={handleSubmit} disabled={compilate < esercizio.lacune.length}>
          Consegna
        </Button>
      </div>
    </Card>
  )
}
