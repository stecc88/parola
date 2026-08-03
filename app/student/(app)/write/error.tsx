'use client'

import { ErrorBoundaryContent } from '@/components/shared/ErrorBoundaryContent'

export default function WriteError({
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
      contesto="pagina scrittura libera"
      tornaHref="/student/progress"
      tornaLabel="Vai ai progressi"
    />
  )
}
