'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { requestNameChange, changeMyPassword, getMyPendingNameChangeRequest, type NameChangeRequest } from './actions'

export function AccountForm({
  nomeIniziale,
  cognomeIniziale
}: {
  nomeIniziale: string
  cognomeIniziale: string
}) {
  const [pendingRequest, setPendingRequest] = useState<NameChangeRequest | null | undefined>(undefined)
  const [nome, setNome] = useState(nomeIniziale)
  const [cognome, setCognome] = useState(cognomeIniziale)
  const [salvandoNome, setSalvandoNome] = useState(false)
  const [erroreNome, setErroreNome] = useState<string | null>(null)
  const [successoNome, setSuccessoNome] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [salvandoPassword, setSalvandoPassword] = useState(false)
  const [errorePassword, setErrorePassword] = useState<string | null>(null)
  const [successoPassword, setSuccessoPassword] = useState(false)

  useEffect(() => {
    getMyPendingNameChangeRequest().then((r) => setPendingRequest(r)).catch(() => setPendingRequest(null))
  }, [])

  async function handleSalvaNome(e: React.FormEvent) {
    e.preventDefault()
    setErroreNome(null)
    setSuccessoNome(false)
    setSalvandoNome(true)
    try {
      await requestNameChange(nome, cognome)
      setSuccessoNome(true)
      const updated = await getMyPendingNameChangeRequest()
      setPendingRequest(updated)
    } catch (err) {
      setErroreNome(err instanceof Error ? err.message : 'Errore inatteso.')
    }
    setSalvandoNome(false)
  }

  async function handleCambiaPassword(e: React.FormEvent) {
    e.preventDefault()
    setErrorePassword(null)
    setSuccessoPassword(false)

    if (password !== confirmPassword) {
      setErrorePassword('Le due password non coincidono.')
      return
    }

    setSalvandoPassword(true)
    try {
      await changeMyPassword(password)
      setSuccessoPassword(true)
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setErrorePassword(err instanceof Error ? err.message : 'Errore inatteso.')
    }
    setSalvandoPassword(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink-primary">Dati personali</h2>

        {pendingRequest === undefined ? (
          <p className="text-sm text-ink-tertiary">Caricamento...</p>
        ) : pendingRequest !== null ? (
          <div className="space-y-3">
            <div className="rounded-md bg-warning-bg p-3 text-sm text-warning-text">
              <p className="font-medium">Richiesta di cambio nome in attesa</p>
              <p className="mt-1">
                Hai richiesto di cambiare il tuo nome da{' '}
                <strong>{pendingRequest.nome_attuale} {pendingRequest.cognome_attuale}</strong>{' '}
                a{' '}
                <strong>{pendingRequest.nome_richiesto} {pendingRequest.cognome_richiesto}</strong>.
              </p>
              <p className="mt-1 text-xs">
                La richiesta è in attesa di approvazione da parte dell&apos;amministratore.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSalvaNome} className="flex flex-col gap-3">
            <p className="text-xs text-ink-tertiary">
              Le modifiche al nome e cognome richiedono l&apos;approvazione dell&apos;amministratore.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="nome" className="mb-1 block text-sm text-ink-secondary">
                  Nome
                </label>
                <input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                />
              </div>
              <div>
                <label htmlFor="cognome" className="mb-1 block text-sm text-ink-secondary">
                  Cognome
                </label>
                <input
                  id="cognome"
                  value={cognome}
                  onChange={(e) => setCognome(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                />
              </div>
            </div>
            {erroreNome && <p className="text-sm text-danger-text">{erroreNome}</p>}
            {successoNome && (
              <p className="text-sm text-success-text">
                Richiesta inviata! L&apos;amministratore la valuterà a breve.
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={salvandoNome}>
                {salvandoNome ? 'Invio...' : 'Richiedi modifica'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink-primary">Cambia password</h2>
        <form onSubmit={handleCambiaPassword} className="flex flex-col gap-3">
          <div>
            <label htmlFor="nuova-password" className="mb-1 block text-sm text-ink-secondary">
              Nuova password
            </label>
            <input
              id="nuova-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
          <div>
            <label htmlFor="conferma-password" className="mb-1 block text-sm text-ink-secondary">
              Conferma nuova password
            </label>
            <input
              id="conferma-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
          {errorePassword && <p className="text-sm text-danger-text">{errorePassword}</p>}
          {successoPassword && (
            <p className="text-sm text-success-text">Password aggiornata!</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={salvandoPassword}>
              {salvandoPassword ? 'Salvataggio...' : 'Cambia password'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
