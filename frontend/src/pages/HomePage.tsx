import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { ErrorBanner } from '../components/ui/ErrorBanner'
import { Spinner } from '../components/ui/Spinner'
import { EyeIcon, EyeOffIcon, ListIcon, LogoutIcon, PixIcon } from '../components/ui/icons'
import { TransactionListItem } from '../components/transactions/TransactionListItem'
import { useTransactions } from '../hooks/useTransactions'
import { formatCurrency, initials } from '../utils/format'

export default function HomePage() {
  const { user, logout } = useAuth()
  const { transactions, isLoading, error } = useTransactions()
  const [showBalance, setShowBalance] = useState(true)

  const recent = transactions.slice(0, 4)

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-4 pb-2 pt-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-gold">
          {user ? initials(user.first_name, user.last_name) : ''}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-ink-soft/60">Olá,</p>
          <p className="truncate text-base font-semibold text-ink">{user?.first_name}</p>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          aria-label="Sair"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft/60 hover:bg-ink/5"
        >
          <LogoutIcon width={18} height={18} />
        </button>
      </header>

      <div className="px-4 pb-6 pt-2">
        <div className="rounded-2xl bg-gradient-to-br from-ink to-ink-soft p-5 text-paper shadow-lg shadow-ink/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-gold-soft">
              Saldo disponível
            </p>
            <button
              type="button"
              onClick={() => setShowBalance((v) => !v)}
              aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
              className="text-paper/60 hover:text-paper"
            >
              {showBalance ? <EyeIcon width={18} height={18} /> : <EyeOffIcon width={18} height={18} />}
            </button>
          </div>
          <p className="mt-2 text-3xl font-semibold">
            {showBalance ? formatCurrency(user?.amount ?? '0') : '••••••'}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            to="/pix"
            className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-paper py-4 text-sm font-medium text-ink transition-colors hover:border-gold/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-gold">
              <PixIcon width={18} height={18} />
            </span>
            Pix
          </Link>
          <Link
            to="/extrato"
            className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-paper py-4 text-sm font-medium text-ink transition-colors hover:border-gold/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-gold">
              <ListIcon width={18} height={18} />
            </span>
            Extrato
          </Link>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/50">
            Últimas transações
          </p>
          {recent.length > 0 ? (
            <Link to="/extrato" className="text-xs font-semibold text-gold-deep hover:underline">
              Ver tudo
            </Link>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorBanner message={error} />
        ) : recent.length === 0 ? (
          <Card className="px-4 py-8 text-center text-sm text-ink-soft/60">
            Você ainda não tem transações.
          </Card>
        ) : (
          <Card className="divide-y divide-line">
            {recent.map((t) => (
              <TransactionListItem key={t.id} transaction={t} />
            ))}
          </Card>
        )}
      </div>
    </AppShell>
  )
}
