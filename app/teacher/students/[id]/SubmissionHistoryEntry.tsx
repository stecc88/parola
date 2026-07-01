'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { AnnotatedText } from '@/components/shared/AnnotatedText'
import { deleteSubmission, generatePersonalizedExercise } from './actions'
import type { ErroreSubmission } from '@/lib/gemini/prompts/generatore'
import type { TipoEsercizioPersonalizzato, ValutazioneEsaminatore } from '@/lib/gemini/schema'

const TIPO_GRAMMATICA_OPTIONS: { value: TipoEsercizioPersonalizzato; label: string }[] = [
  { value: 'completamento', label: 'Completamento (riempi lo spazio)' },
  { value: 'scelta_multipla', label: 'Scelta multipla' },
  { value: 'trasformazione', label: 'Trasformazione di frasi' },
  { value: 'abbinamento', label: 'Abbinamento' },
]

interface Errore {
  testo_originale: string
  correzione: string
  categoria: string
  spiegazione: string
}

interface Props {
  id: string
  studentId: string
  nomeStudente: string
  tipoLabel: string
  dataLabel: string
  testo: string
  punteggio: number | null
  rispettaConsegna: boolean | null
  testoIncollato?: boolean
  secondiScrittura?: number | null
  errori?: Errore[]
  valutazioneCompleta?: ValutazioneEsaminatore | null
}

async function scaricaCorrezionePdf(opts: {
  nomeStudente: string
  tipoLabel: string
  dataLabel: string
  testo: string
  punteggio: number | null
  valutazioneCompleta: ValutazioneEsaminatore | null | undefined
}) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const W = 174 // larghezza utile (210 - 2*18)
  let y = 18

  function riga(testo: string, opts: { size?: number; bold?: boolean; gap?: number; colore?: [number, number, number] } = {}) {
    doc.setFontSize(opts.size ?? 11)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    if (opts.colore) doc.setTextColor(...opts.colore)
    else doc.setTextColor(30, 30, 30)
    const lines = doc.splitTextToSize(testo, W)
    if (y + lines.length * (opts.size ?? 11) * 0.45 > 270) {
      doc.addPage()
      y = 18
    }
    doc.text(lines, 18, y)
    y += lines.length * (opts.size ?? 11) * 0.45 + (opts.gap ?? 4)
  }

  function separatore() {
    doc.setDrawColor(200, 200, 200)
    doc.line(18, y, 192, y)
    y += 5
  }

  riga('Parola — Correzione testo', { size: 16, bold: true, gap: 2 })
  riga(`Generato il ${new Date().toLocaleDateString('it-IT')}`, { size: 9, gap: 6 })

  riga(opts.nomeStudente, { size: 14, bold: true, gap: 2 })
  riga(`${opts.tipoLabel}  ·  ${opts.dataLabel}${opts.punteggio !== null ? `  ·  Punteggio: ${opts.punteggio}%` : ''}`, { size: 10, gap: 6 })

  separatore()
  riga('Testo scritto dallo studente', { size: 11, bold: true, gap: 3 })
  riga(opts.testo, { size: 10, gap: 8 })

  if (opts.valutazioneCompleta) {
    const v = opts.valutazioneCompleta
    separatore()
    riga('Feedback generale', { size: 11, bold: true, gap: 3 })
    riga(v.feedback_generale, { size: 10, gap: 6 })

    if (v.punti_forza.length > 0) {
      riga('Punti di forza', { size: 10, bold: true, gap: 2 })
      for (const p of v.punti_forza) riga(`• ${p}`, { size: 10, gap: 2 })
      y += 2
    }

    if (v.aree_di_miglioramento.length > 0) {
      riga('Aree da lavorare', { size: 10, bold: true, gap: 2 })
      for (const a of v.aree_di_miglioramento) riga(`• ${a}`, { size: 10, gap: 2 })
      y += 2
    }

    if (v.errori.length > 0) {
      separatore()
      riga(`Correzioni (${v.errori.length} errori rilevati)`, { size: 11, bold: true, gap: 4 })
      for (const e of v.errori) {
        riga(`${e.testo_originale}  →  ${e.correzione}`, { size: 10, bold: true, gap: 1 })
        riga(`[${e.categoria}] ${e.spiegazione}`, { size: 9, gap: 4, colore: [100, 100, 100] })
      }
    }

    if (v.rispetto_consegna) {
      separatore()
      const rc = v.rispetto_consegna as { rispetta_consegna: boolean; note?: string }
      riga(`Consegna ${rc.rispetta_consegna ? 'rispettata ✓' : 'non completamente rispettata ⚠'}`, {
        size: 10, bold: true, gap: 2
      })
      if (rc.note) riga(rc.note, { size: 10, gap: 4 })
    }
  }

  separatore()
  riga(
    'Le valutazioni sono generate da un sistema di intelligenza artificiale come supporto didattico, non come certificazione ufficiale.',
    { size: 8, gap: 0, colore: [150, 150, 150] }
  )

  const nomeFile = `correzione-${opts.nomeStudente.toLowerCase().replace(/\s+/g, '-')}-${opts.dataLabel.replace(/[/:, ]/g, '-')}.pdf`
  doc.save(nomeFile)
}

