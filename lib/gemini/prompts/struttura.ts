import { generateStructuredContent } from '../client'
import { zodToGeminiSchema } from '../schema'
import { z } from 'zod'
import { descrizioneLivelloGenerazione } from '../cefrLevels'

/**
 * Los 4 tipi di esercizio di analisi delle strutture (contrato definitivo):
 *
 * 1. esercizio_struttura_1 — Completa la frase (cloze deletion)
 * 2. esercizio_struttura_2 — Riordina le parole (ricostruzione della frase)
 * 3. esercizio_struttura_3 — Scegli la preposizione corretta (scelta multipla)
 * 4. esercizio_struttura_4 — Trasforma la frase (cambio di tempo verbale)
 *
 * Cada tipo sigue el mismo patrón: generateEsercizioStrutturaN(livello) y
 * evaluateEsercizioStrutturaN(consegna, risposte), ambos usando structured
 * outputs nativos de Gemini. No mencionar nunca certificaciones específicas
 * en los prompts ni en el feedback generado.
 */

// ---------------------------------------------------------------------------
// TIPO 1 — Completa la frase
// ---------------------------------------------------------------------------

export const fraseDaCompletareSchema = z.object({
  frasi: z.array(
    z.object({
      id: z.string(),
      testo_con_buco: z.string(),
      contesto_grammaticale: z.string()
    })
  ).min(3).max(8)
})

export type FraseDaCompletare = z.infer<typeof fraseDaCompletareSchema>

export async function generateEsercizioStruttura1(livello: string): Promise<FraseDaCompletare> {
  const prompt = `Genera 5 frasi in italiano per un esercizio di completamento
(cloze) per uno studente di livello ${livello} che si prepara a superare
standard internazionali di lingua italiana. Ogni frase deve avere un buco
segnato con ___ e indicare tra parentesi il verbo o la struttura da usare.
Varia il contesto grammaticale (tempi verbali, preposizioni, concordanza).
${descrizioneLivelloGenerazione(livello)}

Non menzionare mai nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(fraseDaCompletareSchema),
    temperature: 0.6
  })
  const parsed = fraseDaCompletareSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

const valutazioneRisposteSchema = z.object({
  risultati: z.array(
    z.object({
      id: z.string(),
      corretto: z.boolean(),
      risposta_corretta: z.string(),
      feedback: z.string()
    })
  )
})

export type ValutazioneRisposteStruttura = z.infer<typeof valutazioneRisposteSchema>

export async function evaluateEsercizioStruttura1(
  frasi: FraseDaCompletare['frasi'],
  risposte: { id: string; risposta_studente: string }[]
): Promise<ValutazioneRisposteStruttura> {
  const prompt = `Valuta le risposte di uno studente a un esercizio di
completamento frasi in italiano. Per ogni frase, accetta varianti corrette
(sinonimi, forme equivalenti), non solo match esatto.

Frasi e risposte:
${frasi
  .map((f) => {
    const r = risposte.find((x) => x.id === f.id)
    return `- "${f.testo_con_buco}" (${f.contesto_grammaticale}) → risposta dello studente: "${r?.risposta_studente ?? ''}"`
  })
  .join('\n')}

Per ogni frase indica se è corretta, qual è la risposta corretta, e un
breve feedback didattico.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(valutazioneRisposteSchema),
    temperature: 0.2
  })
  const parsed = valutazioneRisposteSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

// ---------------------------------------------------------------------------
// TIPO 2 — Riordina le parole
// ---------------------------------------------------------------------------

export const frasiDaRiordinareSchema = z.object({
  frasi: z.array(
    z.object({
      id: z.string(),
      parole_disordinate: z.array(z.string()).min(3).max(12),
      contesto_grammaticale: z.string()
    })
  ).min(3).max(6)
})

export type FrasiDaRiordinare = z.infer<typeof frasiDaRiordinareSchema>

