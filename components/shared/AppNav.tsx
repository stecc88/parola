'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ParolaMascot } from './ParolaMascot'
import { LogoutButton } from './LogoutButton'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'

interface AppNavProps {
  items: { href: string; label: string }[]
}

export function AppNav({ items }: AppNavProps) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-[var(--surface-translucent)] px-4 py-3 backdrop-blur-md sm:gap-6 sm:px-6">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <ParolaMascot mood="neutro" className="h-9 w-9" />
        <span className="hidden font-semibold text-ink-primary sm:inline">Parola</span>
      </Link>

      <ul className="hide-scrollbar flex flex-1 gap-1 overflow-x-auto sm:gap-2">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative inline-flex items-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'text-brand-400'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-secondary'
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full bg-gradient-to-r from-brand-400 to-sunshine-400" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      <NotificationBell />
      <ThemeToggle />
      <LogoutButton />
    </nav>
  )
}
