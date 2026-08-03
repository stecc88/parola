'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { getTeacherUnseenCount } from '@/app/teacher/(app)/classes/actions'

/**
 * Campanella per il docente: aggrega consegne studenti non viste (segnate
 * come viste su /teacher/dashboard) + traguardi di livello non visti
 * (segnati come visti su /teacher/classes) — due fonti indipendenti su
 * due pagine diverse, quindi NON si può azzerare il conteggio in base al
 * semplice pathname come fa NotificationBell (lì un'unica pagina segna
 * tutto come letto). Si rifà sempre il fetch: il server ha già applicato
 * l'eventuale "segna come visto" della pagina corrente durante il suo
 * render, quindi al montaggio di questo componente il conteggio fresco è
 * già corretto, senza bisogno di scorciatoie locali.
 */
export function TeacherNotificationBell() {
  const [count, setCount] = useState<number | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    getTeacherUnseenCount().then(setCount).catch(() => {})
  }, [pathname])

  if (count === null) return null

  return (
    <Link
      href="/teacher/dashboard"
      className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-surface-secondary hover:text-ink-primary"
      aria-label={count > 0 ? `${count} nuove notifiche` : 'Nessuna nuova notifica'}
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
