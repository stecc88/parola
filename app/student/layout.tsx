'use client'

import { usePathname } from 'next/navigation'
import { AppNav } from '@/components/shared/AppNav'
import { STUDENT_NAV_ITEMS } from '@/components/shared/studentNav'

// Schermate "di attesa/blocco" (studente non ancora approvato, abbonamento
// scaduto, deve ancora unirsi a un insegnante): non mostrano la navigazione
// normale di proposito, l'utente non deve poter navigare altrove finché non
// esce da quello stato.
const NO_NAV_PATHS = ['/student/join-class', '/student/expired', '/student/pending']

/**
 * Prima ogni pagina studente montava un proprio <AppNav>, quindi passare da
 * una voce di menu all'altra smontava e rimontava da zero la nav — comprese
 * le 3 campanelle di notifica (NotificationBell/TeacherNotificationBell/
 * AdminNotificationBell), ognuna con il proprio fetch al mount. Risultato:
 * fino a 3 round-trip di rete ripetuti ad ogni click sul menu, invece che
 * una volta sola. Con la nav qui nel layout, l'App Router la mantiene
 * montata tra le pagine sotto /student e rimonta solo il contenuto che
 * cambia.
 */
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNav = !NO_NAV_PATHS.includes(pathname)

  return (
    <>
      {showNav && <AppNav items={STUDENT_NAV_ITEMS} />}
      {children}
    </>
  )
}
