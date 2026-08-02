'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate } from './format'
import { STATUS_LABEL, STATUS_CLASS } from './statusLabels'
import { SubscriptionEditor } from './SubscriptionEditor'
import type { TeacherRow } from './actions'

export function TeachersList({
  teachers,
  loading,
  pending,
  onApprove,
  onReject,
  onDisable,
  onReenable,
  onDeleteRequest,
  onSubscriptionSaved,
  onError
}: {
  teachers: TeacherRow[]
  loading: boolean
  pending: boolean
  onApprove: (teacherId: string) => void
  onReject: (teacherId: string) => void
  onDisable: (teacherId: string) => void
  onReenable: (teacherId: string) => void
  onDeleteRequest: (teacher: TeacherRow) => void
  onSubscriptionSaved: () => void
  onError: (msg: string) => void
}) {
  return (
    <>
      <h2 className="mb-3 text-sm font-semibold text-ink-tertiary">Insegnanti</h2>

      {loading ? (
        <p className="text-sm text-ink-tertiary">Caricamento...</p>
      ) : teachers.length === 0 ? (
        <Card className="border-dashed text-center text-sm text-ink-tertiary">
          Nessun insegnante registrato.
        </Card>
      ) : (
        <div className="space-y-3">
          {teachers.map((t) => (
            <Card key={t.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-ink-primary">
                  {t.nome} {t.cognome}
                </p>
                <p className="text-xs text-ink-tertiary">{t.email}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[t.teacher_status]}`}
                >
                  {STATUS_LABEL[t.teacher_status]}
                </span>
                <p className="mt-1 text-xs text-ink-tertiary">
                  Abilitato: {formatDate(t.approved_at)} · Scadenza:{' '}
                  {t.subscription_end_at ? formatDate(t.subscription_end_at) : 'senza scadenza'}
                </p>
                <div className="mt-2">
                  <SubscriptionEditor
                    userId={t.id}
                    currentDate={t.subscription_end_at}
                    onSaved={onSubscriptionSaved}
                    onError={onError}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {t.teacher_status === 'pending' && (
                  <>
                    <Button disabled={pending} onClick={() => onApprove(t.id)}>
                      Approva
                    </Button>
                    <Button variant="secondary" disabled={pending} onClick={() => onReject(t.id)}>
                      Rifiuta
                    </Button>
                  </>
                )}

                {t.teacher_status === 'approved' && (
                  <Button variant="secondary" disabled={pending} onClick={() => onDisable(t.id)}>
                    Disabilita
                  </Button>
                )}

                {t.teacher_status === 'disabled' && (
                  <Button variant="secondary" disabled={pending} onClick={() => onReenable(t.id)}>
                    Riattiva
                  </Button>
                )}

                <Button variant="danger" disabled={pending} onClick={() => onDeleteRequest(t)}>
                  Elimina
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
