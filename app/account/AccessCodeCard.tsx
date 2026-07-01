'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function AccessCodeCard({ accessCode }: { accessCode: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(accessCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-1 text-sm font-semibold text-ink-primary">Il tuo codice di accesso</h2>
      <p className="mb-3 text-sm text-ink-secondary">
        Usa questo codice per accedere a Parola. Conservalo in un posto sicuro.
      </p>
      <div className="mb-3 flex items-center gap-3 rounded-lg bg-surface-secondary px-4 py-3">
        <span className="font-mono text-xl font-bold tracking-widest text-brand-400 flex-1">
          {accessCode}
        </span>
        <Button variant="secondary" onClick={handleCopy} className="shrink-0">
          {copied ? '✓ Copiato' : 'Copia'}
        </Button>
      </div>
    </Card>
  )
}
