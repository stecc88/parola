'use client'

import { useEffect, useState, useTransition } from 'react'
import { getLivelloTarget, setLivelloTarget } from '@/lib/student/livello'
import type { LivelloCefr } from '@/lib/supabase/database.types'

const LIVELLI: LivelloCefr[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export function LivelloSelector() {
  const [livello, setLivello] = useState<LivelloCefr | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    getLivelloTarget().then(setLivello)
  }, [])

  function handleChange(value: LivelloCefr) {
    setLivello(value)
    startTransition(() => setLivelloTarget(value))
  }

  if (!livello) return null

  return (
    <label className="flex items-center gap-2 text-sm text-ink-secondary">
      Livello target:
      <select
        value={livello}
        onChange={(e) => handleChange(e.target.value as LivelloCefr)}
        disabled={pending}
        className="rounded-md border border-border bg-surface px-2 py-1 text-sm outline-none focus:border-brand-400"
      >
        {LIVELLI.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}
