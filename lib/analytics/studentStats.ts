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
  if (typeof obj.punteggio === 'number') return obj.punteggio

  if (Array.isArray(obj.risultati)) {
    const risultati = obj.risultati as { corretto: boolean }[]
    if (risultati.length === 0) return null
    const corretti = risultati.filter((r) => r.corretto).length
    return Math.round((corretti / risultati.length) * 100)
  }

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

    // isEsaminatoreValutazione solo garantiza punteggio_complessivo y errori[]
    // (es lo mínimo para considerarlo "del esaminatore"). El resto de campos
    // se trata defensivamente: un registro viejo/parcial en la base no debe
    // romper el cálculo de stats para todo el dashboard.
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
    livelloPrecedente: livelliCronologici[1]?.livello ?? null
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
