'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'
import { getPreviousScritturaScore, getMyPastErrorCategoryCounts } from '@/app/student/write/actions'
import { AnnotatedText } from './AnnotatedText'

const CATEGORIA_LABEL: Record<string, string> = {
  grammatica: 'grammatica',
  lessico: 'lessico',
  sintassi: 'sintassi',
  coerenza: 'coerenza',
  ortografia: 'ortografia'
}

/**
 * Scheda dei risultati condivisa tra /student/write e gli esercizi
 * personalizzati di tipo "scrittura" — evita duplicare la logica di
 * confronto col tentativo precedente e di ricorrenza degli errori in due
 * posti diversi.
 */
export function ValutazioneCard({
  valutazione,
  submissionId,
  testo
}: {
  valutazione: ValutazioneEsaminatore
  submissionId: string
  testo: string
}) {
  const [puntiPrecedenti, setPuntiPrecedenti] = useState<number | null | undefined>(undefined)
  const [conteggiPassati, setConteggiPassati] = useState<Record<string, number>>({})

  useEffect(() => {
    getPreviousScritturaScore(submissionId).then(setPuntiPrecedenti).catch(() => {})
    getMyPastErrorCategoryCounts(submissionId).then(setConteggiPassati).catch(() => {})
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

      {valutazione.errori.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-ink-primary">Il tuo testo</h3>
          <p className="mb-2 text-xs text-ink-tertiary">
            Passa il mouse (o tocca) sulle parole sottolineate per vedere la correzione.
          </p>
          <div className="rounded-md bg-surface-secondary p-3">
            <AnnotatedText testo={testo} errori={valutazione.errori} />
          </div>
        </div>
      )}

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
        <details className="mt-4" open>
          <summary className="cursor-pointer text-sm font-semibold text-ink-primary">
            Correzioni dettagliate ({valutazione.errori.length})
          </summary>
          <div className="mt-3 space-y-4">
            {Object.entries(
              valutazione.errori.reduce<Record<string, typeof valutazione.errori>>((acc, err) => {
                ;(acc[err.categoria] ??= []).push(err)
                return acc
              }, {})
            )
              .sort((a, b) => b[1].length - a[1].length)
              .map(([categoria, erroriGruppo]) => {
                const volteCategoria = conteggiPassati[categoria] ?? 0
                return (
                  <div key={categoria}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-warning-text">
                        {CATEGORIA_LABEL[categoria] ?? categoria}
                      </span>
                      <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold text-warning-text">
                        {erroriGruppo.length} {erroriGruppo.length === 1 ? 'errore' : 'errori'}
                      </span>
                      {volteCategoria >= 2 && (
                        <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[10px] font-semibold text-danger-text">
                          Ricorrente ×{volteCategoria}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 pl-1">
                      {erroriGruppo.map((err, i) => (
                        <div key={i} className="rounded-xl border border-border bg-surface-secondary p-3 text-sm">
                          <p className="mb-1">
                            <span className="font-medium text-danger-text line-through">
                              {err.testo_originale}
                            </span>
                            <span className="mx-2 text-ink-tertiary">→</span>
                            <span className="font-medium text-success-text">{err.correzione}</span>
                          </p>
                          <p className="text-xs leading-relaxed text-ink-secondary">{err.spiegazione}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </details>
      )}

      {/* Conclusione: cosa fare adesso */}
      {(() => {
        const conteggioPerCategoria: Record<string, number> = {}
        for (const err of valutazione.errori) {
          conteggioPerCategoria[err.categoria] = (conteggioPerCategoria[err.categoria] ?? 0) + 1
        }
        const categoriaDebole = Object.entries(conteggioPerCategoria).sort((a, b) => b[1] - a[1])[0]?.[0]
        const labelDebole = categoriaDebole ? CATEGORIA_LABEL[categoriaDebole] ?? categoriaDebole : null

        return (
          <div className="mt-5 rounded-xl border border-brand-200/60 bg-gradient-to-br from-brand-50 to-violet-50 p-4 dark:border-brand-800/40 dark:from-brand-950/30 dark:to-violet-950/30">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
              Cosa fare adesso
            </p>
            {labelDebole ? (
              <p className="text-sm text-ink-primary">
                Il tuo punto debole in questo testo:{' '}
                <span className="font-semibold text-warning-text">{labelDebole}</span>.{' '}
                Il tuo professore può crearti un esercizio mirato — controlla{' '}
                <a href="/student/personalized" className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-800 dark:text-brand-400">
                  &quot;Per te&quot;
                </a>{' '}
                per vedere se ne hai già uno pronto.
              </p>
            ) : (
              <p className="text-sm text-ink-primary">
                Nessun errore rilevato — ottimo lavoro! Controlla{' '}
                <a href="/student/personalized" className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-800 dark:text-brand-400">
                  &quot;Per te&quot;
                </a>{' '}
                per nuovi esercizi dal tuo professore.
              </p>
            )}
          </div>
        )
      })()}
    </Card>
  )
}
