import Link from 'next/link'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedTeacher } from '@/lib/teacher/guard'
import { MoveStudentSelect } from './MoveStudentSelect'

const NAV_ITEMS = [{ href: '/teacher/classes', label: 'Le mie classi' }]

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
  await requireApprovedTeacher()
  const supabase = createClient()

  const { data: classe } = await supabase
    .from('classes')
    .select('id, nome, invite_code')
    .eq('id', params.id)
    .single()

  const { data: altreClassi } = await supabase
    .from('classes')
    .select('id, nome')
    .neq('id', params.id)

  const { data: memberships } = await supabase
    .from('class_memberships')
    .select('id, student_id, profiles(nome, cognome)')
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

        <h1 className="mt-2 mb-1 text-xl font-semibold text-ink-primary">{classe.nome}</h1>
        <p className="mb-6 text-sm text-ink-secondary">
          Codice invito:{' '}
          <span className="rounded bg-surface-tertiary px-2 py-0.5 font-mono">
            {classe.invite_code}
          </span>
        </p>

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
