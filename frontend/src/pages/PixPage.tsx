import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { ErrorBanner } from '../components/ui/ErrorBanner'
import { useAuth } from '../context/AuthContext'
import { createTransaction, searchRecipient } from '../api/payments'
import type { PublicUser } from '../api/types'
import { extractErrorMessage } from '../api/client'
import { formatCurrency, onlyDigits } from '../utils/format'

export default function PixPage() {
  const { user, refreshMe } = useAuth()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [recipient, setRecipient] = useState<PublicUser | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const [cents, setCents] = useState(0)
  const amountValue = (cents / 100).toFixed(2)
  const [transferError, setTransferError] = useState<string | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)

  const balance = Number(user?.amount ?? '0')

  async function handleSearch(event: FormEvent) {
    event.preventDefault()
    setSearchError(null)
    const trimmed = query.trim()
    if (!trimmed) return

    setIsSearching(true)
    try {
      const found = await searchRecipient(trimmed)
      setRecipient(found)
    } catch (err) {
      setRecipient(null)
      setSearchError(extractErrorMessage(err, 'Destinatário não encontrado.'))
    } finally {
      setIsSearching(false)
    }
  }

  function handleChangeRecipient() {
    setRecipient(null)
    setQuery('')
    setSearchError(null)
    setCents(0)
    setTransferError(null)
  }

  function handleAmountChange(value: string) {
    const digits = onlyDigits(value).slice(0, 9)
    setCents(digits ? parseInt(digits, 10) : 0)
  }

  async function handleTransfer() {
    if (!recipient) return
    setTransferError(null)

    if (cents <= 0) {
      setTransferError('Informe um valor maior que zero.')
      return
    }
    if (Number(amountValue) > balance) {
      setTransferError('Saldo insuficiente para essa transferência.')
      return
    }

    setIsTransferring(true)
    try {
      await createTransaction(recipient.id, amountValue)
      await refreshMe()
      navigate('/comprovante', {
        replace: true,
        state: {
          payerName: `${user?.first_name} ${user?.last_name}`.trim(),
          payerDocument: user?.cpf_cnpj,
          payerAccountType: user?.account_type,
          payeeName: `${recipient.first_name} ${recipient.last_name}`.trim(),
          amount: amountValue,
          date: new Date().toISOString(),
        },
      })
    } catch (err) {
      setTransferError(extractErrorMessage(err, 'Não foi possível concluir a transferência.'))
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <AppShell>
      <PageHeader title="Transferência Pix" />

      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6 md:px-8">
        <p className="text-sm text-ink-soft/70">
          Saldo disponível: <span className="font-semibold text-ink">{formatCurrency(balance)}</span>
        </p>

        {!recipient ? (
          <form onSubmit={handleSearch} className="flex flex-col gap-3">
            <TextField
              label="CPF ou e-mail do destinatário"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="000.000.000-00 ou email@exemplo.com"
              autoFocus
            />
            {searchError ? <ErrorBanner message={searchError} /> : null}
            <Button type="submit" isLoading={isSearching}>
              Buscar
            </Button>
          </form>
        ) : (
          <>
            <Card className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft/50">Transferindo para</p>
                <p className="text-base font-semibold text-ink">
                  {recipient.first_name} {recipient.last_name}
                </p>
              </div>
              <button
                type="button"
                onClick={handleChangeRecipient}
                className="text-xs font-semibold text-gold-deep hover:underline"
              >
                Trocar
              </button>
            </Card>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">
                Valor
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrency(amountValue)}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="rounded-xl border border-line bg-paper px-4 py-4 text-2xl font-semibold text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
              />
            </label>

            {transferError ? <ErrorBanner message={transferError} /> : null}

            <Button onClick={handleTransfer} isLoading={isTransferring} disabled={cents <= 0}>
              Transferir agora
            </Button>
          </>
        )}
      </div>
    </AppShell>
  )
}
