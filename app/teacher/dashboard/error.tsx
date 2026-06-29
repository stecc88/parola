'use client'

import { ErrorBoundaryContent } from '@/components/shared/ErrorBoundaryContent'

export default function TeacherDashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorBoundaryContent error={error} reset={reset} contesto="dashboard docente" tornaHref="/teacher/classes" />
  )
}
