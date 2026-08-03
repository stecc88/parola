'use client'

import { useState } from 'react'
import { approveStudent, rejectStudent } from './actions'
import { Button } from '@/components/ui/Button'

export function PendingStudentActions({ studentId }: { studentId: string }) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handle(action: 'approve' | 'reject') {
    setLoading(action)
    setError(null)
    try {
      if (action === 'approve') {
        await approveStudent(studentId)
        setDone('approved')
      } else {
        await rejectStudent(studentId)
        setDone('rejected')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore inatteso.')
    }
    setLoading(null)
  }

  if (done === 'approved') {
    return <span className="text-xs font-medium text-success-text">✓ Approvato</span>
  }
  if (done === 'rejected') {
    return <span className="text-xs font-medium text-danger-text">✗ Rifiutato</span>
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-danger-text">{error}</span>}
      <Button
        variant="secondary"
        disabled={loading !== null}
        onClick={() => handle('approve')}
        className="text-xs"
      >
        {loading === 'approve' ? '...' : 'Approva'}
      </Button>
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => handle('reject')}
        className="text-xs text-danger-text hover:underline disabled:opacity-50"
      >
        Rifiuta
      </button>
    </div>
  )
}
