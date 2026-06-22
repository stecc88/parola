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

  let consegneRispettate = 0
  let consegneTotali = 0

  // Livelli stimati di scrittura libera, in ordine cronologico (per capire
  // qual è l'attuale e quale il precedente).
  const livelliCronologici: { data: string; livello: string }[] = []

  for (const s of submissions) {
    if (!isEsaminatoreValutazione(s.valutazione_ia)) continue
    const v = s.valutazione_ia

    tuttiPuntiForza.push(...v.punti_forza)
    tutteAreeMiglioramento.push(...v.aree_di_miglioramento)

    for (const errore of v.errori) {
      if (CATEGORIE_ERRORE.includes(errore.categoria)) {
        erroriPerCategoria[errore.categoria] += 1
      }
    }

    if (v.rispetto_consegna) {
      consegneTotali += 1
      if (v.rispetto_consegna.rispetta_consegna) consegneRispettate += 1
    }

    livelliCronologici.push({ data: s.created_at, livello: v.livello_stimato })
  }

  livelliCronologici.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  return {
    totaleAttivita,
    valutate,
    mediaGenerale: media(puntiGenerici),
    mediaScritturaLibera: media(puntiScrittura),
    evoluzione,
    puntiForzaFrequenti: topFrequenze(tuttiPuntiForza),
    areeMiglioramentoFrequenti: topFrequenze(tutteAreeMiglioramento),
    erroriPerCategoria,
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
