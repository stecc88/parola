'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { startEsercizio9, submitEsercizio9 } from './actions'
import type { ClozePrepArticoli, ValutazioneCloze } from '@/lib/gemini/prompts/struttura'
import { RisultatoFooter } from './RisultatoFooter'

type Stato = 'idle' | 'generando' | 'rispondendo' | 'pronto' | 'errore'

export function Esercizio9() {
  const [stato, setStato] = useState<Stato>('idle')
  const [esercizio, setEsercizio] = useState<ClozePrepArticoli | null>(null)
  const [risposte, setRisposte] = useState<Record<number, string>>({})
  const [risultato, setRisultato] = useState<ValutazioneCloze | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  async function handleStart() {
    setErrore(null)
    setStato('generando')
    try {
      const data = await startEsercizio9()
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
    const arr = esercizio.lacune.map((l) => ({ numero: l.numero, risposta: risposte[l.numero] ?? '' }))
    try {
      const val = await submitEsercizio9(esercizio, arr)
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
        <p className="mb-2 text-sm font-medium text-ink-primary">Articoli e preposizioni su testo — Formato B1</p>
        <p className="mb-4 text-sm text-ink-secondary">
          Un brano con ~18 lacune. Scrivi l'articolo o la preposizione (semplice o articolata) corretta.
          Se la lacuna ha un suggerimento tra parentesi es. <span className="font-mono">(in)</span>, combina la preposizione con l'articolo giusto.
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
          <p className="text-sm font-semibold text-ink-primary">Punteggio: {corretti}/{totale}</p>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${corretti >= Math.round(totale * 0.7) ? 'bg-success-bg text-success-text' : corretti >= Math.round(totale * 0.5) ? 'bg-warning-bg text-warning-text' : 'bg-danger-bg text-danger-text'}`}>
            {corretti >= Math.round(totale * 0.7) ? 'Ottimo' : corretti >= Math.round(totale * 0.5) ? 'Sufficiente' : 'Da rivedere'}
          </span>
        </div>
        <div className="space-y-2">
          {risultato.risultati.map((r) => (
            <div key={r.numero} className={`rounded-md p-3 text-sm ${r.corretto ? 'bg-success-bg' : 'bg-danger-bg'}`}>
              <p className={`font-medium ${r.corretto ? 'text-success-text' : 'text-danger-text'}`}>
                [{r.numero}] {r.corretto ? `✓ "${r.risposta_corretta}"` : `✗ Hai scritto: "${r.risposta_studente}"`}
              </p>
              <p className="mt-1 text-xs text-ink-secondary">{r.feedback}</p>
            </div>
          ))}
        </div>
        <RisultatoFooter corretti={corretti} totale={totale} tipo={9} />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleStart}>Nuovo brano</Button>
        </div>
      </Card>
    )
  }

  if (!esercizio) return null

  const compilate = Object.values(risposte).filter((v) => v.trim()).length

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-ink-primary">{esercizio.titolo}</h2>
      <div className="mb-6 rounded-md bg-surface-secondary p-4 text-sm leading-relaxed text-ink-primary whitespace-pre-wrap">
        {esercizio.testo_con_lacune}
      </div>
      <p className="mb-3 text-xs font-medium text-ink-secondary uppercase tracking-wide">
        Completa le lacune
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {esercizio.lacune.map((l) => (
          <div key={l.numero} className="flex items-center gap-2">
            <span className="shrink-0 rounded bg-surface-tertiary px-2 py-1 text-xs font-mono text-ink-secondary">
              [{l.numero}]{l.preposizione_suggerita ? ` (${l.preposizione_suggerita})` : ''}
            </span>
            <input
              value={risposte[l.numero] ?? ''}
              onChange={(e) => setRisposte((p) => ({ ...p, [l.numero]: e.target.value }))}
              placeholder="..."
              className="w-full min-w-0 rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand-400"
            />
          </div>
        ))}
      </div>
      {errore && <p className="mt-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">{errore}</p>}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-ink-tertiary">{compilate}/{esercizio.lacune.length} risposte inserite</p>
        <Button onClick={handleSubmit} disabled={compilate < esercizio.lacune.length}>
          Consegna
        </Button>
      </div>
    </Card>
  )
}