export async function generateEsercizioStruttura2(livello: string): Promise<FrasiDaRiordinare> {
  const prompt = `Genera 4 frasi in italiano per un esercizio di
ricostruzione (riordino delle parole) per uno studente di livello ${livello}
che si prepara a superare standard internazionali di lingua italiana. Per
ogni frase fornisci le parole in ordine SBAGLIATO (casuale, non l'ordine
corretto) come array di stringhe, e indica il contesto grammaticale che
l'ordine corretto evidenzia (es. posizione dell'aggettivo, ordine clitici,
struttura interrogativa).

${descrizioneLivelloGenerazione(livello)}

Non menzionare mai nomi di certificazioni
specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(frasiDaRiordinareSchema),
    temperature: 0.6
  })
  const parsed = frasiDaRiordinareSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

export async function evaluateEsercizioStruttura2(
  frasi: FrasiDaRiordinare['frasi'],
  risposte: { id: string; ordine_studente: string[] }[]
): Promise<ValutazioneRisposteStruttura> {
  const prompt = `Valuta le risposte di uno studente a un esercizio di
ricostruzione di frasi in italiano (riordino delle parole). Accetta anche
ordini alternativi se grammaticalmente corretti, non solo un singolo ordine
"giusto".

Frasi e risposte:
${frasi
  .map((f) => {
    const r = risposte.find((x) => x.id === f.id)
    return `- Parole date: [${f.parole_disordinate.join(', ')}] (${f.contesto_grammaticale}) → ordine dello studente: "${r?.ordine_studente.join(' ') ?? ''}"`
  })
  .join('\n')}

Per ogni frase indica se è corretta, qual è (una) frase corretta possibile,
e un breve feedback didattico.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(valutazioneRisposteSchema),
    temperature: 0.2
  })
  const parsed = valutazioneRisposteSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

// ---------------------------------------------------------------------------
// TIPO 3 — Scegli la preposizione corretta (scelta multipla)
// ---------------------------------------------------------------------------

export const domandePreposizioneSchema = z.object({
  domande: z.array(
    z.object({
      id: z.string(),
      testo_con_buco: z.string(),
      opzioni: z.array(z.string()).length(4)
    })
  ).min(4).max(8)
})

export type DomandePreposizione = z.infer<typeof domandePreposizioneSchema>

export async function generateEsercizioStruttura3(livello: string): Promise<DomandePreposizione> {
  const prompt = `Genera 5 domande a scelta multipla sulle preposizioni in
italiano per uno studente di livello ${livello} che si prepara a superare
standard internazionali di lingua italiana. Ogni domanda ha una frase con
un buco e 4 opzioni di preposizione (solo una corretta, le altre devono
essere errori comuni plausibili).

${descrizioneLivelloGenerazione(livello)}

Non menzionare mai nomi di certificazioni
specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(domandePreposizioneSchema),
    temperature: 0.6
  })
  const parsed = domandePreposizioneSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

export async function evaluateEsercizioStruttura3(
  domande: DomandePreposizione['domande'],
  risposte: { id: string; opzione_scelta: string }[]
): Promise<ValutazioneRisposteStruttura> {
  const prompt = `Valuta le risposte di uno studente a un esercizio a scelta
multipla sulle preposizioni in italiano.

Domande e risposte:
${domande
  .map((d) => {
    const r = risposte.find((x) => x.id === d.id)
    return `- "${d.testo_con_buco}" opzioni: [${d.opzioni.join(', ')}] → scelta dello studente: "${r?.opzione_scelta ?? ''}"`
  })
  .join('\n')}

Per ogni domanda indica se è corretta, qual è l'opzione corretta, e un breve
feedback didattico che spiega perché.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(valutazioneRisposteSchema),
    temperature: 0.1
  })
  const parsed = valutazioneRisposteSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

// ---------------------------------------------------------------------------
// TIPO 4 — Trasforma la frase (cambio di tempo verbale)
// ---------------------------------------------------------------------------

export const frasiDaTrasformareSchema = z.object({
  frasi: z.array(
    z.object({
      id: z.string(),
      frase_originale: z.string(),
      istruzione: z.string() // ej: "Trasforma al passato prossimo"
    })
  ).min(3).max(6)
})

export type FrasiDaTrasformare = z.infer<typeof frasiDaTrasformareSchema>

