'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'

export default function ConfirmResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri.')
      return
    }
    if (password !== confirmPassword) {
      setError('Le due password non coincidono.')
      return
    }

    setLoading(true)
    // Supabase, dopo aver cliccato il link nell'email, ha già creato una
    // sessione di tipo "recovery" lato browser (gestita automaticamente
    // dal client SDK leggendo l'URL) — qui basta aggiornare la password.
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(
        "Il link potrebbe essere scaduto o non più valido. Richiedi un nuovo link da 'Password smarrita?'."
      )
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  return (
    <main
      id="main-content"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-surface-secondary via-surface-secondary to-surface p-6 animate-fade-in"
    >
      <Card className="relative w-full max-w-sm bg-surface shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-3">
          <ParolaMascot mood={success ? 'felice' : 'neutro'} />
          <h1 className="text-xl font-semibold text-ink-primary">Imposta una nuova password</h1>
        </div>

        {success ? (
          <p className="text-center text-sm text-success-text">
            Password aggiornata! Ti stiamo portando al login...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-ink-secondary">
                Nuova password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm text-ink-secondary">
                Conferma password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Salvataggio...' : 'Salva nuova password'}
            </Button>
          </form>
        )}
      </Card>
    </main>
  )
}
