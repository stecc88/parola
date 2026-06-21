import { generateStructuredContent } from '../client'
import { zodToGeminiSchema } from '../schema'
import { z } from 'zod'

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
struttura interrogativa). Non menzionare mai nomi di certificazioni
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
essere errori comuni plausibili). Non menzionare mai nomi di certificazioni
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
