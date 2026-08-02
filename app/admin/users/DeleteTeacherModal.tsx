'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  getTeacherBlockers,
  getApprovedTeachersExcept,
  reassignAllClasses,
  deleteTeacher,
  type TeacherRow
} from './actions'

export function DeleteTeacherModal({
  teacher,
  onClose,
  onDeleted,
  onError
}: {
  teacher: TeacherRow
  onClose: () => void
  onDeleted: () => void
  onError: (msg: string) => void
}) {
  const [confirmName, setConfirmName] = useState('')
  const [classi, setClassi] = useState<{ id: string; nome: string }[] | null>(null)
  const [studentiCount, setStudentiCount] = useState(0)
  const [candidates, setCandidates] = useState<TeacherRow[]>([])
  const [targetTeacherId, setTargetTeacherId] = useState('')
  const [pending, startTransition] = useTransition()
  const fullName = `${teacher.nome} ${teacher.cognome}`.trim() || teacher.email

  useEffect(() => {
    getTeacherBlockers(teacher.id).then((r) => {
      setClassi(r.classi)
      setStudentiCount(r.studentiCount)
    })
    getApprovedTeachersExcept(teacher.id).then(setCandidates).catch(() => {})
  }, [teacher.id])

  function handleReassign() {
    if (!targetTeacherId) return
    startTransition(async () => {
      try {
        await reassignAllClasses(teacher.id, targetTeacherId)
        setClassi([])
        setStudentiCount(0)
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Errore riassegnando.')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTeacher(teacher.id, confirmName, fullName)
        onDeleted()
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Errore eliminando.')
      }
    })
  }

  const hasBlockers = classi !== null && (classi.length > 0 || studentiCount > 0)

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-6">
      <Card className="w-full max-w-sm bg-surface">
        <h2 className="mb-2 text-lg font-semibold text-danger-text">
          Elimina {fullName}
        </h2>

        {classi === null ? (
          <p className="text-sm text-ink-tertiary">Verifica in corso...</p>
        ) : hasBlockers ? (
          <div className="space-y-3">
            <div className="rounded-md bg-warning-bg p-3 text-sm text-warning-text">
              Questo insegnante ha ancora {studentiCount} studente/i assegnato/i
              {classi.length > 0 &&
                ` (in ${classi.length} classe/i: ${classi.map((c) => c.nome).join(', ')})`}
              . Riassegnali a un altro insegnante prima di poter eliminare l&apos;account.
            </div>

            {candidates.length === 0 ? (
              <div className="rounded-md bg-danger-bg p-3 text-sm text-danger-text">
                <p className="font-medium">Impossibile procedere con l&apos;eliminazione.</p>
                <p className="mt-1">
                  Non ci sono altri docenti approvati a cui riassegnare gli studenti.
                  Prima di eliminare questo account devi:
                </p>
                <ol className="mt-2 list-decimal pl-4 space-y-1">
                  <li>Approvare un altro docente, oppure</li>
                  <li>Spostare gli studenti in stato indipendente dalla pagina di gestione utenti.</li>
                </ol>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={targetTeacherId}
                  onChange={(e) => setTargetTeacherId(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  <option value="">Seleziona un insegnante...</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cognome}
                    </option>
                  ))}
                </select>
                <Button
                  disabled={!targetTeacherId || pending}
                  onClick={handleReassign}
                >
                  {pending ? 'Riassegnando...' : 'Riassegna tutte'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-ink-secondary">
              Questa azione è definitiva. Digita <strong>{fullName}</strong> per confermare.
            </p>
            <input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="mb-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-danger-text"
            />
          </>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Annulla
          </Button>
          {!hasBlockers && classi !== null && (
            <Button
              variant="danger"
              disabled={pending || confirmName.trim() !== fullName}
              onClick={handleDelete}
            >
              {pending ? 'Eliminando...' : 'Elimina definitivamente'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
