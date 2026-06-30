/**
 * Tipos que reflejan supabase/migrations/0001_schema_base.sql.
 * Mantener sincronizado manualmente, o generar con:
 *   npx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts
 */

export type UserRole = 'student' | 'teacher' | 'admin'
export type TeacherStatus = 'pending' | 'approved' | 'rejected' | 'disabled'
export type LivelloCefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type SubmissionType =
  | 'scrittura_libera'
  | 'scrittura_personalizzata'
  | 'esercizio_struttura_1'
  | 'esercizio_struttura_2'
  | 'esercizio_struttura_3'
  | 'esercizio_struttura_4'

export interface Profile {
  id: string
  role: UserRole
  nome: string
  cognome: string
  teacher_status: TeacherStatus | null
  livello_target: LivelloCefr | null
  invite_code: string | null
  created_at: string
  updated_at: string
}

export interface ClassRow {
  id: string
  teacher_id: string
  nome: string
  invite_code: string
  created_at: string
  updated_at: string
}

export interface ClassMembership {
  id: string
  student_id: string
  teacher_id: string
  class_id: string | null
  joined_at: string
  left_at: string | null
}

export interface Exercise {
  id: string
  tipo: SubmissionType
  titolo: string
  contenuto: Record<string, unknown>
  class_id: string | null
  created_by: string
  created_at: string
}

export interface Submission {
  id: string
  student_id: string
  exercise_id: string | null
  tipo: SubmissionType
  testo_studente: string
  valutazione_ia: Record<string, unknown> | null
  valutazione_completed_at: string | null
  class_id_at_submission: string | null
  teacher_id_at_submission: string | null
  created_at: string
}
