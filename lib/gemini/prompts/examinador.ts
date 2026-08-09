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

/**
 * Normalizza "e'" (e seguita da apostrofo, in qualsiasi variante tipografica),
 * "è" ed "é" a un unico carattere segnaposto — usata per capire se due
 * frammenti differiscono SOLO nella scelta tra queste tre forme.
 */
function normalizzaAccentoE(testo: string): string {
  return testo.replace(/[eE]['’‘`]/g, 'ẽ').replace(/[èÈéÉ]/g, 'ẽ')
}

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

Il punteggio complessivo (0-100) deve riflettere questi quattro aspetti
della rubrica ufficiale di riferimento per la scrittura — il loro peso
relativo NON è uguale a tutti i livelli, vedi sotto:
1. Efficacia comunicativa: comprende l'adeguatezza di contenuto (la
   risposta è adeguata e coerente con quanto richiesto, se c'è una
   consegna), la coerenza (il testo ha una struttura unitaria, le sue
   parti concordano nel significato senza creare problemi di
   comprensione) e la coesione (i legami semantico-lessicali e
   morfosintattici tra le parti del testo: congiunzioni, pronomi,
   clitici, connettivi di causa o tempo). Problemi di coerenza o
   coesione vanno segnalati nel campo "errori" con categoria
   "coerenza", che copre entrambi gli aspetti.
2. Correttezza morfosintattica: grammatica e sintassi corrette per il
   livello indicato sopra.
3. Adeguatezza e ricchezza lessicale: varietà e precisione del
   vocabolario usato, calibrata al livello — non solo assenza di
   errori, ma anche varietà rispetto al minimo richiesto per quel
   livello.
4. Ortografia e punteggiatura: refusi, accenti, doppie, apostrofi, uso
   della punteggiatura.

Peso relativo per livello — leggi con attenzione, cambia in modo netto:
- A1-B2: l'efficacia comunicativa pesa più di ogni altro singolo
  aspetto (circa il 30-40% del punteggio), la correttezza morfosintattica
  pesa meno, e l'ortografia pesa relativamente poco. Un testo che
  comunica bene con qualche errore grammaticale merita un punteggio più
  alto di un testo grammaticalmente corretto ma confuso o che non si fa
  capire.
- C1-C2: la situazione si INVERTE — la correttezza morfosintattica
  diventa il fattore singolo più pesante (più dell'efficacia
  comunicativa), e anche lessico e ortografia acquistano peso relativo.
  A questi livelli comunicare in modo comprensibile è dato per
  scontato: la valutazione si concentra sulla precisione e
  sull'accuratezza, non solo sul farsi capire.

ECCEZIONE OBBLIGATORIA SULL'ACCENTO DELLA "E" — leggi con attenzione,
è una regola FERREA, non una preferenza. Quando la forma corretta di una
parola richiede una "e" accentata (es. "è", "né", "cioè", "perché",
"caffè", "affinché"), le seguenti tre grafie di quella "e" sono SEMPRE
equivalenti e corrette, qualunque lo studente abbia usato: "e'" (e
seguita da apostrofo), "è" (accento grave), "é" (accento acuto). NON
includere MAI in "errori" una voce che corregge una di queste forme in
un'altra — nemmeno se non corrisponde all'accento "canonico" di quella
parola specifica (es. "perché" si scrive canonicamente con l'accento
grave, ma se lo studente scrive "perche'" NON è un errore, e nemmeno se
scrivesse "perché" con l'accento acuto). Esempio concreto da NON fare:
NON generare mai una voce con testo_originale "perche'" e correzione
"perché" — è esattamente il tipo di correzione VIETATA da questa regola.
Questa eccezione riguarda SOLO la scelta tra queste tre forme (e', è,
é): se la "e" è scritta senza NESSUN accento e senza apostrofo (es.
"perche" o "caffe", una semplice e piatta), quello resta un errore
normale da segnalare. Tutti gli altri errori di accento su altre vocali
(ciò/cio', però/pero', più/piu') restano errori normali da segnalare
come sempre.

IMPORTANTE — "errori" deve contenere SOLO sbagli reali: se un frammento
è scritto correttamente (anche se usa una struttura avanzata o
interessante, es. congiuntivo, pronome relativo, ecc.), quello NON è un
errore — è un punto di forza, e va in "punti_forza" (con l'eventuale
spiegazione del perché funziona bene), MAI in "errori". La regola più
semplice per verificare: "correzione" deve essere SEMPRE diversa da
"testo_originale" — se coinciderebbero, quella voce non va inclusa in
"errori".

Per ogni voce del campo "errori": "testo_originale" è esattamente il
frammento scritto dallo studente (non parafrasato), "correzione" è come
andrebbe scritto correggendo lo sbaglio, "categoria" una delle cinque
previste, e "spiegazione" NON deve limitarsi a segnalare l'errore — deve
includere la regola grammaticale (la parte teorica) che lo spiega, in
1-2 frasi, così lo studente capisce il PERCHÉ e non solo il COSA
correggere.

Esempio di "spiegazione" BEN FATTA: "In italiano l'aggettivo concorda in
genere e numero con il nome che accompagna: 'gatto' è maschile
singolare, quindi richiede 'piccolo' e non 'piccola'."

Esempio di "spiegazione" SBAGLIATA da NON produrre (segnala l'errore
senza spiegare la regola che lo governa): "Errore di concordanza tra
articolo e nome."

Per gli errori specifici con correzione e spiegazione (secondo queste
regole), il punteggio complessivo sopra descritto e una stima del
livello CEFR (A1-C2). Non menzionare mai nomi di certificazioni
specifiche: riferisciti genericamente a "standard internazionali di
lingua italiana" se necessario.`
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

  // Rete di sicurezza: nonostante l'istruzione esplicita nel prompt, Gemini
  // a volte include in "errori" frammenti scritti correttamente (con
  // testo_originale === correzione e una spiegazione che dice che va bene
  // così). Mostrarli come "errore" allo studente è fuorviante — li togliamo
  // qui invece di fidarci solo del prompt.
  //
  // Stessa cosa per l'eccezione "e'/è/é": testato con chiamate reali,
  // Gemini a volte ignora l'istruzione esplicita nel prompt e segnala
  // comunque una di queste tre forme come errore (es. "perche'" → "perché").
  // Il prompt da solo non è abbastanza affidabile per una regola che
  // l'utente vuole rispettata SEMPRE — qui è la barriera deterministica.
  const errori = parsed.data.errori.filter((e) => {
    const originale = e.testo_originale.trim()
    const correzione = e.correzione.trim()
    if (originale === correzione) return false
    if (normalizzaAccentoE(originale) === normalizzaAccentoE(correzione)) return false
    return true
  })

  return { ...parsed.data, errori }
}
