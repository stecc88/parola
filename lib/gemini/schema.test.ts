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

  it('propagates array min/max length to Gemini (minItems/maxItems)', () => {
    // Regressione: senza questo, Gemini poteva restituire un array vuoto
    // (o più lungo del previsto) per campi come punti_forza/aree_di_
    // miglioramento (.min(1).max(5)), che poi falliva la validazione Zod
    // finale con un errore generico 502 invece di essere prevenuto a monte.
    const schema = z.object({
      punti_forza: z.array(z.string()).min(1).max(5)
    })
    const result = zodToGeminiSchema(schema)
    expect(result.properties).toEqual({
      punti_forza: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5 }
    })
  })

  it('propagates string min/max length to Gemini (minLength/maxLength)', () => {
    const schema = z.object({ feedback_generale: z.string().min(1) })
    const result = zodToGeminiSchema(schema)
    expect(result.properties).toEqual({
      feedback_generale: { type: 'string', minLength: 1 }
    })
  })

  it('propagates number min/max to Gemini (minimum/maximum)', () => {
    const schema = z.object({ punteggio_complessivo: z.number().min(0).max(100) })
    const result = zodToGeminiSchema(schema)
    expect(result.properties).toEqual({
      punteggio_complessivo: { type: 'number', minimum: 0, maximum: 100 }
    })
  })
})
