'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireApprovedTeacherActionUserId } from '@/lib/teacher/guard'

/**
 * Sposta uno studente dalla classe attuale a un'altra classe dello STESSO
 * docente. RLS (memberships_update_by_teacher) garantisce che possa operare
 * solo sulle membership il cui teacher_id sia il suo.
 *
 * BUG corretto qui: la versione precedente chiudeva la membership attuale
 * (left_at) e poi tentava di INSERIRNE una nuova per la classe di
 * destinazione — ma la policy RLS di insert (memberships_insert_own_student)
 * richiede student_id = auth.uid(), quindi permette SOLO allo studente di
 * creare la propria membership, mai a un docente per suo conto. L'insert
 * falliva sempre; il close della vecchia membership però era già avvenuto
 * (nessuna transazione a collegare le due operazioni), lasciando lo
 * studente senza nessuna membership attiva — invisibile in ogni vista.
 * Un semplice UPDATE del class_id (stesso pattern già usato con successo
 * da assignStudentToClass) risolve alla radice: il teacher_id non cambia
 * mai in questo spostamento, quindi non serve chiudere/riaprire nulla.
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
    .select('class_id')
    .eq('id', membershipId)
    .eq('teacher_id', teacherId)
    .is('left_at', null)
    .single()

  if (!membership) throw new Error('Iscrizione non trovata.')

  const { error } = await supabase
    .from('class_memberships')
    .update({ class_id: targetClassId })
    .eq('id', membershipId)

  if (error) throw new Error('Errore spostando lo studente.')

  // MoveStudentSelect viene usato solo nella pagina di dettaglio classe:
  // senza revalidare anche quella (non solo la lista), lo studente
  // spostato restava visibile nell'elenco della classe di origine finché
  // non si ricaricava manualmente la pagina.
  revalidatePath('/teacher/classes')
  if (membership.class_id) {
    revalidatePath(`/teacher/classes/${membership.class_id}`)
  }
  revalidatePath(`/teacher/classes/${targetClassId}`)
}
