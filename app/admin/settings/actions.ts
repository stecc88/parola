'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, assertIsAdmin } from '@/lib/supabase/admin'

async function requireAdminUserId(): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('UNAUTHENTICATED')
  await assertIsAdmin(data.user.id)
  return data.user.id
}

export interface RegistrationSettings {
  simplifiedRegistrationEnabled: boolean
}

export async function getRegistrationSettings(): Promise<RegistrationSettings> {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('app_settings')
    .select('simplified_registration_enabled')
    .eq('id', true)
    .single()

  if (error) throw new Error('Errore caricando le impostazioni.')
  return { simplifiedRegistrationEnabled: data?.simplified_registration_enabled ?? false }
}

export async function setSimplifiedRegistrationMode(enabled: boolean): Promise<void> {
  await requireAdminUserId()
  const admin = createAdminClient()

  const { error } = await admin
    .from('app_settings')
    .update({ simplified_registration_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', true)

  if (error) throw new Error('Errore aggiornando la modalità di registrazione.')

  revalidatePath('/admin/users')
  revalidatePath('/accesso-studente')
}
