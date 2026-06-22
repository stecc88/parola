import { cn } from '@/lib/utils'

type ParolaMood = 'neutro' | 'felice' | 'pensieroso' | 'incoraggiante'

interface ParolaMascotProps {
  mood?: ParolaMood
  className?: string
}

/**
 * Personaggio "Parola": un ragazzo con cappellino blu all'indietro e
 * felpa gialla, in stile illustrazione semplice e originale (coerente
 * con la palette del brand: blu, giallo, rosso/verde come accenti
 * dell'Italia). Disegnato da zero in SVG — non riprodurre artwork di
 * terzi, anche se l'ispirazione stilistica/cromatica viene da lì.
 */
export function ParolaMascot({ mood = 'neutro', className }: ParolaMascotProps) {
  // La bocca cambia leggermente in base al mood, il resto del personaggio
  // resta identico per coerenza visiva in tutta l'app.
  const mouthPath: Record<ParolaMood, string> = {
    neutro: 'M40 62 Q50 67 60 62',
    felice: 'M38 60 Q50 74 62 60',
    pensieroso: 'M42 64 L58 64',
    incoraggiante: 'M37 59 Q50 76 63 59'
  }

  return (
    <div
      className={cn('flex h-16 w-16 items-center justify-center', className)}
      role="img"
      aria-label={`Parola, umore: ${mood}`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {/* Sfondo circolare */}
        <circle cx="50" cy="50" r="48" fill="#FFF6DC" />

        {/* Felpa gialla */}
        <path
          d="M22 96 C22 78 32 70 50 70 C68 70 78 78 78 96 Z"
          fill="#FFC93C"
          stroke="#1A1410"
          strokeWidth="2.5"
        />
        <path d="M50 70 L46 84 L50 80 L54 84 Z" fill="#2F8FE0" />

        {/* Testa */}
        <circle cx="50" cy="48" r="26" fill="#F5C99B" stroke="#1A1410" strokeWidth="2.5" />

        {/* Cappellino blu all'indietro */}
        <path
          d="M27 38 C27 20 73 20 73 38 L73 30 C73 30 50 24 27 30 Z"
          fill="#2F8FE0"
          stroke="#1A1410"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <rect x="68" y="22" width="9" height="9" rx="2" fill="#CE2B37" />

        {/* Occhi */}
        <circle cx="41" cy="48" r="3" fill="#1A1410" />
        <circle cx="59" cy="48" r="3" fill="#1A1410" />

        {/* Bocca, varia con il mood */}
        <path
          d={mouthPath[mood]}
          fill="none"
          stroke="#1A1410"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Guance, solo per mood felice/incoraggiante */}
        {(mood === 'felice' || mood === 'incoraggiante') && (
          <>
            <circle cx="34" cy="54" r="3.5" fill="#FF9E8A" opacity={0.5} />
            <circle cx="66" cy="54" r="3.5" fill="#FF9E8A" opacity={0.5} />
          </>
        )}
      </svg>
    </div>
  )
}
