'use server'

import { createClient } from '@/lib/supabase/server'
import { notifyAdminOfNameChangeRequest } from '@/lib/email/adminNotification'

export interface MyProfile {
  id: string
  nome: string
  cognome: string
  role: 'admin' | 'teacher' | 'student'
  livello_target: string | null
  livello_obiettivo_classe: string | null
}

export interface NameChangeRequest {
  id: string
  nome_richiesto: string
  cognome_richiesto: string
  nome_attuale: string
  cognome_attuale: string
  stato: 'pending' | 'approved' | 'rejected'
  created_at: string
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

export async function getMyPendingNameChangeRequest(): Promise<NameChangeRequest | null> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data } = await supabase
    .from('name_change_requests')
    .select('id, nome_richiesto, cognome_richiesto, nome_attuale, cognome_attuale, stato, created_at')
    .eq('user_id', userData.user.id)
    .eq('stato', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data as NameChangeRequest | null
}

/**
 * Invia una richiesta di cambio nome/cognome all'amministratore.
 * L'utente non può modificare nome/cognome direttamente: solo l'admin
 * può approvare la richiesta e applicare il cambiamento.
 */
export async function requestNameChange(nome: string, cognome: string): Promise<void> {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  const nomeT = nome.trim()
  const cognomeT = cognome.trim()
  if (!nomeT || !cognomeT) throw new Error('Nome e cognome sono obbligatori.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, cognome')
    .eq('id', userData.user.id)
    .single()

  if (!profile) throw new Error('Profilo non trovato.')

  if (profile.nome === nomeT && profile.cognome === cognomeT) {
    throw new Error('Il nome inserito è uguale a quello attuale.')
  }

  const { error } = await supabase.from('name_change_requests').insert({
    user_id: userData.user.id,
    nome_richiesto: nomeT,
    cognome_richiesto: cognomeT,
    nome_attuale: profile.nome,
    cognome_attuale: profile.cognome
  })

  if (error) {
    if (error.code === '42501') throw new Error('Hai già una richiesta in attesa. Aspetta che l\'amministratore la valuti.')
    throw new Error('Errore inviando la richiesta.')
  }

  // Notifica best-effort all'admin — non blocca mai l'utente
  await notifyAdminOfNameChangeRequest({
    nomeAttuale: profile.nome,
    cognomeAttuale: profile.cognome,
    nomeRichiesto: nomeT,
    cognomeRichiesto: cognomeT
  })
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
