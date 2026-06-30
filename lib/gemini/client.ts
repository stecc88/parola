/**
 * Cliente REST directo a la API de Gemini. NUNCA usar @google/generative-ai
 * ni ningún SDK oficial — regla explícita del proyecto.
 *
 * Modelo principal: gemini-2.5-flash
 *   - Structured outputs nativos (responseSchema) → se usan en vez de
 *     parsear JSON "a mano" desde el texto de respuesta.
 *   - Thinking soportado → opcional, se activa solo donde el costo de
 *     latencia se justifica (evaluación del examinador), no en hints
 *     rápidos de modo guiado.
 *   - Input hasta 1,048,576 tokens / output hasta 65,536.
 *
 * Modello di riserva: gemini-2.5-flash-lite
 *   - Usato SOLO quando il modello principale restituisce quota esaurita
 *     (RESOURCE_EXHAUSTED) — vedi isQuotaExhausted più in basso. Ogni
 *     modello ha la propria quota indipendente nel piano gratuito, quindi
 *     questo garantisce continuità del servizio senza attendere il reset.
 *
 * GEMINI_API_KEY vive solo en el entorno del servidor (sin prefijo
 * NEXT_PUBLIC_) — este módulo no debe importarse desde código de cliente.
 */

// Ordered by cost (cheapest first). Each model has independent quota.
// If primary returns 429/503, we cascade to the next one automatically.
const GEMINI_MODEL_PRIMARY = 'gemini-2.5-flash-lite'   // cheapest known-good model
const GEMINI_MODEL_FALLBACK = 'gemini-3.1-flash-lite'   // next-gen lite when available
const GEMINI_MODEL_FALLBACK_2 = 'gemini-2.5-flash'      // higher quality last resort
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

interface ThinkingConfig {
  thinkingBudget: number // tokens dedicados a thinking; 0 = desactivado
}

interface GenerateContentOptions {
  prompt: string
  responseSchema?: Record<string, unknown>
  thinking?: ThinkingConfig
  temperature?: number
}

interface GeminiCandidate {
  content: {
    parts: Array<{ text?: string }>
  }
  finishReason: string
}

interface GeminiResponse {
  candidates: GeminiCandidate[]
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
    public readonly model?: string
  ) {
    super(message)
    this.name = 'GeminiError'
  }
}

/**
 * Distingue una cuota agotada (RESOURCE_EXHAUSTED — límite diario/por
 * minuto del plan gratuito de Gemini) de una sobrecarga transitoria
 * (503/otros 429 de rate limiting de corta duración). La primera NO se
 * arregla reintentando con nuestro backoff de milisegundos — Gemini
 * mismo indica "retry in Xs" donde X suele ser varios segundos, más de
 * lo que conviene esperar dentro de una función serverless. Reintentar
 * igual solo desperdicia cuota y tiempo; en su lugar, generateContent
 * cambia de modelo (ver GEMINI_MODEL_FALLBACK).
 */
export function isQuotaExhausted(err: GeminiError): boolean {
  if (err.status !== 429) return false
  const body = err.body as { error?: { status?: string } } | undefined
  return body?.error?.status === 'RESOURCE_EXHAUSTED'
}

function buildRequestBody(options: GenerateContentOptions) {
  const generationConfig: Record<string, unknown> = {
    temperature: options.temperature ?? 0.4
  }

  if (options.responseSchema) {
    generationConfig.responseMimeType = 'application/json'
    generationConfig.responseSchema = options.responseSchema
  }

  if (options.thinking) {
    generationConfig.thinkingConfig = {
      thinkingBudget: options.thinking.thinkingBudget
    }
  }

  return {
    contents: [
      {
        role: 'user',
        parts: [{ text: options.prompt }]
      }
    ],
    generationConfig
  }
}

/**
 * Llama a UN modelo específico con reintentos simples ante 429
 * (no-cuota)/5xx. No reintenta ante 4xx de validación (400) ni ante
 * cuota agotada (ver isQuotaExhausted) — en ambos casos reintentar
 * contra el MISMO modelo no ayuda.
 */
