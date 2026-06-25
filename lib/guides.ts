export interface Guida {
  slug: string
  titolo: string
  descrizione: string
  consegna: string
  // true per i tipi che corrispondono esattamente a una delle prove
  // reali dell'esame CILS B1 "Produzione scritta" (Percorso CILS UNO-B1,
  // Esempio Prova N.1 e N.2) — il manuale ufficiale ne specifica solo 2:
  // descrizione di una persona, e lettera informale/email a un amico.
  fedele: boolean
  // Una delle 5 tipologie testuali fondamentali del sillabo (descrittivo,
  // narrativo, espositivo, regolativo, argomentativo) — o null se la
  // guida è un genere specifico che non rientra in una sola categoria
  // pura (es. l'email formale mescola elementi regolativi e descrittivi).
  categoria: 'descrittivo' | 'narrativo' | 'espositivo' | 'regolativo' | 'argomentativo' | null
  // Spiegazione semplice di COS'È questo tipo testuale in generale —
  // per chi non ha mai sentito questi nomi e non sa cosa significano.
  categoriaSpiegazione: string
  // Lunghezza consigliata in parole, come negli esami reali — aiuta lo
  // studente a capire quanto scrivere senza doverlo indovinare.
  paroleMin: number
  paroleMax: number
  // Passi della struttura, nell'ordine in cui il testo si scrive — non
  // sono un "indice", sono pensati come una checklist da seguire mentre
  // si scrive, per chi non sa da dove cominciare.
  struttura: { titolo: string; descrizione: string }[]
  // Frasi pronte da usare/adattare, raggruppate per momento del testo —
  // l'aiuto più concreto per superare il blocco del foglio bianco: non
  // "cosa devo scrivere" in abstratto, ma frasi vere da completare.
  frasiUtili: { sezione: string; frasi: string[] }[]
  // Parole/espressioni tipiche del tipo di testo, per arricchire il
  // vocabolario senza dover andare a cercarlo altrove.
  vocabolarioChiave: string[]
}

/**
 * Guide di scrittura: modalità guidata con consegna fissa e scaffolding
 * pedagogico completo per tipo di testo. Pensate per chi non sa da dove
 * iniziare a scrivere — non solo "cosa" scrivere ma "come" strutturarlo,
 * con frasi pronte e vocabolario chiave. Al hacer clic en una guía, el
 * estudiante va a /student/write con la consegna pre-cargada; la
 * evaluación de Gemini la tiene en cuenta (ver lib/gemini/prompts/
 * examinador.ts).
 */
