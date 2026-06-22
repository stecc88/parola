import { generateStructuredContent } from '../client'
import {
  esercizioPersonalizzatoSchema,
  zodToGeminiSchema,
  type EsercizioPersonalizzato
} from '../schema'

/**
 * Generatore di esercizi personalizzati per il docente. A differenza
 * dell'esaminatore (lib/gemini/prompts/examinador.ts), qui Gemini non valuta
 * un testo: CREA materiale didattico (teoria + spiegazione + esempio +
 * consegna pratica) su misura per le difficoltà specifiche di UNO studente.
 *
 * RECORDATORIO: stesso vincolo del resto del progetto — mai menzionare
 * CILS/CELI/PLIDA, usare sempre "standard internazionali di lingua italiana".
 */

const RESPONSE_SCHEMA = zodToGeminiSchema(esercizioPersonalizzatoSchema)

export interface ProfiloDebolezzeStudente {
  livelloTarget?: string
  areeDiMiglioramento: string[] // già aggregate/contate altrove, qui solo i testi
  categorieErroriFrequenti: string[] // es. ['grammatica', 'ortografia']
}

function buildPrompt(profilo: ProfiloDebolezzeStudente): string {
  const areeText =
    profilo.areeDiMiglioramento.length > 0
      ? profilo.areeDiMiglioramento.map((a) => `- ${a}`).join('\n')
      : '- Nessuna area specifica rilevata ancora: genera un esercizio di ripasso generale adatto al livello.'

  const categorieText =
    profilo.categorieErroriFrequenti.length > 0
      ? `Le categorie di errore più frequenti nelle sue correzioni precedenti sono: ${profilo.categorieErroriFrequenti.join(', ')}.`
      : ''

  return `Sei un insegnante esperto di lingua italiana per adolescenti che si
preparano a superare standard internazionali di lingua italiana. Un docente
ti chiede di creare un esercizio PERSONALIZZATO per UNO studente specifico${
    profilo.livelloTarget ? ` con livello target ${profilo.livelloTarget}` : ''
  }, basato sulle sue difficoltà ricorrenti.

Aree di miglioramento rilevate nelle correzioni precedenti dello studente:
${areeText}
${categorieText}

Crea un esercizio completo con questi 5 elementi, pensati per un adolescente
(linguaggio chiaro, motivante, non punitivo):

1. "titolo": un titolo breve e specifico (es. "L'uso del condizionale per
   esprimere desideri").
2. "teoria": una spiegazione chiara e concisa della regola grammaticale o
   dell'abilità linguistica su cui lo studente deve lavorare, scritta in modo
   semplice e diretto.
3. "spiegazione": il motivo per cui questo punto è importante e perché lo
   studente probabilmente lo sbaglia (collegandolo, se possibile, alle aree
   di miglioramento indicate sopra) — un paio di frasi, tono incoraggiante.
4. "esempio": un esempio concreto e svolto (frase scorretta tipica →
   versione corretta, con breve nota) che illustri la teoria in azione.
5. "consegna": un compito pratico di scrittura che lo studente deve
   svolgere per esercitarsi su questo punto specifico (es. "Scrivi 5 frasi
   usando il condizionale per esprimere desideri legati al tuo futuro").
   La consegna deve essere chiara, specifica, e contenere almeno un
   requisito verificabile (es. un numero minimo di frasi/parole, o un
   elemento grammaticale obbligatorio da usare), così da poter essere
   valutata in modo oggettivo in seguito.

Non menzionare mai nomi di certificazioni specifiche: usa sempre "standard
internazionali di lingua italiana" se necessario.`
}

export async function generateEsercizioPersonalizzato(
  profilo: ProfiloDebolezzeStudente
): Promise<EsercizioPersonalizzato> {
  const raw = await generateStructuredContent({
    prompt: buildPrompt(profilo),
    responseSchema: RESPONSE_SCHEMA,
    thinking: { thinkingBudget: 2048 },
    temperature: 0.5
  })

  const parsed = esercizioPersonalizzatoSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(
      `La risposta di Gemini non rispetta lo schema atteso: ${parsed.error.message}`
    )
  }

  return parsed.data
}
