'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { startEsercizio4, submitEsercizio4 } from './actions'
import type { FrasiDaTrasformare, ValutazioneRisposteStruttura } from '@/lib/gemini/prompts/struttura'
import { Risultati } from './Esercizio1'
import { RisultatoFooter } from './RisultatoFooter'

type Stato = 'idle' | 'generando' | 'rispondendo' | 'valutando' | 'pronto' | 'errore'

export function Esercizio4() {
  const [stato, setStato] = useState<Stato>('idle')
  const [frasi, setFrasi] = useState<FrasiDaTrasformare['frasi']>([])
  const [risposte, setRisposte] = useState<Record<string, string>>({})
  const [valutazione, setValutazione] = useState<ValutazioneRisposteStruttura | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  async function handleStart() {
    setErrore(null)
    setStato('generando')
    try {
      const result = await startEsercizio4()
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
      const arr = frasi.map((f) => ({ id: f.id, frase_trasformata: risposte[f.id] ?? '' }))
      setValutazione(await submitEsercizio4(frasi, arr))
      setStato('pronto')
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore valutando.')
      setStato('errore')
    }
  }

  if (stato === 'idle') {
    return (
      <Card className="text-center">
        <p className="mb-4 text-sm text-ink-secondary">Trasforma la frase secondo l'istruzione.</p>
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
        <RisultatoFooter corretti={corretti} totale={valutazione.risultati.length} tipo={4} />
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
            <p className="mb-1 text-sm text-ink-primary">{i + 1}. {f.frase_originale}</p>
            <p className="mb-1 text-xs text-ink-tertiary">{f.istruzione}</p>
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
