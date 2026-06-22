import Link from 'next/link'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedTeacher } from '@/lib/teacher/guard'
import { CreateClassForm } from './CreateClassForm'
import { AssignStudentSelect } from './AssignStudentSelect'
import { ClassActions } from './ClassActions'
import {
  getTeacherInviteCode,
  getUnassignedStudents,
  getUnseenDeliveries,
  getStudentsOverview
} from './actions'

const NAV_ITEMS = [
  { href: '/teacher/classes', label: 'Le mie classi' },
  { href: '/account', label: 'Account' }
]

export default async function TeacherClassesPage() {
  await requireApprovedTeacher()
  const supabase = createClient()

  const [{ data: classi }, inviteCode, unassigned, notifiche, panoramica] = await Promise.all([
    supabase
      .from('classes')
      .select('id, nome, created_at')
      .order('created_at', { ascending: false }),
    getTeacherInviteCode(),
    getUnassignedStudents(),
    getUnseenDeliveries(),
    getStudentsOverview()
  ])

  const studentiAttenzione = panoramica.filter((s) => s.richiedeAttenzione)

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">
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

        {notifiche.length > 0 && (
          <Card className="mb-6 border-warning-text/30 bg-warning-bg">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-warning-text">
              🔔 Nuove consegne ({notifiche.length})
            </h2>
            <div className="space-y-2">
              {notifiche.map((n) => (
                <Link key={n.id} href={`/teacher/students/${n.student_id}`}>
                  <div className="flex items-center justify-between rounded-md bg-surface p-3 hover:bg-surface-tertiary">
                    <div>
                      <p className="text-sm font-medium text-ink-primary">
                        {n.nome} {n.cognome}
                      </p>
                      <p className="text-xs text-ink-tertiary">{n.titolo}</p>
                    </div>
                    <span className="text-xs text-ink-tertiary">
                      {new Date(n.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {studentiAttenzione.length > 0 && (
          <Card className="mb-6 border-danger-text/30 bg-danger-bg">
            <h2 className="mb-3 text-sm font-semibold text-danger-text">
              ⚠ Studenti che richiedono attenzione ({studentiAttenzione.length})
            </h2>
            <div className="space-y-2">
              {studentiAttenzione.map((s) => (
                <Link key={s.studentId} href={`/teacher/students/${s.studentId}`}>
                  <div className="rounded-md bg-surface p-3 hover:bg-surface-tertiary">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink-primary">
                        {s.nome} {s.cognome}
                      </p>
                      {s.mediaGenerale !== null && (
                        <span className="text-xs text-ink-tertiary">
                          Media: {s.mediaGenerale}%
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-danger-text">
                      {s.motiviAttenzione.join(' · ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {panoramica.length > 0 && (
          <Card className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-ink-primary">
              Tutti gli studenti ({panoramica.length})
            </h2>
            <div className="space-y-1">
              {panoramica.map((s) => (
                <Link key={s.studentId} href={`/teacher/students/${s.studentId}`}>
                  <div className="flex items-center justify-between gap-3 rounded-md p-2 text-sm hover:bg-surface-secondary">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-primary">
                        {s.nome} {s.cognome}
                        {s.richiedeAttenzione && <span className="ml-1">⚠</span>}
                      </p>
                      <p className="truncate text-xs text-ink-tertiary">
                        {s.classeNome ?? 'Nessuna classe'}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right text-xs text-ink-tertiary sm:block">
                      <p>
                        Ultimo accesso:{' '}
                        {s.ultimoAccesso
                          ? new Date(s.ultimoAccesso).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit'
                            })
                          : 'mai'}
                      </p>
                      <p>{s.totaleAttivita} attività</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        s.mediaGenerale === null
                          ? 'bg-surface-tertiary text-ink-tertiary'
                          : s.mediaGenerale < 60
                            ? 'bg-danger-bg text-danger-text'
                            : 'bg-success-bg text-success-text'
                      }`}
                    >
                      {s.mediaGenerale !== null ? `${s.mediaGenerale}%` : '—'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

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
                  <Link
                    href={`/teacher/students/${s.student_id}`}
                    className="text-sm text-ink-primary underline-offset-2 hover:underline"
                  >
                    {s.nome} {s.cognome}
                  </Link>
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
                <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-surface-tertiary">
                  <h2 className="font-semibold text-ink-primary">{c.nome}</h2>
                  <div className="mt-2">
                    <ClassActions classId={c.id} nomeAttuale={c.nome} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
