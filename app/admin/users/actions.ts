'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, assertIsAdmin } from '@/lib/supabase/admin'
import { notifyTeacherAccountStatus } from '@/lib/email/teacherAccountStatus'

async function requireAdminUserId(): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('UNAUTHENTICATED')
  await assertIsAdmin(data.user.id)
  return data.user.id
}

export async function approveTeacher(teacherId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ teacher_status: 'approved' })
    .eq('id', teacherId)
    .eq('role', 'teacher')

  if (error) throw new Error('Errore approvando l\'insegnante.')
  await notifyTeacherAccountStatus({ teacherId, esito: 'approved' })
  revalidatePath('/admin/users')
}

export async function rejectTeacher(teacherId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ teacher_status: 'rejected' })
    .eq('id', teacherId)
    .eq('role', 'teacher')

  if (error) throw new Error('Errore rifiutando l\'insegnante.')
  await notifyTeacherAccountStatus({ teacherId, esito: 'rejected' })
  revalidatePath('/admin/users')
}

export async function disableTeacher(teacherId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ teacher_status: 'disabled' })
    .eq('id', teacherId)
    .eq('role', 'teacher')

  if (error) throw new Error('Errore disabilitando l\'insegnante.')
  revalidatePath('/admin/users')
}

export async function reenableTeacher(teacherId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ teacher_status: 'approved' })
    .eq('id', teacherId)
    .eq('role', 'teacher')

  if (error) throw new Error('Errore riattivando l\'insegnante.')
  revalidatePath('/admin/users')
}

/**
 * Devuelve cuántas classi y estudiantes activos tiene un profesor, para que
 * la UI pueda decidir si bloquear el botón de eliminar definitivamente.
 */
export async function getTeacherBlockers(teacherId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { data: classi } = await admin
    .from('classes')
    .select('id, nome')
    .eq('teacher_id', teacherId)

  return { classi: classi ?? [] }
}

/**
 * Reasigna TODAS las classi de un profesor a otro profesor de una sola vez.
 * No toca submissions/exercises (siguen ligadas a student_id, no a teacher_id).
 */
export async function reassignAllClasses(fromTeacherId: string, toTeacherId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('classes')
    .update({ teacher_id: toTeacherId })
    .eq('teacher_id', fromTeacherId)

  if (error) throw new Error('Errore riassegnando le classi.')
  revalidatePath('/admin/users')
}

/**
 * Elimina definitivamente a un profesor. Bloqueado si todavía tiene
 * classi asociadas (constraint ON DELETE RESTRICT en classes.teacher_id
 * actúa como segunda barrera a nivel DB).
 */
export async function deleteTeacher(teacherId: string, confirmName: string, expectedName: string) {
  await requireAdminUserId()

  if (confirmName.trim() !== expectedName.trim()) {
    throw new Error('Il nome non corrisponde. Eliminazione annullata.')
  }

  const admin = createAdminClient()

  const { data: classi } = await admin.from('classes').select('id').eq('teacher_id', teacherId)
  if (classi && classi.length > 0) {
    throw new Error(
      `Questo insegnante ha ancora ${classi.length} classe/i. Riassegnale prima di eliminare.`
    )
  }

  const { error } = await admin.from('profiles').delete().eq('id', teacherId).eq('role', 'teacher')
  if (error) throw new Error('Errore eliminando l\'insegnante.')
  revalidatePath('/admin/users')
}

export interface TeacherRow {
  id: string
  nome: string
  cognome: string
  teacher_status: 'pending' | 'approved' | 'rejected' | 'disabled'
  created_at: string
}

export async function getTeachers(): Promise<TeacherRow[]> {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('profiles')
    .select('id, nome, cognome, teacher_status, created_at')
    .eq('role', 'teacher')
    .order('created_at', { ascending: false })

  if (error) throw new Error('Errore caricando gli insegnanti.')
  return (data ?? []) as TeacherRow[]
}

export async function getApprovedTeachersExcept(excludeId: string): Promise<TeacherRow[]> {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('profiles')
    .select('id, nome, cognome, teacher_status, created_at')
    .eq('role', 'teacher')
    .eq('teacher_status', 'approved')
    .neq('id', excludeId)
    .order('nome', { ascending: true })

  if (error) throw new Error('Errore caricando gli insegnanti disponibili.')
  return (data ?? []) as TeacherRow[]
}

export interface StudentRow {
  id: string
  nome: string
  cognome: string
  student_status: 'pending' | 'approved' | 'rejected' | null
  created_at: string
}

/**
 * Studenti SENZA insegnante (si sono registrati senza codice) — quelli
 * con un insegnante sono già approvati automaticamente al momento
 * dell'iscrizione (vedi joinClassWithCode) e non compaiono qui.
 */
export async function getIndependentStudents(): Promise<StudentRow[]> {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('profiles')
    .select('id, nome, cognome, student_status, created_at')
    .eq('role', 'student')
    .not('student_status', 'is', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Errore caricando gli studenti.')
  return (data ?? []) as StudentRow[]
}

export async function approveStudent(studentId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ student_status: 'approved' })
    .eq('id', studentId)
    .eq('role', 'student')

  if (error) throw new Error('Errore approvando lo studente.')
  revalidatePath('/admin/users')
}

export async function rejectStudent(studentId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ student_status: 'rejected' })
    .eq('id', studentId)
    .eq('role', 'student')

  if (error) throw new Error('Errore rifiutando lo studente.')
  revalidatePath('/admin/users')
}
