import Link from 'next/link'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedTeacher } from '@/lib/teacher/guard'
import { CreateClassForm } from './CreateClassForm'
import { AssignStudentSelect } from './AssignStudentSelect'
import { getTeacherInviteCode, getUnassignedStudents } from './actions'

const NAV_ITEMS = [{ href: '/teacher/classes', label: 'Le mie classi' }]

export default async function TeacherClassesPage() {
  await requireApprovedTeacher()
  const supabase = createClient()

  const [{ data: classi }, inviteCode, unassigned] = await Promise.all([
    supabase
      .from('classes')
      .select('id, nome, created_at')
      .order('created_at', { ascending: false }),
    getTeacherInviteCode(),
    getUnassignedStudents()
  ])

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6">
        <Card className="mb-6 bg-guided-bg">
          <p className="text-sm text-guided-text">Il tuo codice insegnante</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-guided-text">
            {inviteCode ?? '—'}
          </p>
          <p className="mt-2 text-xs text-guided-text">
            Condividi questo codice con i tuoi studenti — lo inseriranno al
            momento della registrazione per unirsi a te. Dopo, potrai
            assegnarli a una classe specifica qui sotto.
          </p>
        </Card>

        {unassigned.length > 0 && (
          <Card className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-ink-primary">
              Studenti da assegnare a una classe ({unassigned.length})
            </h2>
            <div className="space-y-2">
              {unassigned.map((s) => (
                <div
                  key={s.membership_id}
                  className="flex items-center justify-between rounded-md bg-surface-secondary p-3"
                >
                  <span className="text-sm text-ink-primary">
                    {s.nome} {s.cognome}
                  </span>
                  <AssignStudentSelect
                    membershipId={s.membership_id}
                    classi={classi ?? []}
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink-primary">Le mie classi</h1>
          <CreateClassForm />
        </div>

        {!classi || classi.length === 0 ? (
          <Card className="border-dashed text-center text-sm text-ink-tertiary">
            Non hai ancora creato nessuna classe.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {classi.map((c) => (
              <Link href={`/teacher/classes/${c.id}`} key={c.id}>
                <Card className="h-full transition-colors hover:bg-surface-tertiary">
                  <h2 className="font-semibold text-ink-primary">{c.nome}</h2>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
