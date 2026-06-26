'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  const [pending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      className="text-sm text-ink-secondary hover:text-danger-text disabled:opacity-50"
    >
      {pending ? 'Uscita...' : 'Esci'}
    </button>
  )
}
