'use client'

import { useState, useTransition } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate } from './format'
import { STUDENT_STATUS_LABEL } from './statusLabels'
import { SubscriptionEditor } from './SubscriptionEditor'
import {
  reassignStudentTeacher,
  deleteStudentCompletely,
  disableStudentAccount,
  reenableStudentAccount,
  type StudentAdminRow,
  type TeacherRow
} from './actions'

export function ManageStudentModal({
  student,
  approvedTeachers,
  onClose,
  onChanged,
  onError
}: {
  student: StudentAdminRow
  approvedTeachers: TeacherRow[]
  onClose: () => void
  onChanged: () => void
  onError: (msg: string) => void
}) {
  const [confirmName, setConfirmName] = useState('')
  const [targetTeacherId, setTargetTeacherId] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [pending, startTransition] = useTransition()
  const fullName = `${student.nome} ${student.cognome}`.trim() || student.email

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await action()
        onChanged()
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Errore inatteso.')
      }
    })
  }

  function handleReassign() {
    startTransition(async () => {
      try {
        await reassignStudentTeacher(student.id, targetTeacherId || null)
        onChanged()
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Errore riassegnando.')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteStudentCompletely(student.id, confirmName, fullName)
        onChanged()
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Errore eliminando.')
      }
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-6">
      <Card className="w-full max-w-sm bg-surface">
        <h2 className="mb-1 text-lg font-semibold text-ink-primary">{fullName}</h2>
        <p className="mb-1 text-xs text-ink-tertiary">{student.email}</p>
        <p className="mb-4 text-sm text-ink-tertiary">
          {student.teacherNome
            ? `Insegnante attuale: ${student.teacherNome} ${student.teacherCognome}`
            : 'Indipendente (nessun insegnante)'}
        </p>
        <p className="mb-4 text-xs text-ink-tertiary">
          Abilitato: {formatDate(student.approved_at)} · Scadenza:{' '}
          {student.subscription_end_at ? formatDate(student.subscription_end_at) : 'senza scadenza'}
        </p>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-ink-primary">Scadenza abbonamento</p>
            <SubscriptionEditor
              userId={student.id}
              currentDate={student.subscription_end_at}
              onSaved={onChanged}
              onError={onError}
            />
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-sm font-medium text-ink-primary">Riassegna a un insegnante</p>
            <div className="flex items-center gap-2">
              <select
                value={targetTeacherId}
                onChange={(e) => setTargetTeacherId(e.target.value)}
                className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
              >
                <option value="">Indipendente (nessun insegnante)</option>
                {approvedTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} {t.cognome}
                  </option>
                ))}
              </select>
              <Button disabled={pending} onClick={handleReassign}>
                {pending ? '...' : 'Salva'}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm font-medium text-ink-primary">
              Stato: {STUDENT_STATUS_LABEL[student.student_status]}
            </p>
            {student.student_status === 'disabled' ? (
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => run(() => reenableStudentAccount(student.id))}
              >
                Riattiva
              </Button>
            ) : (
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => run(() => disableStudentAccount(student.id))}
              >
                Disabilita
              </Button>
            )}
          </div>

          <div className="border-t border-border pt-4">
            {confirmingDelete ? (
              <div className="space-y-2">
                <p className="text-sm text-ink-secondary">
                  Questa azione elimina <strong>definitivamente</strong> l&apos;account e TUTTI
                  i dati (scritti, esercizi, storico). Digita <strong>{fullName}</strong> per
                  confermare.
                </p>
                <input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-danger-text"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    disabled={pending}
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Annulla
                  </Button>
                  <Button
                    variant="danger"
                    disabled={pending || confirmName.trim() !== fullName}
                    onClick={handleDelete}
                  >
                    {pending ? 'Eliminando...' : 'Elimina definitivamente'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" disabled={pending} onClick={() => setConfirmingDelete(true)}>
                Elimina account e tutti i dati
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Chiudi
          </Button>
        </div>
      </Card>
    </div>
  )
}
