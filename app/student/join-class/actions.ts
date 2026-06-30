'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function joinClassWithCode(inviteCode: string) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

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

  // class_id resta NULL: lo studente è collegato al docente ma non ancora
  // assegnato a una classe specifica. Il docente lo assegna da /teacher/classes.
  const { error: insertError } = await supabase.from('class_memberships').insert({
    student_id: userData.user.id,
    teacher_id: teacher.id,
    class_id: null
  })

  if (insertError) throw new Error('Errore unendosi al gruppo dell\'insegnante.')

  // Un codice insegnante valido fa da garante: lo studente passa subito
  // ad approved anche se si era registrato senza codice ed era pending.
  // Cliente admin (no quello di sessione): vedi migrazione 0016 — la
  // policy ampia che permetteva agli studenti di aggiornare il proprio
  // profilo senza restrizione di colonna è stata rimossa per sicurezza.
  await admin.from('profiles').update({ student_status: 'approved' }).eq('id', userData.user.id)
}

/**
 * Prova ad unirsi automaticamente usando l'invite_code salvato in
 * user_metadata durante la registrazione (caso: conferma email attiva,
 * il join non ha potuto avvenire al momento della registrazione perché
 * non c'era ancora una sessione). Viene chiamata dalla home al primo login.
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

/**
 * Stato di approvazione per uno studente SENZA insegnante (si è registrato
 * senza codice). NULL se l'utente non è uno studente, o se ha un
 * student_status NULL (caso legacy/con insegnante — vedi migrazione 0012).
 */
export async function getMyStudentStatus(): Promise<'pending' | 'approved' | 'rejected' | null> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data } = await supabase
    .from('profiles')
    .select('role, student_status')
    .eq('id', userData.user.id)
    .single()

  if (data?.role !== 'student') return null
  return data.student_status
}
