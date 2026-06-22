import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { zodToGeminiSchema } from './schema'

describe('zodToGeminiSchema', () => {
  it('converts a simple object with required fields', () => {
    const schema = z.object({
      titolo: z.string(),
      punteggio: z.number()
    })
    expect(zodToGeminiSchema(schema)).toEqual({
      type: 'object',
      properties: {
        titolo: { type: 'string' },
        punteggio: { type: 'number' }
      },
      required: ['titolo', 'punteggio']
    })
  })

  it('marks nullable fields as nullable and excludes them from required', () => {
    const schema = z.object({
      commento: z.string().nullable()
    })
    const result = zodToGeminiSchema(schema)
    expect(result.properties).toEqual({
      commento: { type: 'string', nullable: true }
    })
    expect(result.required).toEqual([])
  })

  it('converts arrays of objects (nested structure used by valutazione errori)', () => {
    const schema = z.object({
      errori: z.array(
        z.object({
          categoria: z.enum(['grammatica', 'lessico']),
          testo_originale: z.string()
        })
      )
    })
    const result = zodToGeminiSchema(schema)
    expect(result.properties).toEqual({
      errori: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            categoria: { type: 'string', enum: ['grammatica', 'lessico'] },
            testo_originale: { type: 'string' }
          },
          required: ['categoria', 'testo_originale']
        }
      }
    })
  })

  it('throws for unsupported Zod types instead of silently producing an invalid schema', () => {
    const schema = z.object({ data: z.date() })
    expect(() => zodToGeminiSchema(schema)).toThrow(/no soportado/)
  })
})
