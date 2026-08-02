'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { setSubscriptionEndDate } from './actions'

export function SubscriptionEditor({
  userId,
  currentDate,
  onSaved,
  onError
}: {
  userId: string
  currentDate: string | null
  onSaved: () => void
  onError: (msg: string) => void
}) {
  const [senzaScadenza, setSenzaScadenza] = useState(!currentDate)
  const [data, setData] = useState(currentDate ? currentDate.slice(0, 10) : '')
  const [pending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      try {
        await setSubscriptionEndDate(userId, senzaScadenza ? null : data ? new Date(data).toISOString() : null)
        onSaved()
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Errore impostando la scadenza.')
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-xs text-ink-secondary">
        <input
          type="checkbox"
          checked={senzaScadenza}
          onChange={(e) => setSenzaScadenza(e.target.checked)}
        />
        Senza scadenza
      </label>
      {!senzaScadenza && (
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-brand-400"
        />
      )}
      <Button variant="secondary" disabled={pending} onClick={handleSave} className="px-2 py-1 text-xs">
        {pending ? '...' : 'Salva scadenza'}
      </Button>
    </div>
  )
}
