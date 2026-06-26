'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

const STORAGE_KEY = 'parola-theme'

export function ThemeToggle() {
  // null finché non leggiamo lo stato reale dal DOM dopo il mount, per
  // evitare un mismatch di hydration col tema già applicato dallo script
  // inline in <head> (vedi app/layout.tsx).
  const [isDark, setIsDark] = useState<boolean | null>(null)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
    } catch {
      // Storage non disponibile (es. modalità privata): il tema resta
      // comunque applicato per la sessione corrente, semplicemente non
      // persiste al refresh.
    }
    setIsDark(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-surface-secondary hover:text-ink-primary"
    >
      {isDark === null ? null : isDark ? (
        <Sun className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  )
}
