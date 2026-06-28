import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean
}

export function Card({ className, glow, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface p-5 shadow-card',
        'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5',
        glow && 'border-brand-200/70 shadow-glow-brand dark:border-brand-800/40',
        className
      )}
      {...props}
    />
  )
}
