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

/**
 * Mappa id -> email per TUTTI gli utenti, leggendo da auth.users via
 * service role (non accessibile via RLS normale, e profiles non
 * memorizza l'email). Una sola chiamata paginata invece di N+1 — accettabile
 * per il volume tipico di questa piattaforma; da rivedere se diventasse
 * un collo di bottiglia con migliaia di utenti.
 */
async function getEmailMap(): Promise<Map<string, string>> {
  const admin = createAdminClient()
  const map = new Map<string, string>()
  let page = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data) break
    for (const u of data.users) {
      if (u.email) map.set(u.id, u.email)
    }
    if (data.users.length < 200) break
    page += 1
  }
  return map
}

export async function approveTeacher(teacherId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ teacher_status: 'approved', approved_at: new Date().toISOString() })
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

  // El vínculo que realmente bloquea el delete (restrict FK) es
  // class_memberships.teacher_id — un alumno sin clase asignada (class_id
  // null) también bloquea, aunque no aparezca en "classes".
  const { count: studentiCount } = await admin
    .from('class_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacherId)
    .is('left_at', null)

  return { classi: classi ?? [], studentiCount: studentiCount ?? 0 }
}

/**
 * Reasigna TODAS las classi de un profesor a otro profesor de una sola vez.
 * No toca submissions/exercises (siguen ligadas a student_id, no a teacher_id).
 */
/**
 * Riassegna TUTTO ciò che lega uno studente a questo insegnante: sia le
 * classi (tabella classes) sia i collegamenti diretti studente-insegnante
 * (class_memberships.teacher_id) — quest'ultima è la colonna che il
 * vincolo "on delete restrict" controlla davvero quando si elimina un
 * insegnante. Aggiornare solo "classes" (come faceva prima questa
 * funzione) lasciava class_memberships ancora puntato al vecchio
 * insegnante, bloccando silenziosamente l'eliminazione più avanti.
 */
export async function reassignAllClasses(fromTeacherId: string, toTeacherId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error: classesError } = await admin
    .from('classes')
    .update({ teacher_id: toTeacherId })
    .eq('teacher_id', fromTeacherId)

  if (classesError) throw new Error('Errore riassegnando le classi.')

  const { error: membershipsError } = await admin
    .from('class_memberships')
    .update({ teacher_id: toTeacherId })
    .eq('teacher_id', fromTeacherId)

  if (membershipsError) throw new Error('Errore riassegnando gli studenti.')

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

  // BUG corretto qui: senza questa chiamata, si eliminava solo la riga
  // in profiles ma l'account di autenticazione vero e proprio (in
  // auth.users) restava intatto — l'insegnante poteva continuare a
  // accedere normalmente nonostante "sparisse" dalla lista admin.
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(teacherId)
  if (deleteUserError) throw new Error('Errore eliminando l\'account di autenticazione.')

  revalidatePath('/admin/users')
}

export interface TeacherRow {
  id: string
  nome: string
  cognome: string
  email: string
  teacher_status: 'pending' | 'approved' | 'rejected' | 'disabled'
  created_at: string
  approved_at: string | null
  subscription_end_at: string | null
}

export async function getTeachers(): Promise<TeacherRow[]> {
  await requireAdminUserId()
  const admin = createAdminClient()

  const [{ data, error }, emailMap] = await Promise.all([
    admin
      .from('profiles')
      .select('id, nome, cognome, teacher_status, created_at, approved_at, subscription_end_at')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false }),
    getEmailMap()
  ])

  if (error) throw new Error('Errore caricando gli insegnanti.')
  return (data ?? []).map((t) => ({ ...t, email: emailMap.get(t.id) ?? '' })) as TeacherRow[]
}

export async function setSubscriptionEndDate(userId: string, date: string | null) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ subscription_end_at: date })
    .eq('id', userId)

  if (error) throw new Error('Errore impostando la data di scadenza.')
  revalidatePath('/admin/users')
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
  return (data ?? []).map((t) => ({ ...t, email: '', approved_at: null, subscription_end_at: null })) as TeacherRow[]
}

export async function approveStudent(studentId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ student_status: 'approved', approved_at: new Date().toISOString() })
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

export interface StudentAdminRow {
  id: string
  nome: string
  cognome: string
  email: string
  student_status: 'pending' | 'approved' | 'rejected' | 'disabled'
  created_at: string
  approved_at: string | null
  subscription_end_at: string | null
  teacherId: string | null
  teacherNome: string | null
  teacherCognome: string | null
}

/**
 * TUTTI gli studenti, con il loro insegnante attuale (se ne hanno uno) —
 * permette all'amministratore di vedere a colpo d'occhio chi è assegnato
 * a chi e chi è indipendente, in un'unica vista.
 */
