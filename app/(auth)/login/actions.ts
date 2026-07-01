'use server'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Riceve il codice personale dello studente, recupera la sua email
 * nell'account Supabase Auth, e imposta la password = codice (in modo
 * che funzioni sia per i nuovi studenti con email sintetica sia per i
 * vecchi studenti con email reale registrati prima del nuovo flusso).
 *
 * Restituisce l'email — il client la usa per signInWithPassword.
 */
export async function resolveStudentAccessCode(code: string): Promise<{ email: string }> {
  const trimmed = code.trim().toUpperCase()
  if (!trimmed) throw new Error('Codice non valido.')

  const admin = createAdminClient()

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('access_code', trimmed)
    .eq('role', 'student')
    .maybeSingle()

  if (profileError || !profile) {
    throw new Error('Codice non valido.')
  }

  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(profile.id)

  if (authError || !authUser.user?.email) {
    throw new Error('Codice non valido.')
  }

  // Allinea la password al codice — necessario per gli studenti esistenti
  // che avevano una password diversa impostata con il vecchio flusso.
  await admin.auth.admin.updateUserById(profile.id, { password: trimmed })

  return { email: authUser.user.email }
}
