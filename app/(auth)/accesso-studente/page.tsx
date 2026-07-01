'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { CopyButton } from '@/components/ui/CopyButton'
import { registerStudent } from './actions'
import { cn } from '@/lib/utils'

const LIVELLI = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export default function AccessoStudentePage() {
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [livello, setLivello] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [accessCode, setAccessCode] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!livello) {
      setError('Seleziona il tuo livello di italiano.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const result = await registerStudent(nome.trim(), cognome.trim(), livello, inviteCode.trim())
      setAccessCode(result.accessCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la registrazione. Riprova.')
    }

    setLoading(false)
  }

  if (accessCode) {
    return (
      <main
        id="main-content"
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-surface-secondary via-surface-secondary to-surface p-6 animate-fade-in"
      >
        <div aria-hidden className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-400/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-sunshine-400/15 blur-3xl" />
        <Card className="relative w-full max-w-sm bg-surface shadow-xl text-center">
          <div className="mb-4 flex flex-col items-center gap-3">
            <ParolaMascot mood="felice" className="animate-float-slow" />
            <h1 className="text-xl font-semibold text-ink-primary">Registrazione completata!</h1>
          </div>

          <p className="mb-2 text-sm text-ink-secondary">
            Il tuo codice personale è:
          </p>

          <div className="mb-4 rounded-lg bg-surface-secondary px-6 py-4">
            <p className="font-mono text-3xl font-bold tracking-widest text-brand-400">
              {accessCode}
            </p>
          </div>

          <div className="mb-4 rounded-md bg-info-bg px-3 py-3 text-sm text-info-text text-left">
            <p className="font-semibold mb-1">Prossimo passo</p>
            <p>
              Il tuo insegnante deve approvare il tuo account. Non appena lo fa, potrai
              accedere con il codice qui sopra.
            </p>
          </div>

          <div className="mb-6 rounded-md bg-warning-bg px-3 py-3 text-sm text-warning-text text-left">
            <p className="font-semibold mb-1">Salva questo codice!</p>
            <p>
              Userai questo codice per accedere ogni volta. Non è recuperabile se perso.
              Scrivilo su carta o salvalo in un posto sicuro.
            </p>
          </div>

          <CopyButton
            text={accessCode}
            className="mb-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-secondary hover:border-brand-400 hover:text-ink-primary transition-colors"
          />

          <Link href="/login">
            <Button className="w-full">Accedi ora</Button>
          </Link>
        </Card>
      </main>
    )
  }

  return (
    <main
      id="main-content"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-surface-secondary via-surface-secondary to-surface p-6 animate-fade-in"
    >
      <div aria-hidden className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-400/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-sunshine-400/15 blur-3xl" />
      <Link
        href="/"
        className="absolute left-4 top-4 z-10 text-sm text-ink-secondary hover:text-ink-primary"
      >
        ← Torna alla home
      </Link>
      <Card className="relative w-full max-w-sm bg-surface shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-3">
          <ParolaMascot mood="incoraggiante" className="animate-float-slow" />
          <h1 className="text-xl font-semibold text-ink-primary">Registrazione studente</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="nome" className="mb-1 block text-sm text-ink-secondary">Nome</label>
              <input
                id="nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="cognome" className="mb-1 block text-sm text-ink-secondary">Cognome</label>
              <input
                id="cognome"
                required
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-secondary">Livello di italiano</label>
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
              {LIVELLI.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLivello(l)}
                  className={cn(
                    'rounded-md border px-2 py-2 text-sm font-medium transition-colors',
                    livello === l
                      ? 'border-brand-400 bg-brand-400 text-white'
                      : 'border-border text-ink-secondary hover:border-brand-400 hover:text-ink-primary'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            {!livello && (
              <p className="mt-1 text-xs text-ink-tertiary">
                Scegli il livello che vuoi raggiungere, o il tuo livello attuale se non sei sicuro.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="inviteCode" className="mb-1 block text-sm text-ink-secondary">
              Codice insegnante
            </label>
            <input
              id="inviteCode"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="es. A3F7K9"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm uppercase tracking-wider outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
            <p className="mt-1 text-xs text-ink-tertiary">
              Chiedi il codice al tuo insegnante.
            </p>
          </div>

          {error && (
            <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="mt-1 w-full">
            {loading ? 'Registrazione in corso...' : 'Crea account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-secondary">
          Hai già un codice?{' '}
          <Link href="/login" className="text-brand-400 underline">
            Accedi
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-ink-secondary">
          Sei un insegnante?{' '}
          <Link href="/registrati" className="text-brand-400 underline">
            Registrati qui
          </Link>
        </p>
      </Card>
    </main>
  )
}
