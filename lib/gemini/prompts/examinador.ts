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
${
  consegna
    ? `\nConsegna data allo studente dal docente: "${consegna}"

Prima di tutto, identifica ogni punto/richiesta esplicita o implicita contenuta
nella consegna (es. "racconta un'esperienza", "esprimi un'opinione", "usa il
condizionale", "scrivi almeno 150 parole", ecc.). Poi verifica, punto per
punto, se il testo dello studente la soddisfa. Compila il campo
"rispetto_consegna" con: l'elenco dei punti richiesti, quali sono stati
coperti, quali mancano, un giudizio booleano se la consegna è stata
complessivamente rispettata, e un commento breve che spiega il giudizio.
Questa verifica è tanto importante quanto la correttezza linguistica: un
testo grammaticalmente perfetto ma che non risponde alla consegna NON deve
ricevere un punteggio alto.
`
    : '\nNon è stata fornita nessuna consegna specifica: lascia "rispetto_consegna" a null.\n'
}
Testo dello studente:
"""
${testoStudente}
"""

Fornisci una valutazione completa, costruttiva e adatta a un adolescente.

Per "punti_forza" e "aree_di_miglioramento", segui queste regole ESATTE
— sono il problema più comune da evitare: NON scrivere voci generiche o
che raggruppano intere categorie grammaticali insieme (es. NON scrivere
"Grammatica (coniugazione verbi, articoli, preposizioni, struttura della
frase)" — questo non aiuta lo studente a capire cosa fare). Invece, ogni
voce deve:
1. Riguardare UN punto specifico e concreto (non una categoria intera)
2. Includere un piccolo esempio preso o ispirato dal testo reale dello
   studente, tra parentesi, che illustri il punto

Esempio di voce BEN FATTA per "aree_di_miglioramento":
"Concordanza degli articoli con il genere del nome (es. hai scritto 'uno
piccolo gatto' invece di 'un piccolo gatto')"

Esempio di voce SBAGLIATA da NON produrre:
"Grammatica (articoli, verbi, preposizioni)"

Stessa logica per "punti_forza": invece di "Buon uso del lessico", scrivi
qualcosa come "Hai usato bene il vocabolario specifico del contesto (es.
'iscrivermi al corso', 'orari delle lezioni')".

Massimo 5 voci per ciascuno dei due campi, ognuna su un punto diverso e
specifico — meglio 3 voci utili e concrete che 5 generiche.

Per gli errori specifici con correzione e spiegazione, un punteggio
complessivo (0-100) e una stima del livello CEFR (A1-C2). Non menzionare
mai nomi di certificazioni specifiche: riferisciti genericamente a
"standard internazionali di lingua italiana" se necessario.`
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
