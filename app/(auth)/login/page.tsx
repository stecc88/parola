'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (authError) {
      setError('Email o password non corretti.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-secondary p-6">
      <Card className="w-full max-w-sm bg-surface">
        <div className="mb-6 flex flex-col items-center gap-3">
          <ParolaMascot mood="felice" />
          <h1 className="text-xl font-semibold text-ink-primary">Accedi a Parola</h1>
        </div>

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
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-400"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-ink-secondary">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-400"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-secondary">
          Non hai un account?{' '}
          <Link href="/registrati" className="text-brand-400 underline">
            Registrati
          </Link>
        </p>
      </Card>
    </main>
  )
}
