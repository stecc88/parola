'use client'

import { ErrorBoundaryContent } from '@/components/shared/ErrorBoundaryContent'

export default function AdminUsersError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorBoundaryContent error={error} reset={reset} contesto="pagina gestione utenti" tornaHref="/admin/users" />
  )
}
