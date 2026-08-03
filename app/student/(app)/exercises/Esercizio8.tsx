'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { startEsercizio8, submitEsercizio8 } from './actions'
import type { SceltaMorfosint, ValutazioneCloze } from '@/lib/gemini/prompts/struttura'
import { RisultatoFooter } from './RisultatoFooter'

type Stato = 'idle' | 'generando' | 'rispondendo' | 'pronto' | 'errore'

export function Esercizio8() {
  const [stato, setStato] = useState<Stato>('idle')
  const [esercizio, setEsercizio] = useState<SceltaMorfosint | null>(null)
  const [risposte, setRisposte] = useState<Record<string, string>>({})
  const [risultato, setRisultato] = useState<ValutazioneCloze | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  async function handleStart() {
    setErrore(null)
    setStato('generando')
    try {
      const data = await startEsercizio8()
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
    const arr = esercizio.domande.map((d) => ({
      id: d.id,
      opzione_scelta: risposte[d.id] ?? ''
    }))
    try {
      const val = await submitEsercizio8(esercizio, arr)
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
        <p className="mb-2 text-sm font-medium text-ink-primary">Scelta multipla morfosintattica — Formato B1</p>
        <p className="mb-4 text-sm text-ink-secondary">
          10 frasi, ognuna con 4 opzioni. Ogni domanda testa una struttura diversa del sílabo B1.
        </p>
        <Button onClick={handleStart}>Inizia esercizio</Button>
      </Card>
    )
  }

  if (stato === 'generando') {
    return <Card role="status" aria-live="polite" className="text-center text-sm text-ink-tertiary">Generazione domande in corso...</Card>
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
          {risultato.risultati.map((r, i) => {
            const domanda = esercizio.domande[i]
            return (
              <div key={r.numero} className={`rounded-md p-3 text-sm ${r.corretto ? 'bg-success-bg' : 'bg-danger-bg'}`}>
                <p className="mb-1 text-ink-primary">{i + 1}. {domanda.frase_con_buco.replace('___', `"${r.risposta_studente}"`)}</p>
                <p className={`font-medium ${r.corretto ? 'text-success-text' : 'text-danger-text'}`}>
                  {r.corretto ? '✓ Corretto' : `✗ Risposta corretta: "${r.risposta_corretta}"`}
                </p>
                <p className="mt-1 text-xs text-ink-secondary">{r.feedback}</p>
              </div>
            )
          })}
        </div>
        <RisultatoFooter corretti={corretti} totale={totale} tipo={8} />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleStart}>Nuovo esercizio</Button>
        </div>
      </Card>
    )
  }

  if (!esercizio) return null

  const tutteRisposte = esercizio.domande.every((d) => risposte[d.id])

  return (
    <Card>
      <div className="space-y-5">
        {esercizio.domande.map((d, i) => (
          <div key={d.id}>
            <p className="mb-1 text-sm font-medium text-ink-primary">
              {i + 1}. {d.frase_con_buco}
            </p>
            <p className="mb-2 text-xs italic text-ink-tertiary">{d.struttura_testata}</p>
            <div className="grid grid-cols-2 gap-2">
              {d.opzioni.map((op) => (
                <button
                  key={op}
                  onClick={() => setRisposte((p) => ({ ...p, [d.id]: op }))}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    risposte[d.id] === op
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
      {errore && <p role="alert" className="mt-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">{errore}</p>}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-ink-tertiary">
          {Object.keys(risposte).length}/{esercizio.domande.length} risposte inserite
        </p>
        <Button onClick={handleSubmit} disabled={!tutteRisposte}>
          Consegna
        </Button>
      </div>
    </Card>
  )
}
