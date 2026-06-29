'use server'

import { createClient } from '@/lib/supabase/server'
import { getLivelloTarget } from '@/lib/student/livello'
import { checkSubmissionRateLimit } from '@/lib/student/rate-limit'
import { requireApprovedStudentActionUserId } from '@/lib/student/guard'
import {
  generateEsercizioStruttura1,
  evaluateEsercizioStruttura1,
  generateEsercizioStruttura2,
  evaluateEsercizioStruttura2,
  generateEsercizioStruttura3,
  evaluateEsercizioStruttura3,
  generateEsercizioStruttura4,
  evaluateEsercizioStruttura4,
  generateEsercizioStruttura5,
  evaluateEsercizioStruttura5,
  generateEsercizioStruttura6,
  evaluateEsercizioStruttura6,
  generateEsercizioStruttura7,
  evaluateEsercizioStruttura7,
  generateEsercizioStruttura8,
  evaluateEsercizioStruttura8,
  type FraseDaCompletare,
  type FrasiDaRiordinare,
  type DomandePreposizione,
  type FrasiDaTrasformare,
  type CompletamentoLessicale,
  type SituazioniComunicative,
  type ValutazioneRisposteStruttura,
  type ClozeTestoB1,
  type SceltaMorfosint,
  type ValutazioneCloze
} from '@/lib/gemini/prompts/struttura'

async function requireStudentAndCheckLimit(): Promise<string> {
  const userId = await requireApprovedStudentActionUserId()
  await checkSubmissionRateLimit(userId)
  return userId
}

export async function startEsercizio1(): Promise<FraseDaCompletare> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura1(await getLivelloTarget())
}
export async function startEsercizio2(): Promise<FrasiDaRiordinare> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura2(await getLivelloTarget())
}
export async function startEsercizio3(): Promise<DomandePreposizione> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura3(await getLivelloTarget())
}
export async function startEsercizio4(): Promise<FrasiDaTrasformare> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura4(await getLivelloTarget())
}
export async function startEsercizio5(): Promise<CompletamentoLessicale> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura5(await getLivelloTarget())
}
export async function startEsercizio6(): Promise<SituazioniComunicative> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura6(await getLivelloTarget())
}

async function persistSubmission(tipo: string, testo: string, valutazione: ValutazioneRisposteStruttura) {
  const supabase = createClient()
  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData.user) throw new Error('Non autenticato.')

  await supabase.from('submissions').insert({
    student_id: userData.user.id,
    tipo,
    testo_studente: testo,
    valutazione_ia: valutazione,
    valutazione_completed_at: new Date().toISOString()
  })
}

export async function submitEsercizio1(
  frasi: FraseDaCompletare['frasi'],
  risposte: { id: string; risposta_studente: string }[]
) {
  const valutazione = await evaluateEsercizioStruttura1(frasi, risposte)
  await persistSubmission(
    'esercizio_struttura_1',
    risposte.map((r) => `${r.id}: ${r.risposta_studente}`).join(' | '),
    valutazione
  )
  return valutazione
}

export async function submitEsercizio2(
  frasi: FrasiDaRiordinare['frasi'],
  risposte: { id: string; ordine_studente: string[] }[]
) {
  const valutazione = await evaluateEsercizioStruttura2(frasi, risposte)
  await persistSubmission(
    'esercizio_struttura_2',
    risposte.map((r) => `${r.id}: ${r.ordine_studente.join(' ')}`).join(' | '),
    valutazione
  )
  return valutazione
}

export async function submitEsercizio3(
  domande: DomandePreposizione['domande'],
  risposte: { id: string; opzione_scelta: string }[]
) {
  const valutazione = await evaluateEsercizioStruttura3(domande, risposte)
  await persistSubmission(
    'esercizio_struttura_3',
    risposte.map((r) => `${r.id}: ${r.opzione_scelta}`).join(' | '),
    valutazione
  )
  return valutazione
}

export async function submitEsercizio4(
  frasi: FrasiDaTrasformare['frasi'],
  risposte: { id: string; frase_trasformata: string }[]
) {
  const valutazione = await evaluateEsercizioStruttura4(frasi, risposte)
  await persistSubmission(
    'esercizio_struttura_4',
    risposte.map((r) => `${r.id}: ${r.frase_trasformata}`).join(' | '),
    valutazione
  )
  return valutazione
}

export async function submitEsercizio5(
  domande: CompletamentoLessicale['domande'],
  risposte: { id: string; opzione_scelta: string }[]
) {
  const valutazione = await evaluateEsercizioStruttura5(domande, risposte)
  await persistSubmission(
    'esercizio_struttura_5',
    risposte.map((r) => `${r.id}: ${r.opzione_scelta}`).join(' | '),
    valutazione
  )
  return valutazione
}

export async function submitEsercizio6(
  domande: SituazioniComunicative['domande'],
  risposte: { id: string; opzione_scelta: string }[]
) {
  const valutazione = await evaluateEsercizioStruttura6(domande, risposte)
  await persistSubmission(
    'esercizio_struttura_6',
    risposte.map((r) => `${r.id}: ${r.opzione_scelta}`).join(' | '),
    valutazione
  )
  return valutazione
}

export async function startEsercizio7(): Promise<ClozeTestoB1> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura7(await getLivelloTarget())
}

export async function submitEsercizio7(
  esercizio: ClozeTestoB1,
  risposte: { numero: number; opzione_scelta: string }[]
): Promise<ValutazioneCloze> {
  await requireApprovedStudentActionUserId()
  const valutazione = evaluateEsercizioStruttura7(esercizio.lacune, risposte)
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user) {
    await supabase.from('submissions').insert({
      student_id: userData.user.id,
      tipo: 'esercizio_struttura_7',
      testo_studente: risposte.map((r) => `[${r.numero}]: ${r.opzione_scelta}`).join(' | '),
      valutazione_ia: valutazione,
      valutazione_completed_at: new Date().toISOString()
    })
  }
  return valutazione
}

export async function startEsercizio8(): Promise<SceltaMorfosint> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura8(await getLivelloTarget())
}

export async function submitEsercizio8(
  esercizio: SceltaMorfosint,
  risposte: { id: string; opzione_scelta: string }[]
): Promise<ValutazioneCloze> {
  await requireApprovedStudentActionUserId()
  const valutazione = evaluateEsercizioStruttura8(esercizio.domande, risposte)
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user) {
    await supabase.from('submissions').insert({
      student_id: userData.user.id,
      tipo: 'esercizio_struttura_8',
      testo_studente: risposte.map((r) => `${r.id}: ${r.opzione_scelta}`).join(' | '),
      valutazione_ia: valutazione,
      valutazione_completed_at: new Date().toISOString()
    })
  }
  return valutazione
}
