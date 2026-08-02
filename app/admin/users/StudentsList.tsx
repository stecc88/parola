'use client'

import { Card } from '@/components/ui/Card'
import { corsoLabel } from '@/lib/student/corso'
import { formatDate } from './format'
import { STUDENT_STATUS_LABEL, STUDENT_STATUS_CLASS } from './statusLabels'
import type { StudentAdminRow } from './actions'

export function StudentsList({
  students,
  onSelect
}: {
  students: StudentAdminRow[]
  onSelect: (student: StudentAdminRow) => void
}) {
  if (students.length === 0) return null

  return (
    <Card className="mb-6">
      <h2 className="mb-3 text-sm font-semibold text-ink-primary">
        Tutti gli studenti ({students.length})
      </h2>
      <div className="space-y-1">
        {students.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="flex w-full items-center justify-between gap-3 rounded-md p-2 text-left text-sm hover:bg-surface-secondary"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink-primary">
                {s.nome} {s.cognome}
              </p>
              <p className="truncate text-xs text-ink-tertiary">{s.email}</p>
              {s.corso && (
                <p className="truncate text-xs text-ink-tertiary">Corso: {corsoLabel(s.corso)}</p>
              )}
              <p
                className={`truncate text-xs ${
                  s.teacherNome ? 'text-ink-tertiary' : 'font-medium text-warning-text'
                }`}
              >
                {s.teacherNome
                  ? `Insegnante: ${s.teacherNome} ${s.teacherCognome}`
                  : '⚠ Indipendente (nessun insegnante)'}
              </p>
              <p className="truncate text-xs text-ink-tertiary">
                Abilitato: {formatDate(s.approved_at)}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STUDENT_STATUS_CLASS[s.student_status]}`}>
              {STUDENT_STATUS_LABEL[s.student_status]}
            </span>
          </button>
        ))}
      </div>
    </Card>
  )
}
