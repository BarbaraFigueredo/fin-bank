import { useCallback, useEffect, useState } from 'react'
import { listTransactions } from '../api/payments'
import type { Transaction } from '../api/types'
import { extractErrorMessage } from '../api/client'

interface UseTransactionsResult {
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  reload: () => void
}

export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    listTransactions()
      .then((data) => {
        if (!cancelled) setTransactions(data)
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err, 'Não foi possível carregar o extrato.'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  return { transactions, isLoading, error, reload }
}
