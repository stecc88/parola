/**
 * Calibrazione per livello CEFR (A1-C2), condivisa da tutti i prompt che
 * generano o valutano contenuto — prima ogni prompt passava il livello a
 * Gemini come una semplice etichetta ("livello B1"), senza dirgli cosa
 * significa in termini di esigenza, vocabolario o complessità. Risultato:
 * un B1 e un C1 venivano trattati quasi allo stesso modo.
 */

export const LIVELLO_GENERAZIONE: Record<string, string> = {
  A1: `Livello A1: usa frasi cortissime e dirette, quasi sempre al presente
indicativo. Il materiale deve essere estremamente semplice, massimo 3-4
frasi brevi, idealmente con una piccola lista a righe separate (una regola
o un esempio per riga) invece di un paragrafo lungo. Evita termini
grammaticali complessi senza spiegarli con parole quotidiane.

Strutture morfosintattiche ammesse (sillabo ufficiale di riferimento per
il livello A1, ambito produttivo):
- nomi (genere e numero regolare), pronomi personali soggetto;
- aggettivi qualificativi (non richiedere l'accordo nome-aggettivo);
- aggettivi e pronomi possessivi; dimostrativi questo/quello;
  interrogativi chi, che cosa, quale, quanto; indefiniti molto, tanto,
  poco, tutto;
- numeri cardinali da 1 a 20;
- preposizioni semplici (di, a, da, in, con, su, per, tra/fra);
- essere, avere, i modali potere/dovere/volere e i verbi regolari, solo a:
  indicativo presente, indicativo passato prossimo (senza pretendere
  l'accordo del participio passato con il soggetto), infinito presente,
  imperativo (2ª persona singolare/plurale, anche in forma negativa);
- avverbi di base: sì/no; prima, poi, dopo, già, ora/adesso, sempre, mai,
  oggi, domani, ieri; qui/qua, lì/là, sopra, sotto, dentro, fuori, vicino,
  lontano, davanti, dietro; così, molto, poco, tanto, più, meno, bene, male;
- frasi semplici dichiarative e interrogative (chi, come, dove, quando,
  perché, che cosa, quanto); al massimo frasi coordinate con e/ma o
  subordinate elementari con perché, quando, per + infinito.

EVITA a questo livello: congiuntivo (qualsiasi tempo), condizionale,
futuro, imperfetto, trapassato, gerundio, participio assoluto,
subordinate relative o ipotetiche, preposizioni articolate (usa solo la
forma semplice), si impersonale/passivante (es. "si mangia", "si usa" —
è un'aggiunta del sillabo A2) — sono riconoscibili solo passivamente a
questo livello, non richieste in produzione.

Vocabolario molto comune e concreto legato a bisogni quotidiani immediati
(presentarsi, famiglia, casa, cibo, numeri, orari, saluti).`,
  A2: `Livello A2: frasi brevi e semplici, quasi sempre al presente o al
passato prossimo/imperfetto. Organizza in poche righe chiare, una idea
per riga, con esempi concreti subito dopo ogni regola.

Oltre a tutto quanto ammesso a livello A1, il sillabo ufficiale di
riferimento per A2, ambito produttivo, richiede in più:
- accordo tra nome e aggettivo;
- pronomi personali complemento: forme toniche, e forme atone lo, la, li, le;
- numeri cardinali (senza limite) e ordinali primo, secondo, terzo;
- preposizioni articolate formate con di, a, da, su (del, alla, dal, sul,
  ecc.);
- imperfetto indicativo, oltre a presente e passato prossimo (verbi
  regolari, irregolari andare/bere/dare/dire/fare/stare/venire, e i
  modali);
- avverbi qualificativi, di tempo, quantità, luogo, affermazione e
  negazione più frequenti;
- proposizioni esclamative;
- proposizioni coordinate introdotte da o, invece, allora, infatti,
  non solo... ma anche;
- proposizioni subordinate oggettive introdotte da che, relative
  introdotte da che (centrate sul soggetto), ipotetiche introdotte da se.

EVITA ancora a questo livello: congiuntivo (qualsiasi tempo),
condizionale, futuro, trapassato, gerundio, participio assoluto,
subordinate diverse da quelle elencate sopra — non sono richieste in
produzione a A2, solo riconoscibili passivamente.

Vocabolario quotidiano (lavoro, viaggi, abitudini, famiglia, tempo
libero), pochissime eccezioni menzionate.`,
  B1: `Livello B1: spiegazione chiara e diretta, in un paragrafo breve o
poche righe. Puoi introdurre 1 eccezione o caso particolare se rilevante,
ma senza appesantire troppo.

Oltre a tutto quanto ammesso ad A1/A2, il sillabo ufficiale di
riferimento per B1 richiede in più:
- articoli determinativi e indeterminativi (uso completo);
- posizione dell'aggettivo qualificativo; comparativo e superlativo;
- pronomi personali forme toniche e atone, pronomi riflessivi;
- pronomi relativi; aggettivi e pronomi indefiniti ogni, ciascuno,
  nessuno, qualche;
- preposizioni articolate (uso completo);
- coniugazione attiva e riflessiva (es. lavarsi, svegliarsi) dei verbi
  regolari, dei modali e di dare/fare/stare/andare/potere/sapere/bere/
  dire/venire, a: indicativo presente, passato prossimo, imperfetto,
  infinito presente, imperativo, condizionale presente;
- avverbi qualificativi, di tempo, quantità, luogo più frequenti;
- frasi dichiarative, interrogative, esclamative, volitive con
  imperativo e condizionale;
- coordinate copulative, avversative, dichiarative;
- subordinate oggettive implicite, temporali, causali, dichiarative,
  relative esplicite.

EVITA ancora a questo livello: passato remoto, trapassato prossimo,
futuro semplice/anteriore, congiuntivo (qualsiasi tempo), condizionale
passato, gerundio, participio assoluto.

Vocabolario quotidiano con qualche termine più articolato (opinioni,
esperienze, progetti).`,
  B2: `Livello B2: spiegazione più articolata, puoi collegare la regola a
casi d'uso reali e un paio di eccezioni o sfumature di significato.

Oltre a tutto quanto ammesso ai livelli precedenti, il sillabo ufficiale
di riferimento per B2 richiede in più:
- pronomi allocutivi (Lei formale); pronomi e aggettivi indefiniti
  (chiunque, qualsiasi, alcuno, nessuno...); pronomi combinati (me lo,
  glielo, ce ne, ve lo...); particelle pronominali ci e ne;
- coniugazione attiva e riflessiva, anche irregolare, a tutti i modi e
  tempi, incluso passato remoto, trapassato prossimo, futuro semplice e
  anteriore, condizionale passato, congiuntivo presente e imperfetto,
  infinito passato;
- forma passiva (solo riconoscimento, non necessariamente da produrre
  attivamente); verbi impersonali (bisogna, occorre, sembra, pare,
  basta...);
- avverbi di giudizio e dubbio (forse, probabilmente, certamente,
  purtroppo);
- proposizioni volitive al congiuntivo/indicativo/infinito; coordinate
  disgiuntive, conclusive, correlative; subordinate soggettive, finali,
  comparative, condizionali con ipotesi reale, concessive esplicite,
  consecutive esplicite, temporali implicite.

EVITA ancora a questo livello: gerundio (in nessuna funzione, es.
"sollevando", "liberando"), participio presente o assoluto, verbi
pronominali/difettivi/fraseologici come categoria dedicata,
nominalizzazione esplicita, proposizioni avversative/incidentali/
esclusive/limitative, condizionali con ipotesi irreale — sono aggiunte
del sillabo C1, non richieste a B2. La forma passiva è ammessa solo a
livello ricettivo: non chiederla come struttura da produrre attivamente.

Vocabolario più ampio, inclusi termini astratti e di opinione
argomentata.`,
  C1: `Livello C1: spiegazione approfondita, con attenzione a registro
(formale/informale), connotazioni ed eccezioni meno comuni.

Oltre a tutto quanto ammesso ai livelli precedenti, il sillabo ufficiale
di riferimento per C1 richiede in più: congiuntivo passato e trapassato;
gerundio presente e passato; participio presente, passato e assoluto;
forma passiva anche con venire/andare; verbi pronominali (farcela,
prendersela), fraseologici (stare per, finire per) e difettivi (solere);
condizionali con ipotesi possibile o irreale (esplicite e implicite);
consecutive, concessive e modali implicite; proposizioni avversative,
incidentali, esclusive, limitative; nominalizzazione; discorso diretto e
indiretto con consecutio temporum completa.

Vocabolario ricco, inclusi termini settoriali/specialistici quando il
contesto lo richiede.`,
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
  A1: `Livello A1: aspettati frasi semplicissime, spesso isolate, quasi
sempre al presente indicativo (essere, avere, modali, verbi regolari) o al
passato prossimo di base. Testi brevi sono normali e completi a questo
livello — indicativamente 15-40 parole secondo il profilo ufficiale di
"produzione scritta" per A1 — non penalizzare la brevità in sé.

Valuta positivamente se lo studente usa correttamente: articoli, genere e
numero, possessivi/dimostrativi/interrogativi di base, preposizioni
semplici, numeri, e riesce a farsi capire su bisogni concreti e immediati
(presentarsi, descrivere persone/luoghi familiari, chiedere o dare
informazioni di base).

NON penalizzare l'assenza di: congiuntivo, condizionale, futuro,
imperfetto, gerundio, preposizioni articolate, frasi subordinate
complesse o relative — non sono richieste in produzione a questo livello,
anche se lo studente potrebbe riconoscerle passivamente. Errori frequenti
di concordanza e su articoli/verbi base sono normali e non devono
abbassare drasticamente il punteggio se il messaggio essenziale si
capisce. Sii particolarmente incoraggiante: per un principiante, scrivere
qualcosa di comprensibile è già un risultato.`,
  A2: `Livello A2: aspettati frasi semplici, spesso collegate con
connettivi base (e, ma, perché, quando, o, invece, allora, infatti) e un
uso già presente di imperfetto e passato prossimo insieme (es. per
raccontare esperienze passate), oltre all'accordo nome-aggettivo e ai
pronomi complemento (lo, la, li, le, forme toniche). Testi normali a
questo livello: indicativamente 25-60 parole secondo il profilo
ufficiale di "produzione scritta" per A2 (varia secondo il tipo di
prova — descrizione, narrazione diaristica, richiesta di informazioni,
lettera informale) — non penalizzare la brevità in sé.

Valuta positivamente: uso corretto o quasi dell'accordo nome-aggettivo,
scelta e coniugazione dell'ausiliare al passato prossimo, alternanza
passato prossimo/imperfetto in una narrazione semplice, connettivi di
base, capacità di descrivere persone/luoghi familiari e raccontare
esperienze o attività quotidiane.

NON penalizzare l'assenza di: congiuntivo, condizionale, futuro,
trapassato, gerundio, o di subordinate diverse da oggettive con che,
relative con che sul soggetto, o ipotetiche con se — non sono richieste
in produzione a questo livello. Errori su preposizioni articolate e
tempi verbali oltre presente/passato prossimo/imperfetto sono normali e
non devono abbassare drasticamente il punteggio se il messaggio resta
chiaro.`,
  B1: `Livello B1: aspettati frasi semplici e qualche subordinata (oggettive
implicite, temporali, causali, relative esplicite), pronomi riflessivi e
relativi, comparativo/superlativo, condizionale presente per richieste
cortesi o desideri. Capacità di raccontare esperienze e esprimere
opinioni semplici. Testi normali a questo livello: indicativamente
50-120 parole secondo il profilo ufficiale di "produzione scritta" per
B1 (varia tra descrizione/narrazione più lunga e lettera informale più
breve) — non penalizzare la brevità in sé se il testo rientra in questo
range.

Errori su congiuntivo, passato remoto, trapassato prossimo, futuro,
condizionale passato, gerundio o concordanze meno comuni sono normali e
non devono abbassare drasticamente il punteggio se il messaggio resta
chiaro — non sono richiesti in produzione a questo livello. Valuta
positivamente i tentativi di strutture più complesse anche se non
perfetti.`,
  B2: `Livello B2: aspettati buona fluidità su argomenti noti, uso già
presente (anche se non sempre perfetto) di congiuntivo presente/
imperfetto, condizionale passato, passato remoto/trapassato in
narrazioni più articolate, pronomi combinati e particelle ci/ne. Testi
normali a questo livello: indicativamente 80-140 parole secondo il
profilo ufficiale di "produzione scritta" per B2 (varia tra descrizione/
recensione/saggio breve più lungo e lettera formale più breve) — non
penalizzare la brevità in sé se il testo rientra in questo range.

Inizia a valutare anche la varietà lessicale, la coesione testuale
(connettivi vari, non solo e/ma/perché) e l'adeguatezza del registro
(formale/informale), non solo la correttezza grammaticale di base.
Errori isolati su strutture avanzate (congiuntivo, forma passiva,
concessive/consecutive esplicite) non devono pesare quanto un errore
sulle strutture di base già richieste ai livelli precedenti.`,
  C1: `Livello C1: aspettati un uso flessibile e preciso della lingua,
incluse strutture complesse (congiuntivo passato/trapassato, gerundio,
condizionali con ipotesi irreale, discorso indiretto con consecutio
temporum, nominalizzazione) e registro adeguato al contesto. Testi
normali a questo livello: indicativamente 100-180 parole secondo il
profilo ufficiale di "produzione scritta" per C1 (saggio breve più
lungo, lettera formale più breve) — non penalizzare la brevità in sé se
il testo rientra in questo range.

A questo livello, errori di base (es. concordanza semplice, uso di
tempi verbali già richiesti ai livelli precedenti) pesano di più nel
punteggio, mentre la valutazione deve dare importanza a precisione
lessicale, coesione testuale, adeguatezza del registro e uso corretto
delle strutture avanzate elencate sopra quando il testo le richiede.`,
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
