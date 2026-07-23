interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  /** 'onLight' para fundos brancos/claros, 'onDark' para fundos pretos/gradiente. */
  tone?: 'onLight' | 'onDark'
}

export function Logo({ size = 'md', tone = 'onLight' }: LogoProps) {
  const mark = size === 'lg' ? 'h-14 w-14 text-xl' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
  const wordmark = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg'
  const finColor = tone === 'onDark' ? 'text-paper' : 'text-ink'

  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl border border-gold/50 bg-ink font-bold text-gold ${mark}`}
      >
        F
      </span>
      <span className={`font-semibold tracking-tight ${wordmark} ${finColor}`}>
        Fin <span className="text-gold">Bank</span>
      </span>
    </div>
  )
}
