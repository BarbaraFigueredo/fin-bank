import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  isLoading?: boolean
  children: ReactNode
}

const variants = {
  primary:
    'bg-ink text-gold-soft border border-gold/40 hover:bg-ink-soft disabled:bg-ink/40 disabled:text-gold-soft/50',
  secondary:
    'bg-transparent text-ink border border-gold-deep/60 hover:bg-gold/10 disabled:text-ink/40 disabled:border-line',
  ghost: 'bg-transparent text-ink-soft hover:bg-ink/5 disabled:text-ink/30',
}

export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}
