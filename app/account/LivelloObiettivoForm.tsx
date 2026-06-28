'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { updateLivelloObiettivo } from './actions'

const LIVELLI = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

interface Props {
  livelloAttuale: string | null
}

export function LivelloObiettivoForm({ livelloAttuale }: Props) {
  const [livello, setLivello] = useState<string>(livelloAttuale ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        await updateLivelloObiettivo(livello || null)
        setSaved(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore inatteso.')
      }
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-secondary">
        Imposta il livello CEFR che vuoi far raggiungere ai tuoi studenti. Quando uno studente
        raggiunge o supera questo livello, riceverai una notifica — e anche lo studente verrà
        congratulato.
      </p>
      <div className="flex items-center gap-3">
        <select
          value={livello}
          onChange={(e) => { setLivello(e.target.value); setSaved(false) }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="">Nessun obiettivo</option>
          {LIVELLI.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <Button onClick={handleSave} disabled={pending} variant="primary" className="text-sm">
          {pending ? 'Salvataggio…' : 'Salva'}
        </Button>
      </div>
      {saved && <p className="text-sm text-success-text">Livello obiettivo aggiornato.</p>}
      {error && <p className="text-sm text-danger-text">{error}</p>}
    </div>
  )
}
