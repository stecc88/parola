import { generateStructuredContent } from '../client'
import {
  valutazioneEsaminatoreSchema,
  zodToGeminiSchema,
  type ValutazioneEsaminatore
} from '../schema'
import { descrizioneLivelloValutazione } from '../cefrLevels'

/**
 * Valutatore di "scrittura libera". Attiva il thinking (budget medio)
 * perché il feedback pedagogico beneficia di un ragionamento più profondo
 * e la latenza aggiuntiva è accettabile in questo flusso
 * (non è un'interazione di hint istantaneo).
 *
 * PROMEMORIA: né il prompt né alcuna stringa generata qui deve menzionare
 * CILS/CELI/PLIDA. Usare sempre "standard internazionali di lingua italiana".
 */

const RESPONSE_SCHEMA = zodToGeminiSchema(valutazioneEsaminatoreSchema)

function sanitizeUserText(text: string, maxChars = 3000): string {
  return text
    .slice(0, maxChars)
    .replace(/"""/g, '"')   // prevent delimiter breakout
    .replace(/\\/g, '\\\\') // escape backslashes
}

function buildPrompt(testoStudente: string, livelloTarget?: string, consegna?: string): string {
  const safeText = sanitizeUserText(testoStudente)
  const safeConsegna = consegna ? sanitizeUserText(consegna, 500) : undefined

  return `Sei un esaminatore esperto di lingua italiana per persone — adolescenti o adulte — che si
preparano a superare standard internazionali di lingua italiana. Valuta il
testo seguente, scritto da uno studente${livelloTarget ? ` con livello target ${livelloTarget}` : ''}.

Calibrazione delle aspettative per questo livello — leggi con attenzione,
è la parte più importante per dare un punteggio giusto:
${descrizioneLivelloValutazione(livelloTarget)}
${
  safeConsegna
    ? `\nConsegna data allo studente dal docente: "${safeConsegna}"

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
${safeText}
"""

Fornisci una valutazione completa, costruttiva, con un tono incoraggiante adatto sia ad adolescenti che ad adulti.

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
    thinking: { thinkingBudget: 1024 },
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
