'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AppNav } from '@/components/shared/AppNav'
import { Card } from '@/components/ui/Card'
import { ParolaMascot } from '@/components/shared/ParolaMascot'
import { LivelloSelector } from '@/components/shared/LivelloSelector'
import { cn } from '@/lib/utils'
import { ExerciseErrorBoundary } from '@/components/shared/ExerciseErrorBoundary'
import { STUDENT_NAV_ITEMS } from '@/components/shared/studentNav'
import type { LivelloCefr } from '@/lib/supabase/database.types'

// Ogni esercizio viene caricato solo quando lo studente lo apre — prima
// tutti e 19 i componenti finivano nel bundle iniziale della pagina anche
// se se ne vede uno alla volta. ssr:false perché non c'è nulla da
// renderizzare finché "tipo" non è impostato da un click dell'utente.
const loadingFallback = (
  <Card role="status" aria-live="polite" className="text-center text-sm text-ink-tertiary">
    Caricamento...
  </Card>
)
const Esercizio1 = dynamic(() => import('./Esercizio1').then((m) => m.Esercizio1), { ssr: false, loading: () => loadingFallback })
const Esercizio2 = dynamic(() => import('./Esercizio2').then((m) => m.Esercizio2), { ssr: false, loading: () => loadingFallback })
const Esercizio3 = dynamic(() => import('./Esercizio3').then((m) => m.Esercizio3), { ssr: false, loading: () => loadingFallback })
const Esercizio4 = dynamic(() => import('./Esercizio4').then((m) => m.Esercizio4), { ssr: false, loading: () => loadingFallback })
const Esercizio5 = dynamic(() => import('./Esercizio5').then((m) => m.Esercizio5), { ssr: false, loading: () => loadingFallback })
const Esercizio6 = dynamic(() => import('./Esercizio6').then((m) => m.Esercizio6), { ssr: false, loading: () => loadingFallback })
const Esercizio7 = dynamic(() => import('./Esercizio7').then((m) => m.Esercizio7), { ssr: false, loading: () => loadingFallback })
const Esercizio8 = dynamic(() => import('./Esercizio8').then((m) => m.Esercizio8), { ssr: false, loading: () => loadingFallback })
const Esercizio9 = dynamic(() => import('./Esercizio9').then((m) => m.Esercizio9), { ssr: false, loading: () => loadingFallback })
const Esercizio10 = dynamic(() => import('./Esercizio10').then((m) => m.Esercizio10), { ssr: false, loading: () => loadingFallback })
const Esercizio11 = dynamic(() => import('./Esercizio11').then((m) => m.Esercizio11), { ssr: false, loading: () => loadingFallback })
const Esercizio12 = dynamic(() => import('./Esercizio12').then((m) => m.Esercizio12), { ssr: false, loading: () => loadingFallback })
const Esercizio13 = dynamic(() => import('./Esercizio13').then((m) => m.Esercizio13), { ssr: false, loading: () => loadingFallback })
const Esercizio14 = dynamic(() => import('./Esercizio14').then((m) => m.Esercizio14), { ssr: false, loading: () => loadingFallback })
const Esercizio15 = dynamic(() => import('./Esercizio15').then((m) => m.Esercizio15), { ssr: false, loading: () => loadingFallback })
const Esercizio16 = dynamic(() => import('./Esercizio16').then((m) => m.Esercizio16), { ssr: false, loading: () => loadingFallback })
const Esercizio17 = dynamic(() => import('./Esercizio17').then((m) => m.Esercizio17), { ssr: false, loading: () => loadingFallback })
const Esercizio18 = dynamic(() => import('./Esercizio18').then((m) => m.Esercizio18), { ssr: false, loading: () => loadingFallback })
const Esercizio19 = dynamic(() => import('./Esercizio19').then((m) => m.Esercizio19), { ssr: false, loading: () => loadingFallback })

type GruppoId = 'generale' | 'b1' | 'b2' | 'c1'

