import { generateStructuredContent } from '../client'
import { zodToGeminiSchema } from '../schema'
import { z } from 'zod'

/**
 * Contrato de esercizio_struttura_1: "Completa la frase" (cloze deletion).
 * Gemini genera N frases con un hueco cada una; el estudiante completa;
 * se evalúa con otra llamada a Gemini (más flexible que comparación exacta,
 * porque acepta sinónimos/conjugaciones correctas que un match literal
 * rechazaría).
 *
 * Los tipos 2-4 (esercizio_struttura_2/3/4) siguen el mismo patrón de dos
 * funciones — generateX(livello) y evaluateX(consegna, risposte) — pero con
 * su propio contrato de contenido. Pendiente de definir cuál ejercicio
 * gramatical representa cada uno (concordanza, preposizioni, tempi verbali,
 * congiuntivo, son candidatos típicos para preparazione a esami di lingua).
 */

export const fraseDaCompletareSchema = z.object({
  frasi: z.array(
    z.object({
      id: z.string(),
      testo_con_buco: z.string(), // ej: "Ieri ___ (andare) al mercato."
      contesto_grammaticale: z.string() // ej: "passato prossimo"
    })
  ).min(3).max(8)
})

export type FraseDaCompletare = z.infer<typeof fraseDaCompletareSchema>

const GENERATE_SCHEMA = zodToGeminiSchema(fraseDaCompletareSchema)

export async function generateEsercizioStruttura1(
  livello: string
): Promise<FraseDaCompletare> {
  const prompt = `Genera 5 frasi in italiano per un esercizio di completamento
(cloze) per uno studente di livello ${livello} che si prepara a superare
standard internazionali di lingua italiana. Ogni frase deve avere un buco
segnato con ___ e indicare tra parentesi il verbo o la struttura da usare.
Varia il contesto grammaticale (tempi verbali, preposizioni, concordanza).
Non menzionare mai nomi di certificazioni specifiche.`

  const raw = await generateStructuredContent({
    prompt,
    responseSchema: GENERATE_SCHEMA,
    temperature: 0.6
  })

  const parsed = fraseDaCompletareSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  }
  return parsed.data
}

const valutazioneRispostaSchema = z.object({
  risultati: z.array(
    z.object({
      id: z.string(),
      corretto: z.boolean(),
      risposta_corretta: z.string(),
      feedback: z.string()
    })
  )
})

export type ValutazioneRisposteStruttura1 = z.infer<typeof valutazioneRispostaSchema>

const EVAL_SCHEMA = zodToGeminiSchema(valutazioneRispostaSchema)

export async function evaluateEsercizioStruttura1(
  frasi: FraseDaCompletare['frasi'],
  risposte: { id: string; risposta_studente: string }[]
): Promise<ValutazioneRisposteStruttura1> {
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
    responseSchema: EVAL_SCHEMA,
    temperature: 0.2
  })

  const parsed = valutazioneRispostaSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Risposta di Gemini non valida: ${parsed.error.message}`)
  }
  return parsed.data
}
