import Link from 'next/link'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedTeacher } from '@/lib/teacher/guard'
import { CreateClassForm } from './CreateClassForm'
import { AssignStudentSelect } from './AssignStudentSelect'
import { ClassActions } from './ClassActions'
import { InviteCodeActions } from './InviteCodeActions'
import { StudentiList } from './StudentiList'
import {
  getTeacherInviteCode,
  getUnassignedStudents,
  getPendingStudents,
  getUnseenDeliveries,
  getStudentsOverview,
  getUnseenLevelAchievements,
  markAllTeacherNotificationsSeen
} from './actions'
import { PendingStudentActions } from './PendingStudentActions'

const NAV_ITEMS = [
  { href: '/teacher/dashboard', label: 'Dashboard' },
  { href: '/teacher/classes', label: 'Le mie classi' },
  { href: '/account', label: 'Account' }
]

export default async function TeacherClassesPage() {
  await requireApprovedTeacher()
  const supabase = createClient()

  const [[{ data: classi }, inviteCode, unassigned, pending, notifiche, panoramica, traguardi]] = await Promise.all([
    Promise.all([
      supabase
        .from('classes')
        .select('id, nome, created_at')
        .order('created_at', { ascending: false }),
      getTeacherInviteCode(),
      getUnassignedStudents(),
      getPendingStudents(),
      getUnseenDeliveries(),
      getStudentsOverview(),
      getUnseenLevelAchievements()
    ]),
    markAllTeacherNotificationsSeen().catch(() => {})
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
          {inviteCode && <InviteCodeActions code={inviteCode} />}
        </Card>

        {pending.length > 0 && (
          <Card className="mb-6 border-info-text/30 bg-info-bg">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-info-text">
              🕐 Studenti in attesa di approvazione ({pending.length})
            </h2>
            <div className="space-y-2">
              {pending.map((s) => (
                <div
                  key={s.student_id}
                  className="flex items-center justify-between rounded-md bg-surface p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-primary">
                      {s.nome} {s.cognome}
                    </p>
                    {s.livello_target && (
                      <p className="text-xs text-ink-tertiary">Livello target: {s.livello_target}</p>
                    )}
                  </div>
                  <PendingStudentActions studentId={s.student_id} />
                </div>
              ))}
            </div>
          </Card>
        )}

        {traguardi.length > 0 && (
          <Card className="mb-6 border-success-text/30 bg-success-bg">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-success-text">
              🏆 Traguardi raggiunti ({traguardi.length})
            </h2>
            <div className="space-y-2">
              {traguardi.map((t) => (
                <Link key={t.id} href={`/teacher/students/${t.student_id}`}>
                  <div className="flex items-center justify-between rounded-md bg-surface p-3 hover:bg-surface-tertiary">
                    <div>
                      <p className="text-sm font-medium text-ink-primary">
                        {t.nome} {t.cognome}
                      </p>
                      <p className="text-xs text-success-text font-medium">
                        Ha raggiunto il livello {t.livello} 🎉
                      </p>
                    </div>
                    <span className="text-xs text-ink-tertiary">
                      {new Date(t.created_at).toLocaleDateString('it-IT', {
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
            <h2 className="mb-4 text-sm font-semibold text-ink-primary">
              Tutti gli studenti
            </h2>
            <StudentiList panoramica={panoramica} />
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
