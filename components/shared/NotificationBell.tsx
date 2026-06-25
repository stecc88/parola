'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { getUnseenPersonalizedCount } from '@/app/student/personalized/actions'

/**
 * Campanella di notifica per lo studente, quando il docente gli genera
 * un esercizio personalizzato nuovo. Si auto-determina la visibilità:
 * se l'utente non è uno studente (o non è loggato), l'azione ritorna
 * null e il componente non renderizza nulla — può essere messo dentro
 * AppNav (condiviso da tutti i ruoli) senza bisogno che ogni pagina
 * sappia se mostrarlo o no.
 */
export function NotificationBell() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    getUnseenPersonalizedCount().then(setCount)
  }, [])

  if (count === null) return null

  return (
    <Link
      href="/student/personalized"
      className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-surface-secondary hover:text-ink-primary"
      aria-label={count > 0 ? `${count} nuovi esercizi da vedere` : 'Nessuna nuova notifica'}
    >
      <Bell className="h-4 w-4" strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-text px-1 text-[10px] font-semibold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
