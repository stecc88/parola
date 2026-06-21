'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createClass(nome: string) {
  const supabase = createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    throw new Error('Non autenticato.')
  }

  // Defensa en profundidad: la página ya bloquea el acceso a profesores
  // no aprobados, pero esta Server Action es invocable independientemente
  // de la página, así que se vuelve a verificar acá.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, teacher_status')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'teacher' || profile.teacher_status !== 'approved') {
    throw new Error('Il tuo account insegnante non è ancora approvato.')
  }

  if (!nome.trim()) {
    throw new Error('Il nome della classe è obbligatorio.')
  }

  // invite_code se autogenera por trigger (set_invite_code), no se pasa acá.
  const { error } = await supabase.from('classes').insert({
    teacher_id: userData.user.id,
    nome: nome.trim()
  })

  if (error) throw new Error('Errore creando la classe.')
  revalidatePath('/teacher/classes')
}

/**
 * Asigna un estudiante sin clase (class_id NULL) a una classe concreta
 * del profesor. A diferencia de moveStudentToClass (que cierra/reabre la
 * membership), acá alcanza con un UPDATE directo porque el teacher_id ya
 * es el mismo — no hay cambio de "dueño", solo de classe.
 */
export async function assignStudentToClass(membershipId: string, classId: string) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) throw new Error('Non autenticato.')

  const { data: targetClass } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', userData.user.id)
    .single()

  if (!targetClass) throw new Error('Classe non valida.')

  const { error } = await supabase
    .from('class_memberships')
    .update({ class_id: classId })
    .eq('id', membershipId)
    .eq('teacher_id', userData.user.id)

  if (error) throw new Error('Errore assegnando lo studente.')
  revalidatePath('/teacher/classes')
}

export async function getTeacherInviteCode(): Promise<string | null> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data } = await supabase
    .from('profiles')
    .select('invite_code')
    .eq('id', userData.user.id)
    .single()

  return data?.invite_code ?? null
}

export interface UnassignedStudent {
  membership_id: string
  student_id: string
  nome: string
  cognome: string
}

export async function getUnassignedStudents(): Promise<UnassignedStudent[]> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data } = await supabase
    .from('class_memberships')
    .select('id, student_id, profiles(nome, cognome)')
    .eq('teacher_id', userData.user.id)
    .is('class_id', null)
    .is('left_at', null)

  return (data ?? []).map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return {
      membership_id: m.id,
      student_id: m.student_id,
      nome: profile?.nome ?? '',
      cognome: profile?.cognome ?? ''
    }
  })
}
