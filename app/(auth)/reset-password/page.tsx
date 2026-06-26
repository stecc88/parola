'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'

export default function ResetPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviata, setInviata] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/confirm`
    })

    setLoading(false)

    if (resetError) {
      setError('Errore inviando l\u2019email. Verifica l\u2019indirizzo e riprova.')
      return
    }

    setInviata(true)
  }

  return (
    <main
      id="main-content"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-surface-secondary via-surface-secondary to-surface p-6 animate-fade-in"
    >
      <Link
        href="/login"
        className="absolute left-4 top-4 z-10 text-sm text-ink-secondary hover:text-ink-primary"
      >
        ← Torna al login
      </Link>
      <Card className="relative w-full max-w-sm bg-surface shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-3">
          <ParolaMascot mood={inviata ? 'felice' : 'neutro'} />
          <h1 className="text-xl font-semibold text-ink-primary">Password smarrita?</h1>
        </div>

        {inviata ? (
          <div className="text-center text-sm text-ink-secondary">
            <p>
              Se l&apos;indirizzo <span className="font-medium text-ink-primary">{email}</span>{' '}
              corrisponde a un account, ti abbiamo inviato un&apos;email con le istruzioni per
              reimpostare la password.
            </p>
            <p className="mt-3 text-xs text-ink-tertiary">
              Non la vedi? Controlla anche nello spam.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-ink-secondary">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                autoComplete="email"
              />
            </div>

            {error && (
              <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Invio...' : 'Invia istruzioni'}
            </Button>
          </form>
        )}
      </Card>
    </main>
  )
}
