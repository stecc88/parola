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
  generateEsercizioStruttura9,
  evaluateEsercizioStruttura9,
  generateEsercizioStruttura10,
  evaluateEsercizioStruttura10,
  generateEsercizioStruttura11,
  evaluateEsercizioStruttura11,
  generateEsercizioStruttura12,
  evaluateEsercizioStruttura12,
  generateEsercizioStruttura13,
  evaluateEsercizioStruttura13,
  generateEsercizioStruttura14,
  evaluateEsercizioStruttura14,
  generateEsercizioStruttura15,
  evaluateEsercizioStruttura15,
  type FraseDaCompletare,
  type FrasiDaRiordinare,
  type DomandePreposizione,
  type FrasiDaTrasformare,
  type CompletamentoLessicale,
  type SituazioniComunicative,
  type ValutazioneRisposteStruttura,
  type ClozeTestoB1,
  type SceltaMorfosint,
  type ValutazioneCloze,
  type ClozePrepArticoli,
  type ClozeVerbi,
  type ValutazioneClozeVerbi,
  type ClozeTestoB2,
  type ClozePronomiB2,
  type ValutazioneClozePronomi,
  type SituazioniB2
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

// B2 actions

export async function startEsercizio9(): Promise<ClozePrepArticoli> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura9(await getLivelloTarget())
}

export async function submitEsercizio9(
  esercizio: ClozePrepArticoli,
  risposte: { numero: number; risposta: string }[]
): Promise<ValutazioneCloze> {
  await requireApprovedStudentActionUserId()
  const valutazione = evaluateEsercizioStruttura9(esercizio.lacune, risposte)
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user) {
    await supabase.from('submissions').insert({
      student_id: userData.user.id,
      tipo: 'esercizio_struttura_9',
      testo_studente: risposte.map((r) => `[${r.numero}]: ${r.risposta}`).join(' | '),
      valutazione_ia: valutazione,
      valutazione_completed_at: new Date().toISOString()
    })
  }
  return valutazione
}

export async function startEsercizio10(): Promise<ClozeVerbi> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura10(await getLivelloTarget())
}

export async function submitEsercizio10(
  esercizio: ClozeVerbi,
  risposte: { numero: number; risposta: string }[]
): Promise<ValutazioneClozeVerbi> {
  await requireApprovedStudentActionUserId()
  const valutazione = await evaluateEsercizioStruttura10(esercizio.lacune, risposte)
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user) {
    await supabase.from('submissions').insert({
      student_id: userData.user.id,
      tipo: 'esercizio_struttura_10',
      testo_studente: risposte.map((r) => `[${r.numero}]: ${r.risposta}`).join(' | '),
      valutazione_ia: valutazione,
      valutazione_completed_at: new Date().toISOString()
    })
  }
  return valutazione
}

export async function startEsercizio11(): Promise<ClozeTestoB2> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura11(await getLivelloTarget())
}

export async function submitEsercizio11(
  esercizio: ClozeTestoB2,
  risposte: { numero: number; opzione_scelta: string }[]
): Promise<ValutazioneCloze> {
  await requireApprovedStudentActionUserId()
  const valutazione = evaluateEsercizioStruttura11(esercizio.lacune, risposte)
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user) {
    await supabase.from('submissions').insert({
      student_id: userData.user.id,
      tipo: 'esercizio_struttura_11',
      testo_studente: risposte.map((r) => `[${r.numero}]: ${r.opzione_scelta}`).join(' | '),
      valutazione_ia: valutazione,
      valutazione_completed_at: new Date().toISOString()
    })
  }
  return valutazione
}

// B2 actions

export async function startEsercizio12(): Promise<ClozePronomiB2> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura12(await getLivelloTarget())
}

export async function submitEsercizio12(
  esercizio: ClozePronomiB2,
  risposte: { numero: number; risposta: string }[]
): Promise<ValutazioneClozePronomi> {
  await requireApprovedStudentActionUserId()
  const valutazione = await evaluateEsercizioStruttura12(esercizio.lacune, risposte)
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user) {
    await supabase.from('submissions').insert({
      student_id: userData.user.id,
      tipo: 'esercizio_struttura_12',
      testo_studente: risposte.map((r) => `[${r.numero}]: ${r.risposta}`).join(' | '),
      valutazione_ia: valutazione,
      valutazione_completed_at: new Date().toISOString()
    })
  }
  return valutazione
}

export async function startEsercizio13(): Promise<ClozeVerbi> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura13(await getLivelloTarget())
}

export async function submitEsercizio13(
  esercizio: ClozeVerbi,
  risposte: { numero: number; risposta: string }[]
): Promise<ValutazioneClozeVerbi> {
  await requireApprovedStudentActionUserId()
  const valutazione = await evaluateEsercizioStruttura13(esercizio.lacune, risposte)
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user) {
    await supabase.from('submissions').insert({
      student_id: userData.user.id,
      tipo: 'esercizio_struttura_13',
      testo_studente: risposte.map((r) => `[${r.numero}]: ${r.risposta}`).join(' | '),
      valutazione_ia: valutazione,
      valutazione_completed_at: new Date().toISOString()
    })
  }
  return valutazione
}

export async function startEsercizio14(): Promise<ClozeTestoB2> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura14(await getLivelloTarget())
}

export async function submitEsercizio14(
  esercizio: ClozeTestoB2,
  risposte: { numero: number; opzione_scelta: string }[]
): Promise<ValutazioneCloze> {
  await requireApprovedStudentActionUserId()
  const valutazione = evaluateEsercizioStruttura14(esercizio.lacune, risposte)
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user) {
    await supabase.from('submissions').insert({
      student_id: userData.user.id,
      tipo: 'esercizio_struttura_14',
      testo_studente: risposte.map((r) => `[${r.numero}]: ${r.opzione_scelta}`).join(' | '),
      valutazione_ia: valutazione,
      valutazione_completed_at: new Date().toISOString()
    })
  }
  return valutazione
}

export async function startEsercizio15(): Promise<SituazioniB2> {
  await requireStudentAndCheckLimit()
  return generateEsercizioStruttura15(await getLivelloTarget())
}

export async function submitEsercizio15(
  esercizio: SituazioniB2,
  risposte: { id: string; opzione_scelta: string }[]
): Promise<ValutazioneCloze> {
  await requireApprovedStudentActionUserId()
  const valutazione = evaluateEsercizioStruttura15(esercizio.domande, risposte)
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user) {
    await supabase.from('submissions').insert({
      student_id: userData.user.id,
      tipo: 'esercizio_struttura_15',
      testo_studente: risposte.map((r) => `${r.id}: ${r.opzione_scelta}`).join(' | '),
      valutazione_ia: valutazione,
      valutazione_completed_at: new Date().toISOString()
    })
  }
  return valutazione
}
