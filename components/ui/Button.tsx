import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-400 text-white hover:bg-brand-600',
  secondary: 'bg-surface-secondary text-ink-primary hover:bg-surface-tertiary border border-border',
  ghost: 'bg-transparent text-ink-primary hover:bg-surface-secondary',
  danger: 'bg-danger-text text-white hover:opacity-90'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
