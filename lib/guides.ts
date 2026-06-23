export interface Guida {
  slug: string
  titolo: string
  descrizione: string
  consegna: string
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
    slug: 'lettera-informale',
    titolo: 'Lettera informale',
    descrizione: 'Scrivi a un amico raccontando un evento recente.',
    consegna:
      'Scrivi una lettera informale a un amico/a raccontando qualcosa che ti è successo di recente. Usa un registro colloquiale, saluti iniziali e finali tipici di una lettera personale.',
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
  }
]

export function getGuidaBySlug(slug: string | null): Guida | undefined {
  return GUIDES.find((g) => g.slug === slug)
}
