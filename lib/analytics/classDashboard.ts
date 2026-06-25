import type { StudentOverviewRow } from '@/app/teacher/classes/actions'
import type { CategoriaErrore } from './studentStats'

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export interface LivelloConteggio {
  livello: string
  conteggio: number
}

export interface ClassDashboard {
  studentiTotali: number
  mediaClasse: number | null
  inMiglioramento: StudentOverviewRow[]
  stabili: StudentOverviewRow[]
  inCalo: StudentOverviewRow[]
  attivi7gg: number
  distribuzioneLivelli: LivelloConteggio[]
  studentiSenzaCorrezioni: number
  studentiARischio: StudentOverviewRow[]
  topClasse: StudentOverviewRow[]
  consegnaMediaClasse: number | null
  erroriTotaliPerCategoria: Record<CategoriaErrore, number>
  studentiConObiettivo: number
  distribuzioneObiettivi: LivelloConteggio[]
  quasiAllObiettivo: StudentOverviewRow[]
}

/**
 * Aggrega le righe per-studente (già calcolate da getStudentsOverview) in
 * un quadro generale della classe/di tutti gli studenti del docente.
 * Funzione pura (nessuna chiamata a DB) per poterla testare facilmente.
 */
export function buildClassDashboard(rows: StudentOverviewRow[]): ClassDashboard {
  const studentiTotali = rows.length

  const conMedia = rows.filter((r) => r.mediaGenerale !== null)
  const mediaClasse =
    conMedia.length > 0
      ? Math.round(conMedia.reduce((acc, r) => acc + (r.mediaGenerale ?? 0), 0) / conMedia.length)
      : null

  const inMiglioramento = rows.filter((r) => r.trend === 'miglioramento')
  const stabili = rows.filter((r) => r.trend === 'stabile')
  const inCalo = rows.filter((r) => r.trend === 'calo')

  const attivi7gg = rows.filter(
    (r) => r.giorniSenzaAttivita !== null && r.giorniSenzaAttivita <= 7
  ).length

  const distribuzioneLivelliMap: Record<string, number> = {}
  for (const livello of CEFR_ORDER) distribuzioneLivelliMap[livello] = 0
  for (const r of rows) {
    if (r.livelloAttuale && distribuzioneLivelliMap[r.livelloAttuale] !== undefined) {
      distribuzioneLivelliMap[r.livelloAttuale] += 1
    }
  }
  const distribuzioneLivelli = CEFR_ORDER.map((l) => ({
    livello: l,
    conteggio: distribuzioneLivelliMap[l]
  }))

  const studentiSenzaCorrezioni = rows.filter((r) => r.livelloAttuale === null).length

  const studentiARischio = rows
    .filter((r) => r.richiedeAttenzione)
    .sort((a, b) => (b.giorniSenzaAttivita ?? 0) - (a.giorniSenzaAttivita ?? 0))

  const topClasse = rows
    .filter((r) => r.mediaGenerale !== null)
    .sort((a, b) => (b.mediaGenerale ?? 0) - (a.mediaGenerale ?? 0))
    .slice(0, 3)

  const conConsegna = rows.filter((r) => r.consegnaPercentuale !== null)
  const consegnaMediaClasse =
    conConsegna.length > 0
      ? Math.round(
          conConsegna.reduce((acc, r) => acc + (r.consegnaPercentuale ?? 0), 0) /
            conConsegna.length
        )
      : null

  const erroriTotaliPerCategoria: Record<CategoriaErrore, number> = {
    grammatica: 0,
    lessico: 0,
    sintassi: 0,
    coerenza: 0,
    ortografia: 0
  }
  for (const r of rows) {
    for (const cat of Object.keys(erroriTotaliPerCategoria) as CategoriaErrore[]) {
      erroriTotaliPerCategoria[cat] += r.erroriPerCategoria[cat] ?? 0
    }
  }

  const conObiettivo = rows.filter((r) => r.livelloTarget !== null)
  const distribuzioneObiettiviMap: Record<string, number> = {}
  for (const r of conObiettivo) {
    const livello = r.livelloTarget as string
    distribuzioneObiettiviMap[livello] = (distribuzioneObiettiviMap[livello] ?? 0) + 1
  }
  const distribuzioneObiettivi = CEFR_ORDER.filter((l) => distribuzioneObiettiviMap[l] > 0).map(
    (l) => ({ livello: l, conteggio: distribuzioneObiettiviMap[l] })
  )

  // "Quasi all'obiettivo": un solo livello CEFR sotto il target, con una
  // media già solida (≥75) — segnale concreto di chi sta per "salire" di
  // livello, utile al docente per capire a chi dare la spinta finale.
  const quasiAllObiettivo = rows.filter((r) => {
    if (!r.livelloAttuale || !r.livelloTarget || r.mediaGenerale === null) return false
    const idxAttuale = CEFR_ORDER.indexOf(r.livelloAttuale as (typeof CEFR_ORDER)[number])
    const idxTarget = CEFR_ORDER.indexOf(r.livelloTarget as (typeof CEFR_ORDER)[number])
    if (idxAttuale === -1 || idxTarget === -1) return false
    return idxTarget - idxAttuale === 1 && r.mediaGenerale >= 75
  })

  return {
    studentiTotali,
    mediaClasse,
    inMiglioramento,
    stabili,
    inCalo,
    attivi7gg,
    distribuzioneLivelli,
    studentiSenzaCorrezioni,
    studentiARischio,
    topClasse,
    consegnaMediaClasse,
    erroriTotaliPerCategoria,
    studentiConObiettivo: conObiettivo.length,
    distribuzioneObiettivi,
    quasiAllObiettivo
  }
}
