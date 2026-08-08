'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { updateStudentClass, type TeacherClassOption } from './actions'

const NESSUNA_CLASSE = '__nessuna__'

export function ClassAssignmentControl({
  studentId,
  currentClassId,
  currentClassNome,
  classi
}: {
  studentId: string
  currentClassId: string | null
  currentClassNome: string | null
  classi: TeacherClassOption[]
}) {
  const [value, setValue] = useState(currentClassId ?? NESSUNA_CLASSE)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const isDirty = value !== (currentClassId ?? NESSUNA_CLASSE)

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        await updateStudentClass(studentId, value === NESSUNA_CLASSE ? null : value)
        setSaved(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Errore inatteso.')
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-ink-tertiary">
        Classe: <span className="text-ink-primary">{currentClassNome ?? 'Nessuna'}</span>
      </span>
      <select
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setSaved(false)
        }}
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-brand-400"
      >
        <option value={NESSUNA_CLASSE}>Nessuna classe</option>
        {classi.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      <Button
        variant="secondary"
        disabled={!isDirty || pending}
        onClick={handleSave}
        className="px-2 py-1 text-xs"
      >
        {pending ? '...' : 'Salva'}
      </Button>
      {saved && <span className="text-xs text-success-text">✓ Salvato</span>}
      {error && <span className="text-xs text-danger-text">{error}</span>}
    </div>
  )
}
