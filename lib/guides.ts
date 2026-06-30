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
  frasiUtili: { sezione: string; frasi: string[] }[]
  vocabolarioChiave: string[]
}

/**
 * Guide di scrittura: modalità guidata con consegna fissa e scaffolding
 * pedagogico completo per tipo di testo. Pensate per chi non sa da dove
 * iniziare a scrivere — non solo "cosa" scrivere ma "come" strutturarlo,
 * con frasi pronte e vocabolario chiave. Cliccando una guida, lo studente
 * va su /student/write con la consegna pre-caricata; la valutazione di
 * Gemini la prende in considerazione (vedi lib/gemini/prompts/examinador.ts).
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
  fattoreLunghezza: number
  notaGrammaticale: string
  struttura?: { titolo: string; descrizione: string }[]
  frasiUtili?: { sezione: string; frasi: string[] }[]
  vocabolarioChiave?: string[]
  testoModello?: string
}

const ADATTAMENTO_PER_CATEGORIA: Record<string, Record<LivelloCefr, AdattamentoLivello>> = {
  descrittivo: {
    A1: { fattoreLunghezza: 0.25, notaGrammaticale: "Usa frasi semplicissime al presente (è, ha, si chiama)." },
    A2: {
      fattoreLunghezza: 0.45,
      notaGrammaticale: 'Usa il presente indicativo. Descrivi con aggettivi semplici e connettivi: "e", "ma", "anche".',
      struttura: [
        { titolo: 'Chi è', descrizione: 'Una frase: nome, età, che rapporto hai con questa persona.' },
        { titolo: 'Com\'è fisicamente', descrizione: 'Due o tre cose: capelli, altezza, occhi. Usa "ha" e "è".' },
        { titolo: 'Carattere', descrizione: 'Una o due qualità con un piccolo esempio concreto.' },
        { titolo: 'Perché è importante', descrizione: 'Una frase finale: perché questa persona è importante per te.' }
      ],
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Voglio descrivere mia/mio...', 'Si chiama... e ha ... anni.', 'La persona che voglio descrivere è...'] },
        { sezione: 'Per il fisico', frasi: ['Ha i capelli...', 'È alto/a...', 'Ha gli occhi...', 'Porta sempre...'] },
        { sezione: 'Per il carattere', frasi: ['È molto...', 'Mi piace perché...', 'Mi aiuta sempre quando...', 'A volte è un po\'...'] },
        { sezione: 'Per concludere', frasi: ['Per me è molto importante perché...', 'Lo/La voglio tanto bene.', 'È la persona più... della mia vita.'] }
      ],
      vocabolarioChiave: ['simpatico/a', 'gentile', 'divertente', 'allegro/a', 'capelli', 'alto/a', 'importante', 'volersi bene'],
      testoModello: `Voglio descrivere mia sorella Chiara. Ha ventitré anni. È alta e ha i capelli lunghi e neri. I suoi occhi sono verdi. È molto simpatica e allegra. Per esempio, quando sono triste mi racconta sempre qualcosa di divertente. Per me è la persona più importante della mia famiglia. La voglio tanto bene!`
    },
    B1: {
      fattoreLunghezza: 1,
      notaGrammaticale: 'Usa il presente indicativo con buona varietà di aggettivi e connettivi.',
      testoModello: `Voglio descrivere il mio migliore amico, Lorenzo. Abbiamo ventidue anni e ci conosciamo dall'asilo.\n\nLorenzo è alto e magro, con i capelli ricci castani sempre un po' disordinati. Porta sempre gli occhiali da vista, che toglie solo quando nuota — la sua passione principale.\n\nDal punto di vista del carattere, è una persona straordinariamente paziente e curiosa. Sa ascoltare senza interrompere, cosa rara tra i giovani della nostra età. A volte può sembrare distante perché è sempre immerso nei suoi pensieri, ma quando parla dice sempre qualcosa di interessante.\n\nLorenzo mi ha insegnato che la vera amicizia non ha bisogno di parole continue: basta condividere uno spazio e sentirsi a proprio agio.`
    },
    B2: {
      fattoreLunghezza: 1.3,
      notaGrammaticale: 'Aggiungi dettagli rivelatori e usa frasi relative (che, il quale, la cui). Evita le liste piatte — mostra il carattere attraverso episodi.',
      struttura: [
        { titolo: 'Presentazione e contesto', descrizione: 'Chi è, che rapporto avete, da quanto vi conoscete. Una o due frasi.' },
        { titolo: 'Ritratto fisico con dettagli significativi', descrizione: 'Non elencare solo capelli e occhi — scegli i dettagli che dicono qualcosa sul carattere (es. un oggetto che porta sempre).' },
        { titolo: 'Carattere attraverso episodi', descrizione: 'Descrivi il carattere con un episodio concreto che lo illustra, non solo aggettivi.' },
        { titolo: 'Importanza nella tua vita', descrizione: 'Una riflessione più personale: cosa hai imparato da questa persona, come ha influenzato il tuo modo di vedere le cose.' }
      ],
      frasiUtili: [
        { sezione: 'Per il fisico', frasi: ['Ha una figura...', 'Porta sempre...', 'Nonostante la sua età,...', 'Colpisce subito per...', 'Non si nota subito, ma...'] },
        { sezione: 'Per il carattere', frasi: ['È una persona di poche parole e molti fatti.', 'Quando qualcuno ha bisogno,...', 'Ricordo ancora il giorno in cui...', 'Ha la rara capacità di...'] },
        { sezione: 'Per concludere', frasi: ['Stare con lui/lei mi ricorda che...', 'Grazie a lui/lei ho capito che...', 'È il tipo di persona che...'] }
      ],
      vocabolarioChiave: ['la cui', 'il quale', 'nonostante', 'ha la rara capacità di', 'colpisce per', 'di poche parole e molti fatti', 'influenzare'],
      testoModello: `C'è una persona nella mia vita che, più di ogni altra, ha influenzato il modo in cui vedo il mondo: mia nonna paterna, Assunta, che ha compiuto settantasette anni lo scorso marzo.\n\nHa una figura minuta ma piena di energia — capelli bianchi raccolti in una crocchia, mani sempre indaffarate, e uno sguardo acuto che non lascia passare nulla inosservato. Non indossa mai gioielli preziosi, ma porta sempre un vecchio orologio d'oro che apparteneva a suo padre.\n\nÈ una donna di poche parole e molti fatti. Quando qualcuno ha bisogno di aiuto, non chiede se può fare qualcosa: lo fa e basta. Ricordo ancora il giorno in cui, saputo che il vicino era rimasto solo e malato, preparò da mangiare per una settimana intera senza dirlo a nessuno.\n\nStare con lei mi ricorda che il carattere si vede nelle piccole cose.`
    },
    C1: {
      fattoreLunghezza: 1.6,
      notaGrammaticale: 'Usa un registro elaborato. Scegli dettagli rivelatori, non elenchi. Mostra la complessità della persona — nessuno è solo "simpatico".',
      struttura: [
        { titolo: 'Apertura non convenzionale', descrizione: 'Evita "Voglio descrivere". Inizia con un\'osservazione, un dettaglio fisico insolito, o una frase che cattura l\'essenza della persona.' },
        { titolo: 'Ritratto fisico con funzione caratteriale', descrizione: 'Ogni dettaglio fisico deve rivelare qualcosa del carattere. Non è una lista — è un ritratto.' },
        { titolo: 'Complessità e contraddizioni', descrizione: 'Nessuna persona è semplice. Mostra un lato inaspettato, una contraddizione, una sfumatura.' },
        { titolo: 'Influenza su di te', descrizione: 'Cosa hai imparato da questa persona? Come ha cambiato il tuo modo di vedere le cose? Concludi con una frase che rimane.' }
      ],
      frasiUtili: [
        { sezione: 'Per aprire', frasi: ['Ci sono persone che si portano dietro una propria luce, anche quando tacciono.', 'Non è imponente, eppure quando entra in una stanza...', 'Ha la rara capacità di...', 'Fin dalla prima volta che l\'ho incontrato/a,...'] },
        { sezione: 'Per il ritratto', frasi: ['...che probabilmente possiede da vent\'anni.', 'Ha smesso da tempo di tentare di...', 'Colpisce non tanto per... quanto per...', 'C\'è qualcosa nel modo in cui... che...'] },
        { sezione: 'Per le contraddizioni', frasi: ['Può anche essere...', 'È proprio questa intransigenza che...', 'A volte... ma è proprio per questo che...', 'Non finge di..., e questo...'] },
        { sezione: 'Per concludere', frasi: ['Grazie a lui/lei ho imparato che...', 'Stare con lui/lei significa...', 'Non l\'ho mai detto, ma...', 'È il tipo di persona che non si dimentica.'] }
      ],
      vocabolarioChiave: ['intransigenza', 'nonostante', 'eppure', 'la rara capacità di', 'autentico/a', 'sfumatura', 'colpisce non tanto per... quanto per...', 'ritratto'],
      testoModello: `Ci sono persone che si portano dietro una propria luce, anche quando tacciono. Il mio ex professore di letteratura, Maurizio Ferrara, è una di queste.\n\nFisicamente non è imponente: è di media statura, con capelli brizzolati che ha smesso da tempo di tentare di sistemare, e porta sempre la stessa giacca di velluto color cenere che probabilmente possiede da vent'anni. Ma quando entra in una stanza, la stanza cambia.\n\nInsegnava come se la letteratura fosse una questione di vita o di morte — forse perché, per lui, lo era davvero. Ha la rara capacità di essere completamente presente: non finge di ascoltare, ascolta. Può anche essere brusco, intollerante verso la superficialità, e a volte chiede troppo. Ma è proprio questa intransigenza, ho capito col tempo, a renderlo un insegnante autentico.\n\nGrazie a lui ho imparato che capire un testo significa capire qualcosa di sé.`
    },
    C2: { fattoreLunghezza: 2, notaGrammaticale: 'Usa un linguaggio ricco e preciso, con scelte stilistiche personali.' }
  },
  narrativo: {
    A1: { fattoreLunghezza: 0.3, notaGrammaticale: 'Racconta con frasi semplicissime, principalmente al presente.' },
    A2: {
      fattoreLunghezza: 0.5,
      notaGrammaticale: 'Usa il passato prossimo per le azioni concluse. Collega le frasi con "poi", "dopo", "alla fine".',
      struttura: [
        { titolo: 'Dove e quando', descrizione: 'Dì dove sei e quando è successo. Una frase basta: "Sabato scorso sono andato/a a...".' },
        { titolo: 'Cosa succede', descrizione: 'Racconta cosa hai fatto, in ordine: prima, poi, dopo. Usa il passato prossimo.' },
        { titolo: 'Come finisce', descrizione: 'Chiudi con come è finita la storia e come ti sei sentito/a.' }
      ],
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Sabato scorso...', 'L\'estate scorsa...', 'Un giorno...', 'La settimana scorsa sono andato/a a...'] },
        { sezione: 'Per raccontare', frasi: ['Prima...', 'Poi...', 'Dopo...', 'Alla fine...', 'Ho visto/mangiato/incontrato...'] },
        { sezione: 'Per concludere', frasi: ['È stato molto...!', 'Mi sono sentito/a...', 'Non dimenticherò mai...', 'È stata una bella esperienza!'] }
      ],
      vocabolarioChiave: ['poi', 'dopo', 'alla fine', 'sono andato/a', 'ho visto', 'ho mangiato', 'è stato bello/brutto', 'mi sono sentito/a'],
      testoModello: `Sabato scorso sono andata al parco con la mia famiglia. Prima abbiamo fatto un picnic sull'erba: mia madre ha preparato panini e succhi di frutta. Poi mio fratello e io abbiamo giocato a pallone per molto tempo. Nel pomeriggio è arrivata una piccola pioggia e siamo tornati a casa subito. È stata una giornata bella ma corta! Non vedo l'ora di tornare.`
    },
    B1: {
      fattoreLunghezza: 1,
      notaGrammaticale: 'Usa passato prossimo e imperfetto, prestando attenzione alla coerenza temporale.',
      testoModello: `Era una mattina di ottobre quando Giulia decise di esplorare il vecchio mercato del suo quartiere. Non ci era mai entrata, anche se ci passava davanti ogni giorno da anni.\n\nMentre camminava tra le bancarelle colorate, sentì una voce familiare. Si girò e vide Marco, il suo compagno di scuola delle elementari. Non si vedevano da dieci anni.\n\nSi guardarono sorpresi, poi scoppiarono a ridere. Parlarono per quasi un'ora, seduti su un muretto vicino alla fontana, ricordando le avventure di quando erano bambini.\n\nQuando si salutarono, Giulia si rese conto che a volte basta una passeggiata fuori dal solito percorso per trovare qualcosa di prezioso.`
    },
    B2: {
      fattoreLunghezza: 1.3,
      notaGrammaticale: 'Usa passato prossimo, imperfetto e trapassato prossimo. Varia i connettivi narrativi e aggiungi dettagli sensoriali.',
      struttura: [
        { titolo: 'Inizio in medias res', descrizione: 'Inizia nel momento più interessante — non dall\'inizio cronologico. Crea subito un\'atmosfera.' },
        { titolo: 'Contesto e personaggi', descrizione: 'Inserisci il contesto (dove, quando, chi) in modo naturale, non come lista separata.' },
        { titolo: 'Sviluppo e tensione', descrizione: 'Racconta cosa succede. Includi almeno un momento di sorpresa, difficoltà o svolta.' },
        { titolo: 'Conclusione e riflessione', descrizione: 'Chiudi la storia con una riflessione breve su cosa hai capito o sentito.' }
      ],
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Non avrei mai immaginato che...', 'Quella sera tutto cambiò quando...', 'Fu durante quella passeggiata che...', 'C\'era qualcosa di strano nell\'aria quella mattina.'] },
        { sezione: 'Per lo sviluppo', frasi: ['Nel frattempo,...', 'Senza rendersene conto,...', 'All\'improvviso,...', 'Proprio in quel momento,...', 'Ci fermammo a...'] },
        { sezione: 'Per concludere', frasi: ['Quella sera capii che...', 'Da quel momento in poi,...', 'Non me lo sarei mai aspettato/a, eppure...', 'È esperienze come queste che...'] }
      ],
      vocabolarioChiave: ['non avrei mai immaginato', 'nel frattempo', 'all\'improvviso', 'proprio in quel momento', 'senza rendersene conto', 'avvolto/a in', 'quella sera capii che'],
      testoModello: `Non avrei mai immaginato che quella serata si sarebbe trasformata in uno dei ricordi più vivi della mia vita.\n\nEra dicembre, e la città era avvolta in un silenzio insolito per un venerdì sera. Marco e io avevamo deciso di uscire nonostante il freddo pungente — la nostra solita pizzeria era chiusa per lavori, e ci trovammo a vagare senza meta per le strade del centro.\n\nFu durante quella passeggiata improvvisata che scoprimmo, nascosto tra due palazzi antichi, un piccolo cortile illuminato da luci calde. Al centro, un gruppo di musicisti suonava jazz dal vivo davanti a una manciata di spettatori.\n\nCi fermammo ad ascoltare per quasi due ore. Nessuno dei due aveva fretta.\n\nQuella sera capii che le esperienze più belle raramente si pianificano — arrivano proprio quando smetti di cercarle.`
    },
    C1: {
      fattoreLunghezza: 1.6,
      notaGrammaticale: 'Varia i tempi verbali con precisione. Usa tecniche narrative: dettaglio rivelatore, dialogo, flashback. Cura lo stile.',
      struttura: [
        { titolo: 'Apertura evocativa', descrizione: 'Inizia con un dettaglio, una sensazione o un\'immagine forte. Evita "C\'era una volta" — entra direttamente nell\'atmosfera.' },
        { titolo: 'Sviluppo con dettaglio rivelatore', descrizione: 'Racconta l\'evento centrale soffermandoti su un dettaglio significativo che rivela qualcosa di più profondo.' },
        { titolo: 'Dialogo o pensiero interiore (opzionale)', descrizione: 'Un breve scambio di battute o un pensiero interiore rende la narrazione più viva e cinematografica.' },
        { titolo: 'Finale aperto o riflessione', descrizione: 'Concludi con una frase che va al di là del semplice racconto: una domanda, un\'immagine, una comprensione nuova.' }
      ],
      frasiUtili: [
        { sezione: 'Per l\'apertura', frasi: ['Non esiste un momento preciso in cui...', 'Ci sono persone che si portano dietro una propria luce.', 'La sera in cui... fu, forse,...', 'Aveva le mani di chi ha...'] },
        { sezione: 'Per lo sviluppo', frasi: ['Proprio qui risiede il paradosso:', 'C\'era qualcosa di familiare nel modo in cui...', 'Nessuno dei due parlò per un po\'.', '«...», disse, e io capii che stava parlando di qualcosa di più grande.'] },
        { sezione: 'Per concludere', frasi: ['Per un momento il tempo si fermò.', 'E io ho ancora [età] anni.', 'Non l\'ho mai capito del tutto, eppure...', 'Certe cose non si spiegano — si portano.'] }
      ],
      vocabolarioChiave: ['eppure', 'proprio qui', 'risiede', 'soffermandosi', 'evocativo', 'rivelatore', 'paradosso', 'nonostante', 'al di là di'],
      testoModello: `Non esiste un momento preciso in cui si smette di essere bambini. Accade, piuttosto, come un'eclissi — gradualmente, quasi senza accorgersene, finché un giorno ci si ritrova dall'altra parte.\n\nLa sera in cui mio nonno mi insegnò a fare il pane fu, forse, l'ultima in cui mi sentii davvero piccola nel senso più rassicurante del termine. Avevo undici anni. Le sue mani, nodose e sicure, coprivano quasi interamente le mie mentre impastavamo insieme.\n\n«La pasta non vuole fretta», disse a un certo punto, e io capii, anche se non avrei saputo spiegare perché, che stava parlando di qualcosa di più grande del pane.\n\nLui è mancato tre anni dopo. Ma ogni volta che impasto, quelle mani enormi tornano a coprire le mie, e per un momento il tempo si ferma, e io ho ancora undici anni.`
    },
    C2: { fattoreLunghezza: 2, notaGrammaticale: 'Usa una gamma completa di tempi verbali e tecniche narrative (es. flashback, voce narrante).' }
  },
  espositivo: {
    A1: { fattoreLunghezza: 0.3, notaGrammaticale: 'Usa frasi brevi e semplici al presente.' },
    A2: {
      fattoreLunghezza: 0.5,
      notaGrammaticale: 'Usa il presente indicativo, con connettivi semplici: "e", "ma", "poi", "anche".',
      struttura: [
        { titolo: 'Di cosa parli', descrizione: 'Una frase: nomina l\'argomento e dì cos\'è in parole semplici.' },
        { titolo: 'Come funziona o com\'è', descrizione: 'Spiega due o tre cose importanti. Usa frasi brevi.' },
        { titolo: 'Perché ti piace o è interessante', descrizione: 'Una frase finale con la tua opinione.' }
      ],
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Voglio parlare di...', '[Nome/argomento] è...', 'Si chiama... ed è...'] },
        { sezione: 'Per spiegare', frasi: ['Prima...', 'Poi...', 'È fatto di...', 'Si usa per...', 'Esiste da...', 'Si trova a/in...'] },
        { sezione: 'Per concludere', frasi: ['Secondo me, è molto...', 'È interessante perché...', 'Mi piace perché...'] }
      ],
      vocabolarioChiave: ['si chiama', 'si usa per', 'è fatto di', 'si trova', 'è importante', 'esiste da', 'secondo me'],
      testoModello: `Voglio parlare del carnevale di Venezia. È una festa italiana molto famosa. Ogni anno, a febbraio, moltissime persone vanno a Venezia. Le persone portano costumi colorati e maschere molto belle. Ci sono sfilate, musica e spettacoli in tutta la città. È una tradizione che esiste da molti secoli. Secondo me, è una delle feste più belle del mondo perché è completamente unica.`
    },
    B1: {
      fattoreLunghezza: 1,
      notaGrammaticale: 'Organizza le informazioni con connettivi (prima di tutto, inoltre, infine). Usa il presente indicativo.',
      testoModello: `Voglio parlare dello yoga, un'attività che pratico da circa due anni e che ha cambiato il mio modo di rapportarmi con il corpo e con lo stress quotidiano.\n\nLo yoga è una pratica originaria dell'India, oggi diffusa in tutto il mondo, che combina esercizi fisici, tecniche di respirazione e meditazione. Si pratica su un tappetino, preferibilmente in silenzio o con musica rilassante.\n\nCi sono molti stili diversi: l'Hatha yoga è adatto ai principianti perché è più lento; l'Ashtanga è più dinamico e intenso.\n\nI benefici principali riguardano la flessibilità, la postura e la riduzione dell'ansia. Personalmente, mi aiuta moltissimo a disconnettermi dalla vita frenetica e a ricaricare le energie.`
    },
    B2: {
      fattoreLunghezza: 1.3,
      notaGrammaticale: 'Usa connettivi variati e strutture impersonali ("si stima che", "è noto che"). Cita dati o fatti concreti.',
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Tra le... più diffuse...', 'Poche cose hanno una storia tanto... quanto...', '[Argomento] è considerato/a uno dei...', 'Si stima che...'] },
        { sezione: 'Per esporre', frasi: ['Le origini risalgono a...', 'È noto che...', 'A differenza di...', 'Secondo gli esperti,...', 'È disciplinato/regolamentato da...'] },
        { sezione: 'Per concludere', frasi: ['Il risultato è...', 'Non a caso,...', 'Questo spiega perché...', 'A detta di...'] }
      ],
      vocabolarioChiave: ['si stima che', 'è noto che', 'a differenza di', 'le origini risalgono a', 'è regolamentato da', 'non a caso', 'a detta di'],
      testoModello: `Tra le tradizioni culinarie regionali italiane, poche hanno una storia tanto affascinante quanto quella della pizza napoletana, riconosciuta nel 2017 come patrimonio culturale immateriale dell'UNESCO.\n\nLe origini risalgono al Settecento, quando i "lazzari" napoletani cominciarono a condire le focacce di pane con pomodoro, aglio e olio. La versione moderna, con mozzarella, nacque in occasione della visita della regina Margherita di Savoia nel 1889.\n\nGli ingredienti di una vera pizza napoletana sono rigidamente disciplinati dal disciplinare STG: farina di tipo 00, pomodoro San Marzano DOP e mozzarella di bufala campana. La cottura deve avvenire in un forno a legna a circa 450 gradi per non più di 90 secondi.\n\nIl risultato è un impasto morbido al centro, croccante ai bordi — un equilibrio che, a detta dei napoletani, non esiste altrove al mondo.`
    },
    C1: {
      fattoreLunghezza: 1.6,
      notaGrammaticale: 'Usa un registro formale con strutture passive e impersonali. Organizza le informazioni in modo gerarchico e cita fonti.',
      struttura: [
        { titolo: 'Inquadramento del tema', descrizione: 'Presenta l\'argomento nel suo contesto più ampio. Indica perché è rilevante oggi.' },
        { titolo: 'Cause o origini', descrizione: 'Spiega le origini o le cause del fenomeno, con dati o riferimenti precisi.' },
        { titolo: 'Aspetti principali', descrizione: 'Analizza i due o tre aspetti più importanti in modo gerarchico, dal generale al particolare.' },
        { titolo: 'Implicazioni o prospettive', descrizione: 'Cosa comporta questo fenomeno? Quali sono le prospettive future? Chiudi con uno sguardo in avanti.' }
      ],
      frasiUtili: [
        { sezione: 'Per inquadrare', frasi: ['Il fenomeno di... rappresenta una delle... più urgenti del nostro tempo.', 'Si stima che... scomparirà entro...', 'La questione... rimane largamente ignorata.'] },
        { sezione: 'Per analizzare', frasi: ['Le cause sono molteplici e interconnesse.', 'La conseguente dominanza di...', 'Ogni lingua codifica...', 'Alcune... contengono, nella loro struttura,...'] },
        { sezione: 'Per concludere', frasi: ['Le iniziative di... dimostrano che...', 'A patto di un impegno... concreto,...', 'La tendenza può essere invertita,...', 'Rimane tuttavia aperta la questione di...'] }
      ],
      vocabolarioChiave: ['si stima che', 'molteplici e interconnesse', 'è spesso trascurato', 'a patto di', 'a riprova di', 'codificare', 'la tendenza può essere invertita'],
      testoModello: `Il fenomeno delle lingue in pericolo di estinzione rappresenta una delle sfide culturali più urgenti del nostro tempo, eppure rimane largamente ignorato dal dibattito pubblico. Si stima che delle circa settemila lingue attualmente parlate nel mondo, almeno la metà scomparirà entro la fine del XXI secolo.\n\nLe cause sono molteplici e interconnesse. La globalizzazione e la conseguente dominanza di lingue veicolari esercita una pressione economica sulle lingue minoritarie: parlare la lingua dominante apre più opportunità di lavoro, e i genitori spesso scelgono di non trasmettere ai figli la lingua d'origine.\n\nLa perdita di una lingua non è solo la perdita di un sistema comunicativo. Ogni lingua codifica una visione del mondo. Alcune lingue amazzoniche contengono, nella loro struttura grammaticale, classificazioni botaniche che la scienza occidentale ha scoperto solo recentemente.\n\nLe iniziative di rivitalizzazione linguistica — come nel caso del gallese o del maori — dimostrano che la tendenza può essere invertita, a patto di un impegno politico concreto e del coinvolgimento attivo delle comunità interessate.`
    },
    C2: { fattoreLunghezza: 2, notaGrammaticale: 'Usa un registro accademico, con strutture complesse e lessico specifico.' }
  },
  regolativo: {
    A1: { fattoreLunghezza: 0.4, notaGrammaticale: "Usa frasi cortissime, anche solo con l'infinito (es. 'mescolare', 'aggiungere')." },
    A2: {
      fattoreLunghezza: 0.6,
      notaGrammaticale: 'Usa l\'imperativo (mescola, aggiungi, aspetta) per i passaggi. Numera i passaggi.',
      struttura: [
        { titolo: 'Cosa farai', descrizione: '"Ecco come si fa/prepara..." — una frase.' },
        { titolo: 'Cosa ti serve', descrizione: 'Una lista corta: 2-4 cose.' },
        { titolo: 'I passaggi', descrizione: '3-4 passaggi numerati, frasi brevissime con l\'imperativo.' },
        { titolo: 'Consiglio', descrizione: 'Un consiglio finale: "Attenzione a..." o "Il consiglio è di...".' }
      ],
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Ecco come si prepara...', 'Per fare [nome], hai bisogno di...', 'È facile! Segui questi passaggi:'] },
        { sezione: 'Per i passaggi', frasi: ['Prima,...', 'Poi,...', 'Dopo,...', 'Alla fine,...', 'Metti/Aggiungi/Mescola/Aspetta...'] },
        { sezione: 'Per concludere', frasi: ['Il consiglio è di...', 'Attenzione a non...', 'È pronto quando...'] }
      ],
      vocabolarioChiave: ['prima', 'poi', 'dopo', 'alla fine', 'aggiungi', 'mescola', 'metti', 'aspetta', 'attenzione a'],
      testoModello: `Ecco come si prepara il tè al limone.\nHai bisogno di: acqua, una bustina di tè, un limone, zucchero.\n1. Prima, scalda l'acqua.\n2. Poi, metti la bustina nel bicchiere e aggiungi l'acqua calda.\n3. Aspetta tre minuti.\n4. Togli la bustina e aggiungi il succo di limone.\n5. Alla fine, aggiungi zucchero a piacere.\nConsiglio: non usare acqua troppo bollente — aspetta un minuto prima di versarla!`
    },
    B1: {
      fattoreLunghezza: 1,
      notaGrammaticale: 'Usa l\'imperativo (voi) o il "si" impersonale per i passaggi. Usa connettivi di sequenza.',
      testoModello: `Ecco come si prepara la pasta al pomodoro, uno dei piatti più semplici e amati della cucina italiana.\n\nIngredienti per 2 persone: 200 g di pasta, una scatoletta di pomodori pelati, uno spicchio d'aglio, olio d'oliva, basilico fresco, sale.\n\nPrima di tutto, mettete a bollire abbondante acqua salata. Nel frattempo, scaldate un filo d'olio in una padella e fatevi imbiondire l'aglio. Aggiungete i pomodori pelati, schiacciateli con un cucchiaio e lasciate cuocere a fuoco medio per dieci minuti.\n\nScolate la pasta al dente e versatela direttamente nella padella con il sugo. Mescolate bene, aggiungete basilico fresco e servite.\n\nConsiglio: non esagerate con il sale nell'acqua — il sugo insaporisce già la pasta.`
    },
    B2: {
      fattoreLunghezza: 1.2,
      notaGrammaticale: 'Usa il "si" impersonale in modo consistente. Varia i connettivi di sequenza. Puoi usare strutture condizionali ("nel caso in cui...").',
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Prepararsi a... richiede metodo oltre che impegno.', 'Ecco un protocollo in ... fasi.', 'La seguente procedura si applica a...'] },
        { sezione: 'Per i passaggi', frasi: ['Innanzitutto,...', 'In un secondo momento,...', 'Si raccomanda di...', 'Nel caso in cui...', 'Una volta completato...'] },
        { sezione: 'Per concludere', frasi: ['Si sconsiglia di...', 'È importante evitare...', 'Il risultato finale sarà...', 'A titolo di promemoria,...'] }
      ],
      vocabolarioChiave: ['si raccomanda di', 'nel caso in cui', 'in un secondo momento', 'si sconsiglia', 'una volta completato', 'a titolo di promemoria', 'proporzionale'],
      testoModello: `Come organizzare uno studio efficace in vista di un esame universitario\n\nPrepararsi a un esame richiede metodo oltre che impegno. Ecco un protocollo in quattro fasi.\n\nInnanzitutto, leggete il programma completo prima di iniziare a studiare: sapere cosa c'è da affrontare permette di distribuire il tempo in modo proporzionale alla complessità di ogni argomento.\n\nIn un secondo momento, suddividete il materiale in blocchi di studio di 45-50 minuti, seguiti da una pausa di dieci minuti. La tecnica Pomodoro si è dimostrata efficace nel mantenere alta la concentrazione.\n\nUna volta completato un argomento, riscrivetelo a mano senza guardare il libro: è il metodo più affidabile per verificare se lo avete realmente capito.\n\nSi sconsiglia infine di studiare fino a tarda notte prima dell'esame: il cervello consolida le informazioni durante il sonno.`
    },
    C1: {
      fattoreLunghezza: 1.4,
      notaGrammaticale: 'Usa un registro tecnico/formale adatto a un manuale o linee guida professionali. Struttura gerarchica.',
      frasiUtili: [
        { sezione: 'Per inquadrare', frasi: ['Il... rappresenta uno degli appuntamenti più critici.', 'La preparazione metodica è spesso l\'elemento discriminante.', 'È indispensabile documentarsi in modo approfondito su...'] },
        { sezione: 'Per i passaggi', frasi: ['In primo luogo, è indispensabile...', 'Sul piano... si raccomanda di...', 'Si consiglia altresì di...', 'Da evitare tassativamente:'] },
        { sezione: 'Per concludere', frasi: ['Tali misure consentono di...', 'L\'adozione sistematica di queste pratiche...', 'Il rispetto di queste indicazioni garantisce...'] }
      ],
      vocabolarioChiave: ['è indispensabile', 'si raccomanda', 'si consiglia altresì', 'da evitare tassativamente', 'l\'elemento discriminante', 'in modo approfondito', 'sistematico'],
      testoModello: `Linee guida per la gestione di un colloquio di lavoro\n\nIl colloquio di selezione rappresenta uno degli appuntamenti più critici nel percorso professionale di un candidato. La preparazione metodica è spesso l'elemento discriminante tra un esito positivo e uno negativo.\n\nIn primo luogo, è indispensabile documentarsi in modo approfondito sull'azienda: storia, settore, valori dichiarati, notizie recenti. I selezionatori valutano positivamente i candidati che dimostrano conoscenza specifica del contesto, poiché tale conoscenza segnala motivazione genuina.\n\nSul piano comunicativo, si raccomanda di strutturare le risposte secondo il modello STAR (Situazione, Task, Azione, Risultato): le risposte ancorate a episodi concreti risultano più credibili rispetto alle formulazioni generiche.\n\nSi consiglia altresì di preparare almeno tre domande pertinenti da porre al selezionatore, così da dimostrare curiosità e coinvolgimento attivi.\n\nDa evitare tassativamente: il ritardo, l'abbigliamento inadeguato al contesto e qualsiasi forma di critica verso i precedenti datori di lavoro.`
    },
    C2: { fattoreLunghezza: 1.6, notaGrammaticale: 'Usa un linguaggio regolativo formale, preciso e senza ambiguità.' }
  },
  argomentativo: {
    A1: { fattoreLunghezza: 0.25, notaGrammaticale: "Esprimi un'opinione semplicissima (mi piace / non mi piace) con \"perché\"." },
    A2: {
      fattoreLunghezza: 0.4,
      notaGrammaticale: 'Esprimi un\'opinione semplice con un motivo, usando "perché" o "secondo me".',
      struttura: [
        { titolo: 'Tema e opinione', descrizione: 'Presenta il tema in una frase e dì subito cosa pensi: "Secondo me,..." o "Penso che...".' },
        { titolo: 'Un motivo', descrizione: 'Spiega un solo motivo per la tua opinione. Usa "perché" o "per esempio".' },
        { titolo: 'Conclusione', descrizione: 'Ripeti la tua opinione in modo diverso. Usa "in conclusione" o "per questo motivo".' }
      ],
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Voglio parlare di...', 'Secondo me,...', 'Penso che... sia molto...', 'A mio parere,...'] },
        { sezione: 'Per dare un motivo', frasi: ['Perché...', 'Per esempio,...', 'È importante perché...', 'Aiuta a...'] },
        { sezione: 'Per concludere', frasi: ['In conclusione,...', 'Per questo motivo, penso che...', 'Quindi,...'] }
      ],
      vocabolarioChiave: ['penso che', 'secondo me', 'perché', 'per esempio', 'importante', 'utile', 'in conclusione'],
      testoModello: `Voglio parlare dei videogiochi. Secondo me, i videogiochi sono utili per i ragazzi. Prima di tutto, aiutano a pensare velocemente — in molti giochi devi risolvere problemi difficili. Poi, puoi giocare con gli amici e stare insieme, anche quando non puoi uscire di casa. Certo, non bisogna giocare troppo. In conclusione, penso che i videogiochi siano buoni se li usi con moderazione.`
    },
    B1: {
      fattoreLunghezza: 1,
      notaGrammaticale: 'Presenta una tesi con almeno due argomenti a supporto.',
      testoModello: `Negli ultimi anni, sempre più scuole usano sistemi di apprendimento online. Secondo me, questa è una scelta positiva, anche se presenta alcuni problemi.\n\nInnanzitutto, studiare online permette agli studenti di organizzare il proprio tempo in modo più flessibile. Uno studente può rivedere una lezione quante volte vuole, cosa impossibile in classe. Questo è particolarmente utile per chi ha difficoltà di apprendimento.\n\nInoltre, le piattaforme online offrono materiali molto vari: video, esercizi interattivi e quiz immediati che rendono lo studio più coinvolgente.\n\nCerto, ci sono anche aspetti negativi: alcuni studenti si concentrano meno a casa e mancano i rapporti sociali con i compagni.\n\nIn conclusione, credo che la scuola online sia uno strumento prezioso se usato insieme, e non al posto, dell'insegnamento tradizionale.`
    },
    B2: {
      fattoreLunghezza: 1.3,
      notaGrammaticale: 'Argomenta con esempi concreti e considera anche un punto di vista contrario.',
      struttura: [
        { titolo: 'Introduzione e tesi', descrizione: 'Presenta il tema con una frase di contesto e dichiara la tua posizione in modo chiaro.' },
        { titolo: 'Primo argomento', descrizione: 'Sviluppa il tuo argomento principale con un esempio concreto o un dato.' },
        { titolo: 'Contro-argomentazione', descrizione: 'Presenta il punto di vista contrario ("D\'altra parte...", "È vero che...") — mostra che hai considerato entrambi i lati.' },
        { titolo: 'Secondo argomento (risposta)', descrizione: 'Rispondi alla contro-argomentazione e rafforza la tua tesi con un secondo argomento.' },
        { titolo: 'Conclusione', descrizione: 'Riassumi la tua posizione con sicurezza. Puoi aggiungere una prospettiva futura.' }
      ],
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Negli ultimi anni,... ha suscitato un acceso dibattito.', 'A mio avviso,...', 'La questione di... merita una riflessione attenta.'] },
        { sezione: 'Per argomentare', frasi: ['Da un lato,...', 'È indubbio che...', 'Come dimostrano i dati,...', 'Un chiaro esempio è...'] },
        { sezione: 'Per la contro-argomentazione', frasi: ['D\'altra parte,...', 'È vero che...', 'Non si può negare che...', 'Chi sostiene il contrario afferma che...'] },
        { sezione: 'Per concludere', frasi: ['In definitiva,...', 'Per questi motivi, ritengo che...', 'La vera sfida è...', 'Sarebbe auspicabile che...'] }
      ],
      vocabolarioChiave: ['a mio avviso', 'è indubbio che', 'da un lato / dall\'altro', 'd\'altra parte', 'tuttavia', 'nonostante', 'in definitiva', 'sarebbe auspicabile'],
      testoModello: `Negli ultimi anni, l'intelligenza artificiale ha trasformato profondamente il mondo del lavoro, sollevando un dibattito acceso sul suo impatto sull'occupazione. A mio avviso, i benefici superano i rischi, a patto che si investa nella formazione dei lavoratori.\n\nDa un lato, l'IA automatizza compiti ripetitivi e pericolosi, liberando i lavoratori per attività più creative. Nel settore manifatturiero, per esempio, i robot gestiscono linee di produzione con maggiore precisione e sicurezza rispetto all'uomo.\n\nD'altra parte, è indubbio che alcune categorie professionali siano a rischio di sostituzione. Contabili, addetti all'inserimento dati e operatori di call center potrebbero vedere ridursi la domanda del loro lavoro nei prossimi anni.\n\nTuttavia, ogni rivoluzione tecnologica ha storicamente creato nuovi lavori mentre ne eliminava altri. La vera sfida non è fermare l'IA, ma garantire che i lavoratori abbiano le competenze per adattarsi.\n\nIn definitiva, l'intelligenza artificiale rappresenta un'opportunità, non una minaccia, se gestita con politiche di riqualificazione adeguate.`
    },
    C1: {
      fattoreLunghezza: 1.6,
      notaGrammaticale: 'Usa un\'argomentazione articolata, con concessioni e contro-argomentazioni. Usa il congiuntivo, il condizionale e connettivi avanzati.',
      struttura: [
        { titolo: 'Introduzione e contestualizzazione', descrizione: 'Apri con una frase che inquadra il tema nel dibattito attuale. Dichiara la tua tesi in modo netto ma sfumato.' },
        { titolo: 'Primo argomento con dati o esempio', descrizione: 'Sviluppa l\'argomento principale. Cita un dato, un esempio reale o un\'esperienza concreta per renderlo solido.' },
        { titolo: 'Concessione', descrizione: 'Riconosci il punto di forza della posizione opposta ("Pur riconoscendo che...", "È pur vero che..."). Questo rafforza la tua credibilità.' },
        { titolo: 'Confutazione e secondo argomento', descrizione: 'Rispondi alla concessione con un argomento più forte. Usa "tuttavia", "ciononostante", "eppure".' },
        { titolo: 'Conclusione articolata', descrizione: 'Non ripetere solo la tesi — aggiungi una prospettiva, una proposta o una riflessione che apra a un orizzonte più ampio.' }
      ],
      frasiUtili: [
        { sezione: 'Per introdurre', frasi: ['Il dibattito su... ha guadagnato terreno negli ultimi anni.', 'La questione merita una riflessione attenta, poiché...', 'A parere di chi scrive,...', 'Lungi dall\'essere una questione semplice,...'] },
        { sezione: 'Per argomentare', frasi: ['I sostenitori di questa misura sostengono, con ragione, che...', 'Studi condotti su... hanno dimostrato che...', 'A riprova di ciò,...', 'Non è un caso che...'] },
        { sezione: 'Per la concessione', frasi: ['Pur riconoscendo la validità di questi dati,...', 'È pur vero che...', 'Non si può negare che...', 'Occorre tuttavia considerare...'] },
        { sezione: 'Per confutare', frasi: ['Ciononostante,...', 'Tale obiezione non tiene conto del fatto che...', 'Proprio qui risiede il limite di questa posizione:', 'È proprio questa intransigenza che...'] },
        { sezione: 'Per concludere', frasi: ['In definitiva,...', '... non è una panacea universale, ma...', 'La sfida non è... bensì...', 'Sarebbe auspicabile che... accompagnato da...'] }
      ],
      vocabolarioChiave: ['pur riconoscendo', 'ciononostante', 'a parere di chi scrive', 'è pur vero che', 'lungi dall\'essere', 'a riprova di ciò', 'sarebbe auspicabile', 'non è un caso che', 'tale obiezione'],
      testoModello: `Il dibattito sulla riduzione della settimana lavorativa a quattro giorni ha guadagnato terreno in diversi paesi europei, con sperimentazioni in Islanda, Portogallo e di recente in Italia. La questione merita una riflessione attenta, poiché le implicazioni toccano tanto la sfera economica quanto quella sociale.\n\nI sostenitori di questa misura sostengono, con ragione, che un minor numero di ore lavorative si traduca in un aumento della produttività e del benessere dei lavoratori. Studi condotti in Islanda hanno dimostrato che, a parità di stipendio, i dipendenti svolgevano lo stesso quantitativo di lavoro in meno tempo, con un netto miglioramento della qualità della vita.\n\nPur riconoscendo la validità di questi dati, occorre tuttavia considerare le difficoltà applicative in settori come la sanità, l'istruzione e i servizi essenziali, dove la riduzione delle ore potrebbe tradursi in carenze strutturali difficilmente colmabili.\n\nÈ pur vero che tali sfide potrebbero essere affrontate attraverso una riorganizzazione intelligente dei turni e degli orari, piuttosto che con un taglio lineare delle ore. Ciononostante, questo richiederebbe investimenti significativi che non tutti i sistemi produttivi sono in grado di sostenere.\n\nIn definitiva, la settimana corta non è una panacea universale, ma un modello organizzativo promettente che richiede un'applicazione differenziata per settore, accompagnata da politiche di formazione mirate.`
    },
    C2: { fattoreLunghezza: 2, notaGrammaticale: 'Costruisci un\'argomentazione sofisticata, con registro e lessico da saggio.' }
  }
}

// Le guide senza una categoria pura (lettera-informale, email-formale)
// hanno il proprio adattamento dedicato per slug.
const ADATTAMENTO_PER_SLUG: Record<string, Record<LivelloCefr, AdattamentoLivello>> = {
  'lettera-informale': {
    A1: { fattoreLunghezza: 0.3, notaGrammaticale: 'Usa frasi semplicissime al presente, con saluti di base.' },
    A2: {
      fattoreLunghezza: 0.55,
      notaGrammaticale: 'Usa il passato prossimo per raccontare cosa è successo. Non dimenticare saluto iniziale e finale.',
      struttura: [
        { titolo: 'Saluto iniziale', descrizione: '"Ciao [nome]! Come stai?" — una riga.' },
        { titolo: 'Cosa vuoi raccontare', descrizione: '"Ti scrivo perché..." — una frase sul motivo.' },
        { titolo: 'Il racconto', descrizione: '2-3 frasi semplici con il passato prossimo: cosa hai fatto, dove sei andato/a.' },
        { titolo: 'Una domanda per l\'amico/a', descrizione: '"E tu? Hai fatto qualcosa di bello?"' },
        { titolo: 'Saluto finale', descrizione: '"A presto! Un abbraccio, [nome]"' }
      ],
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Ciao [nome]! Come stai?', 'Caro/a [nome], spero tu stia bene!', 'Ciao! Ti scrivo perché...'] },
        { sezione: 'Per raccontare', frasi: ['La settimana scorsa...', 'Sabato...', 'Ho fatto/visto/mangiato/incontrato...', 'È stato bellissimo!'] },
        { sezione: 'Per chiedere', frasi: ['E tu? Cosa hai fatto?', 'Sei mai stato/a a...?', 'Dimmi qualcosa di te!'] },
        { sezione: 'Per salutare', frasi: ['A presto!', 'Un abbraccio,', 'Ciao!', 'Scrivi presto!'] }
      ],
      vocabolarioChiave: ['caro/a', 'ti scrivo', 'la settimana scorsa', 'ho fatto', 'è stato bello', 'a presto', 'un abbraccio'],
      testoModello: `Ciao Marta! Come stai?\nTi scrivo perché sabato scorso sono andato a un concerto con mia sorella. È stato bellissimo! Abbiamo ascoltato musica dal vivo per tre ore. Poi abbiamo mangiato una pizza enorme. Sono tornato a casa tardi ma molto contento.\nE tu? Hai fatto qualcosa di bello?\nA presto! Un abbraccio,\nMarco`
    },
    B1: {
      fattoreLunghezza: 1,
      notaGrammaticale: 'Usa un registro colloquiale, con passato prossimo e imperfetto. Saluti iniziali e finali tipici.',
      testoModello: `Cara Sofia,\ncome stai? Spero tutto bene da te!\nTi scrivo perché la settimana scorsa mi è successa una cosa incredibile. Indovina un po'? Ho trovato il portafoglio che avevo perso tre mesi fa! L'ho trovato in un cassetto che non apro quasi mai, mentre cercavo qualcos'altro. Dentro c'erano ancora i soldi e le tessere.\nMi sono sentito così stupido — ma anche molto fortunato!\nDimmi, hai notizie di Luca? Non lo sento da un po'.\nUn abbraccio grande,\nDavide`
    },
    B2: {
      fattoreLunghezza: 1.3,
      notaGrammaticale: 'Usa espressioni colloquiali più ricche e naturali. Aggiungi dettagli e riflessioni personali — non solo i fatti.',
      struttura: [
        { titolo: 'Apertura affettuosa', descrizione: 'Non solo "come stai?" — aggiungi un accenno alla vostra situazione o alla distanza temporale.' },
        { titolo: 'Motivazione e notizia principale', descrizione: 'Perché scrivi? Cosa vuoi raccontare? Annuncialo senza troppa introduzione.' },
        { titolo: 'Sviluppo con dettagli e riflessioni', descrizione: 'Non solo i fatti: come ti sei sentito/a? Cosa hai pensato? Cosa ti ha sorpreso?' },
        { titolo: 'Domanda per l\'amico/a', descrizione: 'Mostra interesse genuino: una domanda vera, non generica.' },
        { titolo: 'Chiusura affettuosa', descrizione: 'Un saluto caldo, non formale.' }
      ],
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['È un po\' di tempo che non ci scriviamo.', 'Stanotte non riesco ad addormentarmi e...', 'So che sono sparita — scusami!', 'Ho mille cose da raccontarti.'] },
        { sezione: 'Per raccontare', frasi: ['La cosa strana è che...', 'Non me ne importava affatto, eppure...', 'C\'era qualcosa di... nell\'aria.', 'Mi sono ritrovato/a a...'] },
        { sezione: 'Per chiedere', frasi: ['Stai facendo qualcosa di nuovo anche tu?', 'Come te la stai cavando con...?', 'Mi mancano le nostre conversazioni su...'] },
        { sezione: 'Per salutare', frasi: ['Con affetto,', 'Un abbraccio grande,', 'Ti voglio bene,', 'A presto (sul serio questa volta)!'] }
      ],
      vocabolarioChiave: ['la cosa strana è che', 'non me ne importava', 'mi sono ritrovato/a', 'eppure', 'profondamente', 'con affetto'],
      testoModello: `Cara Elena,\nè un po' di tempo che non ci scriviamo — colpa del solito vortice di impegni! Ma stanotte non riesco ad addormentarmi e mi è venuta voglia di raccontarti una cosa.\nLa settimana scorsa ho partecipato per la prima volta a un corso di ceramica. L'avevo rimandato da mesi perché pensavo di non avere il talento. Beh, avevo ragione — le mie prime ciotole sembravano elaborate sculture di argilla senza forma né senso. Ma la cosa strana è che non me ne importava affatto. C'era qualcosa di profondamente rilassante nell'avere le mani sporche di terra e la testa completamente vuota.\nStai facendo qualcosa di nuovo anche tu, ultimamente?\nCon affetto,\nSara`
    },
    C1: {
      fattoreLunghezza: 1.5,
      notaGrammaticale: 'Usa un tono naturale e idiomatico. Il registro è colloquiale ma curato — come parlerebbe un madrelingua colto in una lettera personale.',
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Ti scrivo dal divano di casa mia, con...', 'Questa lettera è rimasta troppo a lungo in bozza.', 'Avevo mille cose da dire e non sapevo da dove cominciare.', 'Devo raccontarti una cosa — prometti di non giudicarmi.'] },
        { sezione: 'Per raccontare', frasi: ['Non so spiegarlo meglio di così.', 'Pensavo sarebbe stato... invece...', 'Ho pensato che tu avresti capito.', 'C\'era qualcosa che si è sistemato dentro.'] },
        { sezione: 'Per chiedere', frasi: ['Come stai, davvero?', 'Dimmi qualcosa di te — non le cose da dire, quelle vere.', 'Hai ancora quella sensazione di cui mi parlavi?'] },
        { sezione: 'Per salutare', frasi: ['Con tutto l\'affetto di sempre,', 'Un abbraccio che attraversa i chilometri,', 'Tua per sempre,', 'A presto, giuro.'] }
      ],
      vocabolarioChiave: ['spaesante', 'eppure', 'si è sistemato dentro', 'non so spiegarlo', 'ho pensato che tu avresti capito', 'con tutto l\'affetto di sempre'],
      testoModello: `Cara Giulia,\nti scrivo dal divano di casa mia, con una tazza di tisana e la sensazione strana di avere mille cose da dire e non sapere da dove cominciare — la solita sindrome da lettera rimasta troppo a lungo in bozza.\n\nVolevo raccontarti di questo viaggio in Portogallo che ho fatto quasi per caso la scorsa settimana. Tre giorni sola, senza itinerario. Pensavo sarebbe stato liberatorio; all'inizio è stato solo spaesante. Ma poi, il secondo giorno, mi sono ritrovata seduta su una panchina a Lisbona ad ascoltare un vecchio suonare fado per nessuno, e qualcosa si è sistemato dentro.\n\nNon so spiegarlo meglio di così. Ma ho pensato che tu avresti capito, senza bisogno di spiegazioni.\n\nCome stai, davvero?\nCon tutto l'affetto di sempre,\nFrancesca`
    },
    C2: { fattoreLunghezza: 1.8, notaGrammaticale: 'Usa un linguaggio colloquiale ricco, con espressioni idiomatiche.' }
  },
  'email-formale': {
    A1: { fattoreLunghezza: 0.4, notaGrammaticale: 'Usa frasi semplicissime e formule fisse di saluto formale.' },
    A2: {
      fattoreLunghezza: 0.6,
      notaGrammaticale: 'Usa il presente e formule di cortesia semplici. Struttura: apertura, richiesta, chiusura.',
      struttura: [
        { titolo: 'Formula di apertura', descrizione: '"Gentile [Direttore/Signora]," — sempre con la virgola.' },
        { titolo: 'Chi sei e perché scrivi', descrizione: '"Mi chiamo... e sono interessato/a a..." — due frasi.' },
        { titolo: 'Le domande', descrizione: 'Fai 2-3 domande semplici e dirette.' },
        { titolo: 'Formula di chiusura', descrizione: '"Ringrazio. Distinti saluti, [nome]"' }
      ],
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Gentile Direttore/Direttrice,', 'Gentile Signora/Signor [cognome],', 'A chi di competenza,'] },
        { sezione: 'Per la richiesta', frasi: ['Mi chiamo... e sono interessato/a a...', 'Vorrei sapere:', 'Potete dirmi quando...?', 'Quanto costa...?'] },
        { sezione: 'Per concludere', frasi: ['Ringrazio per la risposta.', 'Grazie.', 'Distinti saluti,', 'Cordiali saluti,'] }
      ],
      vocabolarioChiave: ['gentile', 'distinti saluti', 'cordiali saluti', 'sono interessato/a', 'vorrei sapere', 'ringrazio'],
      testoModello: `Gentile Direttore,\nmi chiamo Marco Rossi e sono uno studente universitario. Vi scrivo perché sono interessato al corso di italiano per stranieri.\nVorrei sapere alcune cose: quando inizia il corso? Quante ore dura ogni settimana? Quanto costa in totale? È possibile pagare in due rate?\nRingrazio per la risposta.\nDistinti saluti,\nMarco Rossi`
    },
    B1: {
      fattoreLunghezza: 1,
      notaGrammaticale: 'Usa un registro formale con il condizionale di cortesia (vorrei, potrebbe, sarei grato/a).',
      testoModello: `Gentile Responsabile,\nmi chiamo Laura Ferrari e sono interessata al corso di cucina italiana per principianti annunciato sul vostro sito. Vorrei richiedere alcune informazioni.\nIn primo luogo, potrebbe indicarmi le date esatte di inizio e fine del corso? Vorrei sapere, inoltre, se sono richieste conoscenze culinarie precedenti o se il corso è aperto anche ai principianti assoluti.\nInfine, sarei grata se potesse fornirmi informazioni sui costi e sulle modalità di pagamento disponibili.\nResto in attesa di una sua gentile risposta.\nCordiali saluti,\nLaura Ferrari`
    },
    B2: {
      fattoreLunghezza: 1.2,
      notaGrammaticale: 'Usa un registro formale articolato con subordinate e lessico preciso. Condizionale e congiuntivo di cortesia.',
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['Sono una/uno... e vi contatto in merito a...', 'Le scrivo in qualità di...', 'Avrei piacere di ricevere informazioni riguardo a...'] },
        { sezione: 'Per la richiesta', frasi: ['Avrei piacere di ricevere informazioni più dettagliate riguardo a...', 'Sarei lieto/a di sapere se...', 'Qualora fosse possibile,...', 'In allegato troverà...'] },
        { sezione: 'Per concludere', frasi: ['Rimango a disposizione per un eventuale colloquio.', 'La ringrazio anticipatamente.', 'In attesa di un suo riscontro,...', 'Porgo distinti saluti.'] }
      ],
      vocabolarioChiave: ['in merito a', 'avrei piacere di', 'qualora fosse possibile', 'rimango a disposizione', 'in attesa di un riscontro', 'in allegato'],
      testoModello: `Gentile Responsabile delle Risorse Umane,\nsono una studentessa di ingegneria dell'Università di Bologna e vi contatto in merito al programma di tirocinio estivo pubblicato sul vostro sito istituzionale.\nAvrei piacere di ricevere informazioni più dettagliate riguardo ai requisiti richiesti ai candidati, alla durata e al calendario del tirocinio, nonché alla possibilità di svolgere parte delle attività da remoto.\nIn allegato troverà il mio curriculum vitae aggiornato, che include le esperienze formative più rilevanti per il profilo ricercato.\nRimango a disposizione per un eventuale colloquio conoscitivo, sia in presenza che in videoconferenza.\nLa ringrazio anticipatamente e porgo distinti saluti.\nValentina Conti`
    },
    C1: {
      fattoreLunghezza: 1.4,
      notaGrammaticale: 'Usa un registro formale sofisticato. Lei maiuscolo. Costruzioni nominali, passivo, lessico preciso e istituzionale.',
      frasiUtili: [
        { sezione: 'Per iniziare', frasi: ['La contatto in qualità di...', 'Ho avuto modo di... con grande interesse.', 'Desidero... in merito a...', 'Mi rivolgo a Lei per...'] },
        { sezione: 'Per la richiesta', frasi: ['Desidero chiedere... l\'autorizzazione a...', 'Sarei altresì grato/a se volesse indicarmi...', 'Qualora ritenga opportuno,...', 'Le chiedo pertanto di...'] },
        { sezione: 'Per concludere', frasi: ['In attesa di un Suo riscontro,...', 'Le porgo i miei più cordiali saluti.', 'Resto a Sua disposizione per...', 'La ringrazio per l\'attenzione che vorrà dedicare...'] }
      ],
      vocabolarioChiave: ['in qualità di', 'desidero', 'sarei altresì grato/a', 'qualora ritenga opportuno', 'a Sua disposizione', 'in attesa di un Suo riscontro'],
      testoModello: `Egregio Professor Marchetti,\nLa contatto in qualità di ricercatrice associata presso il Dipartimento di Scienze Sociali dell'Università Ca' Foscari di Venezia. Ho avuto modo di leggere con grande interesse la Sua recente pubblicazione sull'impatto delle politiche abitative nelle aree metropolitane, e desidero chiederLe l'autorizzazione a citare alcuni dati del terzo capitolo nel contesto di una ricerca che sto attualmente conducendo su commissione del CNR.\nSarei altresì grata se volesse indicarmi se i dataset originali da Lei utilizzati siano accessibili attraverso archivi pubblici o richiedano una specifica richiesta d'accesso.\nIn attesa di un Suo riscontro, Le porgo i miei più cordiali saluti e mi rendo disponibile per qualsiasi chiarimento ritenga necessario.\nProf.ssa Irene Danesi`
    },
    C2: { fattoreLunghezza: 1.6, notaGrammaticale: 'Usa un registro formale impeccabile, con precisione lessicale.' }
  }
}

export interface ConsegnaAdattata {
  consegna: string
  paroleMin: number
  paroleMax: number
  struttura?: { titolo: string; descrizione: string }[]
  frasiUtili?: { sezione: string; frasi: string[] }[]
  vocabolarioChiave?: string[]
  testoModello?: string
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
    paroleMax: Math.max(25, Math.round(guida.paroleMax * adattamento.fattoreLunghezza)),
    struttura: adattamento.struttura,
    frasiUtili: adattamento.frasiUtili,
    vocabolarioChiave: adattamento.vocabolarioChiave,
    testoModello: adattamento.testoModello
  }
}