export async function generateEsercizioStruttura4(livello: string): Promise<FrasiDaTrasformare> {
  const prompt = `Genera 4 frasi in italiano per un esercizio di
trasformazione (cambio di tempo verbale, forma attiva/passiva o discorso
diretto/indiretto) per uno studente di livello ${livello} che si prepara a
superare standard internazionali di lingua italiana. Per ogni frase fornisci
la frase originale e un'istruzione chiara di trasformazione. Non menzionare
${descrizioneLivelloGenerazione(livello)}

mai nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(frasiDaTrasformareSchema),
    temperature: 0.6
  })
  const parsed = frasiDaTrasformareSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

export async function evaluateEsercizioStruttura4(
  frasi: FrasiDaTrasformare['frasi'],
  risposte: { id: string; frase_trasformata: string }[]
): Promise<ValutazioneRisposteStruttura> {
  const prompt = `Valuta le risposte di uno studente a un esercizio di
trasformazione di frasi in italiano. Accetta varianti corrette equivalenti.

Frasi e risposte:
${frasi
  .map((f) => {
    const r = risposte.find((x) => x.id === f.id)
    return `- "${f.frase_originale}" (${f.istruzione}) → risposta dello studente: "${r?.frase_trasformata ?? ''}"`
  })
  .join('\n')}

Per ogni frase indica se è corretta, qual è una trasformazione corretta
possibile, e un breve feedback didattico.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(valutazioneRisposteSchema),
    temperature: 0.2
  })
  const parsed = valutazioneRisposteSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

// ---------------------------------------------------------------------------
// TIPO 5 — Completamento lessicale a scelta multipla ⭐ fedele al formato
// reale dell'esame: stessa struttura della prova "Analisi delle strutture
// di comunicazione" che verifica il lessico (testo con buchi numerati,
// 4 opzioni semanticamente vicine per ognuno, solo una corretta nel
// contesto).
// ---------------------------------------------------------------------------

export const completamentoLessicaleSchema = z.object({
  testo_introduttivo: z.string(),
  domande: z
    .array(
      z.object({
        id: z.string(),
        testo_con_buco: z.string(),
        opzioni: z.array(z.string()).length(4)
      })
    )
    .min(4)
    .max(6)
})

export type CompletamentoLessicale = z.infer<typeof completamentoLessicaleSchema>

export async function generateEsercizioStruttura5(livello: string): Promise<CompletamentoLessicale> {
  const prompt = `Genera un esercizio di completamento lessicale a scelta
multipla in italiano per uno studente di livello ${livello} che si prepara
a superare standard internazionali di lingua italiana, nello stesso
formato della prova "Analisi delle strutture di comunicazione" che
verifica il lessico: un breve testo introduttivo (1-2 frasi di contesto),
poi 4-6 frasi con un buco numerato ciascuna, e per ognuna 4 opzioni di
parole semanticamente vicine tra loro (sinonimi parziali, parole dello
stesso campo semantico) di cui solo una è quella corretta nel contesto
specifico — le opzioni sbagliate devono essere parole plausibili, non
ovviamente sbagliate.

${descrizioneLivelloGenerazione(livello)}

Non menzionare mai nomi di certificazioni
specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(completamentoLessicaleSchema),
    temperature: 0.6
  })
  const parsed = completamentoLessicaleSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

export async function evaluateEsercizioStruttura5(
  domande: CompletamentoLessicale['domande'],
  risposte: { id: string; opzione_scelta: string }[]
): Promise<ValutazioneRisposteStruttura> {
  const prompt = `Valuta le risposte di uno studente a un esercizio di
completamento lessicale a scelta multipla in italiano.

Domande e risposte:
${domande
  .map((d) => {
    const r = risposte.find((x) => x.id === d.id)
    return `- "${d.testo_con_buco}" opzioni: [${d.opzioni.join(', ')}] → scelta dello studente: "${r?.opzione_scelta ?? ''}"`
  })
  .join('\n')}

Per ogni domanda indica se è corretta, qual è l'opzione corretta, e un breve
feedback didattico che spiega la differenza di significato/uso tra
l'opzione corretta e quella scelta (se diversa).`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(valutazioneRisposteSchema),
    temperature: 0.1
  })
  const parsed = valutazioneRisposteSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

