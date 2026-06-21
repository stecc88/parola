import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { joinClassWithCode } from '@/app/student/join-class/actions'

/**
 * POST /api/classes/join
 * body: { inviteCode: string }
 *
 * Usado durante el registro (cuando ya hay sesión activa inmediatamente
 * después del signUp). Delega en joinClassWithCode, la misma lógica que
 * usa /student/join-class para el caso de confirmación de email diferida.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    return NextResponse.json({ error: 'No autenticato.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const inviteCode = body?.inviteCode
  if (!inviteCode || typeof inviteCode !== 'string') {
    return NextResponse.json({ error: 'inviteCode es requerido.' }, { status: 400 })
  }

  try {
    await joinClassWithCode(inviteCode)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore unendosi.'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
