import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-md hover:shadow-lg hover:brightness-110',
  secondary:
    'bg-surface-secondary text-ink-primary hover:bg-surface-tertiary border border-border hover:border-brand-400/40',
  ghost: 'bg-transparent text-ink-primary hover:bg-surface-secondary',
  danger: 'bg-danger-text text-white hover:opacity-90'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ease-out',
          'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
