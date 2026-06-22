'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'
import { getPreviousScritturaScore, getMyPastErrorCategoryCounts } from '@/app/student/write/actions'

const CATEGORIA_LABEL: Record<string, string> = {
  grammatica: 'grammatica',
  lessico: 'lessico',
  sintassi: 'sintassi',
  coerenza: 'coerenza',
  ortografia: 'ortografia'
}

/**
 * Tarjeta de risultato condivisa tra /student/write e gli esercizi
 * personalizzati di tipo "scrittura" — evita duplicare la logica di
 * confronto col tentativo precedente e di ricorrenza degli errori in due
 * posti diversi.
 */
export function ValutazioneCard({
  valutazione,
  submissionId
}: {
  valutazione: ValutazioneEsaminatore
  submissionId: string
}) {
  const [puntiPrecedenti, setPuntiPrecedenti] = useState<number | null | undefined>(undefined)
  const [conteggiPassati, setConteggiPassati] = useState<Record<string, number>>({})

  useEffect(() => {
    getPreviousScritturaScore(submissionId).then(setPuntiPrecedenti)
    getMyPastErrorCategoryCounts(submissionId).then(setConteggiPassati)
  }, [submissionId])

  const delta =
    puntiPrecedenti !== undefined && puntiPrecedenti !== null
      ? valutazione.punteggio_complessivo - puntiPrecedenti
      : null

  return (
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

      {delta !== null && (
        <p
          className={`mb-3 text-sm font-medium ${delta > 0 ? 'text-success-text' : delta < 0 ? 'text-warning-text' : 'text-ink-tertiary'}`}
        >
          {delta > 0 && `▲ +${delta}% rispetto alla tua ultima scrittura libera`}
          {delta < 0 && `▼ ${delta}% rispetto alla tua ultima scrittura libera`}
          {delta === 0 && '— stesso punteggio della tua ultima scrittura libera'}
        </p>
      )}
      {puntiPrecedenti === null && (
        <p className="mb-3 text-sm text-ink-tertiary">
          Questa è la tua prima scrittura libera valutata — ottimo inizio!
        </p>
      )}

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
          <h3 className="mb-2 text-sm font-semibold text-warning-text">Aree di miglioramento</h3>
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
            {valutazione.errori.map((err, i) => {
              const volte = conteggiPassati[err.categoria] ?? 0
              return (
                <div key={i} className="rounded-md bg-surface-secondary p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p>
                      <span className="text-danger-text line-through">
                        {err.testo_originale}
                      </span>
                      {' → '}
                      <span className="text-success-text">{err.correzione}</span>
                    </p>
                    {volte >= 2 && (
                      <span className="shrink-0 rounded-full bg-warning-bg px-2 py-0.5 text-xs text-warning-text">
                        Ricorrente: {CATEGORIA_LABEL[err.categoria] ?? err.categoria} ×{volte}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-tertiary">{err.spiegazione}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