const GRUPPI: {
  id: GruppoId
  label: string
  badge?: string
  descrizione: string
  esercizi: { id: number; label: string; desc: string }[]
}[] = [
  {
    id: 'generale',
    label: 'Esercizi generali',
    descrizione: 'Strutture grammaticali di base — si adattano automaticamente al livello target selezionato.',
    esercizi: [
      { id: 1, label: 'Completa la frase', desc: 'Inserisci la parola o struttura corretta in frasi con un buco.' },
      { id: 2, label: 'Riordina le parole', desc: 'Ricostruisci la frase mettendo le parole nell\'ordine giusto.' },
      { id: 3, label: 'Scegli la preposizione', desc: 'Scelta multipla: trova la preposizione corretta nel contesto.' },
      { id: 4, label: 'Trasforma la frase', desc: 'Cambia il tempo verbale, la forma o la struttura della frase.' },
      { id: 5, label: 'Completamento lessicale', desc: 'Scegli la parola giusta tra sinonimi nel contesto.' },
      { id: 6, label: 'Situazioni comunicative', desc: 'Collega ogni espressione alla situazione d\'uso corretta.' }
    ]
  },
  {
    id: 'b1',
    label: 'Preparazione B1',
    badge: 'B1',
    descrizione: 'Esercizi fedeli al formato degli standard internazionali B1 — morfosintassi, verbi e lessico su testo.',
    esercizi: [
      { id: 7, label: 'Cloze morfosintattico', desc: 'Brano con 10 lacune: articoli, pronomi, verbi — scegli tra 4 opzioni.' },
      { id: 8, label: 'Scelta multipla grammaticale', desc: 'Frasi isolate con 4 opzioni: una struttura B1 diversa per ogni domanda.' },
      { id: 9, label: 'Articoli e preposizioni', desc: 'Brano con lacune: scrivi l\'articolo o la preposizione (semplice o articolata).' },
      { id: 10, label: 'Cloze verbi', desc: 'Brano narrativo: coniuga ogni verbo — l\'infinito è tra parentesi.' },
      { id: 11, label: 'Cloze lessicale', desc: 'Brano con lacune lessicali — scegli tra 4 parole dello stesso campo semantico.' }
    ]
  },
  {
    id: 'b2',
    label: 'Preparazione B2',
    badge: 'B2',
    descrizione: 'Esercizi fedeli al formato degli standard internazionali B2 — strutture avanzate, pronomi combinati, congiuntivo.',
    esercizi: [
      { id: 12, label: 'Pronomi e aggettivi', desc: 'Brano con lacune: pronomi atoni, combinati, possessivi e relativi B2.' },
      { id: 13, label: 'Cloze verbi avanzato', desc: 'Brano con tutti i modi e tempi B2: congiuntivo, futuro, condizionale passato.' },
      { id: 14, label: 'Cloze lessicale avanzato', desc: 'Brano con vocabolario e registri variati B2 — scelta multipla lessicale.' },
      { id: 15, label: 'Situazioni comunicative', desc: 'Testi autentici (email, SMS, annunci): identifica il contesto comunicativo.' }
    ]
  },
  {
    id: 'c1',
    label: 'Preparazione C1',
    badge: 'C1',
    descrizione: 'Esercizi fedeli al formato degli standard internazionali C1 — strutture sintattiche complesse, trasformazione, gerundio, congiuntivo trapassato, nominalizzazione.',
    esercizi: [
      { id: 16, label: 'Cloze verbi avanzato', desc: 'Brano con gerundio, congiuntivo passato/trapassato, participio assoluto e passiva con venire/andare.' },
      { id: 17, label: 'Completamento testuale', desc: 'Brano argomentativo: connettivi avanzati, pronomi relativi complessi, costruzioni gerundiali, nominalizzazioni.' },
      { id: 18, label: 'Scelta multipla C1', desc: 'Brano saggistico con 15 lacune: 4 opzioni per registro, collocazioni, sfumature semantiche e morfologia avanzata.' },
      { id: 19, label: 'Trasformazione sintattica', desc: 'Riscrivi le frasi con le parole date: passivo/attivo, discorso indiretto, implicite, nominalizzazione.' }
    ]
  }
]