// ---------------------------------------------------------------------------
// TIPO 6 — Situazioni comunicative ⭐ fedele al formato reale dell'esame:
// stessa struttura della prova "Analisi delle strutture di comunicazione"
// che verifica l'uso pragmatico della lingua (un'espressione/frase, 4
// situazioni di comunicazione possibili, solo una corretta).
// ---------------------------------------------------------------------------

export const situazioniComunicativeSchema = z.object({
  domande: z
    .array(
      z.object({
        id: z.string(),
        espressione: z.string(),
        opzioni: z.array(z.string()).length(4)
      })
    )
    .min(4)
    .max(8)
})

export type SituazioniComunicative = z.infer<typeof situazioniComunicativeSchema>

export async function generateEsercizioStruttura6(livello: string): Promise<SituazioniComunicative> {
  const prompt = `Genera un esercizio "situazioni comunicative" in italiano
per uno studente di livello ${livello} che si prepara a superare standard
internazionali di lingua italiana, nello stesso formato della prova
"Analisi delle strutture di comunicazione" che verifica l'uso pragmatico
della lingua: per ogni domanda, fornisci una breve espressione o frase che
qualcuno direbbe in una situazione reale (es. al bar, al telefono, in un
negozio, in un'email), e 4 opzioni che descrivono possibili situazioni di
comunicazione in cui quella frase potrebbe essere detta — solo una
corretta, le altre plausibili ma sbagliate (stesso contesto generale ma
dettaglio diverso, es. interlocutore o luogo diverso). Non menzionare mai
${descrizioneLivelloGenerazione(livello)}

nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(situazioniComunicativeSchema),
    temperature: 0.6
  })
  const parsed = situazioniComunicativeSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

export async function evaluateEsercizioStruttura6(
  domande: SituazioniComunicative['domande'],
  risposte: { id: string; opzione_scelta: string }[]
): Promise<ValutazioneRisposteStruttura> {
  const prompt = `Valuta le risposte di uno studente a un esercizio
"situazioni comunicative" in italiano (collegare un'espressione alla
situazione di comunicazione corretta).

Domande e risposte:
${domande
  .map((d) => {
    const r = risposte.find((x) => x.id === d.id)
    return `- "${d.espressione}" opzioni: [${d.opzioni.join(', ')}] → scelta dello studente: "${r?.opzione_scelta ?? ''}"`
  })
  .join('\n')}

Per ogni domanda indica se è corretta, qual è l'opzione corretta, e un breve
feedback didattico che spiega cosa rendeva plausibile/implausibile ogni
opzione.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(valutazioneRisposteSchema),
    temperature: 0.1
  })
  const parsed = valutazioneRisposteSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

// ---------------------------------------------------------------------------
// TIPO 7 — Cloze su testo ⭐ formato fedele CILS UNO-B1 "Analisi delle
// strutture": un brano autentico breve (~150 parole) con 10 lacune numerate,
// 4 opzioni morfosintattiche per ogni lacuna (articoli, pronomi, tempi
// verbali, preposizioni articolate, ecc.) secondo il sílabo B1.
// ---------------------------------------------------------------------------

const STRUTTURE_B1 = `Strutture morfosintattiche del sillabo B1 ufficiale:
- articoli determinativi e indeterminativi
- posizione e accordo dell'aggettivo qualificativo; comparativo e superlativo
- pronomi personali (forme toniche/atone), riflessivi
- pronomi relativi (che, cui, il quale)
- aggettivi e pronomi possessivi, dimostrativi, interrogativi
- indefiniti: ogni, ciascuno, nessuno, qualche
- preposizioni semplici e articolate (del, della, al, alla, dal, nel, ecc.)
- verbi: indicativo presente, indicativo passato prossimo, indicativo imperfetto,
  condizionale presente, imperativo, infinito presente
  (verbi regolari + dare, fare, stare, andare, potere, sapere, bere, dire, venire, modali)
- proposizioni subordinate: oggettive implicite (di + inf.), temporali (quando, mentre),
  causali (perché, dato che), relative esplicite (che, cui)
VIETATO nel sillabo B1: passato remoto, trapassato prossimo, futuro semplice/anteriore,
congiuntivo (qualsiasi tempo), condizionale passato, gerundio, participio assoluto`