export async function getAllStudentsAdmin(): Promise<StudentAdminRow[]> {
  await requireAdminUserId()
  const admin = createAdminClient()

  const [{ data: students, error }, { data: memberships }, emailMap] = await Promise.all([
    admin
      .from('profiles')
      .select('id, nome, cognome, student_status, created_at, approved_at, subscription_end_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false }),
    admin
      .from('class_memberships')
      .select('student_id, teacher_id, profiles!teacher_id(nome, cognome)')
      .is('left_at', null),
    getEmailMap()
  ])

  if (error) throw new Error('Errore caricando gli studenti.')

  const teacherByStudent = new Map<string, { id: string; nome: string; cognome: string }>()
  for (const m of memberships ?? []) {
    const teacherProfile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    teacherByStudent.set(m.student_id, {
      id: m.teacher_id,
      nome: teacherProfile?.nome ?? '',
      cognome: teacherProfile?.cognome ?? ''
    })
  }

  return (students ?? []).map((s) => {
    const teacher = teacherByStudent.get(s.id)
    return {
      id: s.id,
      nome: s.nome,
      cognome: s.cognome,
      email: emailMap.get(s.id) ?? '',
      student_status: s.student_status,
      created_at: s.created_at,
      approved_at: s.approved_at,
      subscription_end_at: s.subscription_end_at,
      teacherId: teacher?.id ?? null,
      teacherNome: teacher?.nome ?? null,
      teacherCognome: teacher?.cognome ?? null
    }
  })
}

export async function getApprovedTeachers(): Promise<TeacherRow[]> {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('profiles')
    .select('id, nome, cognome, teacher_status, created_at')
    .eq('role', 'teacher')
    .eq('teacher_status', 'approved')
    .order('nome', { ascending: true })

  if (error) throw new Error('Errore caricando gli insegnanti disponibili.')
  return (data ?? []).map((t) => ({ ...t, email: '', approved_at: null, subscription_end_at: null })) as TeacherRow[]
}

export async function disableStudentAccount(studentId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ student_status: 'disabled' })
    .eq('id', studentId)
    .eq('role', 'student')

  if (error) throw new Error('Errore disabilitando lo studente.')
  revalidatePath('/admin/users')
}

export async function reenableStudentAccount(studentId: string) {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ student_status: 'approved' })
    .eq('id', studentId)
    .eq('role', 'student')

  if (error) throw new Error('Errore riattivando lo studente.')
  revalidatePath('/admin/users')
}

/**
 * Riassegna uno studente a un altro insegnante (o lo rende indipendente
 * se newTeacherId è null). Se lo studente era pending/rejected, riceverne
 * uno lo approva automaticamente (il docente fa da garante) — se era
 * disabled, resta disabled: riattivarlo è una decisione separata
 * dell'amministratore.
 */
export async function reassignStudentTeacher(studentId: string, newTeacherId: string | null) {
  await requireAdminUserId()
  const admin = createAdminClient()

  // Usa una RPC transazionale per garantire atomicità: se il passaggio
  // "chiudi vecchia membership → apri nuova" fallisce a metà, lo studente
  // non resta orfano senza insegnante né senza accesso.
  const { error } = await admin.rpc('admin_reassign_student', {
    p_student_id: studentId,
    p_new_teacher_id: newTeacherId
  })

  if (error) throw new Error(`Errore riassegnando lo studente: ${error.message}`)

  revalidatePath('/admin/users')
}

/**
 * Elimina PERMANENTEMENTE uno studente e TUTTI i suoi dati (submissions,
 * esercizi personalizzati, iscrizioni) — richiesta esplicita del
 * proprietario del prodotto, stessa logica di irreversibilità già
 * accettata per l'eliminazione di singole submission da parte del
 * docente (migrazione 0009). L'ordine di cancellazione rispetta i
 * vincoli "on delete restrict" dello schema: prima le righe che
 * referenziano il profilo, poi l'utente in auth.users (che fa cascare
 * l'eliminazione del profilo stesso).
 */
export async function deleteStudentCompletely(
  studentId: string,
  confirmName: string,
  expectedName: string
) {
  await requireAdminUserId()

  if (confirmName.trim() !== expectedName.trim()) {
    throw new Error('Il nome non corrisponde. Eliminazione annullata.')
  }

  const admin = createAdminClient()

  const { error: exercisesError } = await admin
    .from('personalized_exercises')
    .delete()
    .eq('student_id', studentId)
  if (exercisesError) throw new Error('Errore eliminando gli esercizi personalizzati.')

  const { error: submissionsError } = await admin
    .from('submissions')
    .delete()
    .eq('student_id', studentId)
  if (submissionsError) throw new Error('Errore eliminando le submissions.')

  const { error: membershipsError } = await admin
    .from('class_memberships')
    .delete()
    .eq('student_id', studentId)
  if (membershipsError) throw new Error('Errore eliminando le iscrizioni.')

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(studentId)
  if (deleteUserError) throw new Error('Errore eliminando l\'account.')

  revalidatePath('/admin/users')
}