export const GUIDES: Guida[] = [
  {
    slug: 'descrizione',
    titolo: 'Descrizione di una persona',
    descrizione: 'Descrivi una persona della tua famiglia o un amico.',
    consegna:
      'Descrivi una persona della tua famiglia o un amico. Parla del suo aspetto fisico, del carattere, di cosa fa nella vita e di perché è importante per te.',
    fedele: true,
    categoria: 'descrittivo',
    categoriaSpiegazione: 'Il tipo descrittivo presenta le caratteristiche di una persona, un luogo o un oggetto: com\'è, che aspetto ha, quali qualità lo distinguono. Non racconta una storia né un\'opinione: "fotografa" qualcosa a parole.',
    paroleMin: 100,
    paroleMax: 120,
    struttura: [
      { titolo: 'Chi è questa persona', descrizione: 'Presenta chi descrivi e il suo legame con te (es. mia sorella, il mio migliore amico).' },
      { titolo: 'Aspetto fisico', descrizione: "Descrivi com'è fisicamente: età approssimativa, altezza, capelli, occhi, stile." },
      { titolo: 'Carattere e personalità', descrizione: 'Racconta com\'è caratterialmente: simpatico, paziente, divertente, ecc., con un piccolo esempio.' },
      { titolo: 'Cosa fa / perché è importante', descrizione: 'Di cosa si occupa (lavoro, studio, hobby) e perché questa persona è importante per te.' }
    ],
    frasiUtili: [
      { sezione: 'Per iniziare', frasi: ['Voglio descrivere...', 'La persona che voglio descrivere è...', 'Si chiama [nome] ed è mio/a...'] },
      { sezione: 'Per il fisico', frasi: ['Ha i capelli...', 'È alto/a...', 'Ha gli occhi...', 'Porta sempre...'] },
      { sezione: 'Per il carattere', frasi: ['È una persona molto...', 'Quello che mi piace di lui/lei è...', 'A volte è un po\'...', 'Sa sempre come...'] },
      { sezione: 'Per concludere', frasi: ['Per questo motivo, per me è...', 'Non potrei vivere senza...', 'Lo/La ammiro molto perché...'] }
    ],
    vocabolarioChiave: ['simpatico/a', 'paziente', 'generoso/a', 'capelli', 'altezza', 'carattere', 'somigliare a']
  },
  {
    slug: 'lettera-informale',
    titolo: 'Lettera informale',
    descrizione: 'Scrivi a un amico raccontando un evento recente.',
    consegna:
      'Scrivi una lettera informale a un amico/a raccontando qualcosa che ti è successo di recente. Usa un registro colloquiale, saluti iniziali e finali tipici di una lettera personale.',
    fedele: true,
    categoria: null,
    categoriaSpiegazione: 'Una lettera o email informale non è una delle 5 tipologie testuali pure: mescola elementi narrativi (racconti cosa è successo) e descrittivi (descrivi persone o luoghi), con un registro colloquiale tipico della corrispondenza personale.',
    paroleMin: 80,
    paroleMax: 100,
    struttura: [
      { titolo: 'Saluto iniziale', descrizione: "Apri con un saluto informale e chiedi come sta l'amico/a." },
      { titolo: 'Motivo della lettera', descrizione: "Dì brevemente perché scrivi (es. raccontare qualcosa di nuovo)." },
      { titolo: 'Il racconto', descrizione: "Racconta l'evento: cosa è successo, quando, dove, con chi, come ti sei sentito." },
      { titolo: 'Saluto finale', descrizione: "Chiudi con un saluto informale e magari un invito a risponderti." }
    ],
    frasiUtili: [
      { sezione: 'Per iniziare', frasi: ['Ciao [nome], come stai?', 'Caro/a [nome], spero tu stia bene!', 'Ciao! Scusa se non scrivo da tanto...'] },
      { sezione: 'Per raccontare', frasi: ['Ti scrivo perché volevo raccontarti...', 'Indovina cosa mi è successo!', 'La settimana scorsa...', 'Non puoi immaginare cosa...'] },
      { sezione: 'Per concludere', frasi: ['Fammi sapere tue notizie!', 'Scrivimi presto!', 'Un abbraccio,', 'A presto,'] }
    ],
    vocabolarioChiave: ['raccontare', 'succedere', 'incredibile', 'divertente', 'sorpresa', 'abbraccio', 'salutare']
  },
  {
    slug: 'email-formale',
    titolo: 'Email formale',
    descrizione: 'Scrivi una email per richiedere informazioni.',
    consegna:
      'Scrivi una email formale per richiedere informazioni su un corso, un servizio o un prodotto. Usa un registro formale, formule di apertura e chiusura appropriate.',
    fedele: false,
    categoria: 'regolativo',
    categoriaSpiegazione: 'Una email formale è in parte di tipo regolativo: segue regole fisse di formattazione e cortesia (formule di apertura/chiusura obbligatorie) più che raccontare o descrivere qualcosa.',
    paroleMin: 80,
    paroleMax: 100,
    struttura: [
      { titolo: 'Formula di apertura', descrizione: "Saluta in modo formale, indicando a chi scrivi se lo sai." },
      { titolo: 'Presentazione', descrizione: "Dì brevemente chi sei, se rilevante per la richiesta." },
      { titolo: 'La richiesta', descrizione: "Spiega chiaramente cosa vuoi sapere: orari, costi, modalità, requisiti." },
      { titolo: 'Formula di chiusura', descrizione: "Ringrazia e chiudi con una formula di cortesia formale." }
    ],
    frasiUtili: [
      { sezione: 'Per iniziare', frasi: ['Gentile [Direttore/Signora/Signor]...', 'In riferimento a..., vorrei chiedere informazioni su...', 'Mi chiamo [nome] e sono interessato/a a...'] },
      { sezione: 'Per la richiesta', frasi: ['Vorrei sapere se...', 'Potrebbe indicarmi...', 'Sarei grato/a se potesse fornirmi maggiori informazioni su...', 'Gradirei conoscere gli orari e i costi di...'] },
      { sezione: 'Per concludere', frasi: ['Resto in attesa di una Sua risposta.', 'La/Lo ringrazio anticipatamente.', 'Cordiali saluti,', 'Distinti saluti,'] }
    ],
    vocabolarioChiave: ['gentile', 'cordiali saluti', 'in attesa di', 'gradirei', 'informazioni', 'modalità', 'requisiti']
  },
  {
    slug: 'racconto-breve',
    titolo: 'Racconto breve',
    descrizione: "Inventa una breve storia con un'introduzione, sviluppo e conclusione.",
    consegna:
      "Scrivi un racconto breve (introduzione, sviluppo, conclusione) su un argomento a tua scelta. Presta attenzione alla coerenza temporale e all'uso dei tempi verbali del passato.",
    fedele: false,
    categoria: 'narrativo',
    categoriaSpiegazione: 'Il tipo narrativo racconta una storia o una sequenza di eventi nel tempo: cosa è successo, in che ordine, con quali personaggi. Usa soprattutto i tempi del passato (passato prossimo, imperfetto).',
    paroleMin: 100,
    paroleMax: 130,
    struttura: [
      { titolo: 'Introduzione', descrizione: "Presenta i personaggi, il luogo e il momento (quando e dove succede)." },
      { titolo: 'Sviluppo', descrizione: "Racconta cosa succede, in ordine cronologico, con almeno un evento centrale." },
      { titolo: 'Conclusione', descrizione: "Chiudi la storia: come finisce, cosa hanno imparato/sentito i personaggi." }
    ],
    frasiUtili: [
      { sezione: 'Per iniziare', frasi: ['C\'era una volta...', 'Un giorno, [nome] decise di...', 'Tutto cominciò quando...', 'Era una mattina come tante, quando...'] },
      { sezione: 'Per lo sviluppo', frasi: ['Improvvisamente...', 'Dopo qualche minuto...', 'Senza pensarci due volte...', 'Nel frattempo...'] },
      { sezione: 'Per concludere', frasi: ['Alla fine...', 'Da quel giorno...', 'E così la storia si conclude...', 'Non avrebbe mai immaginato che...'] }
    ],
    vocabolarioChiave: ['improvvisamente', 'finalmente', 'nel frattempo', 'all\'improvviso', 'accadere', 'rendersi conto', 'decidere']
  },
  {
    slug: 'articolo-opinione',
    titolo: 'Articolo di opinione',
    descrizione: 'Esprimi e argomenta la tua opinione su un tema attuale.',
    consegna:
      'Scrivi un breve articolo di opinione su un tema di attualità a tua scelta. Presenta una tesi chiara, almeno due argomenti a supporto e una conclusione.',
    fedele: false,
    categoria: 'argomentativo',
    categoriaSpiegazione: 'Il tipo argomentativo presenta una tesi (la tua opinione) e la sostiene con argomenti ed esempi, per convincere chi legge. Non basta dire cosa pensi: devi spiegare perché.',
    paroleMin: 120,
    paroleMax: 150,
    struttura: [
      { titolo: 'Introduzione del tema', descrizione: "Presenta il tema e la tua tesi (la tua opinione principale) in modo chiaro." },
      { titolo: 'Primo argomento', descrizione: "Sviluppa un argomento a supporto della tua tesi, con un esempio se possibile." },
      { titolo: 'Secondo argomento', descrizione: "Aggiungi un secondo argomento, diverso dal primo, per rafforzare la tesi." },
      { titolo: 'Conclusione', descrizione: "Riassumi la tua posizione e chiudi con una riflessione finale." }
    ],
    frasiUtili: [
      { sezione: 'Per iniziare', frasi: ['Negli ultimi anni si discute molto di...', 'Secondo me,...', 'A mio parere, è fondamentale...', 'Il tema di [argomento] è oggi molto attuale perché...'] },
      { sezione: 'Per argomentare', frasi: ['Innanzitutto,...', 'Inoltre,...', 'Un altro aspetto da considerare è...', 'Per esempio,...', 'Bisogna anche tenere conto del fatto che...'] },
      { sezione: 'Per concludere', frasi: ['In conclusione,...', 'Per questi motivi, credo che...', 'In definitiva,...', 'Spero che in futuro...'] }
    ],
    vocabolarioChiave: ['secondo me', 'a mio parere', 'innanzitutto', 'inoltre', 'tuttavia', 'in conclusione', 'sostenere', 'argomentare']
  },
  {
    slug: 'esposizione',
    titolo: 'Esposizione di un argomento',
    descrizione: 'Spiega in modo chiaro e oggettivo un argomento che conosci.',
    consegna:
      'Scegli un argomento che conosci bene (una tradizione del tuo paese, una città, un\'attività che pratichi) e spiega le sue caratteristiche principali in modo chiaro e oggettivo, organizzando le informazioni in modo logico.',
    fedele: false,
    categoria: 'espositivo',
    categoriaSpiegazione: 'Il tipo espositivo presenta informazioni su un argomento in modo oggettivo e organizzato, per far capire qualcosa a chi legge — non per raccontare una storia né per convincere di un\'opinione, ma per spiegare fatti e caratteristiche in modo chiaro.',
    paroleMin: 100,
    paroleMax: 130,
    struttura: [
      { titolo: 'Presentazione del tema', descrizione: 'Dì di cosa parlerai e perché lo conosci o lo trovi interessante.' },
      { titolo: 'Caratteristiche principali', descrizione: 'Organizza le informazioni per punti: cosa è, come funziona, quali sono i suoi aspetti principali.' },
      { titolo: 'Dettagli ed esempi', descrizione: 'Aggiungi dettagli concreti o un esempio che aiuti a capire meglio.' },
      { titolo: 'Conclusione', descrizione: 'Riassumi brevemente i punti principali esposti.' }
    ],
    frasiUtili: [
      { sezione: 'Per iniziare', frasi: ['Voglio parlare di...', '[Argomento] è...', 'Una delle cose più interessanti di [argomento] è...'] },
      { sezione: 'Per esporre', frasi: ['Prima di tutto,...', 'Per quanto riguarda...', 'È importante sapere che...', 'Si tratta di...', 'Funziona così:...'] },
      { sezione: 'Per concludere', frasi: ['Riassumendo,...', 'In breve,...', 'Questo è in generale come funziona...'] }
    ],
    vocabolarioChiave: ['per quanto riguarda', 'si tratta di', 'consiste in', 'caratteristica', 'in generale', 'funzionare']
  },
  {
    slug: 'regole-istruzioni',
    titolo: 'Istruzioni e regole',
    descrizione: 'Spiega come fare qualcosa, passo dopo passo (es. una ricetta).',
    consegna:
      'Scrivi le istruzioni per fare qualcosa che sai fare bene (una ricetta, un gioco, un\'attività). Spiega cosa serve e i passaggi in ordine, usando l\'imperativo o il "si" impersonale.',
    fedele: false,
    categoria: 'regolativo',
    categoriaSpiegazione: 'Il tipo regolativo dà istruzioni o regole da seguire — come fare qualcosa, in che ordine, cosa serve. Usa verbi all\'imperativo ("mescola", "aggiungi") o il "si" impersonale ("si mescola", "si aggiunge"), ed è organizzato in passaggi, non in un racconto continuo.',
    paroleMin: 80,
    paroleMax: 110,
    struttura: [
      { titolo: 'Cosa otterrai', descrizione: 'Dì brevemente cosa si imparerà a fare o ottenere seguendo queste istruzioni.' },
      { titolo: 'Cosa serve', descrizione: 'Elenca gli ingredienti, i materiali o le condizioni necessarie prima di iniziare.' },
      { titolo: 'I passaggi in ordine', descrizione: 'Scrivi i passaggi uno dopo l\'altro, nell\'ordine esatto in cui vanno fatti.' },
      { titolo: 'Consiglio finale', descrizione: 'Aggiungi un consiglio utile o un avvertimento per riuscire meglio.' }
    ],
    frasiUtili: [
      { sezione: 'Per iniziare', frasi: ['Per fare [nome], avrai bisogno di...', 'Ecco come si prepara/si gioca a...', 'Prima di iniziare, procurati...'] },
      { sezione: 'Per i passaggi', frasi: ['Prima di tutto,...', 'Poi,...', 'A questo punto,...', 'Mescola/Aggiungi/Versa...', 'Si mescola/Si aggiunge...', 'Infine,...'] },
      { sezione: 'Per concludere', frasi: ['Il consiglio è di...', 'Attenzione a non...', 'È pronto quando...'] }
    ],
    vocabolarioChiave: ['prima di tutto', 'poi', 'infine', 'a questo punto', 'mescolare', 'aggiungere', 'procurarsi', 'attenzione a']
  }
]