export const clozeTestoSchema = z.object({
  titolo: z.string(),
  testo_con_lacune: z.string(),
  lacune: z.array(
    z.object({
      numero: z.number().int().min(1),
      opzioni: z.array(z.string()).length(4),
      risposta_corretta: z.string(),
      struttura_testata: z.string()
    })
  ).min(8).max(10)
})

export type ClozeTestoB1 = z.infer<typeof clozeTestoSchema>

export async function generateEsercizioStruttura7(livello: string): Promise<ClozeTestoB1> {
  const prompt = `Genera un esercizio di cloze su testo in italiano per uno
studente di livello ${livello} che si prepara a superare standard
internazionali di lingua italiana.

Formato esatto:
1. Un brano autentico e coerente di circa 150-180 parole su un argomento
   quotidiano (viaggio, lavoro, amicizia, città, cibo, ecc.)
2. 10 lacune numerate nel testo marcate come [1], [2], ..., [10]
3. Per ogni lacuna: 4 opzioni morfosintattiche (una sola corretta, le altre
   devono essere errori tipici e plausibili — mai opzioni ovviamente sbagliate)
4. Per ogni lacuna indica quale struttura del sílabo B1 viene testata

${STRUTTURE_B1}

${descrizioneLivelloGenerazione(livello)}

Il testo deve essere naturale e scorrevole anche con le lacune riempite
correttamente. Non menzionare mai nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(clozeTestoSchema),
    temperature: 0.6
  })
  const parsed = clozeTestoSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

const valutazioneClozeSchema = z.object({
  risultati: z.array(
    z.object({
      numero: z.number(),
      corretto: z.boolean(),
      risposta_corretta: z.string(),
      risposta_studente: z.string(),
      struttura_testata: z.string(),
      feedback: z.string()
    })
  ),
  punteggio: z.number().int().min(0).max(10)
})

export type ValutazioneCloze = z.infer<typeof valutazioneClozeSchema>

export function evaluateEsercizioStruttura7(
  lacune: ClozeTestoB1['lacune'],
  risposte: { numero: number; opzione_scelta: string }[]
): ValutazioneCloze {
  const risultati = lacune.map((l) => {
    const r = risposte.find((x) => x.numero === l.numero)
    const corretto =
      (r?.opzione_scelta ?? '').trim().toLowerCase() ===
      l.risposta_corretta.trim().toLowerCase()
    return {
      numero: l.numero,
      corretto,
      risposta_corretta: l.risposta_corretta,
      risposta_studente: r?.opzione_scelta ?? '',
      struttura_testata: l.struttura_testata,
      feedback: corretto
        ? `Corretto — ${l.struttura_testata}`
        : `La risposta corretta è "${l.risposta_corretta}" (${l.struttura_testata})`
    }
  })
  const punteggio = risultati.filter((r) => r.corretto).length
  return { risultati, punteggio }
}

// ---------------------------------------------------------------------------
// TIPO 8 — Scelta multipla morfosintattica ⭐ formato CILS B1: frasi
// isolate, ciascuna testa una struttura specifica del sílabo B1 con 4
// opzioni (articoli, forme verbali, pronomi, concordanza, ecc.).
// Le opzioni sbagliate devono essere errori tipici dei learner B1 italiani.
// ---------------------------------------------------------------------------

export const sceltaMorfosintSchema = z.object({
  domande: z.array(
    z.object({
      id: z.string(),
      frase_con_buco: z.string(),
      opzioni: z.array(z.string()).length(4),
      risposta_corretta: z.string(),
      struttura_testata: z.string()
    })
  ).min(8).max(10)
})

export type SceltaMorfosint = z.infer<typeof sceltaMorfosintSchema>

export async function generateEsercizioStruttura8(livello: string): Promise<SceltaMorfosint> {
  const prompt = `Genera 10 domande a scelta multipla morfosintattiche in
italiano per uno studente di livello ${livello} che si prepara a superare
standard internazionali di lingua italiana.

Formato esatto per ogni domanda:
- Una frase con un buco contrassegnato da ___
- 4 opzioni (lettere A/B/C/D come testo dell'opzione, non come etichetta)
- Una sola risposta corretta
- Le opzioni sbagliate devono essere errori tipici dei learner (non ovviamente
  sbagliate)
- Ogni domanda deve testare UNA struttura diversa del sílabo B1

${STRUTTURE_B1}

Copri strutture diverse nelle 10 domande: non ripetere mai la stessa struttura.
${descrizioneLivelloGenerazione(livello)}

Non menzionare mai nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(sceltaMorfosintSchema),
    temperature: 0.65
  })
  const parsed = sceltaMorfosintSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

