import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold">Accedi a Parola</h1>
        {/* TODO: form di login con Supabase Auth (email/password) */}
        <p className="text-sm text-ink-secondary">
          Non hai un account?{' '}
          <Link href="/registrati" className="text-brand-400 underline">
            Registrati
          </Link>
        </p>
      </Card>
    </main>
  )
}
