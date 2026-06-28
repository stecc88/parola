'use server'

import { createClient } from '@/lib/supabase/server'

export interface MyProfile {
  id: string
  nome: string
  cognome: string
  role: 'admin' | 'teacher' | 'student'
  livello_target: string | null
  livello_obiettivo_classe: string | null
}

export async function getMyProfile(): Promise<MyProfile | null> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, nome, cognome, role, livello_target, livello_obiettivo_classe')
    .eq('id', userData.user.id)
    .single()

  return data ?? null
}

/**
 * Aggiorna SOLO nome/cognome — non si tocca mai role, teacher_status,
 * livello_target o altri campi sensibili da questo form, anche se la RLS
 * (profiles_update_own) tecnicamente lo permetterebbe a livello di riga.
 */
export async function updateMyName(nome: string, cognome: string) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  if (!nome.trim() || !cognome.trim()) {
    throw new Error('Nome e cognome sono obbligatori.')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ nome: nome.trim(), cognome: cognome.trim() })
    .eq('id', userData.user.id)

  if (error) throw new Error('Errore aggiornando il profilo.')
}

export async function updateLivelloObiettivo(livello: string | null) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'teacher') throw new Error('Solo i docenti possono impostare il livello obiettivo.')

  const { error } = await supabase
    .from('profiles')
    .update({ livello_obiettivo_classe: livello })
    .eq('id', userData.user.id)

  if (error) throw new Error('Errore aggiornando il livello obiettivo.')
}

export async function changeMyPassword(nuovaPassword: string) {
  const supabase = createClient()
  if (nuovaPassword.length < 6) {
    throw new Error('La password deve avere almeno 6 caratteri.')
  }

  const { error } = await supabase.auth.updateUser({ password: nuovaPassword })
  if (error) throw new Error('Errore aggiornando la password.')
}