export function evaluateEsercizioStruttura8(
  domande: SceltaMorfosint['domande'],
  risposte: { id: string; opzione_scelta: string }[]
): ValutazioneCloze {
  const risultati = domande.map((d, i) => {
    const r = risposte.find((x) => x.id === d.id)
    const corretto =
      (r?.opzione_scelta ?? '').trim().toLowerCase() ===
      d.risposta_corretta.trim().toLowerCase()
    return {
      numero: i + 1,
      corretto,
      risposta_corretta: d.risposta_corretta,
      risposta_studente: r?.opzione_scelta ?? '',
      struttura_testata: d.struttura_testata,
      feedback: corretto
        ? `Corretto — ${d.struttura_testata}`
        : `La risposta corretta è "${d.risposta_corretta}" (${d.struttura_testata})`
    }
  })
  const punteggio = risultati.filter((r) => r.corretto).length
  return { risultati, punteggio }
}

// STRUTTURE_B1 è definita sopra (usata anche da E7/E8)

// ---------------------------------------------------------------------------
// TIPO 9 — Cloze articoli e preposizioni su testo (B1) ⭐ Prova N.1
// Un brano autentico con ~18 lacune: alcune richiedono solo l'articolo,
// altre una preposizione semplice, altre una preposizione articolata.
// Le preposizioni semplici richieste sono indicate tra parentesi accanto
// alla lacuna, esattamente come nel formato d'esame B1.
// ---------------------------------------------------------------------------

export const clozePrepArticoliSchema = z.object({
  titolo: z.string(),
  testo_con_lacune: z.string(),
  lacune: z.array(
    z.object({
      numero: z.number().int().min(1),
      preposizione_suggerita: z.string().optional(),
      risposta_corretta: z.string(),
      tipo: z.enum(['articolo', 'preposizione_semplice', 'preposizione_articolata']),
      spiegazione: z.string()
    })
  ).min(15).max(20)
})

export type ClozePrepArticoli = z.infer<typeof clozePrepArticoliSchema>

