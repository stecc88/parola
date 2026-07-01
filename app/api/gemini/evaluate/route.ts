import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateScritturaLibera } from '@/lib/gemini/prompts/examinador'
import { GeminiError, isQuotaExhausted } from '@/lib/gemini/client'
import { checkSubmissionRateLimit } from '@/lib/student/rate-limit'

/**
 * Le valutazioni con "thinking" attivo in Gemini, sommate ai retry
 * automatici su 503/sovraccarico (e al cambio modello su gemini-2.5-flash-lite
 * se il principale continua a fallire), possono superare il limite di tempo
 * predefinito di una funzione serverless. Questo estende il massimo
 * consentito — Vercel applica comunque il tetto reale del piano, quindi
 * questo valore è sicuro da dichiarare anche se il piano non arriva a 60s.
 */
export const maxDuration = 60

/**
 * POST /api/gemini/evaluate
 * body: { submissionId: string }
 *
 * Flusso:
 *   1. Il client crea prima la submission (Server Action separata) con
 *      testo_studente e valutazione_ia = NULL.
 *   2. Questo endpoint riceve il submissionId, legge il testo (con la
 *      sessione dell'utente — RLS garantisce che possa leggere solo il suo),
 *      chiama Gemini, e fa UPDATE di valutazione_ia con il client admin
 *      (service role).
 *
 * Perché in due passi: se Gemini fallisce o impiega troppo, la submission
 * esiste già con il testo salvato — il testo dello studente non va mai
 * perso per un problema dell'API esterna. Il client può riprovare solo
 * il passo 2.
 *
 * IMPORTANTE (finding di audit di sicurezza): l'UPDATE finale usa il
 * client admin, NON quello dell'utente. In precedenza usava il client
 * dell'utente appoggiandosi alla RLS policy submissions_update_own_student
 * — ma quella stessa policy permetteva a qualsiasi studente, chiamando
 * direttamente la REST API di Supabase con la propria sessione (senza
 * passare per questo endpoint né per Gemini), di scrivere valutazione_ia
 * con qualsiasi punteggio volesse. La policy UPDATE per gli studenti è
 * stata rimossa (vedi migrazione 0016); la lettura iniziale usa ancora il
 * client dell'utente, così la verifica "è davvero la sua
 * submission" resta intatta tramite RLS SELECT.
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
          /* no-op: il route handler non deve aggiornare i cookie in uscita qui */
        },
        remove() {
          /* no-op */
        }
      }
    }
  )

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Formato JSON non valido.' }, { status: 400 })
  }

  if (!rawBody || typeof rawBody !== 'object') {
    return NextResponse.json({ error: 'Body non valido.' }, { status: 400 })
  }

  const { submissionId, consegna: rawConsegna } = rawBody as Record<string, unknown>

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (typeof submissionId !== 'string' || !UUID_RE.test(submissionId)) {
    return NextResponse.json({ error: 'submissionId deve essere un UUID valido.' }, { status: 400 })
  }

  const consegna = typeof rawConsegna === 'string' && rawConsegna.trim().length > 0
    ? rawConsegna.slice(0, 2000)
    : undefined

  const { data: submission, error: fetchError } = await supabase
    .from('submissions')
    .select('id, testo_studente, tipo, valutazione_ia')
    .eq('id', submissionId)
    .single()

  // RLS garantisce che si possa leggere solo la propria submission; se non
  // esiste o non è dell'utente, fetchError o submission sarà null.
  if (fetchError || !submission) {
    return NextResponse.json({ error: 'Submission non trovata.' }, { status: 404 })
  }

  if (submission.tipo !== 'scrittura_libera' && submission.tipo !== 'scrittura_personalizzata') {
    return NextResponse.json(
      { error: 'Questo endpoint valuta solo submissions di tipo scrittura.' },
      { status: 400 }
    )
  }

  if (submission.valutazione_ia) {
    return NextResponse.json(
      { error: 'Questa submission è già stata valutata.' },
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

    if (!submission.testo_studente) {
      return NextResponse.json({ error: 'Testo della submission non trovato.' }, { status: 422 })
    }

    const valutazione = await evaluateScritturaLibera(
      submission.testo_studente,
      profile?.livello_target ?? undefined,
      consegna
    )

    const admin = createAdminClient()

    const { error: updateError } = await admin
      .from('submissions')
      .update({
        valutazione_ia: valutazione,
        valutazione_completed_at: new Date().toISOString()
      })
      .eq('id', submissionId)

    if (updateError) {
      throw updateError
    }

    // Controlla se lo studente ha raggiunto il livello obiettivo del docente.
    // Errori qui non bloccano la risposta — la valutazione è già salvata.
    try {
      const LIVELLO_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
      const livelloStudente = valutazione.livello_stimato
      const livelloIdx = LIVELLO_ORDER.indexOf(livelloStudente)

      if (livelloIdx !== -1) {
        const { data: membership } = await admin
          .from('class_memberships')
          .select('teacher_id')
          .eq('student_id', userData.user.id)
          .is('left_at', null)
          .limit(1)
          .maybeSingle()

        if (membership?.teacher_id) {
          const { data: teacherProfile } = await admin
            .from('profiles')
            .select('livello_obiettivo_classe')
            .eq('id', membership.teacher_id)
            .single()

          const obiettivo = teacherProfile?.livello_obiettivo_classe
          if (obiettivo) {
            const obiettivoIdx = LIVELLO_ORDER.indexOf(obiettivo)
            if (livelloIdx >= obiettivoIdx) {
              // Se lo studente ha già visto questo traguardo con un docente
              // precedente, non va notificato di nuovo (evita doppia notifica
              // dopo un cambio docente).
              const { data: prevAchievement } = await admin
                .from('level_achievements')
                .select('seen_by_student')
                .eq('student_id', userData.user.id)
                .eq('livello', obiettivo)
                .eq('seen_by_student', true)
                .limit(1)
                .maybeSingle()

              const alreadySeenByStudent = prevAchievement !== null

              const { error: upsertError } = await admin.from('level_achievements').upsert(
                {
                  student_id: userData.user.id,
                  teacher_id: membership.teacher_id,
                  livello: obiettivo,
                  seen_by_student: alreadySeenByStudent,
                  seen_by_teacher: false
                },
                { onConflict: 'student_id,teacher_id,livello', ignoreDuplicates: true }
              )
              if (upsertError) {
                console.error('Errore salvando traguardo livello (non bloccante):', upsertError)
              }
            }
          }
        }
      }
    } catch (achievementErr) {
      console.error('Errore controllando traguardo livello:', achievementErr)
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
