import { generateStructuredContent } from '../client'
import { zodToGeminiSchema } from '../schema'
import { z } from 'zod'
import { descrizioneLivelloGenerazione } from '../cefrLevels'

/** Sanitize a student answer before embedding in a prompt string.
 *  Truncates and escapes double-quotes to prevent prompt injection. */
function sa(text: string | null | undefined, max = 500): string {
  if (!text) return ''
  return text.slice(0, max).replace(/"/g, "'")
}

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

export const valutazioneRisposteSchema = z.object({
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
    return `- "${f.testo_con_buco}" (${f.contesto_grammaticale}) → risposta dello studente: "${sa(r?.risposta_studente)}"`
  })
  .join('\n')}

Per ogni frase indica se è corretta, qual è la risposta corretta, e un
feedback didattico di 2-3 frasi: spiega la struttura grammaticale o
lessicale applicata; se la risposta è sbagliata, descrivi l'errore e
fornisci la regola con un esempio o trucco mnemonico per ricordarlo.`

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
    return `- Parole date: [${f.parole_disordinate.join(', ')}] (${f.contesto_grammaticale}) → ordine dello studente: "${sa(r?.ordine_studente?.join(' '), 200)}"`
  })
  .join('\n')}

Per ogni frase indica se è corretta, qual è (una) frase corretta possibile,
e un feedback didattico di 2-3 frasi: spiega l'ordine sintattico corretto
e la regola che lo governa (posizione clitici, aggettivi, avverbi); se
sbagliata, indica quale elemento era fuori posto e perché.`

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
    return `- "${d.testo_con_buco}" opzioni: [${d.opzioni.join(', ')}] → scelta dello studente: "${sa(r?.opzione_scelta, 200)}"`
  })
  .join('\n')}

Per ogni domanda indica se è corretta, qual è l'opzione corretta, e un
feedback didattico di 2-3 frasi: spiega la collocazione preposizionale
corretta (es. "dipendere DA", "pensare A") e il motivo linguistico; se
sbagliata, contrasta con l'opzione scelta dallo studente.`

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
    return `- "${f.frase_originale}" (${f.istruzione}) → risposta dello studente: "${sa(r?.frase_trasformata)}"`
  })
  .join('\n')}

Per ogni frase indica se è corretta, qual è una trasformazione corretta
possibile, e un feedback didattico di 2-3 frasi: spiega la struttura
grammaticale applicata (tempo verbale, modo, concordanza); se sbagliata,
descrivi l'errore specifico e la regola per correggerlo.`

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
    return `- "${d.testo_con_buco}" opzioni: [${d.opzioni.join(', ')}] → scelta dello studente: "${sa(r?.opzione_scelta, 200)}"`
  })
  .join('\n')}

Per ogni domanda indica se è corretta, qual è l'opzione corretta, e un
feedback didattico di 2-3 frasi: spiega il significato esatto della
parola corretta nel contesto; se sbagliata, spiega perché l'opzione
scelta non funziona (registro, collocazione, sfumatura semantica).`

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
    return `- "${d.espressione}" opzioni: [${d.opzioni.join(', ')}] → scelta dello studente: "${sa(r?.opzione_scelta, 200)}"`
  })
  .join('\n')}

Per ogni domanda indica se è corretta, qual è l'opzione corretta, e un
feedback didattico di 2-3 frasi: spiega gli elementi pragmatici che
identificano la situazione giusta (chi parla, a chi, tramite quale mezzo,
in quale contesto); se sbagliata, spiega quale dettaglio smontava l'opzione
scelta dallo studente.`

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
      struttura_testata: z.string(),
      spiegazione: z.string().optional()
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
4. Per ogni lacuna indica:
   - quale struttura del sílabo B1 viene testata (campo struttura_testata)
   - una spiegazione grammaticale di 1-2 frasi: enuncia la regola applicata
     e spiega perché le altre opzioni sono errate (campo spiegazione)

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
        ? `✓ ${l.spiegazione ?? l.struttura_testata}`
        : `La risposta corretta è "${l.risposta_corretta}". ${l.spiegazione ?? l.struttura_testata}`
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
      struttura_testata: z.string(),
      spiegazione: z.string().optional()
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
- Per ogni domanda includi una spiegazione grammaticale di 1-2 frasi
  (campo spiegazione): enuncia la regola, spiega perché la risposta corretta
  è quella e cosa rende le altre opzioni sbagliate

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
        ? `✓ ${d.spiegazione ?? d.struttura_testata}`
        : `La risposta corretta è "${d.risposta_corretta}". ${d.spiegazione ?? d.struttura_testata}`
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
      tipo: z.string(),
      spiegazione: z.string()
    })
  ).min(8)
})