export async function generateEsercizioStruttura9(livello: string): Promise<ClozePrepArticoli> {
  const prompt = `Genera un esercizio di cloze su articoli e preposizioni in
italiano per uno studente di livello ${livello} B1 che si prepara a superare
standard internazionali di lingua italiana.

Formato esatto (fedele alla Prova N.1 dell'esame B1):
1. Un brano autentico e coerente di 180-220 parole su un argomento di
   attualità, cultura, ambiente o vita quotidiana italiana.
2. 18 lacune numerate nel testo marcate come [N]. Per ogni lacuna:
   - Se richiede solo un articolo → nel testo: [N]
   - Se richiede una preposizione articolata → nel testo: (prep) [N]
     dove "prep" è la preposizione semplice di base
     es. "(in) [1]" → risposta corretta "nel"
   - Se richiede solo preposizione semplice senza articolo → [N]
3. Per ogni lacuna indica:
   - Il numero, la preposizione suggerita (se prep. articolata)
   - La risposta corretta esatta (es. "nel", "alla", "un", "di")
   - Il tipo: "articolo", "preposizione_semplice" o "preposizione_articolata"
   - Una breve spiegazione grammaticale

Varia: almeno 6 articoli (determinativi e indeterminativi), 4 preposizioni
semplici, 8 preposizioni articolate (del, della, nel, sulla, alla, ecc.).
Il testo deve contenere strutture grammaticali del sillabo B1 (indicativo
presente, passato prossimo, imperfetto, condizionale presente).
Non menzionare mai nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(clozePrepArticoliSchema),
    temperature: 0.55
  })
  const parsed = clozePrepArticoliSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

export function evaluateEsercizioStruttura9(
  lacune: ClozePrepArticoli['lacune'],
  risposte: { numero: number; risposta: string }[]
): ValutazioneCloze {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  const risultati = lacune.map((l) => {
    const r = risposte.find((x) => x.numero === l.numero)
    const corretto = normalize(r?.risposta ?? '') === normalize(l.risposta_corretta)
    const prepLabel = l.preposizione_suggerita ? ` (${l.preposizione_suggerita}+art.)` : ''
    return {
      numero: l.numero,
      corretto,
      risposta_corretta: l.risposta_corretta,
      risposta_studente: r?.risposta ?? '',
      struttura_testata: l.tipo + prepLabel,
      feedback: corretto
        ? `Corretto — ${l.spiegazione}`
        : `La risposta corretta è "${l.risposta_corretta}". ${l.spiegazione}`
    }
  })
  return { risultati, punteggio: risultati.filter((r) => r.corretto).length }
}

// ---------------------------------------------------------------------------
// TIPO 10 — Cloze verbi su testo (B1) ⭐ Prova N.2
// Un brano narrativo con ~13 lacune: ogni lacuna ha l'infinito del verbo
// tra parentesi, lo studente deve coniugare nel modo e tempo corretto.
// La valutazione usa Gemini perché i verbi irregolari e le varianti
// ortografiche richiedono giudizio contestuale.
// ---------------------------------------------------------------------------

export const clozeVerbiSchema = z.object({
  titolo: z.string(),
  testo_con_lacune: z.string(),
  lacune: z.array(
    z.object({
      numero: z.number().int().min(1),
      infinito: z.string(),
      risposta_corretta: z.string(),
      modo_tempo: z.string(),
      persona: z.string()
    })
  ).min(12).max(15)
})

export type ClozeVerbi = z.infer<typeof clozeVerbiSchema>

export async function generateEsercizioStruttura10(livello: string): Promise<ClozeVerbi> {
  const prompt = `Genera un esercizio di cloze sui verbi in italiano per uno
studente di livello ${livello} B1 che si prepara a superare standard
internazionali di lingua italiana.

Formato esatto (fedele alla Prova N.2 dell'esame B1):
1. Un brano narrativo di 150-180 parole (racconto in prima o terza persona,
   lettera, descrizione di un'abitudine o esperienza quotidiana).
2. 13 lacune numerate marcate come "(infinito) [N]" nel testo.
   Esempio: "(andare) [1]" → risposta "sono andato" oppure "vado".
3. Per ogni lacuna indica:
   - Il numero e l'infinito del verbo
   - La forma corretta coniugata
   - Il modo e tempo usando SOLO quelli del sillabo B1
   - La persona grammaticale (es. "1a singolare")

RISPETTA IL SILLABO B1 — usa SOLO questi tempi e modi:
- indicativo presente
- indicativo passato prossimo (essere/avere + participio)
- indicativo imperfetto
- condizionale presente
- imperativo
- infinito presente
NON usare MAI: passato remoto, trapassato prossimo, futuro semplice,
futuro anteriore, congiuntivo (nessun tempo), condizionale passato,
gerundio, participio assoluto.

Varia la distribuzione: almeno 4 passato prossimo, 3 imperfetto,
3 presente, 2 condizionale presente, 1 imperativo.
Include verbi irregolari del sillabo: andare, fare, stare, dare,
potere, sapere, bere, dire, venire e i verbi modali.
${STRUTTURE_B1}
Non menzionare mai nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(clozeVerbiSchema),
    temperature: 0.6
  })
  const parsed = clozeVerbiSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

const valutazioneClozeVerbiSchema = z.object({
  risultati: z.array(
    z.object({
      numero: z.number(),
      corretto: z.boolean(),
      risposta_corretta: z.string(),
      risposta_studente: z.string(),
      modo_tempo: z.string(),
      feedback: z.string()
    })
  ),
  punteggio: z.number().int().min(0).max(15)
})

export type ValutazioneClozeVerbi = z.infer<typeof valutazioneClozeVerbiSchema>

export async function evaluateEsercizioStruttura10(
  lacune: ClozeVerbi['lacune'],
  risposte: { numero: number; risposta: string }[]
): Promise<ValutazioneClozeVerbi> {
  const prompt = `Valuta le risposte di uno studente a un esercizio di
cloze verbale in italiano livello B1. Per ogni lacuna lo studente ha
ricevuto l'infinito e ha coniugato il verbo nel modo/tempo che riteneva
corretto. Accetta varianti ortografiche minori e forme grammaticalmente
equivalenti nel contesto.

Lacune e risposte:
${lacune
  .map((l) => {
    const r = risposte.find((x) => x.numero === l.numero)
    return `[${l.numero}] infinito:"${l.infinito}" | atteso:"${l.risposta_corretta}" (${l.modo_tempo}, ${l.persona}) | studente:"${r?.risposta ?? ''}"`
  })
  .join('\n')}

Per ogni lacuna restituisci: numero, se è corretta, la forma corretta,
la risposta dello studente, il modo/tempo, e un feedback didattico breve
in italiano che spiega il perché se sbagliata.
Il campo punteggio è il numero totale di risposte corrette (max ${lacune.length}).`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(valutazioneClozeVerbiSchema),
    temperature: 0.1
  })
  const parsed = valutazioneClozeVerbiSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

