'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedStudentActionUserId } from '@/lib/student/guard'

/**
 * Elimina una submission del alumno. La RLS garantiza que solo puede
 * borrar sus propias submissions — si el id no le pertenece, Supabase
 * no borra nada y retornamos error.
 */
export async function deleteOwnSubmission(submissionId: string) {
  const studentId = await requireApprovedStudentActionUserId()
  const supabase = createClient()

  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submissionId)
    .eq('student_id', studentId)

  if (error) {
    throw new Error("Errore durante l'eliminazione. Riprova.")
  }

  revalidatePath('/student/progress')
}
