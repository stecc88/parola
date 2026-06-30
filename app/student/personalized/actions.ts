'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TipoEsercizioPersonalizzato } from '@/lib/gemini/schema'
import { notifyTeacherOfDelivery } from '@/lib/email/teacherNotification'
import { requireApprovedStudentActionUserId } from '@/lib/student/guard'
import { checkSubmissionRateLimit } from '@/lib/student/rate-limit'

export interface EsercizioItem {
  domanda: string
  opzioni: string[]
  risposta_corretta: string
  spiegazione_risposta: string
}

export interface PersonalizedExerciseDetail {
  id: string
  tipo_esercizio: TipoEsercizioPersonalizzato
  titolo: string
  teoria: string
  spiegazione: string
  esempio: string
  consegna: string
  items: EsercizioItem[] | null
  submission_id: string | null
  risposte_studente: string[] | null
  punteggio_chiuso: number | null
  completato_at: string | null
  seen_by_student: boolean
  created_at: string
}

const SELECT_FIELDS =
  'id, student_id, tipo_esercizio, titolo, teoria, spiegazione, esempio, consegna, items, submission_id, risposte_studente, punteggio_chiuso, completato_at, seen_by_student, created_at'

export async function getMyPersonalizedExercises(): Promise<PersonalizedExerciseDetail[]> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, student_status')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'student') return []
  if (profile.student_status !== null && profile.student_status !== 'approved') return []

  const { data, error } = await supabase
    .from('personalized_exercises')
    .select(SELECT_FIELDS)
    .eq('student_id', userData.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore caricando gli esercizi personalizzati:', error)
    return []
  }

  return (data ?? []) as PersonalizedExerciseDetail[]
}

export async function getPersonalizedExerciseById(
  id: string
): Promise<PersonalizedExerciseDetail | null> {
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data, error } = await supabase
    .from('personalized_exercises')
    .select(SELECT_FIELDS)
    .eq('id', id)
    .single()

  if (error || !data) return null

  // Explicit ownership check — don't rely solely on RLS
  if ((data as { student_id: string }).student_id !== userData.user.id) return null

  return data as PersonalizedExerciseDetail
}

export async function getSubmissionValutazione(
  submissionId: string
): Promise<{ valutazione: unknown | null; testo: string } | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('submissions')
    .select('valutazione_ia, testo_studente')
    .eq('id', submissionId)
    .single()

  if (!data) return null
  return { valutazione: data.valutazione_ia ?? null, testo: data.testo_studente }
}

/**
 * Crea la submission per la consegna pratica di un esercizio personalizzato
 * di tipo "scrittura" e collega submission_id sull'esercizio. La
 * valutazione Gemini vera e propria avviene poi chiamando
 * /api/gemini/evaluate, esattamente come per la scrittura libera.
 */
export async function submitPersonalizedExerciseResponse(
  exerciseId: string,
  testo: string,
  consegna: string,
  segnali?: { testoIncollato: boolean; secondiScrittura: number | null }
): Promise<string> {
  const userId = await requireApprovedStudentActionUserId()
  await checkSubmissionRateLimit(userId)
  const supabase = createClient()

  const { data: submission, error: insertError } = await supabase
    .from('submissions')
    .insert({
      student_id: userId,
      tipo: 'scrittura_libera',
      testo_studente: testo,
      consegna,
      testo_incollato: segnali?.testoIncollato ?? false,
      secondi_scrittura: segnali?.secondiScrittura ?? null
    })
    .select('id')
    .single()

  if (insertError || !submission) {
    throw new Error('Errore salvando la risposta.')
  }

  // Client admin per questo UPDATE: la policy UPDATE per gli studenti su
  // personalized_exercises è stata rimossa (migrazione 0016) perché senza
  // restrizione di colonna a livello RLS uno studente poteva scrivere
  // qualsiasi valore (incluso punteggio_chiuso) chiamando direttamente
  // l'API REST di Supabase con la propria sessione.
  const { error: updateError } = await createAdminClient()
    .from('personalized_exercises')
    .update({ submission_id: submission.id, seen_by_teacher: false })
    .eq('id', exerciseId)
    .eq('student_id', userId)

  if (updateError) {
    throw new Error("Risposta salvata, ma errore collegando l'esercizio.")
  }

  await avvisaDocente(exerciseId, userId)

  return submission.id
}

