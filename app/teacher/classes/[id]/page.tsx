import Link from 'next/link'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedTeacher } from '@/lib/teacher/guard'
import { MoveStudentSelect } from './MoveStudentSelect'
import { ClassActions } from '../ClassActions'

const NAV_ITEMS = [{ href: '/teacher/classes', label: 'Le mie classi' }]

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
  await requireApprovedTeacher()
  const supabase = createClient()

  const { data: classe } = await supabase
    .from('classes')
    .select('id, nome')
    .eq('id', params.id)
    .single()

  const { data: altreClassi } = await supabase
    .from('classes')
    .select('id, nome')
    .neq('id', params.id)

  const { data: memberships } = await supabase
    .from('class_memberships')
    .select('id, student_id, profiles!student_id(nome, cognome)')
    .eq('class_id', params.id)
    .is('left_at', null)

  if (!classe) {
    return (
      <>
        <AppNav items={NAV_ITEMS} />
        <main className="p-6">
          <p className="text-sm text-danger-text">Classe non trovata.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6">
        <Link href="/teacher/classes" className="text-sm text-brand-400 underline">
          ← Tutte le classi
        </Link>

        <div className="mt-2 mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink-primary">{classe.nome}</h1>
          <ClassActions classId={classe.id} nomeAttuale={classe.nome} redirectAfterDelete />
        </div>

        <h2 className="mb-3 text-sm font-semibold text-ink-primary">Studenti</h2>

        {!memberships || memberships.length === 0 ? (
          <Card className="border-dashed text-center text-sm text-ink-tertiary">
            Nessuno studente in questa classe.
          </Card>
        ) : (
          <div className="space-y-2">
            {memberships.map((m) => {
              // El join de Supabase puede devolver objeto o array según el
              // tipo de relación detectado; normalizamos a un solo objeto.
              const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
              return (
                <Card key={m.id} className="flex items-center justify-between">
                  <span className="text-sm text-ink-primary">
                    {profile?.nome} {profile?.cognome}
                  </span>
                  <MoveStudentSelect
                    membershipId={m.id}
                    classi={altreClassi ?? []}
                  />
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
