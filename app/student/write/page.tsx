'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { LivelloSelector } from '@/components/shared/LivelloSelector'
import { createScritturaLiberaSubmission } from './actions'
import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'
import { getGuidaBySlug, getConsegnaAdattata } from '@/lib/guides'
import type { LivelloCefr } from '@/lib/supabase/database.types'
import { ValutazioneCard } from '@/components/shared/ValutazioneCard'
import { useWritingSignals } from '@/lib/hooks/useWritingSignals'

const NAV_ITEMS = [
  { href: '/student/progress', label: 'I miei progressi' },
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' },
  { href: '/student/personalized', label: 'Per te' },
  { href: '/account', label: 'Account' }
]

type Stato = 'idle' | 'salvando' | 'valutando' | 'pronto' | 'errore'

function WritePageInner() {
  const searchParams = useSearchParams()
  const guida = getGuidaBySlug(searchParams.get('guida'))
  const [livello, setLivello] = useState<LivelloCefr>('B1')
  const guidaAdattata = guida ? getConsegnaAdattata(guida, livello) : null

  const [testo, setTesto] = useState('')
  const [consegnaLibera, setConsegnaLibera] = useState('')
  const [stato, setStato] = useState<Stato>('idle')
  const [errore, setErrore] = useState<string | null>(null)
  const [valutazione, setValutazione] = useState<ValutazioneEsaminatore | null>(null)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [testoValutato, setTestoValutato] = useState('')
  const { handlePaste, markInterazione, getSegnali } = useWritingSignals()

  const consegnaEffettiva = guidaAdattata ? guidaAdattata.consegna : consegnaLibera

  async function handleSubmit() {
    if (!guida && consegnaLibera.trim().length < 10) {
      setErrore('Inserisci la consegna che ti ha dato il docente prima di scrivere il testo.')
      return
    }

    if (testo.trim().length < 20) {
      setErrore('Scrivi almeno qualche frase prima di richiedere una valutazione.')
      return
    }

    setErrore(null)
    setValutazione(null)
    setStato('salvando')

    try {
      const submissionId = await createScritturaLiberaSubmission(
        testo,
        consegnaEffettiva,
        getSegnali()
      )
      setSubmissionId(submissionId)
      setTestoValutato(testo)

      setStato('valutando')
      const res = await fetch('/api/gemini/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, consegna: consegnaEffettiva })
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
      <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ParolaMascot mood="incoraggiante" />
            <div>
              <h1 className="text-xl font-semibold text-ink-primary">
                {guida ? guida.titolo : 'Scrittura libera'}
              </h1>
              <p className="text-sm text-ink-secondary">
                {guida
                  ? 'Segui la struttura suggerita per non bloccarti.'
                  : 'Scrivi un testo in italiano e ricevi una valutazione dettagliata.'}
              </p>
            </div>
          </div>
          <LivelloSelector onLivelloChange={setLivello} />
        </div>

        <Card>
          {guida && (
            <div className="mb-5 space-y-4">
              <div className="rounded-md bg-info-bg p-3 text-sm text-info-text">
                <p className="font-medium">Consegna</p>
                <p className="mt-1">{guidaAdattata?.consegna}</p>
                <p className="mt-2 text-xs">
                  Livello {livello} · Lunghezza consigliata: {guidaAdattata?.paroleMin}-
                  {guidaAdattata?.paroleMax} parole
                  {' · '}parole scritte finora: {testo.trim().split(/\s+/).filter(Boolean).length}
                </p>
              </div>

              {guida.categoria && (
                <div className="rounded-md bg-guided-bg p-3 text-sm text-guided-text">
                  <p className="font-medium">Cos&apos;è il testo {guida.categoria}?</p>
                  <p className="mt-1">{guida.categoriaSpiegazione}</p>
                </div>
              )}

              <details className="rounded-md border border-border">
                <summary className="cursor-pointer p-3 text-sm font-medium text-ink-primary">
                  📋 Struttura suggerita — da dove iniziare
                </summary>
                <div className="space-y-3 border-t border-border p-3">
                  {(guidaAdattata?.struttura ?? guida.struttura).map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-400 text-xs font-medium text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink-primary">{s.titolo}</p>
                        <p className="text-xs text-ink-secondary">{s.descrizione}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              <details className="rounded-md border border-border" open>
                <summary className="cursor-pointer p-3 text-sm font-medium text-ink-primary">
                  💬 Frasi utili — bloccato? Inizia da qui
                </summary>
                <div className="space-y-3 border-t border-border p-3">
                  {(guidaAdattata?.frasiUtili ?? guida.frasiUtili).map((g, i) => (
                    <div key={i}>
                      <p className="mb-1 text-xs font-medium text-ink-tertiary">{g.sezione}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {g.frasi.map((f, j) => (
                          <span
                            key={j}
                            className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs text-ink-secondary"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              <details className="rounded-md border border-border">
                <summary className="cursor-pointer p-3 text-sm font-medium text-ink-primary">
                  📚 Vocabolario utile
                </summary>
                <div className="flex flex-wrap gap-1.5 border-t border-border p-3">
                  {(guidaAdattata?.vocabolarioChiave ?? guida.vocabolarioChiave).map((v) => (
                    <span
                      key={v}
                      className="rounded-full bg-guided-bg px-2.5 py-1 text-xs text-guided-text"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </details>

              {guidaAdattata?.testoModello && (
                <details className="rounded-md border border-border">
                  <summary className="cursor-pointer p-3 text-sm font-medium text-ink-primary">
                    📝 Testo di esempio (livello {livello})
                  </summary>
                  <div className="border-t border-border p-3">
                    <p className="mb-2 text-xs text-ink-tertiary">
                      Questo è un esempio scritto al livello {livello} — leggilo per capire la struttura e il registro, poi scrivi il tuo testo con le tue idee.
                    </p>
                    <div className="rounded-md bg-surface-secondary p-3 text-sm text-ink-primary whitespace-pre-line leading-relaxed">
                      {guidaAdattata.testoModello}
                    </div>
                  </div>
                </details>
              )}
            </div>
          )}

          {!guida && (
            <div className="mb-4">
              <label
                htmlFor="consegna-libera"
                className="mb-1 block text-sm font-medium text-ink-primary"
              >
                Consegna del docente
              </label>
              <p className="mb-2 text-xs text-ink-tertiary">
                Inserisci esattamente la consegna che ti ha dato il docente. L&apos;esaminatore
                verificherà se il tuo testo rispetta ogni punto richiesto.
              </p>
              <textarea
                id="consegna-libera"
                value={consegnaLibera}
                onChange={(e) => setConsegnaLibera(e.target.value)}
                disabled={stato === 'salvando' || stato === 'valutando'}
                rows={3}
                placeholder="Es: Scrivi una lettera a un amico in cui racconti la tua ultima vacanza. Descrivi dove sei andato, cosa hai fatto e come ti sei sentito. (almeno 120 parole)"
                className="w-full resize-none rounded-md border border-border bg-surface p-3 text-sm text-ink-primary outline-none focus:border-brand-400 disabled:opacity-60"
              />
            </div>
          )}

          <textarea
            value={testo}
            onChange={(e) => {
              markInterazione()
              setTesto(e.target.value)
            }}
            onPaste={handlePaste}
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

        {valutazione && submissionId && (
          <ValutazioneCard
            valutazione={valutazione}
            submissionId={submissionId}
            testo={testoValutato}
          />
        )}
      </main>
    </>
  )
}

export default function WritePage() {
  return (
    <Suspense>
      <WritePageInner />
    </Suspense>
  )
}
