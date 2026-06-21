import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { CreateClassForm } from './CreateClassForm'

const NAV_ITEMS = [{ href: '/teacher/classes', label: 'Le mie classi' }]

export default async function TeacherClassesPage() {
  const supabase = createClient()
  const { data: classi } = await supabase
    .from('classes')
    .select('id, nome, invite_code, created_at')
    .order('created_at', { ascending: false })

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
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
              <Card key={c.id}>
                <h2 className="font-semibold text-ink-primary">{c.nome}</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  Codice invito:{' '}
                  <span className="rounded bg-surface-tertiary px-2 py-0.5 font-mono">
                    {c.invite_code}
                  </span>
                </p>
              </Card>
            ))}
          </div>
        )}
        {/* TODO: gestione studenti per classe, spostamento tra classi proprie */}
      </main>
    </>
  )
}
