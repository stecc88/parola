import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateScritturaLibera } from '@/lib/gemini/prompts/examinador'
import { GeminiError, isQuotaExhausted } from '@/lib/gemini/client'
import { checkSubmissionRateLimit } from '@/lib/student/rate-limit'

/**
 * Le evaluaciones con "thinking" activado en Gemini, sumadas a los
 * reintentos automáticos ante 503/sobrecarga (y el cambio de modelo a
 * gemini-2.5-flash-lite si el principal sigue fallando), pueden superar
 * el límite de tiempo por defecto de una función serverless. Esto
 * extiende el máximo permitido — Vercel aplica de todos modos el techo
 * real de tu plan, así que este valor es seguro de declarar aunque tu
 * plan no llegue a 60s.
 */
export const maxDuration = 60

/**
 * POST /api/gemini/evaluate
 * body: { submissionId: string }
 *
 * Flujo:
 *   1. Cliente crea primero la submission (Server Action separada) con
 *      testo_studente y valutazione_ia = NULL.
 *   2. Este endpoint recibe el submissionId, lee el texto (con la sesión
 *      del propio usuario — RLS garantiza que solo puede leer la suya),
 *      llama a Gemini, y hace UPDATE de valutazione_ia con el cliente
 *      admin (service role).
 *
 * Por qué en dos pasos: si Gemini falla o tarda, la submission ya existe
 * con su texto guardado — nunca se pierde el envío del estudiante por un
 * problema de la API externa. El cliente puede reintentar solo el paso 2.
 *
 * IMPORTANTE (hallazgo de auditoría de seguridad): el UPDATE final usa el
 * cliente admin, NO el del usuario. Antes usaba el cliente del propio
 * usuario apoyándose en la RLS policy submissions_update_own_student —
 * pero esa misma policy permitía que cualquier estudiante, llamando
 * directamente a la API REST de Supabase con su propia sesión (sin pasar
 * por este endpoint ni por Gemini), escribiera valutazione_ia con
 * cualquier puntaje que quisiera. La policy de UPDATE para estudiantes
 * fue eliminada (ver migración 0016); la lectura inicial sigue usando el
 * cliente del usuario, así que la verificación de "es realmente su
 * submission" sigue intacta vía RLS de SELECT.
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {
          /* no-op: route handler no necesita refrescar cookies de salida aquí */
        },
        remove() {
          /* no-op */
        }
      }
    }
  )

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const submissionId = body?.submissionId
  const consegna = typeof body?.consegna === 'string' ? body.consegna : undefined
  if (!submissionId || typeof submissionId !== 'string') {
    return NextResponse.json({ error: 'submissionId es requerido.' }, { status: 400 })
  }

  const { data: submission, error: fetchError } = await supabase
    .from('submissions')
    .select('id, testo_studente, tipo, valutazione_ia')
    .eq('id', submissionId)
    .single()

  // RLS ya garantiza que solo se puede leer la propia submission; si no
  // existe o no es suya, fetchError o submission=null.
  if (fetchError || !submission) {
    return NextResponse.json({ error: 'Submission no encontrada.' }, { status: 404 })
  }

  if (submission.tipo !== 'scrittura_libera') {
    return NextResponse.json(
      { error: 'Este endpoint solo evalúa submissions de tipo scrittura_libera.' },
      { status: 400 }
    )
  }

  if (submission.valutazione_ia) {
    return NextResponse.json(
      { error: 'Esta submission ya fue evaluada.' },
      { status: 409 }
    )
  }

  try {
    await checkSubmissionRateLimit(userData.user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('livello_target')
      .eq('id', userData.user.id)
      .single()

    const valutazione = await evaluateScritturaLibera(
      submission.testo_studente,
      profile?.livello_target ?? undefined,
      consegna
    )

    const { error: updateError } = await createAdminClient()
      .from('submissions')
      .update({
        valutazione_ia: valutazione,
        valutazione_completed_at: new Date().toISOString()
      })
      .eq('id', submissionId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ valutazione })
  } catch (err) {
    console.error('Errore durante la valutazione Gemini:', err)

    if (err instanceof Error && err.message.includes('limite di')) {
      return NextResponse.json({ error: err.message }, { status: 429 })
    }

    if (err instanceof GeminiError && isQuotaExhausted(err)) {
      return NextResponse.json(
        {
          error:
            "Il servizio di correzione IA ha raggiunto il limite giornaliero di richieste gratuite. Riprova più tardi (il limite si resetta a mezzanotte, fuso orario USA/Pacifico) oppure contatta l'amministratore della piattaforma."
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Errore durante la valutazione. Riprova più tardi.' },
      { status: 502 }
    )
  }
}
