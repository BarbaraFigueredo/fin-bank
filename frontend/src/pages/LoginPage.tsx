import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { ErrorBanner } from '../components/ui/ErrorBanner'
import { Logo } from '../components/ui/Logo'
import { extractErrorMessage } from '../api/client'

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const location = useLocation()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(loginValue.trim(), password)
    } catch (err) {
      setError(extractErrorMessage(err, 'Não foi possível entrar. Verifique seus dados.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-b from-ink to-ink-soft px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" tone="onDark" />
        </div>

        <div className="rounded-2xl border border-line bg-paper p-6 shadow-xl shadow-black/20 sm:p-8">
          <h1 className="mb-1 text-xl font-semibold text-ink">Bem-vindo de volta</h1>
          <p className="mb-6 text-sm text-ink-soft/70">Entre com seu usuário ou e-mail para continuar.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <TextField
              label="Usuário ou e-mail"
              type="text"
              autoComplete="username"
              required
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
            />
            <TextField
              label="Senha"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error ? <ErrorBanner message={error} /> : null}

            <Button type="submit" isLoading={isSubmitting} className="mt-2">
              Entrar
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gold-soft">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-semibold text-gold underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
