import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { ErrorBanner } from '../components/ui/ErrorBanner'
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
    <AuthLayout>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Bem-vindo de volta</h1>
      <p className="mb-8 text-sm text-ink-soft/70">
        Entre com seu usuário ou e-mail para continuar.
      </p>

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

      <p className="mt-8 text-sm text-ink-soft/70">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="font-semibold text-gold-deep underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
