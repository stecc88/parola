'use client'

import { useState } from 'react'
import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'

type Errore = ValutazioneEsaminatore['errori'][number]

interface Segmento {
  testo: string
  errore: Errore | null
}

/**
 * Divide il testo originale dello studente in segmenti, individuando le
 * occorrenze esatte di ogni errore.testo_originale per poterle sottolineare
 * inline. Se un errore non si trova nel testo (es. lieve differenza di
 * spaziatura/punteggiatura rispetto a quanto restituito da Gemini), viene
 * semplicemente ignorato qui — resta comunque visibile nella lista
 * dettagliata sotto, quindi nessuna informazione si perde.
 */
function segmentaTesto(testo: string, errori: Errore[]): Segmento[] {
  type Occorrenza = { start: number; end: number; errore: Errore }

  const occorrenze: Occorrenza[] = []
  for (const errore of errori) {
    if (!errore.testo_originale) continue
    const start = testo.indexOf(errore.testo_originale)
    if (start === -1) continue
    occorrenze.push({ start, end: start + errore.testo_originale.length, errore })
  }

  // Ordina per posizione ed elimina sovrapposizioni (mantiene la prima
  // trovata in caso di conflitto, per semplicità).
  occorrenze.sort((a, b) => a.start - b.start)
  const senzaSovrapposizioni: Occorrenza[] = []
  let ultimaFine = -1
  for (const occ of occorrenze) {
    if (occ.start >= ultimaFine) {
      senzaSovrapposizioni.push(occ)
      ultimaFine = occ.end
    }
  }

  const segmenti: Segmento[] = []
  let cursore = 0
  for (const occ of senzaSovrapposizioni) {
    if (occ.start > cursore) {
      segmenti.push({ testo: testo.slice(cursore, occ.start), errore: null })
    }
    segmenti.push({ testo: testo.slice(occ.start, occ.end), errore: occ.errore })
    cursore = occ.end
  }
  if (cursore < testo.length) {
    segmenti.push({ testo: testo.slice(cursore), errore: null })
  }

  return segmenti
}

export function AnnotatedText({ testo, errori }: { testo: string; errori: Errore[] }) {
  const [attivo, setAttivo] = useState<number | null>(null)
  const segmenti = segmentaTesto(testo, errori)

  return (
    <div className="whitespace-pre-line text-sm leading-relaxed text-ink-primary">
      {segmenti.map((seg, i) =>
        seg.errore ? (
          <span key={i} className="relative inline">
            <span
              onMouseEnter={() => setAttivo(i)}
              onMouseLeave={() => setAttivo(null)}
              onClick={() => setAttivo((v) => (v === i ? null : i))}
              className="cursor-help underline decoration-danger-text decoration-wavy decoration-2 underline-offset-2"
            >
              {seg.testo}
            </span>
            {attivo === i && (
              <span className="absolute left-0 top-full z-20 mt-1 block w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-md border border-border bg-surface p-2.5 text-xs font-normal normal-case text-ink-primary shadow-xl">
                <span className="mb-1 block font-semibold text-success-text">
                  {seg.errore.correzione}
                </span>
                <span className="text-ink-secondary">{seg.errore.spiegazione}</span>
              </span>
            )}
          </span>
        ) : (
          <span key={i}>{seg.testo}</span>
        )
      )}
    </div>
  )
}
