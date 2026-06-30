'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { getAdminPendingCount } from '@/app/admin/users/actions'

export function AdminNotificationBell() {
  const [count, setCount] = useState<number | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/admin/users') {
      setCount(0)
      return
    }
    getAdminPendingCount().then(setCount).catch(() => {})
  }, [pathname])

  if (count === null) return null

  return (
    <Link
      href="/admin/users"
      className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-surface-secondary hover:text-ink-primary"
      aria-label={count > 0 ? `${count} richieste in attesa` : 'Nessuna richiesta in attesa'}
    >
      <Bell className={`h-4 w-4 ${count > 0 ? 'text-brand-400' : ''}`} strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-text px-1 text-[10px] font-semibold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
