'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { startEsercizio19, submitEsercizio19 } from './actions'
import type { TrasformazioneSintC1, ValutazioneTrasformazione } from '@/lib/gemini/prompts/struttura'
import { RisultatoFooter } from './RisultatoFooter'

type Stato = 'idle' | 'generando' | 'rispondendo' | 'valutando' | 'pronto' | 'errore'

export function Esercizio19() {
  const [stato, setStato] = useState<Stato>('idle')
  const [esercizio, setEsercizio] = useState<TrasformazioneSintC1 | null>(null)
  const [risposte, setRisposte] = useState<Record<string, string>>({})
  const [risultato, setRisultato] = useState<ValutazioneTrasformazione | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  async function handleStart() {
    setErrore(null)
    setStato('generando')
    try {
      const data = await startEsercizio19()
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
    setStato('valutando')
    const arr = esercizio.frasi.map((f) => ({ id: f.id, risposta_studente: risposte[f.id] ?? '' }))
    try {
      const val = await submitEsercizio19(esercizio, arr)
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
        <p className="mb-2 text-sm font-medium text-ink-primary">Trasformazione sintattica — Formato C1</p>
        <p className="mb-4 text-sm text-ink-secondary">
          Riscrivi ogni frase iniziando dalle parole indicate, mantenendo lo stesso significato ma cambiando la struttura sintattica (passivo/attivo, discorso indiretto, nominalizzazione, implicite).
        </p>
        <Button onClick={handleStart}>Inizia esercizio</Button>
      </Card>
    )
  }

  if (stato === 'generando') {
    return <Card role="status" aria-live="polite" className="text-center text-sm text-ink-tertiary">Generazione esercizio in corso...</Card>
  }

  if (stato === 'valutando') {
    return <Card role="status" aria-live="polite" className="text-center text-sm text-ink-tertiary">Valutazione in corso...</Card>
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
            const frase = esercizio.frasi.find((f) => f.id === r.id) ?? esercizio.frasi[i]
            return (
              <div key={r.id} className={`rounded-md p-3 text-sm ${r.corretto ? 'bg-success-bg' : 'bg-danger-bg'}`}>
                <p className="mb-1 text-xs text-ink-tertiary italic">"{frase?.frase_originale}"</p>
                <p className={`font-medium ${r.corretto ? 'text-success-text' : 'text-danger-text'}`}>
                  {r.corretto ? `✓ "${r.risposta_corretta}"` : `✗ "${r.risposta_studente}" → "${r.risposta_corretta}"`}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded bg-surface-secondary px-2 py-0.5 text-xs text-ink-tertiary">
                    {r.struttura_da_usare}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-secondary">{r.feedback}</p>
              </div>
            )
          })}
        </div>
        <RisultatoFooter corretti={corretti} totale={totale} tipo={19} />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleStart}>Nuovo esercizio</Button>
        </div>
      </Card>
    )
  }

  if (!esercizio) return null

  const compilate = Object.values(risposte).filter((v) => v.trim()).length

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-ink-primary">{esercizio.titolo}</h2>
      <p className="mb-4 text-xs text-ink-secondary">{esercizio.istruzione}</p>
      <div className="space-y-5">
        {esercizio.frasi.map((f, i) => (
          <div key={f.id} className="rounded-md border border-border p-4">
            <p className="mb-2 text-xs font-medium text-ink-tertiary uppercase tracking-wide">
              {i + 1}. {f.struttura_da_usare}
            </p>
            <p className="mb-3 text-sm text-ink-primary">{f.frase_originale}</p>
            <div className="flex items-start gap-2">
              <span className="mt-2 shrink-0 text-sm font-medium text-brand-600">{f.inizio_dato}</span>
              <input
                aria-label={`Risposta <input
                value={risposte[f.id]`}
                value={risposte[f.id] ?? ''}
                onChange={(e) => setRisposte((p) => ({ ...p, [f.id]: e.target.value }))}
                placeholder="completa la frase..."
                className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </div>
          </div>
        ))}
      </div>
      {errore && <p role="alert" className="mt-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">{errore}</p>}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-ink-tertiary">{compilate}/{esercizio.frasi.length} risposte inserite</p>
        <Button onClick={handleSubmit} disabled={compilate < esercizio.frasi.length}>
          Consegna
        </Button>
      </div>
    </Card>
  )
}