export function getGuidaBySlug(slug: string | null): Guida | undefined {
  return GUIDES.find((g) => g.slug === slug)
}

type LivelloCefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

interface AdattamentoLivello {
  // Moltiplicatore applicato a paroleMin/paroleMax della guida (definiti
  // per B1) — così la proporzione tra i diversi tipi di testo si
  // mantiene, invece di usare lo stesso range fisso per tutti i livelli.
  fattoreLunghezza: number
  // Nota grammaticale/di registro specifica per il livello, aggiunta in
  // coda alla consegna — è il punto centrale: un A1 non deve essere
  // valutato (né istruito) con le stesse aspettative di un C1.
  notaGrammaticale: string
}

const ADATTAMENTO_PER_CATEGORIA: Record<string, Record<LivelloCefr, AdattamentoLivello>> = {
  descrittivo: {
    A1: { fattoreLunghezza: 0.25, notaGrammaticale: "Usa frasi semplicissime al presente (è, ha, si chiama)." },
    A2: { fattoreLunghezza: 0.45, notaGrammaticale: 'Usa il presente indicativo, con qualche aggettivo per frase.' },
    B1: { fattoreLunghezza: 1, notaGrammaticale: 'Usa il presente indicativo con buona varietà di aggettivi e connettivi.' },
    B2: { fattoreLunghezza: 1.3, notaGrammaticale: 'Aggiungi dettagli più ricchi e qualche frase relativa (che, il quale).' },
    C1: { fattoreLunghezza: 1.6, notaGrammaticale: 'Usa un registro più elaborato, con sfumature di significato negli aggettivi.' },
    C2: { fattoreLunghezza: 2, notaGrammaticale: 'Usa un linguaggio ricco e preciso, con scelte stilistiche personali.' }
  },
  narrativo: {
    A1: { fattoreLunghezza: 0.3, notaGrammaticale: 'Racconta con frasi semplicissime, principalmente al presente.' },
    A2: { fattoreLunghezza: 0.5, notaGrammaticale: 'Puoi iniziare a usare il passato prossimo per le azioni concluse.' },
    B1: { fattoreLunghezza: 1, notaGrammaticale: "Usa passato prossimo e imperfetto, prestando attenzione alla coerenza temporale." },
    B2: { fattoreLunghezza: 1.3, notaGrammaticale: 'Usa passato prossimo, imperfetto e trapassato prossimo dove serve.' },
    C1: { fattoreLunghezza: 1.6, notaGrammaticale: 'Varia i tempi verbali con precisione, incluso il trapassato e connettivi narrativi più ricchi.' },
    C2: { fattoreLunghezza: 2, notaGrammaticale: 'Usa una gamma completa di tempi verbali e tecniche narrative (es. flashback).' }
  },
  espositivo: {
    A1: { fattoreLunghezza: 0.3, notaGrammaticale: 'Usa frasi brevi e semplici al presente.' },
    A2: { fattoreLunghezza: 0.5, notaGrammaticale: 'Usa il presente indicativo, con connettivi semplici (e, ma, poi).' },
    B1: { fattoreLunghezza: 1, notaGrammaticale: "Organizza le informazioni con connettivi (prima di tutto, inoltre, infine)." },
    B2: { fattoreLunghezza: 1.3, notaGrammaticale: "Usa connettivi più variati e qualche struttura impersonale (si dice che...)." },
    C1: { fattoreLunghezza: 1.6, notaGrammaticale: 'Usa un registro più formale e strutture impersonali/passive dove opportuno.' },
    C2: { fattoreLunghezza: 2, notaGrammaticale: 'Usa un registro accademico, con strutture complesse e lessico specifico.' }
  },
  regolativo: {
    A1: { fattoreLunghezza: 0.4, notaGrammaticale: "Usa frasi cortissime, anche solo con l'infinito (es. 'mescolare', 'aggiungere')." },
    A2: { fattoreLunghezza: 0.6, notaGrammaticale: 'Usa l\'imperativo informale (tu) per i passaggi.' },
    B1: { fattoreLunghezza: 1, notaGrammaticale: "Usa l'imperativo o il \"si\" impersonale per i passaggi." },
    B2: { fattoreLunghezza: 1.2, notaGrammaticale: 'Usa il "si" impersonale in modo consistente, con connettivi di sequenza vari.' },
    C1: { fattoreLunghezza: 1.4, notaGrammaticale: 'Usa un registro più formale/tecnico, adatto a un manuale o regolamento.' },
    C2: { fattoreLunghezza: 1.6, notaGrammaticale: 'Usa un linguaggio regolativo formale, preciso e senza ambiguità.' }
  },
  argomentativo: {
    A1: { fattoreLunghezza: 0.25, notaGrammaticale: "Esprimi un'opinione semplicissima (mi piace / non mi piace) con \"perché\"." },
    A2: { fattoreLunghezza: 0.4, notaGrammaticale: 'Esprimi un\'opinione semplice con un motivo, usando "perché" o "secondo me".' },
    B1: { fattoreLunghezza: 1, notaGrammaticale: 'Presenta una tesi con almeno due argomenti a supporto.' },
    B2: { fattoreLunghezza: 1.3, notaGrammaticale: 'Argomenta con esempi concreti e considera anche un punto di vista contrario.' },
    C1: { fattoreLunghezza: 1.6, notaGrammaticale: 'Usa un\'argomentazione articolata, con concessioni e contro-argomentazioni.' },
    C2: { fattoreLunghezza: 2, notaGrammaticale: 'Costruisci un\'argomentazione sofisticata, con registro e lessico da saggio.' }
  }
}

