/**
 * Cliente REST directo a la API de Gemini. NUNCA usar @google/generative-ai
 * ni ningún SDK oficial — regla explícita del proyecto.
 *
 * Modelo principal: gemini-3.5-flash
 *   - Structured outputs nativos (responseSchema) → se usan en vez de
 *     parsear JSON "a mano" desde el texto de respuesta.
 *   - Thinking soportado → opcional, se activa solo donde el costo de
 *     latencia se justifica (evaluación del examinador), no en hints
 *     rápidos de modo guiado.
 *   - Input hasta 1,048,576 tokens / output hasta 65,536.
 *
 * Modelo de respaldo: gemini-2.5-flash-lite
 *   - Se usa SOLO cuando el modelo principal devuelve cuota agotada
 *     (RESOURCE_EXHAUSTED) — ver isQuotaExhausted más abajo. Cada modelo
 *     tiene su propia cuota independiente en el plan gratuito, así que
 *     esto da continuidad de servicio sin esperar al reseteo de cuota.
 *
 * GEMINI_API_KEY vive solo en el entorno del servidor (sin prefijo
 * NEXT_PUBLIC_) — este módulo no debe importarse desde código de cliente.
 */

const GEMINI_MODEL_PRIMARY = 'gemini-3.5-flash'
const GEMINI_MODEL_FALLBACK = 'gemini-2.5-flash-lite'
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
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null)

        // 400 = problema de nuestro payload (prompt/schema), no reintentar.
        if (res.status === 400) {
          throw new GeminiError(
            `Gemini rechazó la solicitud (400): ${JSON.stringify(errorBody)}`,
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
      lastError = err
      const isRetryable =
        err instanceof GeminiError &&
        (err.status === undefined || err.status >= 429) &&
        !isQuotaExhausted(err)

      if (!isRetryable || attempt === maxRetries) {
        break
      }

      // backoff exponencial simple: 300ms, 900ms, ...
      await new Promise((r) => setTimeout(r, 300 * 3 ** attempt))
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
  { maxRetries = 2 }: { maxRetries?: number } = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new GeminiError('GEMINI_API_KEY no está configurada en el entorno del servidor.')
  }

  const body = buildRequestBody(options)

  try {
    return await callModel(GEMINI_MODEL_PRIMARY, body, apiKey, maxRetries)
  } catch (err) {
    // Cambia al modelo de respaldo ante CUALQUIER error no-400 del
    // principal (cuota agotada, sobrecarga 503, rate limit transitorio) —
    // no solo cuota agotada. Un 503 "alta demanda" es exactamente el caso
    // donde probar un modelo distinto (con su propia capacidad/cuota)
    // tiene sentido, no solo cuando la cuota numérica se agotó.
    const shouldFallback = err instanceof GeminiError && err.status !== 400
    if (shouldFallback) {
      console.warn(
        `Error en ${GEMINI_MODEL_PRIMARY} (status ${
          (err as GeminiError).status
        }), reintentando con modelo de respaldo ${GEMINI_MODEL_FALLBACK}.`
      )
      // Un solo reintento adicional en el fallback alcanza: si éste
      // también falla, no tiene sentido seguir insistiendo.
      return await callModel(GEMINI_MODEL_FALLBACK, body, apiKey, 1)
    }
    throw err
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