export type ClozePrepArticoli = z.infer<typeof clozePrepArticoliSchema>

export async function generateEsercizioStruttura9(livello: string): Promise<ClozePrepArticoli> {
  const prompt = `Genera un esercizio di cloze su articoli e preposizioni in
italiano per uno studente di livello ${livello} B1 che si prepara a superare
standard internazionali di lingua italiana.

Formato (fedele alla Prova N.1 dell'esame B1):
1. Un brano di 150-180 parole su un argomento di vita quotidiana italiana.
2. 12 lacune numerate nel testo marcate come [N]. Per ogni lacuna:
   - Se richiede solo un articolo → nel testo: [N]
   - Se richiede una preposizione articolata → nel testo: (prep) [N]
     dove "prep" è la preposizione semplice di base
     es. "(in) [1]" → risposta corretta "nel"
   - Se richiede solo preposizione semplice → [N]
3. Per ogni lacuna indica:
   - numero, preposizione_suggerita (solo se prep. articolata, altrimenti ometti il campo)
   - risposta_corretta esatta (es. "nel", "alla", "un", "di")
   - tipo: una di queste tre stringhe esatte: "articolo", "preposizione_semplice", "preposizione_articolata"
   - spiegazione grammaticale breve

Varia: almeno 4 articoli, 3 preposizioni semplici, 5 preposizioni articolate.
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
  ).min(8)
})

export type ClozeVerbi = z.infer<typeof clozeVerbiSchema>

export async function generateEsercizioStruttura10(livello: string): Promise<ClozeVerbi> {
  const prompt = `Genera un esercizio di cloze sui verbi in italiano per uno
studente di livello ${livello} B1 che si prepara a superare standard
internazionali di lingua italiana.

Formato (fedele alla Prova N.2 dell'esame B1):
1. Un brano narrativo di 120-150 parole (racconto, lettera, descrizione
   di un'abitudine o esperienza quotidiana).
2. 10 lacune numerate marcate come "(infinito) [N]" nel testo.
   Esempio: "(andare) [1]" → risposta "sono andato".
3. Per ogni lacuna indica: numero, infinito, risposta_corretta,
   modo_tempo, persona grammaticale.

Usa SOLO tempi B1: indicativo presente, passato prossimo, imperfetto,
condizionale presente, imperativo.
NON usare: passato remoto, futuro, congiuntivo, condizionale passato.
Varia: almeno 3 passato prossimo, 2 imperfetto, 2 presente, 1 condizionale,
1 imperativo, 1 a scelta.
Include verbi irregolari: andare, fare, essere, avere, venire, sapere.
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
  punteggio: z.number().int().min(0)
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
    return `[${l.numero}] infinito:"${l.infinito}" | atteso:"${l.risposta_corretta}" (${l.modo_tempo}, ${l.persona}) | studente:"${sa(r?.risposta, 200)}"`
  })
  .join('\n')}

Per ogni lacuna restituisci: numero, se è corretta, la forma corretta,
la risposta dello studente, il modo/tempo, e un feedback didattico di
2-3 frasi in italiano: spiega il modo/tempo corretto e il criterio di
scelta (azione completata vs in corso, anteriorità, ipotesi...); se
sbagliata, contrasta con la forma dello studente e spiega la differenza.
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
      opzioni: z.array(z.string()).min(2),
      risposta_corretta: z.string(),
      campo_semantico: z.string(),
      spiegazione: z.string().optional()
    })
  ).min(8)
})

export type ClozeTestoB2 = z.infer<typeof clozeTestoB2Schema>

