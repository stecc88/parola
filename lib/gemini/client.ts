/**
 * Client REST diretto all'API di Gemini. NON usare mai @google/generative-ai
 * né alcun SDK ufficiale — regola esplicita del progetto.
 *
 * Modello principale: gemini-2.5-flash-lite (vedi GEMINI_MODEL_PRIMARY)
 *   - Structured outputs nativi (responseSchema) → usati invece di
 *     parsare JSON "a mano" dal testo della risposta.
 *   - Thinking supportato → opzionale, attivato solo dove il costo di
 *     latenza è giustificato (valutazione esaminatore), non negli hint
 *     rapidi della modalità guidata.
 *   - Input fino a 1.048.576 token / output fino a 65.536.
 *
 * Modelli di riserva (GEMINI_MODEL_FALLBACK, _FALLBACK_2):
 *   - Usati in cascata quando il modello precedente fallisce (quota
 *     esaurita — RESOURCE_EXHAUSTED — vedi isQuotaExhausted più in basso,
 *     o qualsiasi altro errore Gemini). Ogni modello ha la propria quota
 *     indipendente nel piano gratuito, quindi questo garantisce
 *     continuità del servizio senza attendere il reset.
 *
 * Livello a pagamento (GEMINI_API_KEY_PAID, opzionale):
 *   - Se configurata, viene usata come ultimissima risorsa SOLO quando
 *     l'ultimo modello gratuito fallisce specificamente per quota esaurita
 *     (non per errori di rete/5xx transitori — quelli non si risolvono
 *     spendendo su una key a pagamento). Richiede una seconda API key da
 *     un progetto Google con fatturazione abilitata (aistudio.google.com/apikey),
 *     diversa da GEMINI_API_KEY. Se non configurata, il comportamento resta
 *     identico a prima: dopo l'ultimo modello gratuito, l'errore si propaga.
 *
 * GEMINI_API_KEY (e GEMINI_API_KEY_PAID) vivono solo nell'ambiente server
 * (senza prefisso NEXT_PUBLIC_) — questo modulo non deve essere importato
 * da codice client.
 */

// Ordered by cost (cheapest first). Each model has independent quota.
// If primary returns 429/503, we cascade to the next one automatically.
const GEMINI_MODEL_PRIMARY = 'gemini-2.5-flash-lite'   // cheapest known-good model
const GEMINI_MODEL_FALLBACK = 'gemini-3.1-flash-lite'   // next-gen lite when available
const GEMINI_MODEL_FALLBACK_2 = 'gemini-2.5-flash'      // higher quality last resort
// Ultima risorsa a pagamento, usata solo se GEMINI_API_KEY_PAID è configurata
// e la quota gratuita è davvero esaurita — stesso modello del fallback
// gratuito sopra, così non cambia comportamento/qualità, solo la key.
const GEMINI_MODEL_PAID_FALLBACK = 'gemini-3.1-flash-lite'
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

interface ThinkingConfig {
  thinkingBudget: number // token dedicati al thinking; 0 = disattivato
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
 * Distingue una quota esaurita (RESOURCE_EXHAUSTED — limite giornaliero/al
 * minuto del piano gratuito di Gemini) da un sovraccarico transitorio
 * (503/altri 429 di rate limiting di breve durata). La prima NON si risolve
 * riprovando con il nostro backoff in millisecondi — Gemini stesso indica
 * "retry in Xs" dove X è di solito diversi secondi, troppo per attendere
 * dentro una funzione serverless. Riprovare comunque spreca solo quota e
 * tempo; al suo posto, generateContent cambia modello (vedi GEMINI_MODEL_FALLBACK).
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
 * Chiama UN modello specifico con semplici tentativi su 429
 * (non-quota)/5xx. Non riprova su 4xx di validazione (400) né su
 * quota esaurita (vedi isQuotaExhausted) — in entrambi i casi riprovare
 * con lo STESSO modello non serve.
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

        // 404 = modello inesistente; non riprovare con lo stesso ma con il
        // successivo nel cascade. Anche 400 con payload non valido viene
        // rilanciato (il chiamante decide se fare fallback).
        if (res.status === 404) {
          throw new GeminiError(
            `Gemini ha rifiutato la richiesta (${res.status}): ${JSON.stringify(errorBody)}`,
            res.status,
            errorBody,
            model
          )
        }

