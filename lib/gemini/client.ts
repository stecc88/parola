/**
 * Cliente REST directo a la API de Gemini. NUNCA usar @google/generative-ai
 * ni ningún SDK oficial — regla explícita del proyecto.
 *
 * Modelo: gemini-3.5-flash
 *   - Structured outputs nativos (responseSchema) → se usan en vez de
 *     parsear JSON "a mano" desde el texto de respuesta.
 *   - Thinking soportado → opcional, se activa solo donde el costo de
 *     latencia se justifica (evaluación del examinador), no en hints
 *     rápidos de modo guiado.
 *   - Input hasta 1,048,576 tokens / output hasta 65,536.
 *
 * GEMINI_API_KEY vive solo en el entorno del servidor (sin prefijo
 * NEXT_PUBLIC_) — este módulo no debe importarse desde código de cliente.
 */

const GEMINI_MODEL = 'gemini-3.5-flash'
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
  constructor(message: string, public readonly status?: number, public readonly body?: unknown) {
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
 * igual solo desperdicia cuota y tiempo.
 */
export function isQuotaExhausted(err: GeminiError): boolean {
  if (err.status !== 429) return false
  const body = err.body as { error?: { status?: string } } | undefined
  return body?.error?.status === 'RESOURCE_EXHAUSTED'
}

/**
 * Llama a generateContent con reintentos simples ante 429/5xx.
 * No reintenta ante 4xx de validación (400) — esos son errores de
 * nuestro propio payload, reintentar no ayuda.
 */
export async function generateContent(
  options: GenerateContentOptions,
  { maxRetries = 2 }: { maxRetries?: number } = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new GeminiError('GEMINI_API_KEY no está configurada en el entorno del servidor.')
  }

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

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: options.prompt }]
      }
    ],
    generationConfig
  }

  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

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
            errorBody
          )
        }

        throw new GeminiError(
          `Gemini respondió con error ${res.status}`,
          res.status,
          errorBody
        )
      }

      const data = (await res.json()) as GeminiResponse
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) {
        throw new GeminiError('Gemini devolvió una respuesta sin contenido de texto.', res.status, data)
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
