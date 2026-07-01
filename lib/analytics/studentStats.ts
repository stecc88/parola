import type { ValutazioneEsaminatore } from '@/lib/gemini/schema'

export interface SubmissionRow {
  id: string
  tipo: string
  created_at: string
  consegna: string | null
  valutazione_ia: unknown
}

export interface PuntoEvoluzione {
  data: string
  punteggio: number
  tipo: string
}

export interface FrequenzaVoce {
  testo: string
  conteggio: number
}

export type CategoriaErrore = 'grammatica' | 'lessico' | 'sintassi' | 'coerenza' | 'ortografia'

export interface GruppoAttivita {
  conteggio: number
  media: number | null
}

export interface AttivitaPerTipo {
  scritturaLibera: GruppoAttivita
  scritturaPersonalizzata: GruppoAttivita
  eserciziStruttura: GruppoAttivita
}

export interface AttivitaSettimanale {
  etichetta: string  // es. "23/6 – 29/6"
  conteggio: number
}

export interface StudentStats {
  totaleAttivita: number
  valutate: number
  mediaGenerale: number | null
  mediaScritturaLibera: number | null
  evoluzione: PuntoEvoluzione[]
  puntiForzaFrequenti: FrequenzaVoce[]
  areeMiglioramentoFrequenti: FrequenzaVoce[]
  erroriPerCategoria: Record<CategoriaErrore, number>
  erroriDettagliatiPerCategoria: Record<CategoriaErrore, FrequenzaVoce[]>
  consegna: { rispettate: number; totali: number; percentuale: number | null }
  livelloAttuale: string | null
  livelloPrecedente: string | null
  attivitaPerTipo: AttivitaPerTipo
  attivitaUltimi7Giorni: number
  attivitaUltimi14Giorni: number
  attivitaUltimi30Giorni: number
  mediaSessioniPerSettimana: number | null
  attivitaPerSettimana: AttivitaSettimanale[]
}

const CATEGORIE_ERRORE: CategoriaErrore[] = [
  'grammatica',
  'lessico',
  'sintassi',
  'coerenza',
  'ortografia'
]

function isEsaminatoreValutazione(v: unknown): v is ValutazioneEsaminatore {
  return (
    !!v &&
    typeof v === 'object' &&
    typeof (v as Record<string, unknown>).punteggio_complessivo === 'number' &&
    Array.isArray((v as Record<string, unknown>).errori)
  )
}

function extractPunteggioGenerico(v: unknown): number | null {
  if (!v || typeof v !== 'object') return null
  const obj = v as Record<string, unknown>

  if (typeof obj.punteggio_complessivo === 'number') return obj.punteggio_complessivo

  // Controllare risultati[] PRIMA di punteggio: ValutazioneCloze* ha entrambi,
  // ma punteggio è un conteggio grezzo (es. 7 su 10) non paragonabile alla
  // scala 0-100 di punteggio_complessivo. Il calcolo da risultati[] produce
  // sempre una percentuale comparabile.
  if (Array.isArray(obj.risultati)) {
    const risultati = obj.risultati as { corretto: boolean }[]
    if (risultati.length === 0) return null
    const corretti = risultati.filter((r) => r.corretto).length
    return Math.round((corretti / risultati.length) * 100)
  }

  if (typeof obj.punteggio === 'number') return obj.punteggio

  return null
}

function media(numeri: number[]): number | null {
  if (numeri.length === 0) return null
  return Math.round(numeri.reduce((a, b) => a + b, 0) / numeri.length)
}

function topFrequenze(testi: string[], max = 5): FrequenzaVoce[] {
  const conteggi = new Map<string, number>()
  for (const t of testi) {
    const chiave = t.trim()
    if (!chiave) continue
    conteggi.set(chiave, (conteggi.get(chiave) ?? 0) + 1)
  }
  return Array.from(conteggi.entries())
    .map(([testo, conteggio]) => ({ testo, conteggio }))
    .sort((a, b) => b.conteggio - a.conteggio)
    .slice(0, max)
}

/**
 * Calcola le statistiche pedagogiche di uno studente a partire dalle sue
 * submissions, ordinate da quella più recente a quella meno recente
 * (l'ordine non è rilevante per il calcolo, ma lo è per "livelloAttuale"
 * vs "livelloPrecedente": ci si aspetta created_at descending).
 */
