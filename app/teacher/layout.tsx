'use client'

import { usePathname } from 'next/navigation'
import { AppNav } from '@/components/shared/AppNav'
import { TEACHER_NAV_ITEMS } from '@/components/shared/teacherNav'

// Schermate di attesa/blocco (docente non ancora approvato, abbonamento
// scaduto): non mostrano la navigazione normale di proposito.
const NO_NAV_PATHS = ['/teacher/expired', '/teacher/pending']

/**
 * Stesso motivo di app/student/layout.tsx: prima ogni pagina docente
 * montava un proprio <AppNav>, quindi passare da una voce di menu
 * all'altra smontava e rimontava da zero la nav (comprese le campanelle
 * di notifica, ognuna con il proprio fetch al mount). Qui la nav resta
 * montata tra le pagine sotto /teacher.
 */
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNav = !NO_NAV_PATHS.includes(pathname)

  return (
    <>
      {showNav && <AppNav items={TEACHER_NAV_ITEMS} />}
      {children}
    </>
  )
}
