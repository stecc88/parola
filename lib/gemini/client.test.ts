import { describe, it, expect } from 'vitest'
import { GeminiError, isQuotaExhausted } from './client'

describe('isQuotaExhausted', () => {
  it('returns true for a 429 with RESOURCE_EXHAUSTED status', () => {
    const err = new GeminiError('Gemini respondió con error 429', 429, {
      error: { code: 429, status: 'RESOURCE_EXHAUSTED' }
    })
    expect(isQuotaExhausted(err)).toBe(true)
  })

  it('returns false for a 429 without RESOURCE_EXHAUSTED status (transient rate limit)', () => {
    const err = new GeminiError('Gemini respondió con error 429', 429, {
      error: { code: 429, status: 'UNAVAILABLE' }
    })
    expect(isQuotaExhausted(err)).toBe(false)
  })

  it('returns false for non-429 errors regardless of body', () => {
    const err = new GeminiError('Gemini respondió con error 503', 503, {
      error: { code: 503, status: 'RESOURCE_EXHAUSTED' }
    })
    expect(isQuotaExhausted(err)).toBe(false)
  })

  it('returns false when body is missing or malformed', () => {
    const err = new GeminiError('Gemini respondió con error 429', 429, undefined)
    expect(isQuotaExhausted(err)).toBe(false)
  })
})
