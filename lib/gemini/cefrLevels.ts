/**
 * Calibrazione per livello CEFR (A1-C2), condivisa da tutti i prompt che
 * generano o valutano contenuto — prima ogni prompt passava il livello a
 * Gemini come una semplice etichetta ("livello B1"), senza dirgli cosa
 * significa in termini di esigenza, vocabolario o complessità. Risultato:
 * un B1 e un C1 venivano trattati quasi allo stesso modo.
 */

export const LIVELLO_GENERAZIONE: Record<string, string> = {
  A1: `Livello A1: usa frasi cortissime e dirette. Il materiale deve essere
estremamente semplice, massimo 3-4 frasi brevi, idealmente con una piccola
lista a righe separate (una regola o un esempio per riga) invece di un
paragrafo lungo. Evita termini grammaticali complessi senza spiegarli con
parole quotidiane. Vocabolario molto comune e concreto (famiglia, casa,
cibo, numeri, orari).`,
  A2: `Livello A2: frasi brevi e semplici. Organizza in poche righe chiare,
una idea per riga, con esempi concreti subito dopo ogni regola. Vocabolario
quotidiano (lavoro, viaggi, abitudini), pochissime eccezioni menzionate.`,
  B1: `Livello B1: spiegazione chiara e diretta, in un paragrafo breve o
poche righe. Puoi introdurre 1 eccezione o caso particolare se rilevante,
ma senza appesantire troppo. Vocabolario quotidiano con qualche termine
più articolato (opinioni, esperienze, progetti).`,
  B2: `Livello B2: spiegazione più articolata, puoi collegare la regola a
casi d'uso reali e un paio di eccezioni o sfumature di significato.
Vocabolario più ampio, inclusi termini astratti e di opinione argomentata.`,
  C1: `Livello C1: spiegazione approfondita, con attenzione a registro
(formale/informale), connotazioni ed eccezioni meno comuni. Vocabolario
ricco, inclusi termini settoriali/specialistici quando il contesto lo
richiede.`,
  C2: `Livello C2: spiegazione sofisticata, orientata a sfumature
stilistiche, registro, ed eventuali usi letterari o idiomatici della
struttura. Vocabolario ampio e preciso, inclusi registri letterari o
specialistici.`
}

/**
 * Calibrazione per la VALUTAZIONE (esaminatore) — cosa è realisticamente
 * accettabile/atteso a ciascun livello, per non giudicare un A1 con gli
 * standard di un C1 (o viceversa, sottovalutare un C1 che fa errori che
 * sarebbero normali solo per un principiante).
 */
export const LIVELLO_VALUTAZIONE: Record<string, string> = {
  A1: `Livello A1: aspettati frasi semplicissime, anche isolate, con
errori frequenti di concordanza, articoli e verbi base (essere/avere/
presente indicativo). Un punteggio alto qui significa: si capisce il
messaggio essenziale, anche con errori. Non penalizzare la mancanza di
frasi complesse o subordinate — non sono richieste a questo livello. Sii
particolarmente incoraggiante: per un principiante, scrivere qualcosa di
comprensibile è già un risultato.`,
  A2: `Livello A2: aspettati frasi semplici collegate con connettivi base
(e, ma, perché, quando), errori ancora frequenti su preposizioni e tempi
verbali oltre il presente. Non penalizzare l'assenza di subordinate
complesse o di un registro variato — valuta soprattutto chiarezza e
correttezza di base.`,
  B1: `Livello B1: aspettati frasi semplici e qualche subordinata,
capacità di raccontare esperienze e esprimere opinioni semplici. Errori su
congiuntivo, condizionale o concordanze meno comuni sono normali e non
devono abbassare drasticamente il punteggio se il messaggio resta chiaro.
Valuta positivamente i tentativi di strutture più complesse anche se non
perfetti.`,
  B2: `Livello B2: aspettati buona fluidità su argomenti noti, uso
adeguato di congiuntivo e condizionale nella maggior parte dei casi.
Inizia a valutare anche la varietà lessicale e la coerenza testuale, non
solo la correttezza grammaticale di base.`,
  C1: `Livello C1: aspettati un uso flessibile e preciso della lingua,
incluse strutture complesse e registro adeguato al contesto. A questo
livello, errori di base (es. concordanza semplice) pesano di più nel
punteggio, mentre la valutazione deve dare importanza a precisione
lessicale, coesione testuale e adeguatezza del registro.`,
  C2: `Livello C2: aspettati un controllo quasi nativo della lingua.
Valuta con attenzione sottigliezze di registro, scelte stilistiche e
precisione idiomatica — a questo livello anche piccole imprecisioni di
naturalezza espressiva sono rilevanti per il punteggio.`
}

export function descrizioneLivelloGenerazione(livello: string): string {
  return LIVELLO_GENERAZIONE[livello] ?? LIVELLO_GENERAZIONE.B1
}

export function descrizioneLivelloValutazione(livello?: string): string {
  if (!livello) {
    return 'Nessun livello target specificato: valuta con criteri intermedi (B1), né troppo severi né troppo permissivi.'
  }
  return LIVELLO_VALUTAZIONE[livello] ?? LIVELLO_VALUTAZIONE.B1
}
