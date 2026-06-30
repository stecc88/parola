'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedTeacherActionUserId } from '@/lib/teacher/guard'

/**
 * Sposta uno studente dalla classe attuale a un'altra classe dello STESSO
 * docente. RLS (memberships_update_by_teacher) garantisce che possa operare
 * solo sulle membership di classi il cui teacher_id sia il suo.
 */
export async function moveStudentToClass(membershipId: string, targetClassId: string) {
  const teacherId = await requireApprovedTeacherActionUserId()
  const supabase = createClient()

  // Verifica che la classe destinazione appartenga al docente (difesa extra
  // rispetto alla sola RLS sul lato lettura).
  const { data: targetClass } = await supabase
    .from('classes')
    .select('id')
    .eq('id', targetClassId)
    .eq('teacher_id', teacherId)
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
    teacher_id: teacherId,
    class_id: targetClassId
  })

  if (insertError) throw new Error('Errore spostando lo studente.')
  revalidatePath('/teacher/classes')
}
