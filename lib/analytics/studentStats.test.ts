import { describe, it, expect } from 'vitest'
import { computeStudentStats, classifyTrend, type SubmissionRow } from './studentStats'

function makeSubmission(overrides: Partial<SubmissionRow> = {}): SubmissionRow {
  return {
    id: crypto.randomUUID(),
    tipo: 'scrittura_libera',
    created_at: new Date().toISOString(),
    consegna: null,
    valutazione_ia: null,
    ...overrides
  }
}

describe('computeStudentStats', () => {
  it('returns all-empty stats for no submissions', () => {
    const stats = computeStudentStats([])
    expect(stats.totaleAttivita).toBe(0)
    expect(stats.valutate).toBe(0)
    expect(stats.mediaGenerale).toBeNull()
    expect(stats.evoluzione).toEqual([])
    expect(stats.livelloAttuale).toBeNull()
  })

  it('computes mediaGenerale only from valutazione_ia with punteggio_complessivo', () => {
    const submissions = [
      makeSubmission({ valutazione_ia: { punteggio_complessivo: 80, errori: [] } }),
      makeSubmission({ valutazione_ia: { punteggio_complessivo: 60, errori: [] } }),
      makeSubmission({ valutazione_ia: null })
    ]
    const stats = computeStudentStats(submissions)
    expect(stats.totaleAttivita).toBe(3)
    expect(stats.valutate).toBe(2)
    expect(stats.mediaGenerale).toBe(70)
  })

  it('falls back to risultati[].corretto ratio for esercizio_struttura submissions', () => {
    const submissions = [
      makeSubmission({
        tipo: 'esercizio_struttura_1',
        valutazione_ia: { risultati: [{ corretto: true }, { corretto: false }] }
      })
    ]
    const stats = computeStudentStats(submissions)
    expect(stats.mediaGenerale).toBe(50)
  })

  it('aggregates and counts repeated punti_forza / aree_di_miglioramento', () => {
    const submissions = [
      makeSubmission({
        valutazione_ia: {
          punteggio_complessivo: 70,
          punti_forza: ['Buon uso del lessico'],
          aree_di_miglioramento: ['Concordanza articoli'],
          errori: [],
          livello_stimato: 'B1'
        }
      }),
      makeSubmission({
        valutazione_ia: {
          punteggio_complessivo: 75,
          punti_forza: ['Buon uso del lessico'],
          aree_di_miglioramento: ['Concordanza articoli'],
          errori: [],
          livello_stimato: 'B1'
        }
      })
    ]
    const stats = computeStudentStats(submissions)
    expect(stats.puntiForzaFrequenti[0]).toEqual({ testo: 'Buon uso del lessico', conteggio: 2 })
    expect(stats.areeMiglioramentoFrequenti[0]).toEqual({
      testo: 'Concordanza articoli',
      conteggio: 2
    })
  })

  it('counts errori per categoria correctly', () => {
    const submissions = [
      makeSubmission({
        valutazione_ia: {
          punteggio_complessivo: 70,
          errori: [
            { categoria: 'grammatica', testo_originale: 'a', correzione: 'b', spiegazione: 'c' },
            { categoria: 'grammatica', testo_originale: 'd', correzione: 'e', spiegazione: 'f' },
            { categoria: 'ortografia', testo_originale: 'g', correzione: 'h', spiegazione: 'i' }
          ]
        }
      })
    ]
    const stats = computeStudentStats(submissions)
    expect(stats.erroriPerCategoria.grammatica).toBe(2)
    expect(stats.erroriPerCategoria.ortografia).toBe(1)
    expect(stats.erroriPerCategoria.lessico).toBe(0)
  })

  it('computes consegna compliance percentage only over submissions with rispetto_consegna', () => {
    const submissions = [
      makeSubmission({
        valutazione_ia: {
          punteggio_complessivo: 70,
          errori: [],
          rispetto_consegna: { rispetta_consegna: true }
        }
      }),
      makeSubmission({
        valutazione_ia: {
          punteggio_complessivo: 60,
          errori: [],
          rispetto_consegna: { rispetta_consegna: false }
        }
      }),
      makeSubmission({ valutazione_ia: { punteggio_complessivo: 90, errori: [] } })
    ]
    const stats = computeStudentStats(submissions)
    expect(stats.consegna.totali).toBe(2)
    expect(stats.consegna.rispettate).toBe(1)
    expect(stats.consegna.percentuale).toBe(50)
  })

  it('orders evoluzione chronologically regardless of input order', () => {
    const older = makeSubmission({
      created_at: '2026-01-01T00:00:00Z',
      valutazione_ia: { punteggio_complessivo: 50, errori: [] }
    })
    const newer = makeSubmission({
      created_at: '2026-06-01T00:00:00Z',
      valutazione_ia: { punteggio_complessivo: 80, errori: [] }
    })
    const stats = computeStudentStats([newer, older])
    expect(stats.evoluzione[0].punteggio).toBe(50)
    expect(stats.evoluzione[1].punteggio).toBe(80)
  })

  it('picks livelloAttuale as the most recent and livelloPrecedente as the one before', () => {
    const submissions = [
      makeSubmission({
        created_at: '2026-01-01T00:00:00Z',
        valutazione_ia: { punteggio_complessivo: 50, errori: [], livello_stimato: 'A2' }
      }),
      makeSubmission({
        created_at: '2026-06-01T00:00:00Z',
        valutazione_ia: { punteggio_complessivo: 80, errori: [], livello_stimato: 'B1' }
      })
    ]
    const stats = computeStudentStats(submissions)
    expect(stats.livelloAttuale).toBe('B1')
    expect(stats.livelloPrecedente).toBe('A2')
  })
})

describe('classifyTrend', () => {
  function punto(punteggio: number, data = '2026-01-01T00:00:00Z'): import('./studentStats').PuntoEvoluzione {
    return { data, punteggio, tipo: 'scrittura_libera' }
  }

  it('returns null with fewer than 2 data points', () => {
    expect(classifyTrend([])).toBeNull()
    expect(classifyTrend([punto(70)])).toBeNull()
  })

  it('detects improvement when the second half scores notably higher', () => {
    const evoluzione = [punto(50), punto(55), punto(80), punto(85)]
    expect(classifyTrend(evoluzione)).toBe('miglioramento')
  })

  it('detects decline when the second half scores notably lower', () => {
    const evoluzione = [punto(85), punto(80), punto(55), punto(50)]
    expect(classifyTrend(evoluzione)).toBe('calo')
  })

  it('treats small fluctuations as stable', () => {
    const evoluzione = [punto(70), punto(72), punto(71), punto(69)]
    expect(classifyTrend(evoluzione)).toBe('stabile')
  })
})
