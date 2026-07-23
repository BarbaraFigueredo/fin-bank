import type { Transaction } from '../../api/types'
import { formatCurrency } from '../../utils/format'
import { ArrowDownIcon, ArrowUpIcon } from '../ui/icons'

export function TransactionListItem({ transaction }: { transaction: Transaction }) {
  const isIncoming = transaction.direction === 'in'
  const time = new Date(transaction.date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isIncoming ? 'bg-success/10 text-success' : 'bg-ink/5 text-ink-soft'
        }`}
      >
        {isIncoming ? <ArrowDownIcon width={18} height={18} /> : <ArrowUpIcon width={18} height={18} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{transaction.counterpart_name}</p>
        <p className="text-xs text-ink-soft/60">{time}</p>
      </div>

      <p className={`shrink-0 text-sm font-semibold ${isIncoming ? 'text-success' : 'text-ink'}`}>
        {isIncoming ? '+ ' : '- '}
        {formatCurrency(transaction.amount)}
      </p>
    </div>
  )
}
