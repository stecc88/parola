'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function joinClassWithCode(inviteCode: string) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  const admin = createAdminClient()
  const { data: targetClass, error: classError } = await admin
    .from('classes')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase().trim())
    .single()

  if (classError || !targetClass) {
    throw new Error('Codice classe non valido.')
  }

  await supabase
    .from('class_memberships')
    .update({ left_at: new Date().toISOString() })
    .eq('student_id', userData.user.id)
    .is('left_at', null)

  const { error: insertError } = await supabase.from('class_memberships').insert({
    student_id: userData.user.id,
    class_id: targetClass.id
  })

  if (insertError) throw new Error('Errore unendosi alla classe.')
}

/**
 * Intenta unir automáticamente usando el invite_code guardado en
 * user_metadata durante el signup (caso: confirmación de email activada,
 * el join no pudo hacerse en el momento del registro porque no había
 * sesión todavía). Se llama desde la home al primer login.
 */
export async function tryAutoJoinFromMetadata(): Promise<boolean> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const pendingCode = userData.user?.user_metadata?.invite_code as string | undefined

  if (!pendingCode) return false

  try {
    await joinClassWithCode(pendingCode)
    return true
  } catch {
    return false
  }
}

export async function hasActiveMembership(): Promise<boolean> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return false

  const { data } = await supabase
    .from('class_memberships')
    .select('id')
    .eq('student_id', userData.user.id)
    .is('left_at', null)
    .maybeSingle()

  return !!data
}
