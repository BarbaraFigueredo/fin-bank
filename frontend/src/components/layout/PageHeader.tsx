import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '../ui/icons'

interface PageHeaderProps {
  title: string
  onBack?: () => void
  action?: ReactNode
}

export function PageHeader({ title, onBack, action }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-4 backdrop-blur md:px-8 md:py-6">
      <button
        type="button"
        onClick={() => (onBack ? onBack() : navigate(-1))}
        aria-label="Voltar"
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft/70 hover:bg-ink/5 md:hidden"
      >
        <ChevronLeftIcon width={20} height={20} />
      </button>
      <h1 className="flex-1 text-base font-semibold text-ink md:text-xl">{title}</h1>
      {action}
    </header>
  )
}
