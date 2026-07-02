'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { StudentOverviewRow } from './actions'

const LIVELLI = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export function StudentiList({ panoramica }: { panoramica: StudentOverviewRow[] }) {
  const [filtroLivello, setFiltroLivello] = useState<string>('tutti')

  const studenti = (filtroLivello === 'tutti'
    ? [...panoramica]
    : panoramica.filter((s) => s.livelloTarget === filtroLivello)
  ).sort((a, b) => {
    if (a.studentStatus === 'pending' && b.studentStatus !== 'pending') return -1
    if (a.studentStatus !== 'pending' && b.studentStatus === 'pending') return 1
    return 0
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-tertiary">
          {studenti.length} {studenti.length === 1 ? 'studente' : 'studenti'}
          {filtroLivello !== 'tutti' && ` con obiettivo ${filtroLivello}`}
        </p>
        <div className="flex items-center gap-2 text-sm text-ink-secondary">
          <span className="text-xs">Filtra per obiettivo:</span>
          <select
            value={filtroLivello}
            onChange={(e) => setFiltroLivello(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-brand-400"
          >
            <option value="tutti">Tutti</option>
            {LIVELLI.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {studenti.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-tertiary">
          Nessuno studente con obiettivo {filtroLivello}.
        </p>
      ) : (
        <div className="space-y-1">
          {studenti.map((s) => (
            <Link key={s.studentId} href={`/teacher/students/${s.studentId}`}>
              <div className={`flex items-center justify-between gap-3 rounded-md p-2 text-sm hover:bg-surface-secondary ${s.studentStatus === 'pending' ? 'bg-warning-bg border border-warning-border' : ''}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-primary">
                    {s.nome} {s.cognome}
                    {s.studentStatus === 'pending' && (
                      <span className="ml-2 rounded-full bg-warning-border px-2 py-0.5 text-xs font-medium text-warning-text">
                        in attesa
                      </span>
                    )}
                    {s.richiedeAttenzione && s.studentStatus !== 'pending' && <span className="ml-1">⚠</span>}
                  </p>
                  <p className="truncate text-xs text-ink-tertiary">
                    {s.classeNome ?? 'Nessuna classe'}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right text-xs text-ink-tertiary sm:block">
                  <p>
                    Ultimo accesso:{' '}
                    {s.ultimoAccesso
                      ? new Date(s.ultimoAccesso).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit'
                        })
                      : 'mai'}
                  </p>
                  <p>{s.totaleAttivita} attività</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {s.livelloTarget && (
                    <span className="rounded-full bg-info-bg px-2 py-0.5 text-xs font-medium text-info-text">
                      obiettivo {s.livelloTarget}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      s.mediaGenerale === null
                        ? 'bg-surface-tertiary text-ink-tertiary'
                        : s.mediaGenerale < 60
                          ? 'bg-danger-bg text-danger-text'
                          : 'bg-success-bg text-success-text'
                    }`}
                  >
                    {s.mediaGenerale !== null ? `${s.mediaGenerale}%` : '—'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
