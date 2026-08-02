'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { checkPreAuthRateLimit } from '@/lib/student/rate-limit'
import { generateAccessCode } from '@/lib/student/access-code'
import { CORSI_VALIDI } from '@/lib/student/corso'

const LIVELLI_VALIDI = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
type Livello = (typeof LIVELLI_VALIDI)[number]

export interface RegisterStudentResult {
  accessCode: string
}

/**
 * Booleano non sensibile: la pagina pubblica di registrazione lo usa per
 * decidere quali campi mostrare, quindi nessun controllo admin qui.
 */
export async function getSimplifiedRegistrationMode(): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('app_settings')
    .select('simplified_registration_enabled')
    .eq('id', true)
    .single()

  return data?.simplified_registration_enabled ?? false
}

export async function registerStudent(
  nome: string,
  cognome: string,
  livello: string | null,
  corso: string | null,
  inviteCode: string
): Promise<RegisterStudentResult> {
  if (!nome.trim() || !cognome.trim()) {
    throw new Error('Nome e cognome sono obbligatori.')
  }

  // Rilegge il flag lato server: non ci si può fidare di ciò che manda il
  // client, altrimenti un client "vecchio" potrebbe aggirare l'approvazione.
  const simplifiedMode = await getSimplifiedRegistrationMode()

  if (simplifiedMode) {
    if (!corso || !CORSI_VALIDI.includes(corso as (typeof CORSI_VALIDI)[number])) {
      throw new Error('Corso non valido.')
    }
  } else {
    if (!livello || !LIVELLI_VALIDI.includes(livello as Livello)) {
      throw new Error('Livello non valido.')
    }
  }

  const inviteCodeNorm = inviteCode.trim().toUpperCase()
  if (!inviteCodeNorm) {
    throw new Error('Il codice insegnante è obbligatorio.')
  }

  // La registrazione crea utenti Auth reali: senza limite, un loop può
  // riempire il progetto di account. Finestra più stretta del login.
  await checkPreAuthRateLimit({ maxPerWindow: 5, windowMinutes: 10 })

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
  // L'upsert include tutti i campi obbligatori per essere sicuro anche nei
  // casi in cui il trigger DB sia leggermente asincrono rispetto all'API call.
  // Non incatenare .eq() sull'upsert: PostgREST lo tratta come filtro sull'UPDATE
  // ma non sull'INSERT, causando errori se la riga non esiste ancora.
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: userId,
      nome: nome.trim(),
      cognome: cognome.trim(),
      role: 'student',
      access_code: accessCode,
      livello_target: simplifiedMode ? null : livello,
      corso: simplifiedMode ? corso : null,
      student_status: simplifiedMode ? 'approved' : 'pending',
      approved_at: simplifiedMode ? new Date().toISOString() : null
    })

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
