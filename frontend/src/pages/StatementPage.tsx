import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { ErrorBanner } from '../components/ui/ErrorBanner'
import { Spinner } from '../components/ui/Spinner'
import { SearchIcon } from '../components/ui/icons'
import { TransactionListItem } from '../components/transactions/TransactionListItem'
import { useTransactions } from '../hooks/useTransactions'
import { formatDate } from '../utils/format'
import type { Transaction } from '../api/types'

function groupByDate(transactions: Transaction[]): [string, Transaction[]][] {
  const groups = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const key = formatDate(t.date)
    const list = groups.get(key) ?? []
    list.push(t)
    groups.set(key, list)
  }
  return Array.from(groups.entries())
}

export default function StatementPage() {
  const { transactions, isLoading, error } = useTransactions()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return transactions
    return transactions.filter((t) => t.counterpart_name.toLowerCase().includes(q))
  }, [transactions, query])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  return (
    <AppShell>
      <PageHeader title="Extrato detalhado" />

      <div className="mx-auto max-w-3xl px-4 py-4 md:px-8 md:py-6">
        <label className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5">
          <SearchIcon width={18} height={18} className="text-ink-soft/50" />
          <input
            type="text"
            placeholder="Buscar por nome"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/40"
          />
        </label>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-4 md:px-8">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : error ? (
          <ErrorBanner message={error} />
        ) : groups.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft/60">
            {query ? 'Nenhuma transação encontrada.' : 'Você ainda não tem transações.'}
          </p>
        ) : (
          groups.map(([date, items]) => (
            <div key={date}>
              <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-ink-soft/50">
                {date}
              </p>
              <Card className="divide-y divide-line">
                {items.map((t) => (
                  <TransactionListItem key={t.id} transaction={t} />
                ))}
              </Card>
            </div>
          ))
        )}
      </div>
    </AppShell>
  )
}
