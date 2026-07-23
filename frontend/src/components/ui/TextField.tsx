import { forwardRef, type InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? label.replace(/\s+/g, '-').toLowerCase()
    return (
      <label htmlFor={inputId} className="flex flex-col gap-1.5 text-left">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">
          {label}
        </span>
        <input
          id={inputId}
          ref={ref}
          className={`rounded-xl border bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-gold focus:ring-2 focus:ring-gold/30 ${
            error ? 'border-danger' : 'border-line'
          } ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error ? <span className="text-xs text-danger">{error}</span> : null}
      </label>
    )
  },
)

TextField.displayName = 'TextField'
