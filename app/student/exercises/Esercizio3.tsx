'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { startEsercizio3, submitEsercizio3 } from './actions'
import type { DomandePreposizione, ValutazioneRisposteStruttura } from '@/lib/gemini/prompts/struttura'
import { Risultati } from './Esercizio1'

type Stato = 'idle' | 'generando' | 'rispondendo' | 'valutando' | 'pronto' | 'errore'

export function Esercizio3() {
  const [stato, setStato] = useState<Stato>('idle')
  const [domande, setDomande] = useState<DomandePreposizione['domande']>([])
  const [risposte, setRisposte] = useState<Record<string, string>>({})
  const [valutazione, setValutazione] = useState<ValutazioneRisposteStruttura | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  async function handleStart() {
    setErrore(null)
    setStato('generando')
    try {
      const result = await startEsercizio3()
      setDomande(result.domande)
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
      const arr = domande.map((d) => ({ id: d.id, opzione_scelta: risposte[d.id] ?? '' }))
      setValutazione(await submitEsercizio3(domande, arr))
      setStato('pronto')
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore valutando.')
      setStato('errore')
    }
  }

  if (stato === 'idle') {
    return (
      <Card className="text-center">
        <p className="mb-4 text-sm text-ink-secondary">Scegli la preposizione corretta.</p>
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
      <div className="space-y-5">
        {domande.map((d, i) => (
          <div key={d.id}>
            <p className="mb-2 text-sm text-ink-primary">{i + 1}. {d.testo_con_buco}</p>
            <div className="flex flex-wrap gap-2">
              {d.opzioni.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  disabled={stato === 'valutando'}
                  onClick={() => setRisposte((p) => ({ ...p, [d.id]: opt }))}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm transition-colors',
                    risposte[d.id] === opt
                      ? 'border-brand-400 bg-brand-400 text-white'
                      : 'border-border bg-surface text-ink-primary hover:bg-surface-secondary'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
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
