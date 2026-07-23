import { api } from './client'
import type { PublicUser, Transaction } from './types'

export async function searchRecipient(query: string): Promise<PublicUser> {
  const { data } = await api.get<PublicUser>('/users/search/', { params: { q: query } })
  return data
}

export async function createTransaction(payee: number, amount: string): Promise<{ transaction_id: number }> {
  const { data } = await api.post<{ transaction_id: number }>('/payments/', { payee, amount })
  return data
}

export async function listTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>('/payments/')
  return data
}
