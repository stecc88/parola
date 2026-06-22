'use client'

import { useState } from 'react'
import { AppNav } from '@/components/shared/AppNav'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { LivelloSelector } from '@/components/shared/LivelloSelector'
import { cn } from '@/lib/utils'
import { Esercizio1 } from './Esercizio1'
import { Esercizio2 } from './Esercizio2'
import { Esercizio3 } from './Esercizio3'
import { Esercizio4 } from './Esercizio4'

const NAV_ITEMS = [
  { href: '/student/write', label: 'Scrittura libera' },
  { href: '/student/exercises', label: 'Esercizi' },
  { href: '/student/guides', label: 'Guide' },
  { href: '/student/personalized', label: 'Per te' },
  { href: '/student/progress', label: 'I miei progressi' }
]

const TIPI = [
  { id: 1, label: 'Completa la frase' },
  { id: 2, label: 'Riordina le parole' },
  { id: 3, label: 'Scegli la preposizione' },
  { id: 4, label: 'Trasforma la frase' }
] as const

export default function ExercisesPage() {
  const [tipo, setTipo] = useState<number>(1)

  return (
    <>
      <AppNav items={NAV_ITEMS} />
      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ParolaMascot mood="pensieroso" />
            <div>
              <h1 className="text-xl font-semibold text-ink-primary">
                Esercizi di analisi delle strutture
              </h1>
              <p className="text-sm text-ink-secondary">4 tipi di esercizio.</p>
            </div>
          </div>
          <LivelloSelector />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {TIPI.map((t) => (
            <button
              key={t.id}
              onClick={() => setTipo(t.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                tipo === t.id
                  ? 'bg-brand-400 text-white'
                  : 'bg-surface-secondary text-ink-secondary hover:bg-surface-tertiary'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tipo === 1 && <Esercizio1 key="1" />}
        {tipo === 2 && <Esercizio2 key="2" />}
        {tipo === 3 && <Esercizio3 key="3" />}
        {tipo === 4 && <Esercizio4 key="4" />}
      </main>
    </>
  )
}
