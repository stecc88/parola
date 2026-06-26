import { describe, it, expect } from 'vitest'
import { GUIDES, getConsegnaAdattata, getGuidaBySlug } from './guides'

describe('getConsegnaAdattata', () => {
  it('scales word count down for A1 relative to the B1 baseline', () => {
    const guida = getGuidaBySlug('racconto-breve')!
    const a1 = getConsegnaAdattata(guida, 'A1')
    const b1 = getConsegnaAdattata(guida, 'B1')

    expect(a1.paroleMax).toBeLessThan(b1.paroleMax)
    expect(b1.paroleMin).toBe(guida.paroleMin)
    expect(b1.paroleMax).toBe(guida.paroleMax)
  })

  it('scales word count up for C2 relative to the B1 baseline', () => {
    const guida = getGuidaBySlug('articolo-opinione')!
    const c2 = getConsegnaAdattata(guida, 'C2')
    const b1 = getConsegnaAdattata(guida, 'B1')

    expect(c2.paroleMax).toBeGreaterThan(b1.paroleMax)
  })

  it('appends a level-specific grammar note distinct from the base consegna', () => {
    const guida = getGuidaBySlug('racconto-breve')!
    const a1 = getConsegnaAdattata(guida, 'A1')
    const c1 = getConsegnaAdattata(guida, 'C1')

    expect(a1.consegna).toContain(guida.consegna)
    expect(a1.consegna).not.toBe(c1.consegna)
  })

  it('never returns a word count below the safety floor', () => {
    for (const guida of GUIDES) {
      const a1 = getConsegnaAdattata(guida, 'A1')
      expect(a1.paroleMin).toBeGreaterThanOrEqual(15)
      expect(a1.paroleMax).toBeGreaterThanOrEqual(25)
    }
  })

  it('produces a valid adaptation for every guide at every CEFR level', () => {
    const livelli: Array<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'> = [
      'A1',
      'A2',
      'B1',
      'B2',
      'C1',
      'C2'
    ]
    for (const guida of GUIDES) {
      for (const livello of livelli) {
        const adattata = getConsegnaAdattata(guida, livello)
        expect(adattata.paroleMin).toBeLessThanOrEqual(adattata.paroleMax)
        expect(adattata.consegna.length).toBeGreaterThan(0)
      }
    }
  })
})
