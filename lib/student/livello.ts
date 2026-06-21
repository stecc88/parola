'use server'

import { createClient } from '@/lib/supabase/server'
import type { LivelloCefr } from '@/lib/supabase/database.types'

export async function getLivelloTarget(): Promise<LivelloCefr> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return 'B1'

  const { data } = await supabase
    .from('profiles')
    .select('livello_target')
    .eq('id', userData.user.id)
    .single()

  return (data?.livello_target as LivelloCefr | null) ?? 'B1'
}

export async function setLivelloTarget(livello: LivelloCefr) {
  const supabase = createClient()
  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData.user) throw new Error('Non autenticato.')

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ livello_target: livello })
    .eq('id', userData.user.id)

  if (updateError) throw new Error('Errore salvando il livello.')
}
