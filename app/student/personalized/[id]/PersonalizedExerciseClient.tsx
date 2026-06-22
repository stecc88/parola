'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import {
  submitPersonalizedExerciseResponse,
  submitClosedExerciseAnswers
} from '../actions'
import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'
import type { PersonalizedExerciseDetail } from '../actions'

type Stato = 'idle' | 'salvando' | 'valutando' | 'pronto' | 'errore'

const TIPO_LABEL: Record<string, string> = {
  scrittura: 'Scrittura libera',
  completamento: 'Completamento',
  scelta_multipla: 'Scelta multipla',
  abbinamento: 'Abbinamento',
  trasformazione: 'Trasformazione di frasi'
}

export function PersonalizedExerciseClient({
  esercizio,
  valutazioneIniziale
}: {
  esercizio: PersonalizedExerciseDetail
  valutazioneIniziale: ValutazioneEsaminatore | null
}) {
  if (esercizio.tipo_esercizio === 'scrittura') {
    return <ScritturaEsercizio esercizio={esercizio} valutazioneIniziale={valutazioneIniziale} />
  }
  return <ChiusoEsercizio esercizio={esercizio} />
}

function Intestazione({ esercizio }: { esercizio: PersonalizedExerciseDetail }) {
  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <ParolaMascot mood="incoraggiante" />
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">{esercizio.titolo}</h1>
          <p className="text-sm text-ink-secondary">
            {TIPO_LABEL[esercizio.tipo_esercizio] ?? esercizio.tipo_esercizio} — creato apposta
            per te
          </p>
        </div>
      </div>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-ink-primary">Teoria</h2>
        <p className="whitespace-pre-line text-sm text-ink-secondary">{esercizio.teoria}</p>
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
        <h2 className="mb-2 text-sm font-semibold text-info-text">Consegna</h2>
        <p className="text-sm text-info-text">{esercizio.consegna}</p>
      </Card>
    </>
  )
}

/* ----------------------------- Tipo: scrittura ---------------------------- */

function ScritturaEsercizio({
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
      <Intestazione esercizio={esercizio} />

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

/* ------------------------ Tipi a risposta chiusa -------------------------- */

function ChiusoEsercizio({ esercizio }: { esercizio: PersonalizedExerciseDetail }) {
  const items = esercizio.items ?? []
  const giaCompletato = !!esercizio.completato_at

  const [risposte, setRisposte] = useState<string[]>(
    esercizio.risposte_studente ?? new Array(items.length).fill('')
  )
  const [punteggio, setPunteggio] = useState<number | null>(esercizio.punteggio_chiuso)
  const [stato, setStato] = useState<'idle' | 'inviando' | 'errore'>('idle')
  const [errore, setErrore] = useState<string | null>(null)

  function setRisposta(i: number, valore: string) {
    setRisposte((prev) => {
      const next = [...prev]
      next[i] = valore
      return next
    })
  }

  async function handleSubmit() {
    if (risposte.some((r) => !r || !r.trim())) {
      setErrore('Rispondi a tutte le domande prima di consegnare.')
      return
    }

    setErrore(null)
    setStato('inviando')
    try {
      const result = await submitClosedExerciseAnswers(esercizio.id, risposte)
      setPunteggio(result.punteggio)
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore inatteso.')
      setStato('errore')
      return
    }
    setStato('idle')
  }

  return (
    <>
      <Intestazione esercizio={esercizio} />

      <Card>
        <div className="space-y-4">
          {items.map((item, i) => {
            const mostraRisultato = giaCompletato || punteggio !== null
            const corretta =
              mostraRisultato &&
              risposte[i]?.trim().toLowerCase() === item.risposta_corretta.trim().toLowerCase()

            return (
              <div key={i} className="rounded-md bg-surface-secondary p-3">
                <p className="mb-2 text-sm font-medium text-ink-primary">
                  {i + 1}. {item.domanda}
                </p>

                {item.opzioni.length > 0 ? (
                  <div className="space-y-1">
                    {item.opzioni.map((opzione) => (
                      <label
                        key={opzione}
                        className="flex items-center gap-2 text-sm text-ink-secondary"
                      >
                        <input
                          type="radio"
                          name={`item-${i}`}
                          value={opzione}
                          checked={risposte[i] === opzione}
                          disabled={mostraRisultato}
                          onChange={() => setRisposta(i, opzione)}
                        />
                        {opzione}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={risposte[i] ?? ''}
                    disabled={mostraRisultato}
                    onChange={(e) => setRisposta(i, e.target.value)}
                    placeholder="La tua risposta..."
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-400 disabled:opacity-60"
                  />
                )}

                {mostraRisultato && (
                  <div
                    className={`mt-2 rounded-md p-2 text-xs ${
                      corretta ? 'bg-success-bg text-success-text' : 'bg-warning-bg text-warning-text'
                    }`}
                  >
                    <p className="font-medium">
                      {corretta ? '✓ Corretto' : `✗ Risposta corretta: ${item.risposta_corretta}`}
                    </p>
                    <p className="mt-1">{item.spiegazione_risposta}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {errore && (
          <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
            {errore}
          </p>
        )}

        {!giaCompletato && punteggio === null && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSubmit} disabled={stato === 'inviando'}>
              {stato === 'inviando' ? 'Invio...' : 'Verifica risposte'}
            </Button>
          </div>
        )}
      </Card>

      {punteggio !== null && (
        <Card className="mt-6 text-center">
          <p className="text-sm text-ink-secondary">Hai risposto correttamente a</p>
          <p className="text-3xl font-semibold text-ink-primary">{punteggio}%</p>
          <p className="text-sm text-ink-secondary">delle domande</p>
        </Card>
      )}
    </>
  )
}
