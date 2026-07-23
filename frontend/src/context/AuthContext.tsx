import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchMe, login as loginRequest, logout as logoutRequest } from '../api/auth'
import { UNAUTHORIZED_EVENT, clearToken, getToken, setToken } from '../api/client'
import type { Me } from '../api/types'

interface AuthContextValue {
  user: Me | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (login: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    const me = await fetchMe()
    setUser(me)
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    refreshMe()
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [refreshMe])

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const login = useCallback(async (loginValue: string, password: string) => {
    const { token, user: me } = await loginRequest(loginValue, password)
    setToken(token)
    setUser(me)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // mesmo se a chamada falhar, limpamos a sessão localmente
    }
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, login, logout, refreshMe }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
