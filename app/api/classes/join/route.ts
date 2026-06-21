import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/classes/join
 * body: { inviteCode: string }
 *
 * Valida el invite_code, encuentra la clase y crea la membership del
 * estudiante autenticado. Usa la sesión normal (RLS aplica): la policy
 * memberships_insert_own_student garantiza que solo puede crear su propia
 * membership, pero la validación de que el invite_code exista y pertenezca
 * a una clase real ocurre aquí antes del insert.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const inviteCode = body?.inviteCode
  if (!inviteCode || typeof inviteCode !== 'string') {
    return NextResponse.json({ error: 'inviteCode es requerido.' }, { status: 400 })
  }

  // Nota: classes_select_by_member_student solo deja ver clases a las que
  // ya pertenece, así que esta lectura por invite_code necesita una policy
  // adicional de select público por invite_code, o resolverse server-side
  // con el cliente admin. Para mantener RLS estricto del lado del cliente,
  // se resuelve acá con el admin client solo para esta búsqueda puntual
  // (no para el insert de membership, que sigue yendo con sesión normal).
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const { data: targetClass, error: classError } = await admin
    .from('classes')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (classError || !targetClass) {
    return NextResponse.json({ error: 'Codice classe non valido.' }, { status: 404 })
  }

  // Si el estudiante ya tiene una membership activa, la cerramos antes de
  // crear la nueva (constraint idx_one_active_membership_per_student lo
  // exige de todas formas).
  await supabase
    .from('class_memberships')
    .update({ left_at: new Date().toISOString() })
    .eq('student_id', userData.user.id)
    .is('left_at', null)

  const { error: insertError } = await supabase.from('class_memberships').insert({
    student_id: userData.user.id,
    class_id: targetClass.id
  })

  if (insertError) {
    console.error('Errore creando class_membership:', insertError)
    return NextResponse.json({ error: 'Errore unendosi alla classe.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
