'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createClass(nome: string) {
  const supabase = createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    throw new Error('Non autenticato.')
  }

  if (!nome.trim()) {
    throw new Error('Il nome della classe è obbligatorio.')
  }

  // invite_code se autogenera por trigger (set_invite_code), no se pasa acá.
  const { error } = await supabase.from('classes').insert({
    teacher_id: userData.user.id,
    nome: nome.trim()
  })

  if (error) throw new Error('Errore creando la classe.')
  revalidatePath('/teacher/classes')
}
