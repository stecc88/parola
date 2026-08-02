'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { NameChangeRequestRow } from './actions'

export function NameChangeRequestsCard({
  requests,
  pending,
  onApprove,
  onReject
}: {
  requests: NameChangeRequestRow[]
  pending: boolean
  onApprove: (requestId: string) => void
  onReject: (requestId: string) => void
}) {
  if (requests.length === 0) return null

  return (
    <Card className="mb-6 border-warning-text/30 bg-warning-bg">
      <h2 className="mb-3 text-sm font-semibold text-warning-text">
        Richieste di cambio nome ({requests.length})
      </h2>
      <div className="space-y-2">
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex items-start justify-between gap-3 rounded-md bg-surface p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-tertiary">{r.email}</p>
              <p className="mt-0.5 text-sm text-ink-primary">
                <span className="text-ink-tertiary">{r.nome_attuale} {r.cognome_attuale}</span>
                {' → '}
                <strong>{r.nome_richiesto} {r.cognome_richiesto}</strong>
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                disabled={pending}
                onClick={() => onApprove(r.id)}
                className="px-3 py-1.5 text-sm"
              >
                Approva
              </Button>
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => onReject(r.id)}
                className="px-3 py-1.5 text-sm"
              >
                Rifiuta
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
