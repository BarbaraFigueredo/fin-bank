import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { formatCurrency, formatCpf, formatDateTime } from '../utils/format'

interface ReceiptState {
  payerName: string
  payerCpf?: string
  payeeName: string
  amount: string
  date: string
}

export default function ReceiptPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const state = location.state as ReceiptState | null
  if (!state) {
    return <Navigate to="/" replace />
  }
  const receipt: ReceiptState = state

  async function handleCopy() {
    const text = [
      'Comprovante Fin Bank',
      `Pix enviado: ${formatCurrency(receipt.amount)}`,
      `Data: ${formatDateTime(receipt.date)}`,
      `Origem: ${receipt.payerName}${receipt.payerCpf ? ` (${formatCpf(receipt.payerCpf)})` : ''}`,
      `Destino: ${receipt.payeeName}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard indisponível — ignora silenciosamente
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col items-center gap-6 px-4 py-10">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </span>

        <div className="text-center">
          <p className="text-sm text-ink-soft/60">Pix enviado!</p>
          <p className="text-3xl font-semibold text-ink">{formatCurrency(receipt.amount)}</p>
          <p className="mt-1 text-xs text-ink-soft/50">{formatDateTime(receipt.date)}</p>
        </div>

        <Card className="w-full divide-y divide-line p-4">
          <div className="pb-3">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/50">Origem</p>
            <p className="text-sm font-medium text-ink">{receipt.payerName}</p>
            {receipt.payerCpf ? (
              <p className="text-xs text-ink-soft/60">{formatCpf(receipt.payerCpf)}</p>
            ) : null}
          </div>
          <div className="pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/50">Destino</p>
            <p className="text-sm font-medium text-ink">{receipt.payeeName}</p>
          </div>
        </Card>

        <div className="flex w-full flex-col gap-3">
          <Button variant="secondary" onClick={handleCopy}>
            {copied ? 'Copiado!' : 'Copiar comprovante'}
          </Button>
          <Button onClick={() => navigate('/', { replace: true })}>Voltar para o início</Button>
        </div>
      </div>
    </AppShell>
  )
}
