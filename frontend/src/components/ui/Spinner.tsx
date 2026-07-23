export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={`inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-gold/30 border-t-gold ${className}`}
    />
  )
}
