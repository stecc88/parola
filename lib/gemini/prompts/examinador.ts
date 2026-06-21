import { generateStructuredContent } from '../client'
import {
  valutazioneEsaminatoreSchema,
  zodToGeminiSchema,
  type ValutazioneEsaminatore
} from '../schema'

/**
 * Evaluador de "scrittura libera". Activa thinking (presupuesto medio)
 * porque el feedback pedagógico se beneficia de razonamiento más
 * profundo y la latencia adicional es aceptable en este flujo
 * (no es una interacción de hint instantáneo).
 *
 * RECORDATORIO: ni el prompt ni ningún string generado aquí debe mencionar
 * CILS/CELI/PLIDA. Usar siempre "standard internazionali di lingua italiana".
 */

const RESPONSE_SCHEMA = zodToGeminiSchema(valutazioneEsaminatoreSchema)

function buildPrompt(testoStudente: string, livelloTarget?: string, consegna?: string): string {
  return `Sei un esaminatore esperto di lingua italiana per adolescenti che si
preparano a superare standard internazionali di lingua italiana. Valuta il
testo seguente, scritto da uno studente${livelloTarget ? ` con livello target ${livelloTarget}` : ''}.
${consegna ? `\nConsegna data allo studente: "${consegna}"\nTieni conto di quanto il testo risponde a questa consegna, oltre alla correttezza linguistica.\n` : ''}
Testo dello studente:
"""
${testoStudente}
"""

Fornisci una valutazione completa, costruttiva e adatta a un adolescente:
punti di forza, aree di miglioramento, errori specifici con correzione e
spiegazione, un punteggio complessivo (0-100) e una stima del livello CEFR
(A1-C2). Non menzionare mai nomi di certificazioni specifiche: riferisciti
genericamente a "standard internazionali di lingua italiana" se necessario.`
}

export async function evaluateScritturaLibera(
  testoStudente: string,
  livelloTarget?: string,
  consegna?: string
): Promise<ValutazioneEsaminatore> {
  const raw = await generateStructuredContent({
    prompt: buildPrompt(testoStudente, livelloTarget, consegna),
    responseSchema: RESPONSE_SCHEMA,
    thinking: { thinkingBudget: 4096 },
    temperature: 0.3
  })

  // Validación final: si Gemini se desvía del schema pedido (puede pasar),
  // esto lanza con un error claro en vez de persistir datos corruptos.
  const parsed = valutazioneEsaminatoreSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(
      `La risposta di Gemini non rispetta lo schema atteso: ${parsed.error.message}`
    )
  }

  return parsed.data
}
