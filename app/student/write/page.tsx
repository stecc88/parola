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
import { getGuidaBySlug } from '@/lib/guides'
import { ValutazioneCard } from '@/components/shared/ValutazioneCard'

const NAV_ITEMS = [
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' },
  { href: '/student/personalized', label: 'Per te' },
  { href: '/student/progress', label: 'I miei progressi' }
]

type Stato = 'idle' | 'salvando' | 'valutando' | 'pronto' | 'errore'

function WritePageInner() {
  const searchParams = useSearchParams()
  const guida = getGuidaBySlug(searchParams.get('guida'))

  const [testo, setTesto] = useState('')
  const [consegnaLibera, setConsegnaLibera] = useState('')
  const [stato, setStato] = useState<Stato>('idle')
  const [errore, setErrore] = useState<string | null>(null)
  const [valutazione, setValutazione] = useState<ValutazioneEsaminatore | null>(null)
  const [submissionId, setSubmissionId] = useState<string | null>(null)

  const consegnaEffettiva = guida ? guida.consegna : consegnaLibera

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
      const submissionId = await createScritturaLiberaSubmission(testo, consegnaEffettiva)
      setSubmissionId(submissionId)

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
      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ParolaMascot mood="incoraggiante" />
            <div>
              <h1 className="text-xl font-semibold text-ink-primary">
                {guida ? guida.titolo : 'Scrittura libera'}
              </h1>
              <p className="text-sm text-ink-secondary">
                {guida
                  ? guida.consegna
                  : 'Scrivi un testo in italiano e ricevi una valutazione dettagliata.'}
              </p>
            </div>
          </div>
          <LivelloSelector />
        </div>

        <Card>
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

        {valutazione && submissionId && (
          <ValutazioneCard valutazione={valutazione} submissionId={submissionId} />
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
