import { AppNav } from '@/components/shared/AppNav'
import { STUDENT_NAV_ITEMS } from '@/components/shared/studentNav'

/**
 * Layout condiviso SOLO dalle pagine studente "normali" (progress, write,
 * exercises, guides, personalized) — grazie al route group "(app)" (che
 * non compare nell'URL: /student/progress resta /student/progress), le
 * schermate di attesa/blocco (join-class, expired, pending) restano FUORI
 * da questo gruppo e non ereditano la nav, senza bisogno di nessuna logica
 * condizionale qui dentro.
 *
 * Prima questo layout era un Client Component che usava usePathname() per
 * decidere se nascondere la nav su quelle 3 pagine — pattern che causava
 * hydration mismatch (errori React #418/#422) quando combinato con i
 * Suspense boundary creati da loading.tsx, con l'effetto collaterale che
 * lo stato locale dei componenti figli (es. il conteggio della campanella
 * di notifica) veniva resettato dopo un click. Essendo un Server Component
 * puro, senza logica condizionale sul pathname, questo problema strutturale
 * sparisce del tutto.
 */
export default function StudentAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav items={STUDENT_NAV_ITEMS} />
      {children}
    </>
  )
}
