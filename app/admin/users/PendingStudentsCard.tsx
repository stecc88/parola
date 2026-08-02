'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { StudentAdminRow } from './actions'

export function PendingStudentsCard({
  students,
  pending,
  onApprove,
  onReject
}: {
  students: StudentAdminRow[]
  pending: boolean
  onApprove: (studentId: string) => void
  onReject: (studentId: string) => void
}) {
  if (students.length === 0) return null

  return (
    <Card className="mb-6 border-warning-text/30 bg-warning-bg">
      <h2 className="mb-3 text-sm font-semibold text-warning-text">
        Studenti indipendenti in attesa di approvazione ({students.length})
      </h2>
      <div className="space-y-2">
        {students.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-md bg-surface p-3"
          >
            <p className="text-sm font-medium text-ink-primary">
              {s.nome} {s.cognome}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={pending}
                onClick={() => onApprove(s.id)}
                className="px-3 py-1.5 text-sm"
              >
                Approva
              </Button>
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => onReject(s.id)}
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