        throw new GeminiError(`Gemini ha risposto con errore ${res.status}`, res.status, errorBody, model)
      }

      const data = (await res.json()) as GeminiResponse
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) {
        throw new GeminiError(
          'Gemini ha restituito una risposta senza contenuto testuale.',
          res.status,
          data,
          model
        )
      }

      return text
    } catch (err) {
      const esTimeout = err instanceof Error && err.name === 'AbortError'
      lastError = esTimeout
        ? new GeminiError('Gemini non ha risposto in tempo (timeout).', 504, null, model)
        : err

      const isRetryable =
        esTimeout ||
        (lastError instanceof GeminiError &&
          (lastError.status === undefined || lastError.status >= 429) &&
          !isQuotaExhausted(lastError))

      if (!isRetryable || attempt === maxRetries) {
        break
      }

      // backoff esponenziale semplice: 300ms, 900ms, ...
      await new Promise((r) => setTimeout(r, 300 * 3 ** attempt))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError instanceof Error ? lastError : new GeminiError('Errore sconosciuto durante la chiamata a Gemini.')
}

/**
 * Genera contenuto con il modello principale; se fallisce, passa in
 * cascata ai modelli di riserva (quota indipendente per ciascuno) e,
 * se configurata, infine alla key a pagamento — solo se l'ultimo
 * modello gratuito ha fallito specificamente per quota esaurita. Il
 * chiamante non ha bisogno di sapere quale modello/key ha risposto.
 */
export async function generateContent(
  options: GenerateContentOptions,
  { maxRetries = 1 }: { maxRetries?: number } = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new GeminiError('GEMINI_API_KEY non è configurata nelle variabili d\'ambiente del server.')
  }
  const paidApiKey = process.env.GEMINI_API_KEY_PAID

  const body = buildRequestBody(options)
  // I modelli di fallback (lite) non supportano thinking — costruiamo un
  // body senza thinkingConfig per evitare timeout o errori nel fallback.
  const bodyWithoutThinking = options.thinking
    ? buildRequestBody({ ...options, thinking: undefined })
    : body

  const cascata: {
    model: string
    apiKey: string
    body: ReturnType<typeof buildRequestBody>
    retries: number
    isPaid: boolean
  }[] = [
    { model: GEMINI_MODEL_PRIMARY, apiKey, body, retries: maxRetries, isPaid: false },
    { model: GEMINI_MODEL_FALLBACK, apiKey, body: bodyWithoutThinking, retries: 1, isPaid: false },
    { model: GEMINI_MODEL_FALLBACK_2, apiKey, body: bodyWithoutThinking, retries: 1, isPaid: false }
  ]
  if (paidApiKey) {
    cascata.push({
      model: GEMINI_MODEL_PAID_FALLBACK,
      apiKey: paidApiKey,
      body: bodyWithoutThinking,
      retries: 1,
      isPaid: true
    })
  }

  let lastError: unknown
  for (let i = 0; i < cascata.length; i++) {
    const tentativo = cascata[i]

    // La key a pagamento si usa SOLO se l'errore precedente era
    // specificamente quota esaurita — per errori di rete/5xx transitori
    // riprovare su una key diversa non risolve nulla, spende solo soldi.
    if (tentativo.isPaid && !(lastError instanceof GeminiError && isQuotaExhausted(lastError))) {
      break
    }

    try {
      if (i > 0) {
        console.warn(
          `Passo a ${tentativo.model}${tentativo.isPaid ? ' (key a pagamento)' : ''} dopo errore su ${cascata[i - 1].model}.`
        )
      }
      return await callModel(tentativo.model, tentativo.body, tentativo.apiKey, tentativo.retries)
    } catch (err) {
      lastError = err
      // Qualsiasi GeminiError giustifica il passaggio al tentativo
      // successivo: 429/503 (quota o sovraccarico) e anche 404 (modello
      // inesistente/ritirato — vedi commento in callModel). Un errore
      // non-Gemini (bug di codice, ecc.) si propaga subito.
      if (!(err instanceof GeminiError)) throw err
    }
  }

  throw lastError instanceof Error ? lastError : new GeminiError('Errore sconosciuto durante la chiamata a Gemini.')
}

/**
 * Wrapper di convenienza: genera contenuto con structured output e
 * fa il parse del JSON risultante. NON valida con Zod qui — è responsabilità
 * del chiamante (ogni prompt builder usa il proprio schema da
 * lib/gemini/schema.ts per validare prima di persistere).
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
      'Gemini ha restituito testo non-JSON nonostante responseSchema. Risposta grezza: ' +
        text.slice(0, 500)
    )
  }
}
