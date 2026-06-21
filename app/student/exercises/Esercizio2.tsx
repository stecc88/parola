'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { startEsercizio2, submitEsercizio2 } from './actions'
import type { FrasiDaRiordinare, ValutazioneRisposteStruttura } from '@/lib/gemini/prompts/struttura'
import { Risultati } from './Esercizio1'

type Stato = 'idle' | 'generando' | 'rispondendo' | 'valutando' | 'pronto' | 'errore'

export function Esercizio2() {
  const [stato, setStato] = useState<Stato>('idle')
  const [frasi, setFrasi] = useState<FrasiDaRiordinare['frasi']>([])
  const [risposte, setRisposte] = useState<Record<string, string>>({})
  const [valutazione, setValutazione] = useState<ValutazioneRisposteStruttura | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  async function handleStart() {
    setErrore(null)
    setStato('generando')
    try {
      const result = await startEsercizio2()
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
      const arr = frasi.map((f) => ({
        id: f.id,
        ordine_studente: (risposte[f.id] ?? '').trim().split(/\s+/).filter(Boolean)
      }))
      setValutazione(await submitEsercizio2(frasi, arr))
      setStato('pronto')
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore valutando.')
      setStato('errore')
    }
  }

  if (stato === 'idle') {
    return (
      <Card className="text-center">
        <p className="mb-4 text-sm text-ink-secondary">Riordina le parole per formare una frase corretta.</p>
        <Button onClick={handleStart}>Inizia esercizio</Button>
      </Card>
    )
  }

  if (stato === 'generando') {
    return <Card className="text-center text-sm text-ink-tertiary">Generazione in corso...</Card>
  }

  if (stato === 'pronto' && valutazione) {
    return (
      <Card>
        <Risultati valutazione={valutazione} />
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
            <p className="mb-1 text-sm text-ink-primary">
              {i + 1}. [{f.parole_disordinate.join(' / ')}]
            </p>
            <p className="mb-1 text-xs text-ink-tertiary">{f.contesto_grammaticale}</p>
            <input
              value={risposte[f.id] ?? ''}
              onChange={(e) => setRisposte((p) => ({ ...p, [f.id]: e.target.value }))}
              placeholder="Scrivi la frase nell'ordine corretto"
              disabled={stato === 'valutando'}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400 disabled:opacity-60"
            />
          </div>
        ))}
      </div>
      {errore && <p className="mt-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">{errore}</p>}
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSubmit} disabled={stato === 'valutando'}>
          {stato === 'valutando' ? 'Valutazione in corso...' : 'Invia risposte'}
        </Button>
      </div>
    </Card>
  )
}
