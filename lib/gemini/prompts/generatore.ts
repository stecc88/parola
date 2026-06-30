import { generateStructuredContent } from '../client'
import {
  esercizioPersonalizzatoSchema,
  zodToGeminiSchema,
  type EsercizioPersonalizzato,
  type TipoEsercizioPersonalizzato
} from '../schema'
import { descrizioneLivelloGenerazione } from '../cefrLevels'

/**
 * Generatore di esercizi personalizzati per il docente. A differenza
 * dell'esaminatore (lib/gemini/prompts/examinador.ts), qui Gemini non valuta
 * un testo: CREA materiale didattico (teoria + spiegazione + esempio +
 * consegna/items) su misura per le difficoltà specifiche di UNO studente.
 *
 * PROMEMORIA: stesso vincolo del resto del progetto — mai menzionare
 * CILS/CELI/PLIDA, usare sempre "standard internazionali di lingua italiana".
 */

const RESPONSE_SCHEMA = zodToGeminiSchema(esercizioPersonalizzatoSchema)

export interface ErroreSubmission {
  testo_originale: string
  correzione: string
  categoria: string
  spiegazione: string
}

export interface ProfiloDebolezzeStudente {
  livelloTarget?: string
  areeDiMiglioramento: string[] // già aggregate/contate altrove, qui solo i testi
  categorieErroriFrequenti: string[] // es. ['grammatica', 'ortografia']
  // Se presenti, sono gli errori concreti di UN testo specifico dello studente.
  // Hanno priorità sulle statistiche aggregate per costruire l'esercizio.
  erroriSubmissionSpecifica?: ErroreSubmission[]
  // Se omesso, l'IA scegli il tipo più adatto alle difficoltà rilevate.
  tipoEsercizio?: TipoEsercizioPersonalizzato
}

const TIPO_ISTRUZIONI: Record<TipoEsercizioPersonalizzato, string> = {
  scrittura: `Tipo "scrittura": lascia "items" come array VUOTO. In "consegna" scrivi
un compito di scrittura completo con almeno un requisito verificabile
(numero minimo di frasi/parole, o un elemento grammaticale obbligatorio).`,
  completamento: `Tipo "completamento": genera 5-8 frasi in "items", ciascuna con uno
spazio vuoto segnato con "___" nel campo "domanda" (es. "Ieri io ___
(andare) al mercato."). "opzioni" resta un array VUOTO (risposta aperta).
"risposta_corretta" è la parola/forma esatta che completa la frase.
"consegna" è una singola istruzione breve, es. "Completa ogni frase con
la forma corretta della parola tra parentesi."`,
  scelta_multipla: `Tipo "scelta_multipla": genera 5-8 domande in "items". Ogni "domanda"
è una frase con uno spazio "___" o una domanda diretta. "opzioni" contiene
3-4 alternative (solo una corretta). "risposta_corretta" deve essere
identica testualmente a una delle "opzioni". "consegna" è una singola
istruzione breve, es. "Scegli l'opzione corretta per completare ogni frase."`,
  abbinamento: `Tipo "abbinamento": genera 5-8 item in "items". Ogni "domanda" è un
elemento da abbinare (es. un pronome, un'espressione di tempo, l'inizio di
una frase). "opzioni" contiene 4-6 possibili corrispondenze tra cui
scegliere (incluse quelle corrette per tutti gli item, mescolate).
"risposta_corretta" è la corrispondenza esatta per quella domanda, identica
testualmente a una delle "opzioni". "consegna" è una singola istruzione
breve, es. "Abbina ogni pronome alla forma verbale corretta."`,
  trasformazione: `Tipo "trasformazione": genera 5-8 frasi in "items". Ogni "domanda" è
una frase da trasformare (es. da presente a passato, da affermativa a
negativa, da singolare a plurale). "opzioni" resta un array VUOTO.
"risposta_corretta" è la frase trasformata, scritta per intero.
"consegna" è una singola istruzione breve, es. "Trasforma ogni frase al
passato prossimo."`
}

