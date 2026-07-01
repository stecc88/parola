'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'

export default function RegistratiPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'teacher', nome, cognome }
      }
    })

    setLoading(false)

    if (signUpError) {
      setError(
        signUpError.message.includes('already registered')
          ? 'Esiste già un account con questa email.'
          : 'Errore durante la registrazione. Riprova.'
      )
      return
    }

    if (!data.session) {
      setSuccess("Controlla la tua email per confermare l'account prima di accedere.")
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-surface-secondary via-surface-secondary to-surface p-6 animate-fade-in">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-400/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-sunshine-400/15 blur-3xl"
      />
      <Link
        href="/"
        className="absolute left-4 top-4 z-10 text-sm text-ink-secondary hover:text-ink-primary"
      >
        ← Torna alla home
      </Link>
      <Card className="relative w-full max-w-sm bg-surface shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-3">
          <ParolaMascot mood="incoraggiante" className="animate-float-slow" />
          <h1 className="text-xl font-semibold text-ink-primary">Registrazione insegnante</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-ink-secondary">Nome</label>
              <input
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-ink-secondary">Cognome</label>
              <input
                required
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-secondary">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-secondary">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              autoComplete="new-password"
            />
          </div>

          <p className="rounded-md bg-info-bg px-3 py-2 text-xs text-info-text">
            Il tuo account dovrà essere approvato da un amministratore prima di poter accedere.
          </p>

          {error && (
            <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">{error}</p>
          )}
          {success && (
            <p className="rounded-md bg-success-bg px-3 py-2 text-sm text-success-text">{success}</p>
          )}

          <Button type="submit" disabled={loading} className="mt-1 w-full">
            {loading ? 'Registrazione in corso...' : 'Crea account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-secondary">
          Hai già un account?{' '}
          <Link href="/login" className="text-brand-400 underline">
            Accedi
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-ink-secondary">
          Sei uno studente?{' '}
          <Link href="/accesso-studente" className="text-brand-400 underline">
            Registrati qui
          </Link>
        </p>
      </Card>
    </main>
  )
}