export async function generateEsercizioStruttura11(livello: string): Promise<ClozeTestoB2> {
  const prompt = `Genera un esercizio di cloze lessicale a scelta multipla
in italiano per uno studente di livello ${livello} B1 che si prepara a
superare standard internazionali di lingua italiana.

Formato (fedele alla Prova N.3 dell'esame B1):
1. Un brano di 140-170 parole su un argomento di vita quotidiana italiana.
   Usa strutture B1: presente, passato prossimo, imperfetto, condizionale.
2. 12 lacune numerate da [0] a [11] nel testo.
3. Per ogni lacuna: esattamente 4 opzioni lessicali (stesso campo semantico,
   una sola corretta, le altre plausibili ma errate nel contesto).
4. Per ogni lacuna indica il campo semantico testato e una spiegazione
   lessicale di 1-2 frasi (campo spiegazione): spiega il significato
   preciso della parola corretta e perché le altre non si adattano al
   contesto (differenza semantica, collocazione o registro).

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
        ? `✓ ${l.spiegazione ?? l.campo_semantico}`
        : `La risposta corretta è "${l.risposta_corretta}". ${l.spiegazione ?? l.campo_semantico}`
    }
  })
  return { risultati, punteggio: risultati.filter((r) => r.corretto).length }
}

// ---------------------------------------------------------------------------
// Sillabo B2 ufficiale
// ---------------------------------------------------------------------------

const STRUTTURE_B2 = `Strutture morfosintattiche del sillabo B2 da rispettare
(includono tutto il B1 più):

Morfologia pronominale:
- pronomi allocutivi (Lei formale)
- pronomi e aggettivi indefiniti (chiunque, qualsiasi, alcuno, nessuno...)
- pronomi combinati (me lo, glielo, ce ne, ve lo...)
- particelle pronominali ci e ne

Morfologia verbale — TUTTI questi modi e tempi:
- indicativo presente, passato prossimo, imperfetto, passato remoto,
  trapassato prossimo, futuro semplice, futuro anteriore
- condizionale presente e passato
- congiuntivo presente e imperfetto
- infinito presente e passato
- imperativo
- forma passiva (essere + participio passato)
- verbi impersonali (bisogna, occorre, capita, sembra, pare, basta)

Sintassi:
- avverbi di giudizio e dubbio (forse, probabilmente, certamente, quasi, purtroppo)
- proposizioni coordinate disgiuntive (o, oppure), conclusive (quindi, perciò,
  dunque), correlative (sia... sia, né... né, o... o)
- proposizioni subordinate: soggettive (è bello che + congiuntivo), finali
  (affinché, perché + congiuntivo), comparative (come se + congiuntivo),
  condizionali ipotesi reale (se + indicativo), concessive esplicite
  (anche se, sebbene + congiuntivo), consecutive (così... che, tanto... da),
  temporali implicite (prima di, dopo, nel + infinito)`

// ---------------------------------------------------------------------------
// TIPO 12 — Cloze pronomi e aggettivi B2 ⭐ Prova N.1
// ---------------------------------------------------------------------------

export const clozePronomiB2Schema = z.object({
  titolo: z.string(),
  testo_con_lacune: z.string(),
  lacune: z.array(
    z.object({
      numero: z.number().int().min(1),
      risposta_corretta: z.string(),
      tipo: z.string(),
      spiegazione: z.string()
    })
  ).min(8)
})

export type ClozePronomiB2 = z.infer<typeof clozePronomiB2Schema>

const valutazioneClozePronomiSchema = z.object({
  risultati: z.array(
    z.object({
      numero: z.number(),
      corretto: z.boolean(),
      risposta_corretta: z.string(),
      risposta_studente: z.string(),
      tipo: z.string(),
      feedback: z.string()
    })
  ),
  punteggio: z.number().int().min(0)
})

export type ValutazioneClozePronomi = z.infer<typeof valutazioneClozePronomiSchema>

export async function generateEsercizioStruttura12(livello: string): Promise<ClozePronomiB2> {
  const prompt = `Genera un esercizio di cloze su pronomi e aggettivi in
italiano per uno studente di livello ${livello} B2 che si prepara a superare
standard internazionali di lingua italiana.

Formato (fedele alla Prova N.1 dell'esame B2):
1. Un brano narrativo di 160-200 parole (storia di una persona, articolo
   di cronaca, esperienza personale) con registro medio-alto.
2. 12 lacune numerate marcate come [N]. Ogni lacuna richiede uno tra:
   pronome personale atono (lo, la, gli, ci, ne, si...), pronome tonico
   (lui, lei, sé...), pronome combinato (me lo, glielo, ce ne...),
   aggettivo/pronome possessivo, dimostrativo, relativo o indefinito.
3. Per ogni lacuna indica: numero, risposta_corretta, tipo (es. "pronome
   atono oggetto diretto"), spiegazione grammaticale breve.

Varia i tipi: almeno 4 pronomi atoni, 3 possessivi, 2 combinati,
2 relativi, 1 indefinito.
Non menzionare mai nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(clozePronomiB2Schema),
    temperature: 0.55
  })
  const parsed = clozePronomiB2Schema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

export async function evaluateEsercizioStruttura12(
  lacune: ClozePronomiB2['lacune'],
  risposte: { numero: number; risposta: string }[]
): Promise<ValutazioneClozePronomi> {
  const prompt = `Valuta le risposte di uno studente a un esercizio di cloze
su pronomi e aggettivi in italiano livello B2. Accetta varianti
grammaticalmente equivalenti (es. "a lui" = "gli").

Lacune e risposte:
${lacune
  .map((l) => {
    const r = risposte.find((x) => x.numero === l.numero)
    return `[${l.numero}] tipo:"${l.tipo}" | atteso:"${l.risposta_corretta}" | studente:"${sa(r?.risposta, 200)}"`
  })
  .join('\n')}

Restituisci per ogni lacuna: numero, corretto, risposta_corretta,
risposta_studente, tipo, feedback didattico di 2-3 frasi in italiano:
spiega la funzione grammaticale del pronome/aggettivo corretto; se
sbagliato, spiega la differenza tra la forma scelta e quella corretta
(es. atono vs tonico, oggetto diretto vs indiretto, combinazione errata).
Il campo punteggio è il totale corretto (max ${lacune.length}).`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(valutazioneClozePronomiSchema),
    temperature: 0.1
  })
  const parsed = valutazioneClozePronomiSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Valutazione non valida: ${parsed.error.message}`)
  return parsed.data
}

// ---------------------------------------------------------------------------
// TIPO 13 — Cloze verbi B2 ⭐ Prova N.2
// Stesso formato di E10 ma con TUTTI i tempi del sillabo B2.
// ---------------------------------------------------------------------------

export async function generateEsercizioStruttura13(livello: string): Promise<ClozeVerbi> {
  const prompt = `Genera un esercizio di cloze sui verbi in italiano per uno
