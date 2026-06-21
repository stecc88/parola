import { cn } from '@/lib/utils'

type ParolaMood = 'neutro' | 'felice' | 'pensieroso' | 'incoraggiante'

interface ParolaMascotProps {
  mood?: ParolaMood
  className?: string
}

/**
 * Placeholder del personaggio "Parola" usato in tutta l'app per dare
 * feedback, incoraggiamento e guida agli studenti. Sostituire con
 * l'illustrazione/animazione definitiva quando sia pronta.
 */
export function ParolaMascot({ mood = 'neutro', className }: ParolaMascotProps) {
  return (
    <div
      className={cn(
        'flex h-16 w-16 items-center justify-center rounded-full bg-guided-bg text-guided-accent',
        className
      )}
      role="img"
      aria-label={`Parola, umore: ${mood}`}
    >
      <span className="text-2xl">P</span>
    </div>
  )
}
