'use client'

import { ErrorBoundaryContent } from '@/components/shared/ErrorBoundaryContent'

export default function ExercisesError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorBoundaryContent
      error={error}
      reset={reset}
      contesto="pagina esercizi"
      tornaHref="/student/progress"
      tornaLabel="Vai ai progressi"
    />
  )
}