studente di livello ${livello} B2 che si prepara a superare standard
internazionali di lingua italiana.

Formato (fedele alla Prova N.2 dell'esame B2):
1. Un brano narrativo/descrittivo di 150-180 parole su un evento culturale,
   tradizione o articolo di attualità italiana.
2. 12 lacune marcate come "(infinito) [N]" nel testo.
3. Per ogni lacuna: numero, infinito, risposta_corretta, modo_tempo, persona.

Usa la varietà B2 — almeno:
- 2 passato remoto, 2 congiuntivo (presente o imperfetto),
- 2 futuro (semplice o anteriore), 2 condizionale (presente o passato),
- 2 imperfetto o trapassato, 2 presente indicativo.
Includi verbi irregolari e passiva (essere + participio).
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

export async function evaluateEsercizioStruttura13(
  lacune: ClozeVerbi['lacune'],
  risposte: { numero: number; risposta: string }[]
): Promise<ValutazioneClozeVerbi> {
  const prompt = `Valuta le risposte di uno studente a un esercizio di
cloze verbale in italiano livello B2. Accetta varianti ortografiche minori
e forme grammaticalmente equivalenti nel contesto.

Lacune e risposte:
${lacune
  .map((l) => {
    const r = risposte.find((x) => x.numero === l.numero)
    return `[${l.numero}] infinito:"${l.infinito}" | atteso:"${l.risposta_corretta}" (${l.modo_tempo}, ${l.persona}) | studente:"${sa(r?.risposta, 200)}"`
  })
  .join('\n')}

Per ogni lacuna restituisci: numero, corretto, risposta_corretta,
risposta_studente, modo_tempo, feedback didattico di 2-3 frasi in
italiano: spiega il modo/tempo corretto e la regola che lo richiede
(consecutio, aspetto verbale, sfumatura modale); se sbagliato, contrasta
con la forma dello studente e fornisci l'esempio corretto.
Il campo punteggio è il totale corretto (max ${lacune.length}).`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(valutazioneClozeVerbiSchema),
    temperature: 0.1
  })
  const parsed = valutazioneClozeVerbiSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Valutazione non valida: ${parsed.error.message}`)
  return parsed.data
}

// ---------------------------------------------------------------------------
// TIPO 14 — Cloze lessicale scelta multipla B2 ⭐ Prova N.3
// Stesso schema di E11 ma con vocabolario e contenuti B2.
// ---------------------------------------------------------------------------

export async function generateEsercizioStruttura14(livello: string): Promise<ClozeTestoB2> {
  const prompt = `Genera un esercizio di cloze lessicale a scelta multipla
in italiano per uno studente di livello ${livello} B2 che si prepara a
superare standard internazionali di lingua italiana.

