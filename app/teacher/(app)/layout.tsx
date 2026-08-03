import { AppNav } from '@/components/shared/AppNav'
import { TEACHER_NAV_ITEMS } from '@/components/shared/teacherNav'

/**
 * Stesso motivo di app/student/(app)/layout.tsx: route group "(app)" per
 * condividere la nav solo tra le pagine docente "normali" (dashboard,
 * classes, students), lasciando fuori le schermate di attesa/blocco
 * (expired, pending) senza bisogno di usePathname() — vedi il commento
 * esteso nel layout studente per il perché (evita hydration mismatch).
 */
export default function TeacherAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav items={TEACHER_NAV_ITEMS} />
      {children}
    </>
  )
}
