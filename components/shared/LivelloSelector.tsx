'use client'

import { useEffect, useState, useTransition } from 'react'
import { getLivelloTarget, setLivelloTarget } from '@/lib/student/livello'
import type { LivelloCefr } from '@/lib/supabase/database.types'

const LIVELLI: LivelloCefr[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export function LivelloSelector({
  onLivelloChange
}: {
  onLivelloChange?: (livello: LivelloCefr) => void
}) {
  const [livello, setLivello] = useState<LivelloCefr | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    getLivelloTarget().then((l) => {
      setLivello(l)
      onLivelloChange?.(l)
    })
    // onLivelloChange è una callback passata dal genitore: la chiamiamo
    // solo al mount e al cambio esplicito, non va nelle dipendenze per
    // evitare un loop se il genitore non la memoizza.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(value: LivelloCefr) {
    setLivello(value)
    onLivelloChange?.(value)
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
