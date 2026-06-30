'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedStudentActionUserId } from '@/lib/student/guard'

/**
 * Elimina una submission dello studente. La RLS garantisce che possa
 * eliminare solo le proprie submissions — se l'id non gli appartiene,
 * Supabase non cancella nulla e restituiamo un errore.
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