Formato (fedele alla Prova N.3 dell'esame B2):
1. Un brano di 180-220 parole su un argomento culturale, tecnologico o
   di attualità italiana (storia recente, innovazione, media, economia,
   tradizioni). Usa registro medio-alto con strutture sintattiche complesse.
2. 12 lacune numerate da [0] a [11] nel testo.
3. Per ogni lacuna: esattamente 4 opzioni lessicali — una corretta, le
   altre plausibili ma sbagliate nel contesto (sinonimi parziali, false
   analogie, parole con radice simile).
4. Indica il campo semantico testato per ogni lacuna e una spiegazione
   lessicale di 1-2 frasi (campo spiegazione): spiega il significato
   esatto della parola corretta nel contesto e la differenza rispetto
   alle opzioni sbagliate (registro, collocazione, sfumatura semantica).

Vocabolario B2: lessico specifico e registri variati, collocazioni,
verbi frasali, espressioni idiomatiche di uso comune.
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

export function evaluateEsercizioStruttura14(
  lacune: ClozeTestoB2['lacune'],
  risposte: { numero: number; opzione_scelta: string }[]
): ValutazioneCloze {
  return evaluateEsercizioStruttura11(lacune, risposte)
}

// ---------------------------------------------------------------------------
// TIPO 15 — Situazioni comunicative B2 ⭐ Prova N.4
// Dato un testo/espressione, scegliere la situazione comunicativa corretta.
// Schema con risposta_corretta → valutazione deterministica.
// ---------------------------------------------------------------------------

export const situazioniB2Schema = z.object({
  domande: z.array(
    z.object({
      id: z.string(),
      espressione: z.string(),
      opzioni: z.array(z.string()).min(2),
      risposta_corretta: z.string(),
      spiegazione: z.string()
    })
  ).min(6)
})

export type SituazioniB2 = z.infer<typeof situazioniB2Schema>

export async function generateEsercizioStruttura15(livello: string): Promise<SituazioniB2> {
  const prompt = `Genera un esercizio "situazioni comunicative" in italiano
per uno studente di livello ${livello} B2 che si prepara a superare
standard internazionali di lingua italiana.

Formato (fedele alla Prova N.4 dell'esame B2):
Genera 8 domande. Per ogni domanda:
1. "espressione": un testo autentico di 2-5 righe (annuncio, SMS, email,
   avviso, comunicato, cartello, messaggio vocale trascritto) con registro
   variato (formale, informale, burocratico, commerciale).
2. "opzioni": esattamente 4 descrizioni della situazione comunicativa —
   chi parla/scrive, a chi, dove, tramite quale canale. Solo una corretta;
   le altre sbagliate per un dettaglio specifico (persona, luogo, mezzo).
3. "risposta_corretta": testo ESATTO dell'opzione corretta tra le 4.
4. "spiegazione": perché quella è la situazione giusta.
5. "id": "q1", "q2", ...

Varia i contesti: negozio, ufficio, telefono, internet, aeroporto,
ospedale, banca, università, famiglia, lavoro, media.
Non menzionare mai nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(situazioniB2Schema),
    temperature: 0.65
  })
  const parsed = situazioniB2Schema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

// ---------------------------------------------------------------------------
// Sillabo C1 ufficiale
// ---------------------------------------------------------------------------

const STRUTTURE_C1 = `Strutture del sillabo C1 (include tutto B2 più):

Morfologia verbale avanzata:
- congiuntivo passato (abbia fatto) e trapassato (avesse fatto)
- gerundio presente (facendo) e passato (avendo fatto)
- participio presente (seguente, corrente) e assoluto (arrivato il treno, partì)
- forma passiva con venire + participio (viene letto) e andare + participio (va rispettato)
- verbi pronominali (farcela, prendersela, cavarsela, andarsene)
- verbi fraseologici (stare per, stare + gerundio, finire per, tornare a, continuare a)
- verbi difettivi: solere (solitamente, era solito)

Sintassi complessa:
- frasi condizionali: ipotesi possibile (se venisse, porterei) e irreale nel passato
  (se fosse venuto, avrei portato)
- condizionali implicite (a + infinito, con + nome)
- consecutive implicite (tanto da + infinito, da + infinito)
- concessive implicite (pur + gerundio, nonostante + infinito)
- modali implicite (gerundio, participio passato in funzione modale)
- avversative (mentre, laddove, al contrario, invece)
- incidentali (tra virgole o trattini)
- esclusive (tranne che, a meno che non, eccetto che)
- limitative (per quanto + congiuntivo, nei limiti in cui)
- nominalizzazione (la crescita = il fatto che cresca)
- discorso indiretto con consecutio temporum completa`

// ---------------------------------------------------------------------------
// TIPO 16 — Cloze verbi C1 ⭐ Prova N.2 C1
// Stesso schema di E10/E13 ma con tutti i tempi/modi C1 incluso
// gerundio, congiuntivo passato/trapassato, participio, passiva avanzata.
// ---------------------------------------------------------------------------

export async function generateEsercizioStruttura16(livello: string): Promise<ClozeVerbi> {
  const prompt = `Genera un esercizio di cloze sui verbi in italiano per uno
studente di livello ${livello} C1 che si prepara a superare standard
internazionali di lingua italiana.

Formato (fedele alla Prova N.2 dell'esame C1):
1. Un brano narrativo/argomentativo di 200-240 parole su un argomento
   culturale, storico o di attualità italiana (personaggio famoso, evento
   storico, questione sociale, tema artistico).
2. 15 lacune marcate come "(infinito) [N]" nel testo.
3. Per ogni lacuna: numero, infinito, risposta_corretta, modo_tempo, persona.

Usa la varietà C1 — obbligatori:
- almeno 3 congiuntivo (presente, passato o trapassato)
- almeno 2 gerundio (presente o passato, "avendo fatto", "facendo")
- almeno 2 participio passato in costruzione assoluta o passiva con venire/andare
- almeno 2 condizionale (presente o passato)
- almeno 2 passato remoto o trapassato
- i restanti: futuro anteriore, imperativo, presente
Includi verbi pronominali (farcela, prendersela), verbi fraseologici
(stare per, finire per), discorso indiretto.

${STRUTTURE_C1}

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

export async function evaluateEsercizioStruttura16(
  lacune: ClozeVerbi['lacune'],
  risposte: { numero: number; risposta: string }[]
): Promise<ValutazioneClozeVerbi> {
  const prompt = `Valuta le risposte di uno studente a un esercizio di
cloze verbale in italiano livello C1. Accetta varianti ortografiche minori,
sinonimi morfologicamente equivalenti, e costruzioni alternative corrette
nel contesto (es. forma attiva/passiva equivalente, gerundio vs participio
in funzione analoga).

Lacune e risposte:
${lacune
    .map((l) => {
      const r = risposte.find((x) => x.numero === l.numero)
      return `[${l.numero}] infinito:"${l.infinito}" | atteso:"${l.risposta_corretta}" (${l.modo_tempo}, ${l.persona}) | studente:"${sa(r?.risposta, 200)}"`
    })
    .join('\n')}

Per ogni lacuna restituisci: numero, corretto, risposta_corretta,
risposta_studente, modo_tempo, feedback didattico di 2-3 frasi in
italiano: spiega la costruzione C1 corretta (gerundio passato, congiuntivo
trapassato, passiva con venire/andare, participio assoluto...) e il valore
semantico che esprime; se sbagliato, indica l'errore e la regola con un
esempio alternativo per consolidare.
Il campo punteggio è il totale corretto (max ${lacune.length}).`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(valutazioneClozeVerbiSchema),
    temperature: 0.1
  })
  const parsed = valutazioneClozeVerbiSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Valutazione non valida: ${parsed.error.message}`)
  return parsed.data
}

// ---------------------------------------------------------------------------
// TIPO 17 — Cloze connettivi e strutture testuali C1 ⭐ Prova N.1 C1
// Brano con lacune che richiedono connettivi, pronomi, avverbi, sintagmi
// e strutture sintattiche complesse (non solo verbi).
// Valutazione Gemini perché le risposte sono testo libero.
// ---------------------------------------------------------------------------

export const clozeTestoC1Schema = z.object({
  titolo: z.string(),
  testo_con_lacune: z.string(),
  lacune: z.array(
    z.object({
      numero: z.number().int().min(1),
      risposta_corretta: z.string(),
      struttura: z.string(),
      spiegazione: z.string()
    })
  ).min(10)
})

export type ClozeTestoC1 = z.infer<typeof clozeTestoC1Schema>

const valutazioneClozeC1Schema = z.object({
  risultati: z.array(
    z.object({
      numero: z.number(),
      corretto: z.boolean(),
      risposta_corretta: z.string(),
      risposta_studente: z.string(),
      struttura: z.string(),
      feedback: z.string()
    })
  ),
  punteggio: z.number().int().min(0)
})

export type ValutazioneClozeC1 = z.infer<typeof valutazioneClozeC1Schema>

export async function generateEsercizioStruttura17(livello: string): Promise<ClozeTestoC1> {
  const prompt = `Genera un esercizio di completamento testuale in italiano
per uno studente di livello ${livello} C1 che si prepara a superare standard
internazionali di lingua italiana.

Formato (fedele alla Prova N.1 dell'esame C1):
1. Un brano argomentativo/espositivo di 220-260 parole su un argomento
   di attualità italiana (ambiente, cultura, società, scienza, storia).
   Registro formale-giornalistico.
2. 12-15 lacune numerate [N] distribuite nel testo. Ogni lacuna richiede UNA
   delle seguenti strutture (VARIA, non ripetere lo stesso tipo più di 3 volte):
   - connettivi discorsivi (tuttavia, ciononostante, d'altronde, eppure,
     a meno che, nonostante, affinché, purché, sebbene, benché)
   - pronomi relativi complessi (il cui, la quale, nei quali, da cui)
   - costruzioni gerundiali (avendo compreso, pur essendo)
   - nominalizzazioni (es. "la realizzazione" per "realizzare")
   - sintagmi preposizionali di testo (in seguito a, a causa di, dal momento che)
   - forme passive con venire/andare (viene considerato, va rispettato)
   - congiuntivo in subordinate (sebbene fosse, affinché siano)
3. Per ogni lacuna: numero, risposta_corretta (la parola/frase esatta),
   struttura (tipo di elemento sintattico/lessicale), spiegazione breve.

${STRUTTURE_C1}

Il testo deve essere coerente e coeso sia con le lacune vuote che riempite.
Non menzionare mai nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(clozeTestoC1Schema),
    temperature: 0.6
  })
  const parsed = clozeTestoC1Schema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

export async function evaluateEsercizioStruttura17(
  lacune: ClozeTestoC1['lacune'],
  risposte: { numero: number; risposta: string }[]
): Promise<ValutazioneClozeC1> {
  const prompt = `Valuta le risposte di uno studente a un esercizio di
completamento testuale in italiano livello C1 (connettivi, strutture
sintattiche complesse, nominalizzazioni, pronomi relativi, forme passive).
Accetta sinonimi funzionalmente equivalenti e varianti corrette nel contesto.

Lacune e risposte:
${lacune
    .map((l) => {
      const r = risposte.find((x) => x.numero === l.numero)
      return `[${l.numero}] struttura:"${l.struttura}" | atteso:"${l.risposta_corretta}" | studente:"${sa(r?.risposta, 200)}"`
    })
    .join('\n')}

Per ogni lacuna restituisci: numero, corretto, risposta_corretta,
risposta_studente, struttura, feedback didattico di 2-3 frasi in
italiano: spiega la funzione discorsiva/sintattica della struttura
corretta (connettivo di concessione, pronome relativo complesso,
nominalizzazione...); se sbagliata, spiega perché l'opzione dello
studente non funziona in quel contesto.
Il campo punteggio è il totale corretto (max ${lacune.length}).`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(valutazioneClozeC1Schema),
    temperature: 0.1
  })
  const parsed = valutazioneClozeC1Schema.safeParse(raw)
  if (!parsed.success) throw new Error(`Valutazione non valida: ${parsed.error.message}`)
  return parsed.data
}

