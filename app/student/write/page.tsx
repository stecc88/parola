'use client'

import { useState } from 'react'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { createScritturaLiberaSubmission } from './actions'
import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'

const NAV_ITEMS = [
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' }
]

type Stato = 'idle' | 'salvando' | 'valutando' | 'pronto' | 'errore'

export default function WritePage() {
  const [testo, setTesto] = useState('')
  const [stato, setStato] = useState<Stato>('idle')
  const [errore, setErrore] = useState<string | null>(null)
  const [valutazione, setValutazione] = useState<ValutazioneEsaminatore | null>(null)

  async function handleSubmit() {
    if (testo.trim().length < 20) {
      setErrore('Scrivi almeno qualche frase prima di richiedere una valutazione.')
      return
    }

    setErrore(null)
    setValutazione(null)
    setStato('salvando')

    try {
      const submissionId = await createScritturaLiberaSubmission(testo)

      setStato('valutando')
      const res = await fetch('/api/gemini/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Errore durante la valutazione.')
      }

      const body = await res.json()
      setValutazione(body.valutazione)
      setStato('pronto')
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore inatteso.')
      setStato('errore')
    }
  }

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <ParolaMascot mood="incoraggiante" />
          <div>
            <h1 className="text-xl font-semibold text-ink-primary">Scrittura libera</h1>
            <p className="text-sm text-ink-secondary">
              Scrivi un testo in italiano e ricevi una valutazione dettagliata.
            </p>
          </div>
        </div>

        <Card>
          <textarea
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            disabled={stato === 'salvando' || stato === 'valutando'}
            rows={10}
            placeholder="Scrivi qui il tuo testo..."
            className="w-full resize-none rounded-md border border-border bg-surface p-3 text-sm text-ink-primary outline-none focus:border-brand-400 disabled:opacity-60"
          />

          {errore && (
            <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
              {errore}
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={stato === 'salvando' || stato === 'valutando'}
            >
              {stato === 'salvando' && 'Salvataggio...'}
              {stato === 'valutando' && "L'esaminatore sta valutando..."}
              {(stato === 'idle' || stato === 'pronto' || stato === 'errore') &&
                'Invia per la valutazione'}
            </Button>
          </div>
        </Card>

        {valutazione && (
          <Card className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-primary">Valutazione</h2>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-info-bg px-3 py-1 text-sm font-medium text-info-text">
                  Livello {valutazione.livello_stimato}
                </span>
                <span className="rounded-full bg-success-bg px-3 py-1 text-sm font-medium text-success-text">
                  {valutazione.punteggio_complessivo}/100
                </span>
              </div>
            </div>

            <p className="mb-4 text-sm text-ink-primary">{valutazione.feedback_generale}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-success-text">Punti di forza</h3>
                <ul className="space-y-1 text-sm text-ink-secondary">
                  {valutazione.punti_forza.map((p, i) => (
                    <li key={i}>• {p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-warning-text">
                  Aree di miglioramento
                </h3>
                <ul className="space-y-1 text-sm text-ink-secondary">
                  {valutazione.aree_di_miglioramento.map((p, i) => (
                    <li key={i}>• {p}</li>
                  ))}
                </ul>
              </div>
            </div>

            {valutazione.errori.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold text-ink-primary">Errori specifici</h3>
                <div className="space-y-2">
                  {valutazione.errori.map((err, i) => (
                    <div key={i} className="rounded-md bg-surface-secondary p-3 text-sm">
                      <p>
                        <span className="text-danger-text line-through">{err.testo_originale}</span>
                        {' → '}
                        <span className="text-success-text">{err.correzione}</span>
                      </p>
                      <p className="mt-1 text-xs text-ink-tertiary">{err.spiegazione}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </main>
    </>
  )
}
