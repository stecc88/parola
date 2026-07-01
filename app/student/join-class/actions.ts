'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function joinClassWithCode(inviteCode: string) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('student_status')
    .eq('id', userData.user.id)
    .single()
  if (callerProfile?.student_status === 'disabled') {
    throw new Error('Il tuo account è stato disabilitato. Contatta l\'amministratore.')
  }

  const admin = createAdminClient()
  const { data: teacher, error: teacherError } = await admin
    .from('profiles')
    .select('id, teacher_status')
    .eq('role', 'teacher')
    .eq('invite_code', inviteCode.toUpperCase().trim())
    .single()

  if (teacherError || !teacher) {
    throw new Error('Codice insegnante non valido.')
  }

  if (teacher.teacher_status !== 'approved') {
    throw new Error(
      teacher.teacher_status === 'disabled'
        ? "L'insegnante associato a questo codice è disabilitato. Contatta l'amministratore della piattaforma."
        : "L'insegnante non è ancora stato approvato. Riprova più tardi o contatta l'amministratore."
    )
  }

  await supabase
    .from('class_memberships')
    .update({ left_at: new Date().toISOString() })
    .eq('student_id', userData.user.id)
    .is('left_at', null)

  const { error: insertError } = await supabase.from('class_memberships').insert({
    student_id: userData.user.id,
    teacher_id: teacher.id,
    class_id: null
  })

  if (insertError) throw new Error("Errore unendosi al gruppo dell'insegnante.")

  await admin.from('profiles').update({ student_status: 'approved' }).eq('id', userData.user.id)
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
