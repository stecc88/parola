'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { getUnseenPersonalizedCount } from '@/app/student/personalized/actions'

/**
 * Campanella di notifica per lo studente, quando il docente gli genera
 * un esercizio personalizzato nuovo. Si auto-determina la visibilità:
 * se l'utente non è uno studente (o non è loggato), l'azione ritorna
 * null e il componente non renderizza nulla — può essere messo dentro
 * AppNav (condiviso da tutti i ruoli) senza bisogno che ogni pagina
 * sappia se mostrarlo o no.
 *
 * Il count si aggiorna ad ogni cambio di rotta: quando lo studente visita
 * /student/personalized il server marca tutto come letto, e al ritorno
 * su un'altra pagina il refetch trova già 0.
 */
export function NotificationBell() {
  const [count, setCount] = useState<number | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/student/personalized') {
      setCount(0)
      return
    }
    getUnseenPersonalizedCount().then(setCount).catch(() => {})
  }, [pathname])

  if (count === null) return null

  return (
    <Link
      href="/student/personalized"
      className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-surface-secondary hover:text-ink-primary"
      aria-label={count > 0 ? `${count} nuovi esercizi da vedere` : 'Nessuna nuova notifica'}
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
