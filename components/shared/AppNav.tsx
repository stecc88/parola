import Link from 'next/link'
import { ParolaMascot } from './ParolaMascot'
import { LogoutButton } from './LogoutButton'

interface AppNavProps {
  items: { href: string; label: string }[]
}

export function AppNav({ items }: AppNavProps) {
  return (
    <nav className="flex items-center gap-6 border-b border-border bg-surface px-6 py-3">
      <Link href="/" className="flex items-center gap-2">
        <ParolaMascot mood="neutro" className="h-9 w-9" />
        <span className="font-semibold text-ink-primary">Parola</span>
      </Link>
      <ul className="flex flex-1 gap-4">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-ink-secondary hover:text-ink-primary"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <LogoutButton />
    </nav>
  )
}