async function callModel(
  model: string,
  body: ReturnType<typeof buildRequestBody>,
  apiKey: string,
  maxRetries: number
): Promise<string> {
  const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`

  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Timeout per tentativo: senza questo, una singola chiamata lenta poteva
    // consumare tutto il tempo della funzione serverless prima che il nostro
    // retry/fallback si attivasse. 14s lascia margine perché, anche nel caso
    // peggiore con reintentativi, tutto stia dentro maxDuration=60 dell'endpoint.
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 14_000)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null)

        // 404 = modelo inexistente, no reintentar con el mismo modelo pero sí
        // con el siguiente en el cascade. 400 con payload inválido también se
        // re-lanza (el caller decide si hacer fallback).
        if (res.status === 404) {
          throw new GeminiError(
            `Gemini rechazó la solicitud (${res.status}): ${JSON.stringify(errorBody)}`,
            res.status,
            errorBody,
            model
          )
        }

        throw new GeminiError(`Gemini respondió con error ${res.status}`, res.status, errorBody, model)
      }

      const data = (await res.json()) as GeminiResponse
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) {
        throw new GeminiError(
          'Gemini devolvió una respuesta sin contenido de texto.',
          res.status,
          data,
          model
        )
      }

      return text
    } catch (err) {
      const esTimeout = err instanceof Error && err.name === 'AbortError'
      lastError = esTimeout
        ? new GeminiError('Gemini no respondió a tiempo (timeout).', 504, null, model)
        : err

      const isRetryable =
        esTimeout ||
        (lastError instanceof GeminiError &&
          (lastError.status === undefined || lastError.status >= 429) &&
          !isQuotaExhausted(lastError))

      if (!isRetryable || attempt === maxRetries) {
        break
      }

      // backoff exponencial simple: 300ms, 900ms, ...
      await new Promise((r) => setTimeout(r, 300 * 3 ** attempt))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError instanceof Error ? lastError : new GeminiError('Error desconocido llamando a Gemini.')
}

/**
 * Genera contenido con el modelo principal; si éste devuelve cuota
 * agotada, cambia automáticamente al modelo de respaldo (cuota
 * independiente) antes de rendirse. El llamador no necesita saber cuál
 * de los dos modelos respondió finalmente.
 */
export async function generateContent(
  options: GenerateContentOptions,
  { maxRetries = 1 }: { maxRetries?: number } = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new GeminiError('GEMINI_API_KEY non è configurata nelle variabili d\'ambiente del server.')
  }

  const body = buildRequestBody(options)
  // Il modello di fallback (lite) non supporta thinking — costruiamo un
  // body senza thinkingConfig per evitare timeout o errori nel fallback.
  const bodyWithoutThinking = options.thinking
    ? buildRequestBody({ ...options, thinking: undefined })
    : body

  const shouldFallback = (err: unknown): boolean =>
    err instanceof GeminiError && err.status !== 404

  try {
    return await callModel(GEMINI_MODEL_PRIMARY, body, apiKey, maxRetries)
  } catch (err) {
    if (!shouldFallback(err)) throw err
    console.warn(
      `Errore su ${GEMINI_MODEL_PRIMARY} (status ${(err as GeminiError).status}), riprovo con ${GEMINI_MODEL_FALLBACK}.`
    )
    try {
      return await callModel(GEMINI_MODEL_FALLBACK, bodyWithoutThinking, apiKey, 1)
    } catch (err2) {
      if (!shouldFallback(err2)) throw err2
      console.warn(
        `Errore su ${GEMINI_MODEL_FALLBACK} (status ${(err2 as GeminiError).status}), riprovo con ${GEMINI_MODEL_FALLBACK_2}.`
      )
      return await callModel(GEMINI_MODEL_FALLBACK_2, bodyWithoutThinking, apiKey, 1)
    }
  }
}

/**
 * Wrapper de conveniencia: genera contenido con structured output y
 * parsea el JSON resultante. NO valida con Zod aquí — eso es responsabilidad
 * de quien llama (cada prompt builder usa su propio schema de
 * lib/gemini/schema.ts para validar antes de persistir).
 */
export async function generateStructuredContent(
  options: GenerateContentOptions,
  retryOptions: { maxRetries?: number } = {}
): Promise<unknown> {
  const text = await generateContent(options, retryOptions)
  try {
    return JSON.parse(text)
  } catch {
    throw new GeminiError(
      'Gemini devolvió texto no-JSON a pesar de responseSchema. Respuesta cruda: ' +
        text.slice(0, 500)
    )
  }
}
