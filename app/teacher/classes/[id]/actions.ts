'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedTeacherActionUserId } from '@/lib/teacher/guard'

/**
 * Mueve un estudiante de la clase actual a otra clase del MISMO profesor.
 * RLS (memberships_update_by_teacher) garantiza que solo puede operar
 * sobre membresías de classi cuyo teacher_id sea el suyo.
 */
export async function moveStudentToClass(membershipId: string, targetClassId: string) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, teacher_status')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'teacher' || profile.teacher_status !== 'approved') {
    throw new Error('Il tuo account insegnante non è ancora approvato.')
  }

  // Verificar que la clase destino también sea del profesor (defensa extra,
  // RLS en el insert ya lo exigiría vía classes_insert/select policies del
  // lado de lectura, pero confirmamos explícitamente acá).
  const { data: targetClass } = await supabase
    .from('classes')
    .select('id')
    .eq('id', targetClassId)
    .eq('teacher_id', userData.user.id)
    .single()

  if (!targetClass) throw new Error('Classe di destinazione non valida.')

  const { data: membership } = await supabase
    .from('class_memberships')
    .select('student_id')
    .eq('id', membershipId)
    .single()

  if (!membership) throw new Error('Iscrizione non trovata.')

  await supabase
    .from('class_memberships')
    .update({ left_at: new Date().toISOString() })
    .eq('id', membershipId)

  const { error: insertError } = await supabase.from('class_memberships').insert({
    student_id: membership.student_id,
    teacher_id: userData.user.id,
    class_id: targetClassId
  })

  if (insertError) throw new Error('Errore spostando lo studente.')
  revalidatePath('/teacher/classes')
}