// Le guide senza una categoria pura (lettera-informale, email-formale)
// hanno il proprio adattamento dedicato per slug.
const ADATTAMENTO_PER_SLUG: Record<string, Record<LivelloCefr, AdattamentoLivello>> = {
  'lettera-informale': {
    A1: { fattoreLunghezza: 0.3, notaGrammaticale: 'Usa frasi semplicissime al presente, con saluti di base.' },
    A2: { fattoreLunghezza: 0.55, notaGrammaticale: 'Puoi usare il passato prossimo per raccontare cosa è successo.' },
    B1: { fattoreLunghezza: 1, notaGrammaticale: 'Usa un registro colloquiale, con passato prossimo e imperfetto.' },
    B2: { fattoreLunghezza: 1.3, notaGrammaticale: 'Aggiungi dettagli ed espressioni colloquiali più ricche.' },
    C1: { fattoreLunghezza: 1.5, notaGrammaticale: 'Usa un tono naturale e idiomatico, come un madrelingua giovane.' },
    C2: { fattoreLunghezza: 1.8, notaGrammaticale: 'Usa un linguaggio colloquiale ricco, con espressioni idiomatiche.' }
  },
  'email-formale': {
    A1: { fattoreLunghezza: 0.4, notaGrammaticale: 'Usa frasi semplicissime e formule fisse di saluto formale.' },
    A2: { fattoreLunghezza: 0.6, notaGrammaticale: 'Usa il presente e formule di cortesia semplici.' },
    B1: { fattoreLunghezza: 1, notaGrammaticale: 'Usa un registro formale con il condizionale di cortesia (vorrei, potrebbe).' },
    B2: { fattoreLunghezza: 1.2, notaGrammaticale: 'Usa un registro formale più articolato, con qualche subordinata.' },
    C1: { fattoreLunghezza: 1.4, notaGrammaticale: 'Usa un registro formale sofisticato, adatto a un contesto professionale.' },
    C2: { fattoreLunghezza: 1.6, notaGrammaticale: 'Usa un registro formale impeccabile, con precisione lessicale.' }
  }
}