export function SubmissionHistoryEntry({
  id,
  studentId,
  nomeStudente,
  tipoLabel,
  dataLabel,
  testo,
  punteggio,
  rispettaConsegna,
  testoIncollato,
  secondiScrittura,
  errori,
  valutazioneCompleta
}: Props) {
  const [espanso, setEspanso] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletePending, startDeleteTransition] = useTransition()

  const [generateSuccess, setGenerateSuccess] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generatePending, startGenerateTransition] = useTransition()
  const [tipoSelezionato, setTipoSelezionato] = useState<TipoEsercizioPersonalizzato>('completamento')

  function handleDelete() {
    setDeleteError(null)
    startDeleteTransition(async () => {
      try {
        await deleteSubmission(id, studentId)
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : 'Errore inatteso.')
        setConfirmingDelete(false)
      }
    })
  }

  function handleGenerateFromSubmission() {
    setGenerateError(null)
    setGenerateSuccess(false)
    startGenerateTransition(async () => {
      try {
        await generatePersonalizedExercise(
          studentId,
          tipoSelezionato,
          errori as ErroreSubmission[]
        )
        setGenerateSuccess(true)
      } catch (err) {
        setGenerateError(err instanceof Error ? err.message : 'Errore inatteso.')
      }
    })
  }

  return (
    <div className="rounded-md bg-surface-secondary p-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setEspanso((v) => !v)}
          className="flex-1 text-left"
        >
          <p className="text-sm font-medium text-ink-primary">
            {tipoLabel} <span className="ml-1 text-xs text-ink-tertiary">{espanso ? '▾' : '▸'}</span>
          </p>
          <p className="text-xs text-ink-tertiary">{dataLabel}</p>
        </button>

        <div className="flex items-center gap-2">
          {rispettaConsegna !== null && (
            <span
              className={`text-xs ${rispettaConsegna ? 'text-success-text' : 'text-warning-text'}`}
              title={rispettaConsegna ? 'Consegna rispettata' : 'Consegna non completamente rispettata'}
            >
              {rispettaConsegna ? '✓' : '⚠'}
            </span>
          )}
          {punteggio !== null ? (
            <span className="rounded-full bg-info-bg px-3 py-1 text-sm font-medium text-info-text">
              {punteggio}%
            </span>
          ) : (
            <span className="text-xs text-ink-tertiary">In attesa</span>
          )}
        </div>
      </div>

      {espanso && (
        <div className="mt-3 space-y-3">
          {/* Testo con annotazioni inline */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
              Testo dello studente
            </p>
            {valutazioneCompleta && valutazioneCompleta.errori.length > 0 ? (
              <>
                <AnnotatedText testo={testo} errori={valutazioneCompleta.errori} />
                <p className="mt-2 text-xs text-ink-tertiary">
                  Passa il mouse sulle parole sottolineate per vedere la correzione.
                </p>
              </>
            ) : (
              <p className="whitespace-pre-line text-sm text-ink-primary">{testo}</p>
            )}
            {(testoIncollato || secondiScrittura !== null) && (
              <p
                className="mt-3 text-xs text-ink-tertiary"
                title="Informazione neutra sul modo in cui è stato prodotto il testo."
              >
                ℹ️{' '}
                {testoIncollato && 'Contiene testo incollato'}
                {testoIncollato && secondiScrittura ? ' · ' : ''}
                {secondiScrittura !== null &&
                  secondiScrittura !== undefined &&
                  `Tempo sulla pagina: ${
                    secondiScrittura < 60
                      ? `${secondiScrittura}s`
                      : `${Math.round(secondiScrittura / 60)} min`
                  }`}
              </p>
            )}
          </div>

          {/* Valutazione completa */}
          {valutazioneCompleta && (
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                Valutazione IA
              </p>

              <p className="text-sm text-ink-primary">{valutazioneCompleta.feedback_generale}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-success-text">Punti di forza</p>
                  <ul className="space-y-0.5 text-xs text-ink-secondary">
                    {valutazioneCompleta.punti_forza.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-warning-text">Aree da lavorare</p>
                  <ul className="space-y-0.5 text-xs text-ink-secondary">
                    {valutazioneCompleta.aree_di_miglioramento.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {valutazioneCompleta.errori.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-ink-secondary">
                    Errori rilevati ({valutazioneCompleta.errori.length})
                  </p>
                  <ul className="space-y-1">
                    {valutazioneCompleta.errori.map((e, i) => (
                      <li key={i} className="text-xs text-ink-secondary">
                        <span className="text-danger-text line-through">{e.testo_originale}</span>
                        {' → '}
                        <span className="text-success-text">{e.correzione}</span>
                        <span className="ml-1 text-ink-tertiary">({e.categoria})</span>
                        {e.spiegazione && (
                          <span className="ml-1 text-ink-tertiary">— {e.spiegazione}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {errori && errori.length > 0 && (
            <div className="rounded-xl border border-brand-200/60 bg-gradient-to-br from-brand-50 to-violet-50 p-4 dark:border-brand-800/40 dark:from-brand-950/30 dark:to-violet-950/30">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                Genera esercizio personalizzato
              </p>
              {(() => {
                const conteggio: Record<string, number> = {}
                for (const e of errori) conteggio[e.categoria] = (conteggio[e.categoria] ?? 0) + 1
                const dominante = Object.entries(conteggio).sort((a, b) => b[1] - a[1])[0]
                if (!dominante) return null
                const labelMap: Record<string, string> = {
                  grammatica: 'Grammatica', lessico: 'Lessico', sintassi: 'Sintassi',
                  coerenza: 'Coerenza', ortografia: 'Ortografia'
                }
                return (
                  <p className="mb-3 text-xs text-ink-secondary">
                    Categoria con più errori:{' '}
                    <span className="font-semibold text-warning-text">
                      {labelMap[dominante[0]] ?? dominante[0]} ({dominante[1]} {dominante[1] === 1 ? 'errore' : 'errori'})
                    </span>
                    {' '}— l&apos;esercizio generato si concentrerà su questo punto debole.
                  </p>
                )
              })()}
              <div>
                {generateSuccess ? (
                  <p className="text-xs text-success-text">
                    ✓ Esercizio generato — lo trovi in cima e nello spazio dello studente.
                  </p>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {TIPO_GRAMMATICA_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setTipoSelezionato(opt.value)}
                          disabled={generatePending}
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                            tipoSelezionato === opt.value
                              ? 'border-brand-400 bg-brand-400 text-white'
                              : 'border-border bg-surface text-ink-secondary hover:border-brand-400 hover:text-brand-400'
                          } disabled:opacity-60`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={handleGenerateFromSubmission}
                      disabled={generatePending}
                      className="text-xs"
                    >
                      {generatePending
                        ? 'Generazione in corso...'
                        : '✨ Genera esercizio'}
                    </Button>
                    {generatePending && (
                      <p className="mt-1 text-xs text-ink-tertiary">
                        L&apos;IA sta costruendo un esercizio sugli errori di questo testo…
                      </p>
                    )}
                  </>
                )}
                {generateError && (
                  <p className="mt-1 text-xs text-danger-text">{generateError}</p>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      <div className="mt-2 flex items-center justify-end gap-3">
        {valutazioneCompleta && (
          <button
            onClick={() =>
              scaricaCorrezionePdf({ nomeStudente, tipoLabel, dataLabel, testo, punteggio, valutazioneCompleta })
            }
            className="text-xs text-brand-400 hover:underline"
            title="Scarica PDF con testo e correzione"
          >
            ↓ PDF correzione
          </button>
        )}
        {confirmingDelete ? (
          <>
            <span className="text-xs text-danger-text">Eliminare definitivamente?</span>
            <Button
              variant="danger"
              disabled={deletePending}
              onClick={handleDelete}
              className="px-2 py-1 text-xs"
            >
              {deletePending ? '...' : 'Sì, elimina'}
            </Button>
            <Button
              variant="ghost"
              className="px-2 py-1 text-xs"
              onClick={() => setConfirmingDelete(false)}
            >
              No
            </Button>
          </>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="text-xs text-ink-tertiary hover:text-danger-text"
          >
            Elimina
          </button>
        )}
        {deleteError && <span className="text-xs text-danger-text">{deleteError}</span>}
      </div>
    </div>
  )
}
