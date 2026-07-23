import type { HTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-paper shadow-sm shadow-ink/5 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
