'use client'

import { useEffect, useState, useTransition } from 'react'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  getTeachers,
  approveTeacher,
  rejectTeacher,
  disableTeacher,
  reenableTeacher,
  deleteTeacher,
  getTeacherBlockers,
  getApprovedTeachersExcept,
  getApprovedTeachers,
  reassignAllClasses,
  getAllStudentsAdmin,
  approveStudent,
  rejectStudent,
  disableStudentAccount,
  reenableStudentAccount,
  reassignStudentTeacher,
  deleteStudentCompletely,
  type TeacherRow,
  type StudentAdminRow
} from './actions'

const NAV_ITEMS = [
  { href: '/admin/users', label: 'Gestione utenti' },
  { href: '/account', label: 'Account' }
]

const STATUS_LABEL: Record<TeacherRow['teacher_status'], string> = {
  pending: 'In attesa',
  approved: 'Approvato',
  rejected: 'Rifiutato',
  disabled: 'Disabilitato'
}

const STATUS_CLASS: Record<TeacherRow['teacher_status'], string> = {
  pending: 'bg-warning-bg text-warning-text',
  approved: 'bg-success-bg text-success-text',
  rejected: 'bg-danger-bg text-danger-text',
  disabled: 'bg-surface-tertiary text-ink-tertiary'
}

const STUDENT_STATUS_LABEL: Record<StudentAdminRow['student_status'], string> = {
  pending: 'In attesa',
  approved: 'Attivo',
  rejected: 'Rifiutato',
  disabled: 'Disabilitato'
}

const STUDENT_STATUS_CLASS: Record<StudentAdminRow['student_status'], string> = {
  pending: 'bg-warning-bg text-warning-text',
  approved: 'bg-success-bg text-success-text',
  rejected: 'bg-danger-bg text-danger-text',
  disabled: 'bg-surface-tertiary text-ink-tertiary'
}

// I docenti "in attesa" sono l'azione piu urgente — vanno mostrati primi,
// indipendentemente dalla data di registrazione.
const STATUS_ORDER: Record<TeacherRow['teacher_status'], number> = {
  pending: 0,
  approved: 1,
  disabled: 2,
  rejected: 3
}

