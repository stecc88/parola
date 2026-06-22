import type { PuntoEvoluzione } from '@/lib/analytics/studentStats'

const WIDTH = 600
const HEIGHT = 160
const PADDING_X = 12
const PADDING_Y = 16

/**
 * Grafico a linea minimale, in SVG puro, per mostrare l'evoluzione del
 * punteggio di uno studente nel tempo. Deliberatamente senza libreria di
 * charting: pochi punti, nessuna interattività necessaria, e si evita una
 * dipendenza in più solo per questo.
 */
export function EvolutionChart({ punti }: { punti: PuntoEvoluzione[] }) {
  if (punti.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-tertiary">
        Non ci sono ancora abbastanza dati valutati per mostrare un grafico.
      </p>
    )
  }

  if (punti.length === 1) {
    return (
      <p className="py-8 text-center text-sm text-ink-tertiary">
        Solo un&apos;attività valutata finora ({punti[0].punteggio}%). Servono almeno due
        attività per mostrare un&apos;evoluzione.
      </p>
    )
  }

  const innerWidth = WIDTH - PADDING_X * 2
  const innerHeight = HEIGHT - PADDING_Y * 2

  const coords = punti.map((p, i) => {
    const x = PADDING_X + (i / (punti.length - 1)) * innerWidth
    // Scala fissa 0-100 perché il punteggio è sempre una percentuale.
    const y = PADDING_Y + innerHeight - (p.punteggio / 100) * innerHeight
    return { x, y, p }
  })

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ')
  const areaPoints = `${PADDING_X},${PADDING_Y + innerHeight} ${polylinePoints} ${
    PADDING_X + innerWidth
  },${PADDING_Y + innerHeight}`

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-40 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Evoluzione del punteggio nel tempo"
    >
      {/* Linee guida orizzontali (25/50/75%) */}
      {[25, 50, 75].map((pct) => {
        const y = PADDING_Y + innerHeight - (pct / 100) * innerHeight
        return (
          <line
            key={pct}
            x1={PADDING_X}
            x2={WIDTH - PADDING_X}
            y1={y}
            y2={y}
            stroke="var(--border-default)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )
      })}

      <polygon points={areaPoints} fill="#2F8FE0" opacity={0.08} />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="#2F8FE0"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={4} fill="#2F8FE0">
          <title>
            {new Date(c.p.data).toLocaleDateString('it-IT', {
              day: '2-digit',
              month: '2-digit'
            })}
            {' — '}
            {c.p.punteggio}%
          </title>
        </circle>
      ))}
    </svg>
  )
}
