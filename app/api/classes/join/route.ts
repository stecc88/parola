import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { joinClassWithCode } from '@/app/student/join-class/actions'

/**
 * POST /api/classes/join
 * body: { inviteCode: string }
 *
 * Chiamato durante la registrazione (quando c'è già una sessione attiva
 * immediatamente dopo il signUp). Delega a joinClassWithCode, la stessa
 * logica usata da /student/join-class per il caso di conferma email differita.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const inviteCode = body?.inviteCode
  if (!inviteCode || typeof inviteCode !== 'string') {
    return NextResponse.json({ error: 'inviteCode è obbligatorio.' }, { status: 400 })
  }

  try {
    await joinClassWithCode(inviteCode)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore unendosi.'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
