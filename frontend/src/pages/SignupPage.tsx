import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signup } from '../api/auth'
import type { UserType } from '../api/types'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { ErrorBanner } from '../components/ui/ErrorBanner'
import { extractErrorMessage } from '../api/client'
import { formatDocument, onlyDigits } from '../utils/format'
import { isStrongEnoughPassword, isValidDocument, isValidEmail } from '../utils/validators'

interface FormState {
  username: string
  firstName: string
  lastName: string
  document: string
  email: string
  password: string
  confirmPassword: string
  type: UserType
}

const initialState: FormState = {
  username: '',
  firstName: '',
  lastName: '',
  document: '',
  email: '',
  password: '',
  confirmPassword: '',
  type: 'people',
}

const DOCUMENT_LABEL: Record<UserType, string> = {
  people: 'CPF',
  company: 'CNPJ',
}

const DOCUMENT_PLACEHOLDER: Record<UserType, string> = {
  people: '000.000.000-00',
  company: '00.000.000/0000-00',
}

const DOCUMENT_MAX_LENGTH: Record<UserType, number> = {
  people: 14,
  company: 18,
}

export default function SignupPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialState)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleTypeChange(type: UserType) {
    setForm((prev) => ({ ...prev, type, document: '' }))
    setFieldErrors((prev) => ({ ...prev, document: undefined }))
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {}

    if (form.username.trim().length < 3) errors.username = 'Use ao menos 3 caracteres.'
    if (!form.firstName.trim()) errors.firstName = 'Informe seu nome.'
    if (!form.lastName.trim()) errors.lastName = 'Informe seu sobrenome.'
    if (!isValidDocument(form.document, form.type)) {
      errors.document = `${DOCUMENT_LABEL[form.type]} inválido.`
    }
    if (!isValidEmail(form.email)) errors.email = 'E-mail inválido.'
    if (!isStrongEnoughPassword(form.password)) errors.password = 'Use ao menos 8 caracteres.'
    if (form.confirmPassword !== form.password) errors.confirmPassword = 'As senhas não coincidem.'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await signup({
        user: {
          username: form.username.trim(),
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          cpf_cnpj: onlyDigits(form.document),
          email: form.email.trim(),
          password: form.password,
        },
        type_user: { type: form.type },
      })
      await login(form.username.trim(), form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, 'Não foi possível criar sua conta. Tente novamente.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Criar conta</h1>
      <p className="mb-8 text-sm text-ink-soft/70">Leva menos de um minuto.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex gap-2 rounded-xl border border-line p-1">
          {(['people', 'company'] as UserType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                form.type === type ? 'bg-ink text-gold-soft' : 'text-ink-soft/70 hover:bg-ink/5'
              }`}
            >
              {type === 'people' ? 'Pessoa física' : 'Empresa'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Nome"
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            error={fieldErrors.firstName}
            autoComplete="given-name"
          />
          <TextField
            label="Sobrenome"
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            error={fieldErrors.lastName}
            autoComplete="family-name"
          />
        </div>

        <TextField
          label="Usuário"
          value={form.username}
          onChange={(e) => updateField('username', e.target.value)}
          error={fieldErrors.username}
          autoComplete="username"
        />

        <TextField
          label={DOCUMENT_LABEL[form.type]}
          value={form.document}
          onChange={(e) => updateField('document', formatDocument(e.target.value, form.type))}
          error={fieldErrors.document}
          inputMode="numeric"
          maxLength={DOCUMENT_MAX_LENGTH[form.type]}
          placeholder={DOCUMENT_PLACEHOLDER[form.type]}
        />

        <TextField
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={fieldErrors.email}
          autoComplete="email"
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Senha"
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            error={fieldErrors.password}
            autoComplete="new-password"
          />
          <TextField
            label="Confirmar senha"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
          />
        </div>

        {error ? <ErrorBanner message={error} /> : null}

        <Button type="submit" isLoading={isSubmitting} className="mt-2">
          Criar conta
        </Button>
      </form>

      <p className="mt-8 text-sm text-ink-soft/70">
        Já tem conta?{' '}
        <Link to="/login" className="font-semibold text-gold-deep underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
