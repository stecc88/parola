import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-br from-brand-600 via-brand-400 to-violet-600 text-white shadow-glow-brand hover:shadow-glow-violet hover:brightness-110',
  secondary:
    'bg-surface-secondary text-ink-primary border border-border hover:bg-surface-tertiary hover:border-brand-400/50 hover:shadow-card',
  ghost:
    'bg-transparent text-ink-secondary hover:bg-surface-secondary hover:text-ink-primary',
  danger:
    'bg-gradient-to-br from-danger-text to-rose-600 text-white shadow-sm hover:brightness-110'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold',
          'transition-all duration-200 ease-out',
          'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
