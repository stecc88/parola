import { z } from 'zod'

/**
 * Schema de la valutazione del "esaminatore" para scrittura libera.
 * Se usa con doble propósito:
 *   1. Generar el responseSchema nativo que se envía a Gemini
 *      (structured outputs) — ver lib/gemini/client.ts
 *   2. Validar la respuesta antes de persistirla en submissions.valutazione_ia
 *
 * IMPORTANTE: ningún texto aquí (ni en prompts) debe mencionar CILS/CELI/PLIDA.
 * Usar siempre "standard internazionali" en cualquier label visible al usuario.
 */
export const valutazioneEsaminatoreSchema = z.object({
  punteggio_complessivo: z.number().min(0).max(100),
  livello_stimato: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  punti_forza: z.array(z.string()).min(1).max(5),
  aree_di_miglioramento: z.array(z.string()).min(1).max(5),
  errori: z.array(
    z.object({
      testo_originale: z.string(),
      correzione: z.string(),
      categoria: z.enum(['grammatica', 'lessico', 'sintassi', 'coerenza', 'ortografia']),
      spiegazione: z.string()
    })
  ),
  feedback_generale: z.string().min(1),
  rispetto_consegna: z
    .object({
      punti_richiesti: z.array(z.string()).min(1).max(8),
      punti_coperti: z.array(z.string()),
      punti_mancanti: z.array(z.string()),
      rispetta_consegna: z.boolean(),
      commento: z.string().min(1)
    })
    .nullable()
})

export type ValutazioneEsaminatore = z.infer<typeof valutazioneEsaminatoreSchema>

/**
 * Schema para los 4 tipi di esercizio di analisi delle strutture.
 * Placeholder deliberadamente genérico hasta que se defina el contrato
 * exacto de cada tipo (pendiente, mencionado en la conversación previa).
 */
export const valutazioneStrutturaSchema = z.object({
  tipo: z.enum([
    'esercizio_struttura_1',
    'esercizio_struttura_2',
    'esercizio_struttura_3',
    'esercizio_struttura_4'
  ]),
  corretto: z.boolean(),
  punteggio: z.number().min(0).max(100),
  feedback: z.string().min(1),
  suggerimento: z.string().nullable()
})

export type ValutazioneStruttura = z.infer<typeof valutazioneStrutturaSchema>

/**
 * Schema per la GENERAZIONE (non valutazione) di un esercizio personalizzato
 * da parte del docente, basato sui punti debili di uno studente specifico.
 *
 * "items" è usato per i tipi a risposta chiusa (completamento, scelta
 * multipla, abbinamento, trasformazione) — vuoto per "scrittura", dove si
 * usa invece "consegna" con il flusso di valutazione libera di Gemini.
 */
export const tipoEsercizioPersonalizzatoSchema = z.enum([
  'scrittura',
  'completamento',
  'scelta_multipla',
  'abbinamento',
  'trasformazione'
])

export type TipoEsercizioPersonalizzato = z.infer<typeof tipoEsercizioPersonalizzatoSchema>

export const esercizioPersonalizzatoSchema = z.object({
  tipo_esercizio: tipoEsercizioPersonalizzatoSchema,
  titolo: z.string().min(1).max(120),
  teoria: z.string().min(1),
  spiegazione: z.string().min(1),
  esempio: z.string().min(1),
  // Per "scrittura": il compito di scrittura completo. Per gli altri tipi:
  // un'istruzione breve (es. "Completa ogni frase con la preposizione
  // corretta").
  consegna: z.string().min(1),
  // Vuoto per "scrittura". 4-8 item per gli altri tipi.
  items: z.array(
    z.object({
      domanda: z.string().min(1),
      // Scelte per scelta_multipla/abbinamento; vuoto per completamento/trasformazione.
      opzioni: z.array(z.string()),
      risposta_corretta: z.string().min(1),
      spiegazione_risposta: z.string().min(1)
    })
  )
})

export type EsercizioPersonalizzato = z.infer<typeof esercizioPersonalizzatoSchema>

/**
 * Convierte un schema Zod (subset soportado: object/array/string/number/
 * boolean/enum/nullable) al formato responseSchema que espera la REST API
 * de Gemini (subset de OpenAPI 3.0 Schema Object).
 *
 * No es un conversor genérico completo — cubre exactamente lo que usan
 * los schemas de este archivo. Si se agregan tipos nuevos (uniones,
 * records, etc.) hay que extenderlo.
 */
export function zodToGeminiSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape
    const properties: Record<string, unknown> = {}
    const required: string[] = []

    for (const key of Object.keys(shape)) {
      const field = shape[key]
      properties[key] = zodToGeminiSchema(field)
      if (!field.isOptional() && !(field instanceof z.ZodNullable)) {
        required.push(key)
      }
    }

    return { type: 'object', properties, required }
  }

  if (schema instanceof z.ZodArray) {
    return { type: 'array', items: zodToGeminiSchema(schema.element) }
  }

  if (schema instanceof z.ZodEnum) {
    return { type: 'string', enum: schema.options }
  }

  if (schema instanceof z.ZodOptional) {
    return zodToGeminiSchema(schema.unwrap())
  }

  if (schema instanceof z.ZodNullable) {
    return { ...zodToGeminiSchema(schema.unwrap()), nullable: true }
  }

  if (schema instanceof z.ZodString) {
    return { type: 'string' }
  }

  if (schema instanceof z.ZodNumber) {
    return { type: 'number' }
  }

  if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' }
  }

  throw new Error(`zodToGeminiSchema: tipo Zod no soportado para ${schema.constructor.name}`)
}
