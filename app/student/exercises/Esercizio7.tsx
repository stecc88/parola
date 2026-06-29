'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { startEsercizio7, submitEsercizio7 } from './actions'
import type { ClozeTestoB1, ValutazioneCloze } from '@/lib/gemini/prompts/struttura'
import { RisultatoFooter } from './RisultatoFooter'

type Stato = 'idle' | 'generando' | 'rispondendo' | 'pronto' | 'errore'

export function Esercizio7() {
  const [stato, setStato] = useState<Stato>('idle')
  const [esercizio, setEsercizio] = useState<ClozeTestoB1 | null>(null)
  const [risposte, setRisposte] = useState<Record<number, string>>({})
  const [risultato, setRisultato] = useState<ValutazioneCloze | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  async function handleStart() {
    setErrore(null)
    setStato('generando')
    try {
      const data = await startEsercizio7()
      setEsercizio(data)
      setRisposte({})
      setRisultato(null)
      setStato('rispondendo')
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore generando il cloze.')
      setStato('errore')
    }
  }

  async function handleSubmit() {
    if (!esercizio) return
    const arr = esercizio.lacune.map((l) => ({
      numero: l.numero,
      opzione_scelta: risposte[l.numero] ?? ''
    }))
    try {
      const val = await submitEsercizio7(esercizio, arr)
      setRisultato(val)
      setStato('pronto')
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore.')
      setStato('errore')
    }
  }

  if (stato === 'idle') {
    return (
      <Card className="text-center">
        <p className="mb-2 text-sm font-medium text-ink-primary">Cloze su testo — Formato B1</p>
        <p className="mb-4 text-sm text-ink-secondary">
          Un brano con 10 lacune numerate. Scegli la risposta morfosintatticamente corretta per ognuna.
        </p>
        <Button onClick={handleStart}>Inizia esercizio</Button>
      </Card>
    )
  }

  if (stato === 'generando') {
    return <Card className="text-center text-sm text-ink-tertiary">Generazione brano in corso...</Card>
  }

  if (stato === 'pronto' && risultato && esercizio) {
    const corretti = risultato.risultati.filter((r) => r.corretto).length
    const totale = risultato.risultati.length
    return (
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-primary">
            Punteggio: {corretti}/{totale}
          </p>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${corretti >= 7 ? 'bg-success-bg text-success-text' : corretti >= 5 ? 'bg-warning-bg text-warning-text' : 'bg-danger-bg text-danger-text'}`}>
            {corretti >= 7 ? 'Ottimo' : corretti >= 5 ? 'Sufficiente' : 'Da rivedere'}
          </span>
        </div>
        <div className="space-y-3">
          {risultato.risultati.map((r) => (
            <div key={r.numero} className={`rounded-md p-3 text-sm ${r.corretto ? 'bg-success-bg' : 'bg-danger-bg'}`}>
              <p className={`font-medium ${r.corretto ? 'text-success-text' : 'text-danger-text'}`}>
                [{r.numero}] {r.corretto ? '✓ Corretto' : `✗ Hai scritto: "${r.risposta_studente}"`}
              </p>
              <p className="mt-1 text-xs text-ink-secondary">{r.feedback}</p>
            </div>
          ))}
        </div>
        <RisultatoFooter corretti={corretti} totale={totale} tipo={7} />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleStart}>Nuovo brano</Button>
        </div>
      </Card>
    )
  }

  if (!esercizio) return null

  const tutteRisposte = esercizio.lacune.every((l) => risposte[l.numero])

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-ink-primary">{esercizio.titolo}</h2>
      <div className="mb-6 rounded-md bg-surface-secondary p-4 text-sm leading-relaxed text-ink-primary">
        {esercizio.testo_con_lacune}
      </div>
      <div className="space-y-4">
        {esercizio.lacune.map((l) => (
          <div key={l.numero}>
            <p className="mb-2 text-xs font-medium text-ink-secondary">
              [{l.numero}] — <span className="italic">{l.struttura_testata}</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {l.opzioni.map((op) => (
                <button
                  key={op}
                  onClick={() => setRisposte((p) => ({ ...p, [l.numero]: op }))}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    risposte[l.numero] === op
                      ? 'border-brand-400 bg-brand-50 font-medium text-brand-600'
                      : 'border-border bg-surface text-ink-primary hover:bg-surface-secondary'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {errore && <p className="mt-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">{errore}</p>}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-ink-tertiary">
          {Object.keys(risposte).length}/{esercizio.lacune.length} risposte inserite
        </p>
        <Button onClick={handleSubmit} disabled={!tutteRisposte}>
          Consegna
        </Button>
      </div>
    </Card>
  )
}
