'use client'

import { ErrorBoundaryContent } from '@/components/shared/ErrorBoundaryContent'

export default function StudentDetailError({
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
      contesto="pagina dettaglio studente"
      tornaHref="/teacher/classes"
      tornaLabel="Torna alle classi"
    />
  )
}
