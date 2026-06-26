'use client'

import { ErrorBoundaryContent } from '@/components/shared/ErrorBoundaryContent'

export default function TeacherClassesError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorBoundaryContent error={error} reset={reset} contesto="pagina classi" tornaHref="/" />
  )
}