export function computeStudentStats(submissions: SubmissionRow[]): StudentStats {
  const totaleAttivita = submissions.length
  const valutate = submissions.filter((s) => s.valutazione_ia).length

  const puntiGenerici = submissions
    .map((s) => extractPunteggioGenerico(s.valutazione_ia))
    .filter((p): p is number => p !== null)

  const scritturaLibera = submissions.filter((s) => s.tipo === 'scrittura_libera')
  const puntiScrittura = scritturaLibera
    .map((s) => extractPunteggioGenerico(s.valutazione_ia))
    .filter((p): p is number => p !== null)

  // Evoluzione: solo le submission valutate, in ordine cronologico crescente
  // (così il grafico si legge da sinistra-passato a destra-presente).
  const evoluzione: PuntoEvoluzione[] = submissions
    .map((s) => ({ s, punteggio: extractPunteggioGenerico(s.valutazione_ia) }))
    .filter((x): x is { s: SubmissionRow; punteggio: number } => x.punteggio !== null)
    .map((x) => ({ data: x.s.created_at, punteggio: x.punteggio, tipo: x.s.tipo }))
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

  const tuttiPuntiForza: string[] = []
  const tutteAreeMiglioramento: string[] = []
  const erroriPerCategoria: Record<CategoriaErrore, number> = {
    grammatica: 0,
    lessico: 0,
    sintassi: 0,
    coerenza: 0,
    ortografia: 0
  }
  const spiegazioniPerCategoria: Record<CategoriaErrore, string[]> = {
    grammatica: [],
    lessico: [],
    sintassi: [],
    coerenza: [],
    ortografia: []
  }

  let consegneRispettate = 0
  let consegneTotali = 0

  // Livelli stimati di scrittura libera, in ordine cronologico (per capire
  // qual è l'attuale e quale il precedente).
  const livelliCronologici: { data: string; livello: string }[] = []

  for (const s of submissions) {
    if (!isEsaminatoreValutazione(s.valutazione_ia)) continue
    const v = s.valutazione_ia

    // isEsaminatoreValutazione garantisce solo punteggio_complessivo ed errori[]
    // (il minimo per considerarla "del esaminatore"). Gli altri campi
    // vengono trattati difensivamente: un record vecchio/parziale in DB non
    // deve rompere il calcolo delle stats per tutta la dashboard.
    tuttiPuntiForza.push(...(v.punti_forza ?? []))
    tutteAreeMiglioramento.push(...(v.aree_di_miglioramento ?? []))

    for (const errore of v.errori ?? []) {
      if (errore?.categoria && CATEGORIE_ERRORE.includes(errore.categoria)) {
        erroriPerCategoria[errore.categoria] += 1
        if (errore.spiegazione) {
          spiegazioniPerCategoria[errore.categoria].push(errore.spiegazione)
        }
      }
    }

    if (v.rispetto_consegna) {
      consegneTotali += 1
      if (v.rispetto_consegna.rispetta_consegna) consegneRispettate += 1
    }

    if (v.livello_stimato) {
      livelliCronologici.push({ data: s.created_at, livello: v.livello_stimato })
    }
  }

  livelliCronologici.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  // Prima prova ad aggregare per testo identico (×N se Gemini usa la stessa
  // frase); se tutte le spiegazioni sono uniche (Gemini le riformula ogni
  // volta), mostra comunque le prime 5 — una spiegazione specifica vale
  // infinitamente più di un numero generico.
  const erroriDettagliatiPerCategoria = Object.fromEntries(
    CATEGORIE_ERRORE.map((cat) => {
      const voci = topFrequenze(spiegazioniPerCategoria[cat], 5)
      // topFrequenze restituisce già tutte le voci uniche ordinate per freq;
      // se ci sono meno di 5 uniche, le mostra comunque tutte.
      return [cat, voci]
    })
  ) as Record<CategoriaErrore, FrequenzaVoce[]>

  // --- Allenamento per tipo ---
  const isEsercizioStruttura = (tipo: string) => tipo.startsWith('esercizio_struttura_')

  const buildGruppo = (rows: SubmissionRow[]): GruppoAttivita => ({
    conteggio: rows.length,
    media: media(rows.map((s) => extractPunteggioGenerico(s.valutazione_ia)).filter((p): p is number => p !== null))
  })

  const attivitaPerTipo: AttivitaPerTipo = {
    scritturaLibera: buildGruppo(submissions.filter((s) => s.tipo === 'scrittura_libera')),
    scritturaPersonalizzata: buildGruppo(submissions.filter((s) => s.tipo === 'scrittura_personalizzata')),
    eserciziStruttura: buildGruppo(submissions.filter((s) => isEsercizioStruttura(s.tipo)))
  }

  // --- Frequenza di allenamento ---
  const ora = new Date()
  const msInGiorno = 86_400_000
  const attivitaUltimi7Giorni = submissions.filter(
    (s) => ora.getTime() - new Date(s.created_at).getTime() <= 7 * msInGiorno
  ).length
  const attivitaUltimi14Giorni = submissions.filter(
    (s) => ora.getTime() - new Date(s.created_at).getTime() <= 14 * msInGiorno
  ).length
  const attivitaUltimi30Giorni = submissions.filter(
    (s) => ora.getTime() - new Date(s.created_at).getTime() <= 30 * msInGiorno
  ).length

  // Media sessioni/settimana dalla prima submission fino a oggi
  let mediaSessioniPerSettimana: number | null = null
  if (submissions.length > 0) {
    const prima = submissions.reduce(
      (min, s) => (new Date(s.created_at) < new Date(min) ? s.created_at : min),
      submissions[0].created_at
    )
    const giorniTotali = Math.max(1, (ora.getTime() - new Date(prima).getTime()) / msInGiorno)
    const settimane = giorniTotali / 7
    mediaSessioniPerSettimana = Math.round((submissions.length / settimane) * 10) / 10
  }

  // Attività per settimana (ultime 8 settimane), lunedì come inizio settimana
  const lunediDiSettimana = (d: Date): Date => {
    const day = d.getDay() // 0=dom, 1=lun, ...
    const diff = (day === 0 ? -6 : 1 - day)
    const lun = new Date(d)
    lun.setHours(0, 0, 0, 0)
    lun.setDate(d.getDate() + diff)
    return lun
  }

  const settimanaCorrente = lunediDiSettimana(ora)
  const attivitaPerSettimana: AttivitaSettimanale[] = Array.from({ length: 8 }, (_, i) => {
    const lunedi = new Date(settimanaCorrente)
    lunedi.setDate(settimanaCorrente.getDate() - (7 - i) * 7)
    const domenica = new Date(lunedi)
    domenica.setDate(lunedi.getDate() + 6)
    domenica.setHours(23, 59, 59, 999)
    const conteggio = submissions.filter((s) => {
      const t = new Date(s.created_at).getTime()
      return t >= lunedi.getTime() && t <= domenica.getTime()
    }).length
    const fmt = (d: Date) =>
      d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
    return { etichetta: `${fmt(lunedi)}–${fmt(domenica)}`, conteggio }
  })

  return {
    totaleAttivita,
    valutate,
    mediaGenerale: media(puntiGenerici),
    mediaScritturaLibera: media(puntiScrittura),
    evoluzione,
    puntiForzaFrequenti: topFrequenze(tuttiPuntiForza),
    areeMiglioramentoFrequenti: topFrequenze(tutteAreeMiglioramento),
    erroriPerCategoria,
    erroriDettagliatiPerCategoria,
    consegna: {
      rispettate: consegneRispettate,
      totali: consegneTotali,
      percentuale:
        consegneTotali > 0 ? Math.round((consegneRispettate / consegneTotali) * 100) : null
    },
    livelloAttuale: livelliCronologici[0]?.livello ?? null,
    livelloPrecedente: livelliCronologici[1]?.livello ?? null,
    attivitaPerTipo,
    attivitaUltimi7Giorni,
    attivitaUltimi14Giorni,
    attivitaUltimi30Giorni,
    mediaSessioniPerSettimana,
    attivitaPerSettimana
  }
}

/**
 * Classifica l'andamento di uno studente confrontando la media della
 * prima metà delle sue attività valutate con quella della seconda metà
 * (cronologica). Richiede almeno 2 punti valutati — con meno, non c'è
 * abbastanza dato per dire se sta migliorando o peggiorando.
 *
 * Soglia di ±5 punti percentuali per evitare di etichettare come
 * "in calo"/"in miglioramento" piccole fluttuazioni naturali tra
 * un testo e l'altro.
 */
export function classifyTrend(
  evoluzione: PuntoEvoluzione[]
): 'miglioramento' | 'stabile' | 'calo' | null {
  if (evoluzione.length < 2) return null

  const metà = Math.ceil(evoluzione.length / 2)
  const primaMetà = evoluzione.slice(0, metà)
  const secondaMetà = evoluzione.slice(metà)
  if (secondaMetà.length === 0) return null

  const media = (arr: PuntoEvoluzione[]) =>
    arr.reduce((acc, p) => acc + p.punteggio, 0) / arr.length

  const diff = media(secondaMetà) - media(primaMetà)

  if (diff >= 5) return 'miglioramento'
  if (diff <= -5) return 'calo'
  return 'stabile'
}
