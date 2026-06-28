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

  const { error, count } = await supabase
    .from('submissions')
    .delete({ count: 'exact' })
    .eq('id', submissionId)
    .eq('student_id', studentId)

  if (error) {
    throw new Error("Errore durante l'eliminazione. Riprova.")
  }

  if (count === 0) {
    throw new Error('Scritto non trovato o non eliminabile.')
  }

  revalidatePath('/student/progress')
}
