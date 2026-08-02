import type { TeacherRow, StudentAdminRow } from './actions'

export const STATUS_LABEL: Record<TeacherRow['teacher_status'], string> = {
  pending: 'In attesa',
  approved: 'Approvato',
  rejected: 'Rifiutato',
  disabled: 'Disabilitato'
}

export const STATUS_CLASS: Record<TeacherRow['teacher_status'], string> = {
  pending: 'bg-warning-bg text-warning-text',
  approved: 'bg-success-bg text-success-text',
  rejected: 'bg-danger-bg text-danger-text',
  disabled: 'bg-surface-tertiary text-ink-tertiary'
}

export const STUDENT_STATUS_LABEL: Record<StudentAdminRow['student_status'], string> = {
  pending: 'In attesa',
  approved: 'Attivo',
  rejected: 'Rifiutato',
  disabled: 'Disabilitato'
}

export const STUDENT_STATUS_CLASS: Record<StudentAdminRow['student_status'], string> = {
  pending: 'bg-warning-bg text-warning-text',
  approved: 'bg-success-bg text-success-text',
  rejected: 'bg-danger-bg text-danger-text',
  disabled: 'bg-surface-tertiary text-ink-tertiary'
}

// I docenti "in attesa" sono l'azione piu urgente — vanno mostrati primi,
// indipendentemente dalla data di registrazione.
export const STATUS_ORDER: Record<TeacherRow['teacher_status'], number> = {
  pending: 0,
  approved: 1,
  disabled: 2,
  rejected: 3
}
