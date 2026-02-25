/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { apiRequest } from '../lib/api'

interface AuthUser {
  id: string
  email: string
  roles: string[]
}

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  accessToken: string
  expiresInMinutes: number
  user: {
    id: string
    email: string
    roles: string[]
  }
}

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (request: LoginRequest) => Promise<void>
  logout: () => void
}

const STORAGE_TOKEN_KEY = 'projectx.auth.token'
const STORAGE_USER_KEY = 'projectx.auth.user'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem(STORAGE_USER_KEY)
    if (!storedUser) {
      return null
    }

    try {
      return JSON.parse(storedUser) as AuthUser
    } catch {
      localStorage.removeItem(STORAGE_USER_KEY)
      return null
    }
  })
  const [isLoading] = useState(false)

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN_KEY)
    localStorage.removeItem(STORAGE_USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback(async (request: LoginRequest) => {
    const response = await apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    })

    const nextUser: AuthUser = {
      id: response.user.id,
      email: response.user.email,
      roles: response.user.roles,
    }

    localStorage.setItem(STORAGE_TOKEN_KEY, response.accessToken)
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser))
    setToken(response.accessToken)
    setUser(nextUser)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
    }),
    [isLoading, login, logout, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
