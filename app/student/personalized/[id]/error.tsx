'use client'

import { ErrorBoundaryContent } from '@/components/shared/ErrorBoundaryContent'

export default function PersonalizedExerciseError({
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
      contesto="pagina esercizio personalizzato"
      tornaHref="/student/personalized"
      tornaLabel="Torna agli esercizi"
    />
  )
}
