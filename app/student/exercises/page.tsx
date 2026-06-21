'use client'

import { useState } from 'react'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { startEsercizioStruttura1, submitEsercizioStruttura1 } from './actions'
import type { FraseDaCompletare, ValutazioneRisposteStruttura1 } from '@/lib/gemini/prompts/struttura'

const NAV_ITEMS = [
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' }
]

type Stato = 'idle' | 'generando' | 'rispondendo' | 'valutando' | 'pronto' | 'errore'

export default function ExercisesPage() {
  const [stato, setStato] = useState<Stato>('idle')
  const [frasi, setFrasi] = useState<FraseDaCompletare['frasi']>([])
  const [risposte, setRisposte] = useState<Record<string, string>>({})
  const [valutazione, setValutazione] = useState<ValutazioneRisposteStruttura1 | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  async function handleStart() {
    setErrore(null)
    setStato('generando')
    try {
      const result = await startEsercizioStruttura1()
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
      const risposteArray = frasi.map((f) => ({
        id: f.id,
        risposta_studente: risposte[f.id] ?? ''
      }))
      const result = await submitEsercizioStruttura1(frasi, risposteArray)
      setValutazione(result)
      setStato('pronto')
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore valutando le risposte.')
      setStato('errore')
    }
  }

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <ParolaMascot mood="pensieroso" />
          <div>
            <h1 className="text-xl font-semibold text-ink-primary">
              Esercizi di analisi delle strutture
            </h1>
            <p className="text-sm text-ink-secondary">
              Completa la frase — primo di 4 tipi di esercizio previsti.
            </p>
          </div>
        </div>

        {stato === 'idle' && (
          <Card className="text-center">
            <p className="mb-4 text-sm text-ink-secondary">
              Genera un nuovo set di frasi da completare.
            </p>
            <Button onClick={handleStart}>Inizia esercizio</Button>
          </Card>
        )}

        {stato === 'generando' && (
          <Card className="text-center text-sm text-ink-tertiary">
            Generazione delle frasi in corso...
          </Card>
        )}

        {(stato === 'rispondendo' || stato === 'valutando') && (
          <Card>
            <div className="space-y-4">
              {frasi.map((f, i) => (
                <div key={f.id}>
                  <p className="mb-1 text-sm text-ink-primary">
                    {i + 1}. {f.testo_con_buco}
                  </p>
                  <p className="mb-1 text-xs text-ink-tertiary">{f.contesto_grammaticale}</p>
                  <input
                    value={risposte[f.id] ?? ''}
                    onChange={(e) =>
                      setRisposte((prev) => ({ ...prev, [f.id]: e.target.value }))
                    }
                    disabled={stato === 'valutando'}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400 disabled:opacity-60"
                  />
                </div>
              ))}
            </div>

            {errore && (
              <p className="mt-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
                {errore}
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <Button onClick={handleSubmit} disabled={stato === 'valutando'}>
                {stato === 'valutando' ? 'Valutazione in corso...' : 'Invia risposte'}
              </Button>
            </div>
          </Card>
        )}

        {stato === 'pronto' && valutazione && (
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-ink-primary">Risultati</h2>
            <div className="space-y-3">
              {valutazione.risultati.map((r, i) => (
                <div
                  key={r.id}
                  className={`rounded-md p-3 text-sm ${r.corretto ? 'bg-success-bg' : 'bg-danger-bg'}`}
                >
                  <p className={r.corretto ? 'text-success-text' : 'text-danger-text'}>
                    {i + 1}. {r.corretto ? 'Corretto' : `Risposta corretta: ${r.risposta_corretta}`}
                  </p>
                  <p className="mt-1 text-xs text-ink-secondary">{r.feedback}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleStart}>Nuovo esercizio</Button>
            </div>
          </Card>
        )}
      </main>
    </>
  )
}
