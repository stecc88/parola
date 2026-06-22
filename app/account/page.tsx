import { redirect } from 'next/navigation'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { getMyProfile } from './actions'
import { AccountForm } from './AccountForm'

const NAV_ITEMS_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  student: [
    { href: '/student/write', label: 'Scrittura libera' },
    { href: '/student/exercises', label: 'Esercizi' },
    { href: '/student/guides', label: 'Guide' },
    { href: '/student/personalized', label: 'Per te' },
    { href: '/student/progress', label: 'I miei progressi' },
    { href: '/account', label: 'Account' }
  ],
  teacher: [
    { href: '/teacher/classes', label: 'Le mie classi' },
    { href: '/account', label: 'Account' }
  ],
  admin: [
    { href: '/admin/users', label: 'Utenti' },
    { href: '/account', label: 'Account' }
  ]
}

export default async function AccountPage() {
  const profile = await getMyProfile()

  if (!profile) {
    redirect('/login')
  }

  const navItems = NAV_ITEMS_BY_ROLE[profile.role] ?? [{ href: '/account', label: 'Account' }]

  return (
    <>
      <AppNav items={navItems} />
      <main id="main-content" className="mx-auto max-w-2xl p-6 animate-fade-in">
        <h1 className="mb-6 text-xl font-semibold text-ink-primary">Il tuo account</h1>

        <Card className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-ink-primary">Ruolo</h2>
          <p className="text-sm text-ink-secondary">
            {profile.role === 'student' && 'Studente'}
            {profile.role === 'teacher' && 'Insegnante'}
            {profile.role === 'admin' && 'Amministratore'}
            {profile.livello_target && ` · Livello target: ${profile.livello_target}`}
          </p>
        </Card>

        <AccountForm nomeIniziale={profile.nome} cognomeIniziale={profile.cognome} />
      </main>
    </>
  )
}
