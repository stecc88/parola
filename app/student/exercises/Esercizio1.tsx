'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { startEsercizio1, submitEsercizio1 } from './actions'
import type { FraseDaCompletare, ValutazioneRisposteStruttura } from '@/lib/gemini/prompts/struttura'
import { RisultatoFooter } from './RisultatoFooter'

type Stato = 'idle' | 'generando' | 'rispondendo' | 'valutando' | 'pronto' | 'errore'

export function Esercizio1() {
  const [stato, setStato] = useState<Stato>('idle')
  const [frasi, setFrasi] = useState<FraseDaCompletare['frasi']>([])
  const [risposte, setRisposte] = useState<Record<string, string>>({})
  const [valutazione, setValutazione] = useState<ValutazioneRisposteStruttura | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  async function handleStart() {
    setErrore(null)
    setStato('generando')
    try {
      const result = await startEsercizio1()
      setFrasi(result.frasi)
      setRisposte({})
      setValutazione(null)
      setStato('rispondendo')
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore generando l\'esercizio.')
      setStato('errore')
    }
  }

  async function handleSubmit() {
    setErrore(null)
    setStato('valutando')
    try {
      const arr = frasi.map((f) => ({ id: f.id, risposta_studente: risposte[f.id] ?? '' }))
      setValutazione(await submitEsercizio1(frasi, arr))
      setStato('pronto')
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore valutando.')
      setStato('errore')
    }
  }

  if (stato === 'idle') {
    return (
      <Card className="text-center">
        <p className="mb-2 text-sm font-medium text-ink-primary">Completa la frase — Esercizio adattivo</p>
        <p className="mb-4 text-sm text-ink-secondary">Inserisci la parola o struttura corretta in ogni frase. L'IA valuterà anche varianti equivalenti.</p>
        <Button onClick={handleStart}>Inizia esercizio</Button>
      </Card>
    )
  }

  if (stato === 'generando') {
    return <Card role="status" aria-live="polite" className="text-center text-sm text-ink-tertiary">Generazione in corso...</Card>
  }

  if (stato === 'pronto' && valutazione) {
    const corretti = valutazione.risultati.filter((r) => r.corretto).length
    return (
      <Card>
        <Risultati valutazione={valutazione} />
        <RisultatoFooter corretti={corretti} totale={valutazione.risultati.length} tipo={1} />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleStart}>Nuovo esercizio</Button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="space-y-4">
        {frasi.map((f, i) => (
          <div key={f.id}>
            <p className="mb-1 text-sm text-ink-primary">{i + 1}. {f.testo_con_buco}</p>
            <p className="mb-1 text-xs text-ink-tertiary">{f.contesto_grammaticale}</p>
            <input
              aria-label={`Risposta <input
              value={risposte[f.id]`}
              value={risposte[f.id] ?? ''}
              onChange={(e) => setRisposte((p) => ({ ...p, [f.id]: e.target.value }))}
              disabled={stato === 'valutando'}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400 disabled:opacity-60"
            />
          </div>
        ))}
      </div>
      {errore && <p role="alert" className="mt-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">{errore}</p>}
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSubmit} disabled={stato === 'valutando'}>
          {stato === 'valutando' ? 'Valutazione in corso...' : 'Invia risposte'}
        </Button>
      </div>
    </Card>
  )
}

export function Risultati({ valutazione, tipo }: { valutazione: ValutazioneRisposteStruttura; tipo?: number }) {
  const corretti = valutazione.risultati.filter((r) => r.corretto).length
  const totale = valutazione.risultati.length
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-primary">Punteggio: {corretti}/{totale}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${corretti >= Math.round(totale * 0.7) ? 'bg-success-bg text-success-text' : corretti >= Math.round(totale * 0.5) ? 'bg-warning-bg text-warning-text' : 'bg-danger-bg text-danger-text'}`}>
          {corretti >= Math.round(totale * 0.7) ? 'Ottimo' : corretti >= Math.round(totale * 0.5) ? 'Sufficiente' : 'Da rivedere'}
        </span>
      </div>
      <div className="space-y-3">
        {valutazione.risultati.map((r, i) => (
          <div key={r.id} className={`rounded-md p-3 text-sm ${r.corretto ? 'bg-success-bg' : 'bg-danger-bg'}`}>
            <p className={`font-medium ${r.corretto ? 'text-success-text' : 'text-danger-text'}`}>
              {i + 1}. {r.corretto ? '✓ Corretto' : `✗ Risposta corretta: "${r.risposta_corretta}"`}
            </p>
            <p className="mt-1 text-xs text-ink-secondary">{r.feedback}</p>
          </div>
        ))}
      </div>
    </>
  )
}