const COMPONENTS: Record<number, React.ComponentType> = {
  1: Esercizio1, 2: Esercizio2, 3: Esercizio3, 4: Esercizio4,
  5: Esercizio5, 6: Esercizio6, 7: Esercizio7, 8: Esercizio8,
  9: Esercizio9, 10: Esercizio10, 11: Esercizio11, 12: Esercizio12,
  13: Esercizio13, 14: Esercizio14, 15: Esercizio15,
  16: Esercizio16, 17: Esercizio17, 18: Esercizio18, 19: Esercizio19
}

export function ExercisesPageClient({ livelloIniziale }: { livelloIniziale: LivelloCefr }) {
  const [gruppo, setGruppo] = useState<GruppoId>('generale')
  const [tipo, setTipo] = useState<number | null>(null)

  const gruppoAttivo = GRUPPI.find((g) => g.id === gruppo)!
  const ExComponent = tipo !== null ? COMPONENTS[tipo] : null

  function cambiaGruppo(id: GruppoId) {
    setGruppo(id)
    setTipo(null)
  }

  return (
    <>
      <AppNav items={STUDENT_NAV_ITEMS} />
      <main id="main-content" className="mx-auto max-w-3xl p-6 animate-fade-in">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ParolaMascot mood="pensieroso" className="mt-0.5 shrink-0" />
            <div>
              <h1 className="text-xl font-semibold text-ink-primary">Analisi delle strutture</h1>
              <p className="mt-0.5 text-sm text-ink-secondary">
                {gruppo === 'generale'
                  ? 'Gli esercizi generali si adattano al tuo livello target.'
                  : 'Scegli un esercizio e inizia a praticare.'}
              </p>
            </div>
          </div>
          {gruppo === 'generale' && (
            <div className="shrink-0">
              <LivelloSelector livelloIniziale={livelloIniziale} />
            </div>
          )}
        </div>

        {/* Group tabs */}
        <div className="mb-1 flex gap-1 border-b border-border">
          {GRUPPI.map((g) => (
            <button
              key={g.id}
              onClick={() => cambiaGruppo(g.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
                gruppo === g.id
                  ? 'border border-b-0 border-border bg-surface text-ink-primary'
                  : 'text-ink-tertiary hover:text-ink-secondary'
              )}
            >
              {g.badge && (
                <span className={cn(
                  'rounded px-1.5 py-0.5 text-xs font-bold',
                  g.badge === 'B1' ? 'bg-brand-100 text-brand-600' : g.badge === 'B2' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                )}>
                  {g.badge}
                </span>
              )}
              {g.label}
            </button>
          ))}
        </div>

        {/* Group description */}
        <p className="mb-4 mt-3 text-xs text-ink-tertiary">{gruppoAttivo.descrizione}</p>

        {/* Exercise cards */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {gruppoAttivo.esercizi.map((e) => (
            <button
              key={e.id}
              onClick={() => setTipo(tipo === e.id ? null : e.id)}
              className={cn(
                'group rounded-lg border p-4 text-left transition-all',
                tipo === e.id
                  ? 'border-brand-400 bg-brand-50 shadow-sm'
                  : 'border-border bg-surface hover:border-brand-300 hover:shadow-sm'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={cn(
                  'text-sm font-semibold leading-snug',
                  tipo === e.id ? 'text-brand-600' : 'text-ink-primary group-hover:text-brand-600'
                )}>
                  {e.label}
                </p>
                <span className={cn(
                  'shrink-0 rounded-full border text-xs px-2 py-0.5',
                  tipo === e.id
                    ? 'border-brand-400 bg-brand-400 text-white'
                    : 'border-border text-ink-tertiary group-hover:border-brand-300'
                )}>
                  {tipo === e.id ? 'Aperto' : `N.${e.id}`}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">{e.desc}</p>
            </button>
          ))}
        </div>

        {/* Active exercise */}
        {ExComponent && (
          <div className="rounded-t-none">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-ink-tertiary">
                {gruppoAttivo.esercizi.find((e) => e.id === tipo)?.label}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <ExerciseErrorBoundary key={String(tipo)}>
              <ExComponent />
            </ExerciseErrorBoundary>
          </div>
        )}

        {!tipo && (
          <div className="rounded-lg border border-dashed border-border py-10 text-center">
            <p className="text-sm text-ink-tertiary">Seleziona un esercizio qui sopra per iniziare</p>
          </div>
        )}

      </main>
    </>
  )
}
