'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { createClass } from './actions'

export function CreateClassForm() {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await createClass(nome)
        setNome('')
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Errore inatteso.')
      }
    })
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Nuova classe</Button>
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="es. 1° Anno"
        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand-400"
      />
      <Button type="submit" disabled={pending}>
        {pending ? 'Creando...' : 'Crea'}
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
        Annulla
      </Button>
      {error && <span className="text-sm text-danger-text">{error}</span>}
    </form>
  )
}
