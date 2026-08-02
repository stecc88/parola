'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, assertIsAdmin } from '@/lib/supabase/admin'
import { generateAccessCode } from '@/lib/student/access-code'
import { CORSI_VALIDI } from '@/lib/student/corso'

export {
  getAllStudentsAdmin,
  getApprovedTeachers,
  deleteStudentCompletely,
  type StudentAdminRow,
  type TeacherRow
} from '../users/actions'

async function requireAdminUserId(): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('UNAUTHENTICATED')
  await assertIsAdmin(data.user.id)
  return data.user.id
}

function validateCorso(corso: string): void {
  if (!CORSI_VALIDI.includes(corso as (typeof CORSI_VALIDI)[number])) {
    throw new Error('Corso non valido.')
  }
}

export async function updateStudentDetails(
  studentId: string,
  details: { nome: string; cognome: string; corso: string }
): Promise<void> {
  await requireAdminUserId()

  if (!details.nome.trim() || !details.cognome.trim()) {
    throw new Error('Nome e cognome sono obbligatori.')
  }
  validateCorso(details.corso)

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({
      nome: details.nome.trim(),
      cognome: details.cognome.trim(),
      corso: details.corso
    })
    .eq('id', studentId)
    .eq('role', 'student')

  if (error) throw new Error('Errore aggiornando lo studente.')
  revalidatePath('/admin/students')
  revalidatePath('/admin/users')
}

export interface CreateStudentResult {
  accessCode: string
}

/**
 * Crea uno studente direttamente dal pannello admin, senza passare per il
 * codice insegnante pubblico: stesso pattern di registerStudent
 * (utente Auth sintetico + codice di accesso), ma già 'approved'.
 */
export async function createStudentAdmin(
  nome: string,
  cognome: string,
  corso: string,
  teacherId: string | null
): Promise<CreateStudentResult> {
  await requireAdminUserId()

  if (!nome.trim() || !cognome.trim()) {
    throw new Error('Nome e cognome sono obbligatori.')
  }
  validateCorso(corso)

  const admin = createAdminClient()

  if (teacherId) {
    const { data: teacher, error: teacherError } = await admin
      .from('profiles')
      .select('id')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .eq('teacher_status', 'approved')
      .single()

    if (teacherError || !teacher) {
      throw new Error('Insegnante non valido.')
    }
  }

  let accessCode = ''
  let userId = ''

  for (let attempt = 0; attempt < 5; attempt++) {
    accessCode = generateAccessCode()
    const syntheticEmail = `${accessCode}@student.parola.internal`

    const { data: authData, error: signUpError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password: accessCode,
      email_confirm: true,
      user_metadata: { role: 'student', nome, cognome }
    })

    if (signUpError) {
      if (signUpError.message.includes('already been registered') || signUpError.status === 422) {
        continue
      }
      throw new Error('Errore durante la creazione. Riprova.')
    }

    userId = authData.user.id
    break
  }

  if (!userId) {
    throw new Error('Impossibile generare un codice univoco. Riprova.')
  }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: userId,
      nome: nome.trim(),
      cognome: cognome.trim(),
      role: 'student',
      access_code: accessCode,
      livello_target: null,
      corso,
      student_status: 'approved',
      approved_at: new Date().toISOString()
    })

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    throw new Error('Errore configurando il profilo. Riprova.')
  }

  if (teacherId) {
    const { error: membershipError } = await admin.from('class_memberships').insert({
      student_id: userId,
      teacher_id: teacherId,
      class_id: null
    })

    if (membershipError) {
      await admin.auth.admin.deleteUser(userId)
      throw new Error("Errore associando l'insegnante. Riprova.")
    }
  }

  revalidatePath('/admin/students')
  revalidatePath('/admin/users')

  return { accessCode }
}
