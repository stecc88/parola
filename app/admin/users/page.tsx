'use client'

import { useEffect, useState, useTransition } from 'react'
import { AppNav } from '@/components/shared/AppNav'
import { ADMIN_NAV_ITEMS } from '@/components/shared/adminNav'
import { Card } from '@/components/ui/Card'
import { SimplifiedModeToggle } from './SimplifiedModeToggle'
import { NameChangeRequestsCard } from './NameChangeRequestsCard'
import { PendingStudentsCard } from './PendingStudentsCard'
import { StudentsList } from './StudentsList'
import { ManageStudentModal } from './ManageStudentModal'
import { TeachersList } from './TeachersList'
import { DeleteTeacherModal } from './DeleteTeacherModal'
import { STATUS_ORDER } from './statusLabels'
import {
  getTeachers,
  approveTeacher,
  rejectTeacher,
  disableTeacher,
  reenableTeacher,
  getApprovedTeachers,
  getAllStudentsAdmin,
  approveStudent,
  rejectStudent,
  getPendingNameChangeRequests,
  approveNameChangeRequest,
  rejectNameChangeRequest,
  type TeacherRow,
  type StudentAdminRow,
  type NameChangeRequestRow
} from './actions'

export default function AdminUsersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [students, setStudents] = useState<StudentAdminRow[]>([])
  const [approvedTeachers, setApprovedTeachers] = useState<TeacherRow[]>([])
  const [nameChangeRequests, setNameChangeRequests] = useState<NameChangeRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<TeacherRow | null>(null)
  const [manageTarget, setManageTarget] = useState<StudentAdminRow | null>(null)

  async function reload() {
    setLoading(true)
    try {
      const [t, s, at, ncr] = await Promise.all([
        getTeachers(),
        getAllStudentsAdmin(),
        getApprovedTeachers(),
        getPendingNameChangeRequests()
      ])
      setTeachers(t)
      setStudents(s)
      setApprovedTeachers(at)
      setNameChangeRequests(ncr)
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
  const pendingStudents = students.filter((s) => s.student_status === 'pending')

  return (
    <>
      <AppNav items={ADMIN_NAV_ITEMS} />
      <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">
        <h1 className="mb-2 text-xl font-semibold text-ink-primary">Gestione utenti</h1>

        <Card className="mb-6">
          <SimplifiedModeToggle onError={setError} />
        </Card>
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

        {!loading && (
          <NameChangeRequestsCard
            requests={nameChangeRequests}
            pending={pending}
            onApprove={(id) => run(() => approveNameChangeRequest(id))}
            onReject={(id) => run(() => rejectNameChangeRequest(id))}
          />
        )}

        {!loading && (
          <PendingStudentsCard
            students={pendingStudents}
            pending={pending}
            onApprove={(id) => run(() => approveStudent(id))}
            onReject={(id) => run(() => rejectStudent(id))}
          />
        )}

        {!loading && <StudentsList students={students} onSelect={setManageTarget} />}

        <TeachersList
          teachers={teachersOrdinati}
          loading={loading}
          pending={pending}
          onApprove={(id) => run(() => approveTeacher(id))}
          onReject={(id) => run(() => rejectTeacher(id))}
          onDisable={(id) => run(() => disableTeacher(id))}
          onReenable={(id) => run(() => reenableTeacher(id))}
          onDeleteRequest={setDeleteTarget}
          onSubscriptionSaved={reload}
          onError={setError}
        />

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
