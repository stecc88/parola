'use client'

import { ErrorBoundaryContent } from '@/components/shared/ErrorBoundaryContent'

export default function ProgressError({
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
      contesto="pagina progressi"
      tornaHref="/student/write"
      tornaLabel="Vai alla scrittura"
    />
  )
}
