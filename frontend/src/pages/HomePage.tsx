import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { ErrorBanner } from '../components/ui/ErrorBanner'
import { Spinner } from '../components/ui/Spinner'
import { EyeIcon, EyeOffIcon, ListIcon, PixIcon } from '../components/ui/icons'
import { TransactionListItem } from '../components/transactions/TransactionListItem'
import { useTransactions } from '../hooks/useTransactions'
import { formatCurrency, formatDocument, initials } from '../utils/format'

const ACCOUNT_TYPE_LABEL = {
  people: 'Pessoa física',
  company: 'Empresa',
}

export default function HomePage() {
  const { user } = useAuth()
  const { transactions, isLoading, error } = useTransactions()
  const [showBalance, setShowBalance] = useState(true)

  const recent = transactions.slice(0, 6)

  return (
    <AppShell>
      <div className="px-4 py-6 md:px-8 md:py-10">
        <header className="flex items-center gap-3 pb-6 md:pb-8">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-gold">
            {user ? initials(user.first_name, user.last_name) : ''}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink-soft/60">Olá,</p>
            <p className="truncate text-lg font-semibold text-ink">{user?.first_name}</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded-2xl bg-gradient-to-br from-ink to-ink-soft p-6 text-paper shadow-lg shadow-ink/20 md:p-8">
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
              <p className="mt-3 text-4xl font-semibold">
                {showBalance ? formatCurrency(user?.amount ?? '0') : '••••••'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/pix"
                className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-5 text-sm font-medium text-ink transition-colors hover:border-gold/50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-gold">
                  <PixIcon width={18} height={18} />
                </span>
                <span>
                  Pix
                  <span className="block text-xs font-normal text-ink-soft/60">Transferir dinheiro</span>
                </span>
              </Link>
              <Link
                to="/extrato"
                className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-5 text-sm font-medium text-ink transition-colors hover:border-gold/50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-gold">
                  <ListIcon width={18} height={18} />
                </span>
                <span>
                  Extrato
                  <span className="block text-xs font-normal text-ink-soft/60">Ver histórico</span>
                </span>
              </Link>
            </div>
          </div>

          <Card className="flex flex-col gap-4 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/50">
              Dados da conta
            </p>
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-ink-soft/50">Nome</dt>
                <dd className="font-medium text-ink">
                  {user?.first_name} {user?.last_name}
                </dd>
              </div>
              <div>
                <dt className="text-ink-soft/50">Tipo de conta</dt>
                <dd className="font-medium text-ink">
                  {user ? ACCOUNT_TYPE_LABEL[user.account_type] : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-soft/50">
                  {user?.account_type === 'company' ? 'CNPJ' : 'CPF'}
                </dt>
                <dd className="font-medium text-ink">
                  {user ? formatDocument(user.cpf_cnpj, user.account_type) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-soft/50">E-mail</dt>
                <dd className="truncate font-medium text-ink">{user?.email}</dd>
              </div>
            </dl>
          </Card>

          <div className="lg:col-span-3">
            <div className="mb-3 flex items-center justify-between px-1">
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
        </div>
      </div>
    </AppShell>
  )
}
