'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { cn } from '@/lib/utils'

type Ruolo = 'student' | 'teacher'

export default function RegistratiPage() {
  const router = useRouter()
  const supabase = createClient()

  const [ruolo, setRuolo] = useState<Ruolo>('student')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
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
        data: { role: ruolo, nome, cognome, invite_code: ruolo === 'student' ? inviteCode : undefined }
      }
    })

    if (signUpError) {
      setLoading(false)
      setError(
        signUpError.message.includes('already registered')
          ? 'Esiste già un account con questa email.'
          : 'Errore durante la registrazione. Riprova.'
      )
      return
    }

    // Se la conferma email è disattivata in Supabase, ya hay sesión activa
    // y podemos unir al estudiante a la clase de inmediato. Si requiere
    // confirmación, data.session será null y el join deberá hacerse después
    // del primer login (no cubierto en este flujo mínimo).
    if (ruolo === 'student' && data.session) {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setLoading(false)
        setError(body.error ?? 'Codice classe non valido.')
        return
      }
    }

    setLoading(false)

    if (!data.session) {
      setSuccess('Controlla la tua email per confermare l\'account prima di accedere.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-secondary p-6">
      <Card className="w-full max-w-sm bg-surface">
        <div className="mb-6 flex flex-col items-center gap-3">
          <ParolaMascot mood="incoraggiante" />
          <h1 className="text-xl font-semibold text-ink-primary">Registrati</h1>
        </div>

        <div className="mb-4 flex rounded-md border border-border p-1">
          {(['student', 'teacher'] as Ruolo[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRuolo(r)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
                ruolo === r
                  ? 'bg-brand-400 text-white'
                  : 'text-ink-secondary hover:bg-surface-secondary'
              )}
            >
              {r === 'student' ? 'Studente' : 'Insegnante'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-ink-secondary">Nome</label>
              <input
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-ink-secondary">Cognome</label>
              <input
                required
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
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
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
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
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
              autoComplete="new-password"
            />
          </div>

          {ruolo === 'student' && (
            <div>
              <label className="mb-1 block text-sm text-ink-secondary">Codice classe</label>
              <input
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="es. A3F7K9"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm uppercase outline-none focus:border-brand-400"
              />
              <p className="mt-1 text-xs text-ink-tertiary">
                Te lo fornisce il tuo insegnante.
              </p>
            </div>
          )}

          {ruolo === 'teacher' && (
            <p className="rounded-md bg-info-bg px-3 py-2 text-xs text-info-text">
              Il tuo account dovrà essere approvato da un amministratore prima di poter
              accedere.
            </p>
          )}

          {error && (
            <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md bg-success-bg px-3 py-2 text-sm text-success-text">
              {success}
            </p>
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
      </Card>
    </main>
  )
}
