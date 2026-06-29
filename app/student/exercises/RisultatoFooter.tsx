'use client'

const CONSIGLI: Record<number, { insufficiente: string; sufficiente: string; ottimo: string }> = {
  1: {
    insufficiente: 'Rileggi il contesto grammaticale indicato sotto ogni frase prima di rispondere. Cerca di capire che struttura richiede il buco: un verbo? Un pronome? Una preposizione? Poi applica la regola corretta.',
    sufficiente: 'Stai migliorando. Quando sbagli, chiediti: quale struttura testava quella frase? Annotala e riutilizzala in una frase originale per consolidarla.',
    ottimo: 'Ottimo risultato! Per alzare ancora il livello, prova a spiegare ad alta voce perché hai scelto ogni risposta — se riesci a motivarla, la struttura è acquisita.'
  },
  2: {
    insufficiente: 'In italiano, l\'ordine tipico è: Soggetto + Verbo + Oggetto. I pronomi clitici (lo, la, mi, ti…) vanno PRIMA del verbo coniugato ma DOPO l\'infinito. Gli aggettivi qualificativi di norma seguono il nome.',
    sufficiente: 'Attenzione alla posizione dei clitici e degli avverbi. Rileggi la frase costruita e chiediti: suona naturale? Puoi dire quella frase in italiano senza esitare?',
    ottimo: 'Ottimo! Ora sperimenta varianti: sposta un elemento e osserva come cambia il significato o l\'enfasi della frase.'
  },
  3: {
    insufficiente: 'Le preposizioni si imparano per collocazione, non a regola: "pensare A", "dipendere DA", "parlare DI". Tieni un quaderno con i verbi + preposizione usati in questo esercizio.',
    sufficiente: 'Buon lavoro. Per le preposizioni che hai sbagliato, scrivi 3 frasi originali usando quella preposizione nel contesto corretto.',
    ottimo: 'Eccellente! Ora prova con preposizioni articolate nei brani di livello superiore — il principio è lo stesso ma il contesto è più complesso.'
  },
  4: {
    insufficiente: 'Prima di trasformare, identifica il verbo principale e il tempo/modo richiesto. Poi segui questi passi: (1) isola il verbo, (2) applica la coniugazione, (3) rileggi la frase completa per verificare la concordanza.',
    sufficiente: 'Stai cogliendo la logica delle trasformazioni. Concentrati sui verbi irregolari che hai sbagliato: coniugali in tutti i tempi richiesti finora.',
    ottimo: 'Bravissimo! Le trasformazioni complesse (passivo, discorso indiretto) richiedono attenzione alla consecutio temporum — è il passo successivo.'
  },
  5: {
    insufficiente: 'Distingui i sinonimi dal contesto sintattico: guarda la parola prima e dopo il buco. Spesso la collocazione (la parola che "va insieme") rivela la risposta giusta.',
    sufficiente: 'Buon progresso. Per le parole che hai sbagliato, cerca un esempio d\'uso nel dizionario e confrontalo con la frase dell\'esercizio.',
    ottimo: 'Ottimo vocabolario! Per arricchirlo ulteriormente, leggi testi autentici italiani (articoli, storie brevi) e annota le collocazioni nuove.'
  },
  6: {
    insufficiente: 'Per ogni espressione, chiediti: CHI parla? A CHI? In QUALE contesto (formale/informale)? Questi 3 fattori determinano sempre la situazione comunicativa corretta.',
    sufficiente: 'Stai sviluppando la competenza pragmatica. Per le domande sbagliate, rileggi l\'espressione e le 4 opzioni cercando il dettaglio che distingue quella giusta.',
    ottimo: 'Ottima competenza pragmatica! Prova ora con i testi autentici dell\'esercizio B2 sulle situazioni comunicative — il formato è simile ma più complesso.'
  },
  7: {
    insufficiente: 'Leggi tutto il brano PRIMA di rispondere alle singole lacune: il contesto globale spesso rivela la risposta. Poi, per ogni lacuna, elimina le opzioni chiaramente sbagliate e scegli tra quelle rimaste.',
    sufficiente: 'Buon lavoro sul cloze. Rianalizza le lacune sbagliate: quale struttura B1 testavano? Studia quella struttura specifica e rifai l\'esercizio.',
    ottimo: 'Eccellente! Sei pronto per il cloze B2 (esercizio 12) che richiede strutture più avanzate come pronomi combinati e congiuntivo.'
  },
  8: {
    insufficiente: 'Per ogni domanda con 4 opzioni: prima elimina le 2 opzioni ovviamente sbagliate, poi confronta le 2 rimaste focalizzandoti sulla struttura grammaticale testata (indicata sotto la frase).',
    sufficiente: 'Stai acquisendo le strutture B1. Per quelle che hai sbagliato: scrivi la regola grammaticale in italiano e costruisci 2 frasi di esempio.',
    ottimo: 'Ottimo padronanza morfosintassi B1! Passa alla scelta multipla B2 (esercizio 14) per sfidare il tuo livello.'
  },
  9: {
    insufficiente: 'Memorizza le contrazioni fondamentali: DI+il=DEL, DI+la=DELLA, A+il=AL, A+la=ALLA, IN+il=NEL, IN+la=NELLA, DA+il=DAL, SU+il=SUL. Se la lacuna ha la preposizione semplice tra parentesi, devi solo aggiungere l\'articolo corretto.',
    sufficiente: 'Buon lavoro sulle preposizioni. Concentrati sulle preposizioni articolate meno frequenti: CON+il=COL (o "con il"), FRA/TRA restano invariate.',
    ottimo: 'Ottimo! Ora prova i brani B2 con strutture sintattiche più complesse dove le preposizioni cambiano significato al verbo.'
  },
  10: {
    insufficiente: 'Per ogni verbo: (1) leggi tutta la frase, (2) identifica SE descrive un\'azione passata completa (passato prossimo), un\'abitudine/stato passato (imperfetto), un\'azione presente (presente) o un\'ipotesi (condizionale), (3) coniuga di conseguenza.',
    sufficiente: 'Stai migliorando la coniugazione. Focalizzati sull\'opposizione passato prossimo vs imperfetto: è la distinzione più critica al B1.',
    ottimo: 'Ottima coniugazione B1! Prova il cloze verbi B2 (esercizio 13) che include congiuntivo, futuro anteriore e condizionale passato.'
  },
  11: {
    insufficiente: 'Prima leggi il brano intero per capire il tema e il tono, poi affronta ogni lacuna. Per le parole simili: quale "va" con le parole vicine? Usa la collocazione come guida.',
    sufficiente: 'Buona comprensione lessicale. Per le parole che hai sbagliato, cerca in un dizionario la differenza di significato tra l\'opzione corretta e quella sbagliata.',
    ottimo: 'Ottimo lessico B1! Passa al cloze lessicale B2 (esercizio 14) per sfidare il tuo vocabolario con registri più variati.'
  },
  12: {
    insufficiente: 'Schema pronomi atoni: oggetto diretto → LO/LA/LI/LE; oggetto indiretto → MI/TI/GLI/CI/VI; riflessivi → MI/TI/SI/CI/VI. Pronomi combinati: ME+LO=ME LO, TE+LO=TE LO, GLI+LO=GLIELO.',
    sufficiente: 'Stai padroneggiando i pronomi B2. Concentrati sui combinati (GLIELO, GLIENE, CE NE) che sono i più complessi.',
    ottimo: 'Eccellente padronanza pronominale! Ora costruisci frasi originali con i pronomi combinati per consolidare l\'automatismo.'
  },
  13: {
    insufficiente: 'Mappa i tempi B2: congiuntivo → dopo "penso che/credo che/spero che/sebbene"; futuro anteriore → azione futura PRIMA di un\'altra; trapassato → passato del passato; condizionale passato → ipotesi irreale nel passato.',
    sufficiente: 'Stai acquisendo i tempi B2. Focalizzati sul congiuntivo imperfetto (che fosse, che avesse) vs presente (che sia, che abbia): dipende dal tempo della reggente.',
    ottimo: 'Ottima padronanza dei tempi B2! La consecutio temporum è la sfida più alta della lingua italiana — sei sulla strada giusta.'
  },
  14: {
    insufficiente: 'Al B2 le parole simili differiscono per registro (formale/informale), sfumatura semantica o collocazione. Chiediti: questa parola è più formale? Più specifica? Compatibile con il contesto del brano?',
    sufficiente: 'Buon lavoro. Per le parole sbagliate: cerca il campo semantico a cui appartengono e studia le parole correlate nel dizionario.',
    ottimo: 'Ottimo lessico B2! Ora leggi articoli di giornale italiani — i testi autentici sono il modo migliore per espandere il vocabolario a questo livello.'
  },
  15: {
    insufficiente: 'Per ogni testo: analizza sistematicamente (1) CHI ha scritto/parlato, (2) A CHI è rivolto, (3) TRAMITE quale mezzo (SMS, email, cartello…), (4) SCOPO del messaggio. Solo una delle 4 opzioni corrisponde a tutti e 4 gli elementi.',
    sufficiente: 'Stai migliorando la comprensione del contesto comunicativo. Per le domande sbagliate, rileggi il testo cercando parole-chiave che indicano il mittente o il canale.',
    ottimo: 'Ottima competenza pragmatica B2! Sei in grado di decodificare testi autentici complessi in contesti comunicativi variati.'
  },
  16: {
    insufficiente: 'Al C1 le sfide verbali principali sono: (1) gerundio passato = "avendo + participio" (avendo capito); (2) congiuntivo trapassato = "avessi/avesse + participio"; (3) passiva con "venire" = azione puntuale, con "essere" = stato risultante. Studia queste tre costruzioni prima di riprovare.',
    sufficiente: 'Stai acquisendo i verbi C1. Focalizzati sul contrasto gerundio presente vs passato: "facendo" = simultaneo all\'azione principale; "avendo fatto" = anteriore, già completato prima.',
    ottimo: 'Eccellente padronanza verbale C1! Le costruzioni participiali assolute (arrivato il treno, partirono tutti) sono il passo successivo: usale nei tuoi testi scritti per dare un registro più elevato.'
  },
  17: {
    insufficiente: 'I connettivi C1 si imparano per funzione discorsiva: CONCESSIONE (pur + gerundio, nonostante + infinito, benché + congiuntivo), ESCLUSIONE (a meno che non, tranne che), LIMITAZIONE (per quanto + congiuntivo). Studia ciascuna categoria separatamente.',
    sufficiente: 'Buon lavoro. Per i connettivi sbagliati: chiediti quale relazione logica esprimono (causa? concessione? limitazione?) e cerca nel testo la frase precedente che stabilisce quella relazione.',
    ottimo: 'Ottima gestione della coesione testuale C1! Ora prova a produrre testi argomentativi usando almeno 3 connettivi avanzati diversi — è la competenza che distingue il C1 dal B2.'
  },
  18: {
    insufficiente: 'Al C1 le opzioni sbagliate differiscono per registro (formale/informale), collocazione (la parola "giusta" con quel verbo/nome) o sfumatura semantica sottile. Prima elimina le opzioni di registro chiaramente sbagliato, poi scegli tra le 2 rimaste quella che "colloca" meglio nel contesto.',
    sufficiente: 'Stai affinando la sensibilità lessicale C1. Per le parole sbagliate: cerca in un dizionario monolingue italiano le differenze d\'uso tra l\'opzione scelta e quella corretta.',
    ottimo: 'Ottimo lessico C1! Leggi quotidiani italiani di qualità (Corriere, Repubblica, Il Post): i testi giornalistici usano esattamente le collocazioni e i registri testati in questo esercizio.'
  },
  19: {
    insufficiente: 'Le trasformazioni C1 seguono regole precise: PASSIVO→ATTIVO: trova il complemento d\'agente (da + nome) e rendilo soggetto; DISCORSO INDIRETTO: abbassa i tempi di un grado (presente→imperfetto, futuro→condizionale, passato prossimo→trapassato); IMPLICITE: sostituisci "che + congiuntivo" con "di + infinito" quando il soggetto è lo stesso.',
    sufficiente: 'Stai acquisendo la trasformazione sintattica. Focalizzati sulla consecutio temporum nel discorso indiretto — è la fonte principale di errori al C1.',
    ottimo: 'Eccellente padronanza delle trasformazioni C1! La nominalizzazione (trasformare frasi in sintagmi nominali) è la struttura più caratteristica del registro formale italiano scritto — usala consapevolmente nei tuoi testi.'
  }
}

interface RisultatoFooterProps {
  corretti: number
  totale: number
  tipo: number
}

export function RisultatoFooter({ corretti, totale, tipo }: RisultatoFooterProps) {
  if (totale === 0) return null
  const pct = Math.round((corretti / totale) * 100)
  const fascia = pct >= 70 ? 'ottimo' : pct >= 50 ? 'sufficiente' : 'insufficiente'
  const consiglio = CONSIGLI[tipo]?.[fascia] ?? null

  return (
    <div className="mt-6 rounded-lg border border-border bg-surface-secondary p-4">
      <div className="mb-1 flex items-center justify-between text-xs text-ink-secondary">
        <span>Risultato</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-tertiary">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${pct >= 70 ? 'bg-success-text' : pct >= 50 ? 'bg-warning-text' : 'bg-danger-text'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {consiglio && (
        <>
          <p className="mb-1 text-xs font-semibold text-ink-primary">Consiglio didattico</p>
          <p className="text-xs leading-relaxed text-ink-secondary">{consiglio}</p>
        </>
      )}
    </div>
  )
}
