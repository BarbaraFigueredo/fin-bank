import axios from 'axios'

const TOKEN_KEY = 'picpay:token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8005/api',
  timeout: 10_000,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Disparado quando o backend recusa o token (expirado/inválido), para a UI reagir deslogando o usuário. */
export const UNAUTHORIZED_EVENT = 'picpay:unauthorized'

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: unknown; errors?: unknown } | undefined
    const detail = data?.error ?? data?.errors
    if (typeof detail === 'string') return detail
    if (detail && typeof detail === 'object') {
      const firstField = Object.values(detail as Record<string, unknown>)[0]
      if (Array.isArray(firstField) && typeof firstField[0] === 'string') return firstField[0]
    }
  }
  return fallback
}