export interface ConsegnaAdattata {
  consegna: string
  paroleMin: number
  paroleMax: number
}

/**
 * Adatta la consegna, la lunghezza e l'esigenza grammaticale di una
 * guida al livello CEFR scelto dallo studente. Le guide sono definite
 * con un range di parole "base" pensato per B1 (lo stesso usato
 * dall'esame CILS reale dove applicabile) — gli altri livelli scalano
 * proporzionalmente, invece di chiedere lo stesso numero di parole e la
 * stessa complessità grammaticale a un A1 e a un C1.
 */
export function getConsegnaAdattata(guida: Guida, livello: LivelloCefr): ConsegnaAdattata {
  const mappa = guida.categoria
    ? ADATTAMENTO_PER_CATEGORIA[guida.categoria]
    : ADATTAMENTO_PER_SLUG[guida.slug]
  const adattamento = mappa?.[livello]

  if (!adattamento) {
    return { consegna: guida.consegna, paroleMin: guida.paroleMin, paroleMax: guida.paroleMax }
  }

  return {
    consegna: `${guida.consegna} ${adattamento.notaGrammaticale}`,
    paroleMin: Math.max(15, Math.round(guida.paroleMin * adattamento.fattoreLunghezza)),
    paroleMax: Math.max(25, Math.round(guida.paroleMax * adattamento.fattoreLunghezza))
  }
}
