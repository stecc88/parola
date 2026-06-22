'use client'

import { useState } from 'react'

interface Props {
  titolo: string
  teoria: string
  spiegazione: string
  esempio: string
  consegna: string
  dataLabel: string
  statoNode: React.ReactNode
}

export function PersonalizedExerciseEntry({
  titolo,
  teoria,
  spiegazione,
  esempio,
  consegna,
  dataLabel,
  statoNode
}: Props) {
  const [espanso, setEspanso] = useState(false)

  return (
    <div className="rounded-md bg-surface-secondary p-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setEspanso((v) => !v)} className="flex-1 text-left">
          <p className="text-sm font-medium text-ink-primary">
            {titolo} <span className="ml-1 text-xs text-ink-tertiary">{espanso ? '▾' : '▸'}</span>
          </p>
          <p className="text-xs text-ink-tertiary">{dataLabel}</p>
        </button>
        {statoNode}
      </div>

      {espanso && (
        <div className="mt-3 space-y-3 rounded-md bg-surface p-3 text-sm">
          <div>
            <p className="mb-1 font-semibold text-ink-primary">Teoria</p>
            <p className="text-ink-secondary">{teoria}</p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-ink-primary">Spiegazione</p>
            <p className="text-ink-secondary">{spiegazione}</p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-ink-primary">Esempio</p>
            <p className="whitespace-pre-line text-ink-secondary">{esempio}</p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-ink-primary">Consegna data allo studente</p>
            <p className="text-ink-secondary">{consegna}</p>
          </div>
        </div>
      )}
    </div>
  )
}