export default function AdminUsersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [students, setStudents] = useState<StudentAdminRow[]>([])
  const [approvedTeachers, setApprovedTeachers] = useState<TeacherRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<TeacherRow | null>(null)
  const [manageTarget, setManageTarget] = useState<StudentAdminRow | null>(null)

  async function reload() {
    setLoading(true)
    try {
      const [t, s, at] = await Promise.all([
        getTeachers(),
        getAllStudentsAdmin(),
        getApprovedTeachers()
      ])
      setTeachers(t)
      setStudents(s)
      setApprovedTeachers(at)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricando gli insegnanti.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await action()
        await reload()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Errore inatteso.')
      }
    })
  }

  const inAttesa = teachers.filter((t) => t.teacher_status === 'pending').length
  const approvati = teachers.filter((t) => t.teacher_status === 'approved').length
  const teachersOrdinati = [...teachers].sort(
    (a, b) =>
      STATUS_ORDER[a.teacher_status] - STATUS_ORDER[b.teacher_status] ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">
        <h1 className="mb-2 text-xl font-semibold text-ink-primary">Gestione utenti</h1>
        {!loading && teachers.length > 0 && (
          <p className="mb-6 text-sm text-ink-tertiary">
            {teachers.length} insegnanti totali · {approvati} approvati
            {inAttesa > 0 && (
              <span className="ml-1 font-medium text-warning-text">
                · {inAttesa} in attesa di approvazione
              </span>
            )}
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
            {error}
          </p>
        )}

        {!loading && students.filter((s) => s.student_status === 'pending').length > 0 && (
          <Card className="mb-6 border-warning-text/30 bg-warning-bg">
            <h2 className="mb-3 text-sm font-semibold text-warning-text">
              Studenti indipendenti in attesa di approvazione (
              {students.filter((s) => s.student_status === 'pending').length})
            </h2>
            <div className="space-y-2">
              {students
                .filter((s) => s.student_status === 'pending')
                .map((s) => (
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
                        onClick={() => run(() => approveStudent(s.id))}
                        className="px-3 py-1.5 text-sm"
                      >
                        Approva
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={pending}
                        onClick={() => run(() => rejectStudent(s.id))}
                        className="px-3 py-1.5 text-sm"
                      >
                        Rifiuta
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {!loading && students.length > 0 && (
          <Card className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-ink-primary">
              Tutti gli studenti ({students.length})
            </h2>
            <div className="space-y-1">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setManageTarget(s)}
                  className="flex w-full items-center justify-between gap-3 rounded-md p-2 text-left text-sm hover:bg-surface-secondary"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-primary">
                      {s.nome} {s.cognome}
                    </p>
                    <p className="truncate text-xs text-ink-tertiary">{s.email}</p>
                    <p className="truncate text-xs text-ink-tertiary">
                      {s.teacherNome
                        ? `Insegnante: ${s.teacherNome} ${s.teacherCognome}`
                        : 'Indipendente'}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STUDENT_STATUS_CLASS[s.student_status]}`}>
                    {STUDENT_STATUS_LABEL[s.student_status]}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        <h2 className="mb-3 text-sm font-semibold text-ink-tertiary">Insegnanti</h2>

        {loading ? (
          <p className="text-sm text-ink-tertiary">Caricamento...</p>
        ) : teachers.length === 0 ? (
          <Card className="border-dashed text-center text-sm text-ink-tertiary">
            Nessun insegnante registrato.
          </Card>
        ) : (
          <div className="space-y-3">
            {teachersOrdinati.map((t) => (
              <Card key={t.id} className="flex items-center justify-between gap-4">
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
                </div>

                <div className="flex flex-wrap gap-2">
                  {t.teacher_status === 'pending' && (
                    <>
                      <Button
                        disabled={pending}
                        onClick={() => run(() => approveTeacher(t.id))}
                      >
                        Approva
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={pending}
                        onClick={() => run(() => rejectTeacher(t.id))}
                      >
                        Rifiuta
                      </Button>
                    </>
                  )}

                  {t.teacher_status === 'approved' && (
                    <Button
                      variant="secondary"
                      disabled={pending}
                      onClick={() => run(() => disableTeacher(t.id))}
                    >
                      Disabilita
                    </Button>
                  )}

                  {t.teacher_status === 'disabled' && (
                    <Button
                      variant="secondary"
                      disabled={pending}
                      onClick={() => run(() => reenableTeacher(t.id))}
                    >
                      Riattiva
                    </Button>
                  )}

                  <Button
                    variant="danger"
                    disabled={pending}
                    onClick={() => setDeleteTarget(t)}
                  >
                    Elimina
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {deleteTarget && (
          <DeleteTeacherModal
            teacher={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={() => {
              setDeleteTarget(null)
              reload()
            }}
            onError={(msg) => setError(msg)}
          />
        )}

        {manageTarget && (
          <ManageStudentModal
            student={manageTarget}
            approvedTeachers={approvedTeachers}
            onClose={() => setManageTarget(null)}
            onChanged={() => {
              setManageTarget(null)
              reload()
            }}
            onError={(msg) => setError(msg)}
          />
        )}
      </main>
    </>
  )
}

function DeleteTeacherModal({
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
  const fullName = `${teacher.nome} ${teacher.cognome}`

  useEffect(() => {
    getTeacherBlockers(teacher.id).then((r) => {
      setClassi(r.classi)
      setStudentiCount(r.studentiCount)
    })
    getApprovedTeachersExcept(teacher.id).then(setCandidates)
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
              <p className="text-sm text-ink-tertiary">
                Non ci sono altri insegnanti approvati a cui riassegnare gli studenti.
              </p>
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

function ManageStudentModal({
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
  const fullName = `${student.nome} ${student.cognome}`

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

        <div className="space-y-4">
          <div>
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
