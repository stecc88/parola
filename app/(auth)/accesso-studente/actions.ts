'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const LIVELLI_VALIDI = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
type Livello = (typeof LIVELLI_VALIDI)[number]

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const array = new Uint8Array(8)
  crypto.getRandomValues(array)
  for (const byte of array) {
    code += chars[byte % chars.length]
  }
  return code
}

export interface RegisterStudentResult {
  accessCode: string
}

export async function registerStudent(
  nome: string,
  cognome: string,
  livello: string,
  inviteCode: string
): Promise<RegisterStudentResult> {
  if (!nome.trim() || !cognome.trim()) {
    throw new Error('Nome e cognome sono obbligatori.')
  }

  if (!LIVELLI_VALIDI.includes(livello as Livello)) {
    throw new Error('Livello non valido.')
  }

  const inviteCodeNorm = inviteCode.trim().toUpperCase()
  if (!inviteCodeNorm) {
    throw new Error('Il codice insegnante è obbligatorio.')
  }

  const admin = createAdminClient()

  // Verifica che il codice insegnante esista e sia approvato
  const { data: teacher, error: teacherError } = await admin
    .from('profiles')
    .select('id, teacher_status')
    .eq('role', 'teacher')
    .eq('invite_code', inviteCodeNorm)
    .single()

  if (teacherError || !teacher) {
    throw new Error('Codice insegnante non valido.')
  }

  if (teacher.teacher_status !== 'approved') {
    throw new Error(
      teacher.teacher_status === 'disabled'
        ? "L'insegnante è disabilitato. Contatta l'amministratore."
        : "L'insegnante non è ancora approvato. Riprova più tardi."
    )
  }

  // Genera un codice univoco (retry al massimo 5 volte in caso di collisione)
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
        // collisione di codice (rarissima) — riprova
        continue
      }
      throw new Error('Errore durante la registrazione. Riprova.')
    }

    userId = authData.user.id
    break
  }

  if (!userId) {
    throw new Error('Impossibile generare un codice univoco. Riprova.')
  }

  // Il trigger handle_new_user crea il profilo con nome/cognome dai metadata.
  // Aggiungiamo access_code e livello_target con admin (il profilo è già creato
  // in modo sincrono dal trigger DB, o quasi — lo upsert è sicuro in entrambi i casi).
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      access_code: accessCode,
      livello_target: livello,
      student_status: 'pending'
    })
    .eq('id', userId)

  if (profileError) {
    // Pulizia auth utente se l'update fallisce (best-effort)
    await admin.auth.admin.deleteUser(userId)
    throw new Error('Errore configurando il profilo. Riprova.')
  }

  // Associa lo studente all'insegnante
  const { error: membershipError } = await admin.from('class_memberships').insert({
    student_id: userId,
    teacher_id: teacher.id,
    class_id: null
  })

  if (membershipError) {
    await admin.auth.admin.deleteUser(userId)
    throw new Error("Errore associandosi all'insegnante. Riprova.")
  }

  return { accessCode }
}