function buildPrompt(profilo: ProfiloDebolezzeStudente): string {
  const livello = profilo.livelloTarget ?? 'B1'

  const areeText =
    profilo.areeDiMiglioramento.length > 0
      ? profilo.areeDiMiglioramento.map((a) => `- ${a.slice(0, 300).replace(/"/g, "'")}`).join('\n')
      : '- Nessuna area specifica rilevata ancora: genera un esercizio di ripasso generale adatto al livello.'

  const categorieText =
    profilo.categorieErroriFrequenti.length > 0
      ? `Le categorie di errore più frequenti nelle sue correzioni precedenti sono: ${profilo.categorieErroriFrequenti.join(', ')}.`
      : ''

  const erroriSpecificiText =
    profilo.erroriSubmissionSpecifica && profilo.erroriSubmissionSpecifica.length > 0
      ? `\nIMPORTANTE: il docente vuole un esercizio basato sugli errori CONCRETI commessi
dallo studente in un testo specifico appena analizzato. Questi sono gli errori reali
(con spiegazione) che devono guidare la creazione dell'esercizio — usali come punto
di partenza diretto per la teoria, gli esempi e le domande:\n${profilo.erroriSubmissionSpecifica
          .map((e, i) => {
            const orig = e.testo_originale.slice(0, 300).replace(/"/g, "'")
            const corr = e.correzione.slice(0, 300).replace(/"/g, "'")
            const spiega = e.spiegazione.slice(0, 400).replace(/"/g, "'")
            return `${i + 1}. "${orig}" → "${corr}" [${e.categoria}]: ${spiega}`
          })
          .join('\n')}`
      : ''

  const tipoText = profilo.tipoEsercizio
    ? TIPO_ISTRUZIONI[profilo.tipoEsercizio]
    : `Scegli TU il tipo più adatto alle difficoltà rilevate, tra: "scrittura",
"completamento", "scelta_multipla", "abbinamento", "trasformazione".
Istruzioni per ciascun tipo, da seguire ESATTAMENTE una volta scelto:
${Object.values(TIPO_ISTRUZIONI).join('\n\n')}`

  return `Sei un insegnante esperto di lingua italiana per persone — adolescenti o adulte — che si
preparano a superare standard internazionali di lingua italiana. Un docente
ti chiede di creare un esercizio PERSONALIZZATO per UNO studente specifico
con livello target ${livello}, basato sulle sue difficoltà ricorrenti.

Aree di miglioramento rilevate nelle correzioni precedenti dello studente:
${areeText}
${categorieText}
${erroriSpecificiText}

${descrizioneLivelloGenerazione(livello)}

${tipoText}

Crea l'esercizio completo con questi campi, con un linguaggio chiaro,
motivante e non punitivo, adatto sia ad adolescenti che ad adulti:

1. "tipo_esercizio": il tipo scelto (vedi sopra).
2. "titolo": un titolo breve e specifico (es. "L'uso del condizionale per
   esprimere desideri").
3. "teoria": la spiegazione della regola, con la profondità e il formato
   indicati per il livello ${livello} sopra.
4. "spiegazione": il motivo per cui questo punto è importante e perché lo
   studente probabilmente lo sbaglia (collegandolo, se possibile, alle aree
   di miglioramento indicate sopra) — un paio di frasi, tono incoraggiante.
5. "esempio": un esempio concreto e svolto (frase scorretta tipica →
   versione corretta, con breve nota) che illustri la teoria in azione.
6. "consegna" e "items": segui ESATTAMENTE le istruzioni del tipo scelto
   sopra.

Non menzionare mai nomi di certificazioni specifiche: usa sempre "standard
internazionali di lingua italiana" se necessario.`
}

export async function generateEsercizioPersonalizzato(
  profilo: ProfiloDebolezzeStudente
): Promise<EsercizioPersonalizzato> {
  const raw = await generateStructuredContent(
    {
      prompt: buildPrompt(profilo),
      responseSchema: RESPONSE_SCHEMA,
      thinking: { thinkingBudget: 2048 },
      temperature: 0.5
    },
    { maxRetries: 4 }
  )

  const parsed = esercizioPersonalizzatoSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(
      `La risposta di Gemini non rispetta lo schema atteso: ${parsed.error.message}`
    )
  }

  return parsed.data
}
