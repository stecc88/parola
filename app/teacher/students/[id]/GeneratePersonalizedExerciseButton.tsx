'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { generatePersonalizedExercise } from './actions'
import type { TipoEsercizioPersonalizzato } from '@/lib/gemini/schema'

const TIPO_OPTIONS: { value: TipoEsercizioPersonalizzato | ''; label: string }[] = [
  { value: '', label: "Lascia decidere all'IA" },
  { value: 'scrittura', label: 'Scrittura libera' },
  { value: 'completamento', label: 'Completamento' },
  { value: 'scelta_multipla', label: 'Scelta multipla' },
  { value: 'abbinamento', label: 'Abbinamento' },
  { value: 'trasformazione', label: 'Trasformazione di frasi' }
]

export function GeneratePersonalizedExerciseButton({ studentId }: { studentId: string }) {
  const [tipo, setTipo] = useState<TipoEsercizioPersonalizzato | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleClick() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      try {
        await generatePersonalizedExercise(studentId, tipo || undefined)
        setSuccess(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore inatteso.')
      }
    })
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <label htmlFor="tipo-esercizio" className="text-xs text-ink-tertiary">
          Tipo di esercizio:
        </label>
        <select
          id="tipo-esercizio"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoEsercizioPersonalizzato | '')}
          disabled={pending}
          className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink-primary outline-none focus:border-brand-400 disabled:opacity-60"
        >
          {TIPO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Button onClick={handleClick} disabled={pending} className="text-sm">
        {pending ? 'Generazione in corso...' : '✨ Genera esercizio personalizzato'}
      </Button>
      {pending && (
        <p className="mt-2 text-xs text-ink-tertiary">
          L&apos;IA sta analizzando le difficoltà ricorrenti dello studente. Può richiedere
          qualche secondo.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-danger-text">{error}</p>}
      {success && (
        <p className="mt-2 text-xs text-success-text">
          Esercizio generato — lo trovi qui sotto e nello spazio dello studente.
        </p>
      )}
    </div>
  )
}