// ---------------------------------------------------------------------------
// TIPO 11 — Cloze lessicale scelta multipla B1 ⭐ Prova N.3
// Un brano di ~220 parole con 15 lacune lessicali (da [0] a [14]),
// 4 opzioni per ognuna. Più lungo e più ricco del B1 (Esercizio 7).
// ---------------------------------------------------------------------------

export const clozeTestoB2Schema = z.object({
  titolo: z.string(),
  testo_con_lacune: z.string(),
  lacune: z.array(
    z.object({
      numero: z.number().int().min(0),
      opzioni: z.array(z.string()).length(4),
      risposta_corretta: z.string(),
      campo_semantico: z.string()
    })
  ).min(13).max(16)
})

export type ClozeTestoB2 = z.infer<typeof clozeTestoB2Schema>

export async function generateEsercizioStruttura11(livello: string): Promise<ClozeTestoB2> {
  const prompt = `Genera un esercizio di cloze lessicale a scelta multipla
in italiano per uno studente di livello ${livello} B1 che si prepara a
superare standard internazionali di lingua italiana.

Formato esatto (fedele alla Prova N.3 dell'esame B1):
1. Un brano di 180-220 parole su un argomento di vita quotidiana, abitudini,
   viaggi, lavoro, ambiente o cultura italiana. Il testo deve usare strutture
   grammaticali del sillabo B1 (presente, passato prossimo, imperfetto,
   condizionale presente — NO congiuntivo, NO passato remoto, NO futuro).
2. 15 lacune numerate da [0] a [14] nel testo.
3. Per ogni lacuna: 4 opzioni lessicali dello stesso campo semantico,
   con sfumature diverse — solo una corretta nel contesto.
   Le opzioni sbagliate devono essere plausibili: sinonimi parziali,
   parole con radice simile, false analogie.
4. Per ogni lacuna indica il campo semantico testato.

Il vocabolario deve essere livello B1: parole di uso comune e frequente,
non rare né troppo elementari. Evita tecnicismi e lessico specialistico.
Non menzionare mai nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(clozeTestoB2Schema),
    temperature: 0.6
  })
  const parsed = clozeTestoB2Schema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

export function evaluateEsercizioStruttura11(
  lacune: ClozeTestoB2['lacune'],
  risposte: { numero: number; opzione_scelta: string }[]
): ValutazioneCloze {
  const normalize = (s: string) => s.trim().toLowerCase()
  const risultati = lacune.map((l) => {
    const r = risposte.find((x) => x.numero === l.numero)
    const corretto = normalize(r?.opzione_scelta ?? '') === normalize(l.risposta_corretta)
    return {
      numero: l.numero,
      corretto,
      risposta_corretta: l.risposta_corretta,
      risposta_studente: r?.opzione_scelta ?? '',
      struttura_testata: l.campo_semantico,
      feedback: corretto
        ? `Corretto — ${l.campo_semantico}`
        : `La risposta corretta è "${l.risposta_corretta}" (${l.campo_semantico})`
    }
  })
  return { risultati, punteggio: risultati.filter((r) => r.corretto).length }
}
