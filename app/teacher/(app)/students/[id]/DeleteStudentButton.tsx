'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { deleteStudentAsTeacher } from './actions'

export function DeleteStudentButton({
  studentId,
  nomeCompleto
}: {
  studentId: string
  nomeCompleto: string
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteStudentAsTeacher(studentId, confirmName, nomeCompleto)
        router.push('/teacher/classes')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Errore inatteso.')
      }
    })
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-ink-tertiary hover:text-danger-text"
      >
        Elimina account e tutti i dati
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-danger-text">
        Questa azione elimina <strong>definitivamente</strong> l&apos;account di {nomeCompleto} e
        tutti i suoi dati (scritti, esercizi, storico). Digita <strong>{nomeCompleto}</strong> per
        confermare.
      </p>
      <input
        value={confirmName}
        onChange={(e) => setConfirmName(e.target.value)}
        className="w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-danger-text"
      />
      <div className="flex gap-2">
        <Button
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setConfirming(false)
            setConfirmName('')
          }}
        >
          Annulla
        </Button>
        <Button
          variant="danger"
          disabled={pending || confirmName.trim() !== nomeCompleto}
          onClick={handleDelete}
        >
          {pending ? 'Eliminando...' : 'Elimina definitivamente'}
        </Button>
      </div>
      {error && <span className="text-xs text-danger-text">{error}</span>}
    </div>
  )
}