// ---------------------------------------------------------------------------
// TIPO 18 — Scelta multipla morfolessicale C1 ⭐ Prova N.3 C1
// Brano con 15 lacune lessicali/morfosintattiche, 4 opzioni ciascuna.
// Schema: riusa ClozeTestoB2 con prompt C1.
// ---------------------------------------------------------------------------

export async function generateEsercizioStruttura18(livello: string): Promise<ClozeTestoB2> {
  const prompt = `Genera un esercizio di scelta multipla morfolessicale in
italiano per uno studente di livello ${livello} C1 che si prepara a superare
standard internazionali di lingua italiana.

Formato (fedele alla Prova N.3 dell'esame C1):
1. Un brano di 240-280 parole su un argomento culturale/sociale complesso
   (storia dell'arte, letteratura, politica, scienza, economia italiana).
   Registro formale-saggistico con strutture sintattiche complesse.
2. 15 lacune numerate da [0] a [14] nel testo.
3. Per ogni lacuna: esattamente 4 opzioni (una corretta, tre plausibili ma
   errate nel contesto). Le opzioni devono testare distinzioni C1:
   - sinonimi di registro diverso (formale vs informale)
   - collocazioni lessicali specifiche (es. "condurre" vs "fare" + ricerca)
   - connettivi con sfumatura diversa (tuttavia vs eppure vs invece)
   - morfologia avanzata (nominalizzazioni, derivazioni)
   - preposizioni in frasi idiomatiche e reggenze verbali
4. Indica il campo semantico/struttura testata per ogni lacuna e una
   spiegazione di 1-2 frasi (campo spiegazione): spiega la distinzione
   C1 in gioco (registro, collocazione, sfumatura) e perché la risposta
   corretta è l'unica appropriata nel contesto.

${STRUTTURE_C1}

Vocabolario C1: lessico formale, tecnico-specialistico di uso comune,
espressioni idiomatiche, collocazioni fisse, sfumature di registro.
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

export function evaluateEsercizioStruttura18(
  lacune: ClozeTestoB2['lacune'],
  risposte: { numero: number; opzione_scelta: string }[]
): ValutazioneCloze {
  return evaluateEsercizioStruttura11(lacune, risposte)
}

// ---------------------------------------------------------------------------
// TIPO 19 — Trasformazione sintattica C1 ⭐ Prova N.4 C1
// Data una frase, riscrivila cominciando dalle parole fornite,
// mantenendo lo stesso significato ma cambiando la struttura sintattica.
// Valutazione Gemini.
// ---------------------------------------------------------------------------

export const trasformazioneSintC1Schema = z.object({
  titolo: z.string(),
  istruzione: z.string(),
  frasi: z.array(
    z.object({
      id: z.string(),
      frase_originale: z.string(),
      inizio_dato: z.string(),
      struttura_da_usare: z.string(),
      esempio_risposta: z.string()
    })
  ).min(5).max(8)
})

export type TrasformazioneSintC1 = z.infer<typeof trasformazioneSintC1Schema>

const valutazioneTrasformazioneSchema = z.object({
  risultati: z.array(
    z.object({
      id: z.string(),
      corretto: z.boolean(),
      risposta_corretta: z.string(),
      risposta_studente: z.string(),
      struttura_da_usare: z.string(),
      feedback: z.string()
    })
  ),
  punteggio: z.number().int().min(0)
})

export type ValutazioneTrasformazione = z.infer<typeof valutazioneTrasformazioneSchema>

export async function generateEsercizioStruttura19(livello: string): Promise<TrasformazioneSintC1> {
  const prompt = `Genera un esercizio di trasformazione sintattica in italiano
per uno studente di livello ${livello} C1 che si prepara a superare standard
internazionali di lingua italiana.

Formato (fedele alla Prova N.4 dell'esame C1):
1. Un titolo breve che indica il tema (es. "Un concorso letterario").
2. Un'istruzione: "Riscrivi le frasi iniziando dalle parole indicate,
   senza cambiare il significato. Se necessario, usa parole non presenti
   nel testo originale."
3. Genera 6 frasi. Ogni frase ha:
   - "frase_originale": la frase da trasformare (15-25 parole)
   - "inizio_dato": le prime parole della riscrittura (3-6 parole)
   - "struttura_da_usare": la struttura sintattica da applicare, tra:
     • passivo → attivo o viceversa
     • discorso diretto → indiretto (con consecutio temporum C1)
     • frase relativa → costruzione con participio/gerundio
     • frase subordinata esplicita → implicita (o viceversa)
     • nominalizzazione (trasforma un verbo in nome o viceversa)
     • ipotetica esplicita → implicita (con + nome, a + infinito)
   - "esempio_risposta": una risposta corretta completa

Usa strutture DIVERSE nelle 6 frasi. Ogni frase deve testare una
struttura C1 diversa. Le trasformazioni devono essere univoche
(non ambigue) e verificabili.

${STRUTTURE_C1}

Non menzionare mai nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(trasformazioneSintC1Schema),
    temperature: 0.65
  })
  const parsed = trasformazioneSintC1Schema.safeParse(raw)
  if (!parsed.success) throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  return parsed.data
}

