import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'

const NAV_ITEMS = [{ href: '/admin/users', label: 'Gestione insegnanti' }]

export default function AdminUsersPage() {
  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="mb-6 text-xl font-semibold text-ink-primary">Gestione insegnanti</h1>
        <Card className="border-dashed text-center text-sm text-ink-tertiary">
          Questa sezione richiede endpoint admin non ancora implementati
          (approvazione, disabilitazione, eliminazione, riassegnazione).
        </Card>
      </main>
    </>
  )
}
