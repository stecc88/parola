'use client'

import { useEffect, useState, useTransition } from 'react'
import { AppNav } from '@/components/shared/AppNav'
import { ADMIN_NAV_ITEMS } from '@/components/shared/adminNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { CORSI, corsoLabel } from '@/lib/student/corso'
import {
  getAllStudentsAdmin,
  getApprovedTeachers,
  deleteStudentCompletely,
  type StudentAdminRow,
  type TeacherRow
} from '../users/actions'
import { updateStudentDetails, createStudentAdmin } from './actions'

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentAdminRow[]>([])
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<StudentAdminRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudentAdminRow | null>(null)
  const [creating, setCreating] = useState(false)

  async function reload() {
    setLoading(true)
    try {
      const [s, t] = await Promise.all([getAllStudentsAdmin(), getApprovedTeachers()])
      setStudents(s)
      setTeachers(t)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricando gli studenti.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  return (
    <>
      <AppNav items={ADMIN_NAV_ITEMS} />
      <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-ink-primary">Gestione Studenti</h1>
          <Button onClick={() => setCreating(true)}>Crea nuovo studente</Button>
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-ink-tertiary">Caricamento...</p>
        ) : students.length === 0 ? (
          <Card className="border-dashed text-center text-sm text-ink-tertiary">
            Nessuno studente registrato.
          </Card>
        ) : (
          <div className="space-y-2">
            {students.map((s) => (
              <Card key={s.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-primary">
                    {s.nome} {s.cognome}
                  </p>
                  <p className="truncate text-xs text-ink-tertiary">
                    Corso: {corsoLabel(s.corso)}
                    {s.teacherNome ? ` · Insegnante: ${s.teacherNome} ${s.teacherCognome}` : ' · Indipendente'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="secondary" onClick={() => setEditTarget(s)}>Modifica</Button>
                  <Button variant="danger" onClick={() => setDeleteTarget(s)}>Elimina</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {creating && (
          <CreateStudentModal
            teachers={teachers}
            onClose={() => setCreating(false)}
            onCreated={() => {
              setCreating(false)
              reload()
            }}
            onError={setError}
          />
        )}

        {editTarget && (
          <EditStudentModal
            student={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={() => {
              setEditTarget(null)
              reload()
            }}
            onError={setError}
          />
        )}

        {deleteTarget && (
          <DeleteStudentModal
            student={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={() => {
              setDeleteTarget(null)
              reload()
            }}
            onError={setError}
          />
        )}
      </main>
    </>
  )
}

function CreateStudentModal({
  teachers,
  onClose,
  onCreated,
  onError
}: {
  teachers: TeacherRow[]
  onClose: () => void
  onCreated: () => void
  onError: (msg: string) => void
}) {
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [corso, setCorso] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [accessCode, setAccessCode] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleCreate() {
    if (!nome.trim() || !cognome.trim() || !corso) {
      onError('Nome, cognome e corso sono obbligatori.')
      return
    }
    startTransition(async () => {
      try {
        const result = await createStudentAdmin(nome.trim(), cognome.trim(), corso, teacherId || null)
        setAccessCode(result.accessCode)
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Errore creando lo studente.')
      }
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-6">
      <Card className="w-full max-w-sm bg-surface">
        {accessCode ? (
          <>
            <h2 className="mb-2 text-lg font-semibold text-ink-primary">Studente creato</h2>
            <p className="mb-2 text-sm text-ink-secondary">Codice di accesso personale:</p>
            <div className="mb-4 rounded-lg bg-surface-secondary px-6 py-4 text-center">
              <p className="font-mono text-2xl font-bold tracking-widest text-brand-400">
                {accessCode}
              </p>
            </div>
            <CopyButton
              text={accessCode}
              className="mb-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-secondary hover:border-brand-400 hover:text-ink-primary transition-colors"
            />
            <div className="flex justify-end">
              <Button onClick={onCreated}>Chiudi</Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-semibold text-ink-primary">Crea nuovo studente</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-ink-secondary">Nome</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink-secondary">Cognome</label>
                <input
                  value={cognome}
                  onChange={(e) => setCognome(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink-secondary">Corso</label>
                <select
                  value={corso}
                  onChange={(e) => setCorso(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  <option value="" disabled>Seleziona il corso...</option>
                  {CORSI.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink-secondary">Insegnante (opzionale)</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  <option value="">Indipendente (nessun insegnante)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome} {t.cognome}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={pending}>Annulla</Button>
              <Button onClick={handleCreate} disabled={pending}>
                {pending ? 'Creazione...' : 'Crea studente'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

function EditStudentModal({
  student,
  onClose,
  onSaved,
  onError
}: {
  student: StudentAdminRow
  onClose: () => void
  onSaved: () => void
  onError: (msg: string) => void
}) {
  const [nome, setNome] = useState(student.nome)
  const [cognome, setCognome] = useState(student.cognome)
  const [corso, setCorso] = useState(student.corso ?? '')
  const [pending, startTransition] = useTransition()

  function handleSave() {
    if (!nome.trim() || !cognome.trim() || !corso) {
      onError('Nome, cognome e corso sono obbligatori.')
      return
    }
    startTransition(async () => {
      try {
        await updateStudentDetails(student.id, { nome: nome.trim(), cognome: cognome.trim(), corso })
        onSaved()
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Errore aggiornando lo studente.')
      }
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-6">
      <Card className="w-full max-w-sm bg-surface">
        <h2 className="mb-4 text-lg font-semibold text-ink-primary">Modifica studente</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-ink-secondary">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-secondary">Cognome</label>
            <input
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-secondary">Corso</label>
            <select
              value={corso}
              onChange={(e) => setCorso(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            >
              <option value="" disabled>Seleziona il corso...</option>
              {CORSI.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Annulla</Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function DeleteStudentModal({
  student,
  onClose,
  onDeleted,
  onError
}: {
  student: StudentAdminRow
  onClose: () => void
  onDeleted: () => void
  onError: (msg: string) => void
}) {
  const [confirmName, setConfirmName] = useState('')
  const [pending, startTransition] = useTransition()
  const fullName = `${student.nome} ${student.cognome}`.trim() || student.email

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteStudentCompletely(student.id, confirmName, fullName)
        onDeleted()
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Errore eliminando lo studente.')
      }
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-6">
      <Card className="w-full max-w-sm bg-surface">
        <h2 className="mb-2 text-lg font-semibold text-danger-text">Elimina {fullName}</h2>
        <p className="mb-3 text-sm text-ink-secondary">
          Questa azione è definitiva ed elimina anche tutti i dati dello studente. Digita{' '}
          <strong>{fullName}</strong> per confermare.
        </p>
        <input
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          className="mb-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-danger-text"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>Annulla</Button>
          <Button
            variant="danger"
            disabled={pending || confirmName.trim() !== fullName}
            onClick={handleDelete}
          >
            {pending ? 'Eliminando...' : 'Elimina definitivamente'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
