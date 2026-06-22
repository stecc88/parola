'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { submitPersonalizedExerciseResponse } from '../actions'
import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'
import type { PersonalizedExerciseDetail } from '../actions'

type Stato = 'idle' | 'salvando' | 'valutando' | 'pronto' | 'errore'

export function PersonalizedExerciseClient({
  esercizio,
  valutazioneIniziale
}: {
  esercizio: PersonalizedExerciseDetail
  valutazioneIniziale: ValutazioneEsaminatore | null
}) {
  const [testo, setTesto] = useState('')
  const [stato, setStato] = useState<Stato>(esercizio.submission_id ? 'pronto' : 'idle')
  const [errore, setErrore] = useState<string | null>(null)
  const [valutazione, setValutazione] = useState<ValutazioneEsaminatore | null>(
    valutazioneIniziale
  )
  const giaConsegnato = !!esercizio.submission_id

  async function handleSubmit() {
    if (testo.trim().length < 20) {
      setErrore('Scrivi almeno qualche frase prima di richiedere una valutazione.')
      return
    }

    setErrore(null)
    setStato('salvando')

    try {
      const submissionId = await submitPersonalizedExerciseResponse(
        esercizio.id,
        testo,
        esercizio.consegna
      )

      setStato('valutando')
      const res = await fetch('/api/gemini/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, consegna: esercizio.consegna })
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
      <div className="mb-6 flex items-center gap-3">
        <ParolaMascot mood="incoraggiante" />
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">{esercizio.titolo}</h1>
          <p className="text-sm text-ink-secondary">Esercizio creato apposta per te</p>
        </div>
      </div>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-ink-primary">Teoria</h2>
        <p className="text-sm text-ink-secondary">{esercizio.teoria}</p>
      </Card>

      <Card className="mb-4 bg-guided-bg">
        <h2 className="mb-2 text-sm font-semibold text-guided-text">Perché è importante</h2>
        <p className="text-sm text-guided-text">{esercizio.spiegazione}</p>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-ink-primary">Esempio</h2>
        <p className="whitespace-pre-line text-sm text-ink-secondary">{esercizio.esempio}</p>
      </Card>

      <Card className="mb-6 bg-info-bg">
        <h2 className="mb-2 text-sm font-semibold text-info-text">La tua consegna</h2>
        <p className="text-sm text-info-text">{esercizio.consegna}</p>
      </Card>

      {!giaConsegnato && (
        <Card>
          <textarea
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            disabled={stato === 'salvando' || stato === 'valutando'}
            rows={8}
            placeholder="Scrivi qui la tua risposta alla consegna..."
            className="w-full resize-none rounded-md border border-border bg-surface p-3 text-sm text-ink-primary outline-none focus:border-brand-400 disabled:opacity-60"
          />

          {errore && (
            <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
              {errore}
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSubmit} disabled={stato === 'salvando' || stato === 'valutando'}>
              {stato === 'salvando' && 'Salvataggio...'}
              {stato === 'valutando' && "L'esaminatore sta valutando..."}
              {(stato === 'idle' || stato === 'errore') && 'Invia per la valutazione'}
            </Button>
          </div>
        </Card>
      )}

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

          {valutazione.rispetto_consegna && (
            <div
              className={`mb-4 rounded-md p-3 text-sm ${
                valutazione.rispetto_consegna.rispetta_consegna
                  ? 'bg-success-bg text-success-text'
                  : 'bg-warning-bg text-warning-text'
              }`}
            >
              <p className="font-semibold">
                {valutazione.rispetto_consegna.rispetta_consegna
                  ? '✓ Consegna rispettata'
                  : '⚠ Consegna non completamente rispettata'}
              </p>
              <p className="mt-1">{valutazione.rispetto_consegna.commento}</p>
              {valutazione.rispetto_consegna.punti_mancanti.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Punti mancanti:</p>
                  <ul className="ml-4 list-disc">
                    {valutazione.rispetto_consegna.punti_mancanti.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

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

      {giaConsegnato && !valutazione && stato !== 'errore' && (
        <Card className="mt-6 text-center text-sm text-ink-tertiary">
          Risposta consegnata, in attesa di valutazione. Riprova a ricaricare la pagina tra
          qualche istante.
        </Card>
      )}
    </>
  )
}