export async function evaluateEsercizioStruttura19(
  frasi: TrasformazioneSintC1['frasi'],
  risposte: { id: string; risposta_studente: string }[]
): Promise<ValutazioneTrasformazione> {
  const prompt = `Valuta le risposte di uno studente a un esercizio di
trasformazione sintattica in italiano livello C1. Accetta varianti corrette
equivalenti — l'importante è che la struttura sintattica richiesta sia
utilizzata e il significato sia preservato.

Frasi e risposte:
${frasi
    .map((f) => {
      const r = risposte.find((x) => x.id === f.id)
      return `[${f.id}]
  Originale: "${f.frase_originale}"
  Inizio dato: "${f.inizio_dato}..."
  Struttura richiesta: ${f.struttura_da_usare}
  Esempio risposta: "${f.esempio_risposta}"
  Risposta studente: "${sa(r?.risposta_studente)}"`
    })
    .join('\n\n')}

Per ogni frase restituisci: id, corretto, risposta_corretta (quella
di esempio o migliore), risposta_studente, struttura_da_usare, feedback
didattico di 2-3 frasi in italiano: spiega la regola sintattica della
struttura richiesta (passivo, discorso indiretto, nominalizzazione...);
se sbagliata, indica dove si è perso il significato o la struttura e
fornisci un esempio che mostra come applicarla correttamente.
Il campo punteggio è il totale corretto (max ${frasi.length}).`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: zodToGeminiSchema(valutazioneTrasformazioneSchema),
    temperature: 0.1
  })
  const parsed = valutazioneTrasformazioneSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Valutazione non valida: ${parsed.error.message}`)
  return parsed.data
}

export function evaluateEsercizioStruttura15(
  domande: SituazioniB2['domande'],
  risposte: { id: string; opzione_scelta: string }[]
): ValutazioneCloze {
  const normalize = (s: string) => s.trim().toLowerCase()
  const risultati = domande.map((d, i) => {
    const r = risposte.find((x) => x.id === d.id)
    const corretto = normalize(r?.opzione_scelta ?? '') === normalize(d.risposta_corretta)
    return {
      numero: i + 1,
      corretto,
      risposta_corretta: d.risposta_corretta,
      risposta_studente: r?.opzione_scelta ?? '',
      struttura_testata: 'situazione comunicativa',
      feedback: corretto
        ? `Corretto. ${d.spiegazione}`
        : `La risposta corretta è: "${d.risposta_corretta}". ${d.spiegazione}`
    }
  })
  return { risultati, punteggio: risultati.filter((r) => r.corretto).length }
}
