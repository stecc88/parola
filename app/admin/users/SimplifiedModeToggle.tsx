'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { getRegistrationSettings, setSimplifiedRegistrationMode } from '../settings/actions'

export function SimplifiedModeToggle({ onError }: { onError: (msg: string) => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    getRegistrationSettings()
      .then((s) => setEnabled(s.simplifiedRegistrationEnabled))
      .catch((e) => onError(e instanceof Error ? e.message : 'Errore caricando le impostazioni.'))
  }, [])

  function handleToggle() {
    if (enabled === null) return
    const next = !enabled
    startTransition(async () => {
      try {
        await setSimplifiedRegistrationMode(next)
        setEnabled(next)
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Errore aggiornando la modalità.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold text-ink-primary">Modalità di registrazione semplificata</h2>
        <p className="text-xs text-ink-tertiary">
          {enabled === null
            ? 'Caricamento...'
            : enabled
              ? 'Attiva: il registro studenti mostra solo Nome, Cognome, Corso e Codice insegnante, con accesso immediato.'
              : 'Disattiva: il registro classico è in uso (Nome, Cognome, Livello, Codice insegnante, con approvazione).'}
        </p>
      </div>
      <Button
        variant={enabled ? 'danger' : 'secondary'}
        disabled={enabled === null || pending}
        onClick={handleToggle}
      >
        {pending
          ? '...'
          : enabled
            ? 'Disattiva modalità semplificata'
            : 'Attiva modalità semplificata'}
      </Button>
    </div>
  )
}