/**
 * Corregge localmente le risposte di un esercizio a risposta chiusa
 * (completamento, scelta_multipla, abbinamento, trasformazione) — nessuna
 * chiamata a Gemini necessaria, il confronto è deterministico
 * (case-insensitive, spazi ai lati ignorati).
 */
export async function submitClosedExerciseAnswers(
  exerciseId: string,
  risposte: string[]
): Promise<{ punteggio: number }> {
  const userId = await requireApprovedStudentActionUserId()
  await checkSubmissionRateLimit(userId)
  const supabase = createClient()

  const { data: esercizio, error: fetchError } = await supabase
    .from('personalized_exercises')
    .select('items, student_id')
    .eq('id', exerciseId)
    .single()

  if (fetchError || !esercizio || !esercizio.items) {
    throw new Error('Esercizio non trovato.')
  }

  const items = esercizio.items as EsercizioItem[]
  const corretti = items.reduce((count, item, i) => {
    const risposta = (risposte[i] ?? '').trim().toLowerCase()
    const giusta = item.risposta_corretta.trim().toLowerCase()
    return risposta === giusta ? count + 1 : count
  }, 0)

  const punteggio = items.length > 0 ? Math.round((corretti / items.length) * 100) : 0

  // Client admin: vedi commento equivalente in submitPersonalizedExerciseResponse.
  // Qui è ancora più critico — senza questo uno studente poteva scrivere
  // punteggio_chiuso=100 senza rispondere correttamente a nulla.
  const { error: updateError } = await createAdminClient()
    .from('personalized_exercises')
    .update({
      risposte_studente: risposte,
      punteggio_chiuso: punteggio,
      completato_at: new Date().toISOString(),
      seen_by_teacher: false
    })
    .eq('id', exerciseId)
    .eq('student_id', userId)

  if (updateError) {
    throw new Error('Errore salvando le risposte.')
  }

  await avvisaDocente(exerciseId, userId)

  return { punteggio }
}

/**
 * Helper condiviso: recupera teacher_id/titolo dell'esercizio e il nome
 * dello studente, poi invia la notifica (in-app già aggiornata da
 * seen_by_teacher=false; qui solo l'email best-effort aggiuntiva).
 */
async function avvisaDocente(exerciseId: string, studentId: string) {
  try {
    const supabase = createClient()

    const [{ data: esercizio }, { data: profilo }] = await Promise.all([
      supabase
        .from('personalized_exercises')
        .select('teacher_id, titolo')
        .eq('id', exerciseId)
        .single(),
      supabase.from('profiles').select('nome, cognome').eq('id', studentId).single()
    ])

    if (!esercizio || !profilo) {
      console.warn('avvisaDocente: dati mancanti', { exerciseId, studentId, esercizio, profilo })
      return
    }

    await notifyTeacherOfDelivery({
      teacherId: esercizio.teacher_id,
      nomeStudente: `${profilo.nome} ${profilo.cognome}`,
      titoloEsercizio: esercizio.titolo,
      studentId
    })
  } catch (err) {
    console.error('Errore notificando il docente (non bloccante):', err, { exerciseId, studentId })
  }
}

/**
 * Quanti esercizi personalizzati nuovi (generati dal docente) lo studente
 * non ha ancora visto — per la campanella di notifiche.
 * Restituisce null se l'utente non è uno studente (così il componente
 * della campanella sa che non deve mostrarsi affatto, non solo mostrare 0).
 */
export async function getUnseenPersonalizedCount(): Promise<number | null> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, student_status')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'student') return null
  if (profile.student_status !== null && profile.student_status !== 'approved') return null

  const { count } = await supabase
    .from('personalized_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', userData.user.id)
    .eq('seen_by_student', false)

  return count ?? 0
}

/**
 * Marca come visti tutti gli esercizi personalizzati in sospeso dello
 * studente — chiamata all'entrata in /student/personalized, stesso schema
 * di markPersonalizedExercisesSeen lato docente.
 */
export async function markPersonalizedExercisesSeenByStudent() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return

  await supabase
    .from('personalized_exercises')
    .update({ seen_by_student: true })
    .eq('student_id', userData.user.id)
    .eq('seen_by_student', false)
}
