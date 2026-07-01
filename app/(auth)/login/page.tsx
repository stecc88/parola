'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { cn } from '@/lib/utils'
import { resolveStudentAccessCode } from './actions'

type Tab = 'student' | 'teacher'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('student')

  // Student
  const [accessCode, setAccessCode] = useState('')

  // Teacher
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleStudentLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const code = accessCode.trim().toUpperCase()

    let email: string
    try {
      const result = await resolveStudentAccessCode(code)
      email = result.email
    } catch {
      setLoading(false)
      setError('Codice non valido. Controlla di averlo inserito correttamente.')
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: code
    })

    setLoading(false)

    if (authError) {
      setError('Codice non valido. Controlla di averlo inserito correttamente.')
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleTeacherLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (authError) {
      setError('Email o password non corretti.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-surface-secondary via-surface-secondary to-surface p-6 animate-fade-in">
      <div aria-hidden className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-400/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-sunshine-400/15 blur-3xl" />
      <Link href="/" className="absolute left-4 top-4 z-10 text-sm text-ink-secondary hover:text-ink-primary">
        ← Torna alla home
      </Link>
      <Card className="relative w-full max-w-sm bg-surface shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-3">
          <ParolaMascot mood="felice" className="animate-float-slow" />
          <h1 className="text-xl font-semibold text-ink-primary">Accedi a Parola</h1>
        </div>

        <div className="mb-4 flex rounded-md border border-border p-1">
          {(['student', 'teacher'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null) }}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
                tab === t
                  ? 'bg-brand-400 text-white'
                  : 'text-ink-secondary hover:bg-surface-secondary'
              )}
            >
              {t === 'student' ? 'Sono uno studente' : 'Sono un insegnante'}
            </button>
          ))}
        </div>

        {tab === 'student' ? (
          <form onSubmit={handleStudentLogin} className="flex flex-col gap-4">
            <div>
              <label htmlFor="access-code" className="mb-1 block text-sm text-ink-secondary">
                Codice personale
              </label>
              <input
                id="access-code"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="es. A7K2XM9P"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono tracking-widest uppercase text-ink-primary outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                autoComplete="off"
                autoCapitalize="characters"
              />
              <p className="mt-1 text-xs text-ink-tertiary">
                Il codice che hai ricevuto al momento della registrazione.
              </p>
            </div>

            {error && (
              <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>

            <p className="text-center text-sm text-ink-secondary">
              Prima volta?{' '}
              <Link href="/accesso-studente" className="text-brand-400 underline">
                Crea account studente
              </Link>
            </p>
            <p className="text-center text-xs text-ink-tertiary">
              Hai perso il codice? Chiedilo al tuo insegnante — lo trova nel tuo profilo.
            </p>
          </form>
        ) : (
          <form onSubmit={handleTeacherLogin} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-ink-secondary">Email</label>
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

            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-ink-secondary">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">{error}</p>
            )}

            <div className="text-right">
              <Link href="/reset-password" className="text-xs text-ink-secondary hover:text-brand-400">
                Hai dimenticato la password?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>

            <p className="text-center text-sm text-ink-secondary">
              Non hai un account?{' '}
              <Link href="/registrati" className="text-brand-400 underline">
                Registrati
              </Link>
            </p>
          </form>
        )}
      </Card>
    </main>
  )
}
