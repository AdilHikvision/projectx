/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { apiRequest, SESSION_EXPIRED_KEY } from '../lib/api'

interface AuthUser {
  id: string
  email: string
  roles: string[]
  permissions: string[]
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
    permissions?: string[]
  }
}

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  /** true while session is being validated (via /api/auth/me) */
  isLoading: boolean
  login: (request: LoginRequest) => Promise<void>
  logout: () => void
  /** Returns true if the user has the given permission key (e.g. "Devices.Manage"). Admin always returns true. */
  hasPermission: (permission: string) => boolean
  /** Returns true if the user has at least one of the given permission keys. */
  hasAnyPermission: (permissions: string[]) => boolean
}

const STORAGE_TOKEN_KEY = 'projectx.auth.token'
const STORAGE_USER_KEY = 'projectx.auth.user'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem(STORAGE_USER_KEY)
    if (!storedUser) return null
    try {
      return JSON.parse(storedUser) as AuthUser
    } catch {
      localStorage.removeItem(STORAGE_USER_KEY)
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(STORAGE_TOKEN_KEY)))

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN_KEY)
    localStorage.removeItem(STORAGE_USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const validateSession = async () => {
      const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY)
      if (!storedToken) {
        setIsLoading(false)
        return
      }
      try {
        const me = await apiRequest<{ id: string; email: string; roles: string[]; permissions: string[] }>('/api/auth/me', { token: storedToken })
        const nextUser: AuthUser = {
          id: me.id,
          email: me.email ?? '',
          roles: me.roles ?? [],
          permissions: me.permissions ?? [],
        }
        setUser(nextUser)
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser))
      } catch {
        logout()
      } finally {
        setIsLoading(false)
      }
    }
    validateSession()
  }, [logout])

  useEffect(() => {
    const handleSessionExpired = () => {
      logout()
      sessionStorage.setItem(SESSION_EXPIRED_KEY, '1')
      window.location.href = '/login'
    }
    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [logout])

  const login = useCallback(async (request: LoginRequest) => {
    const response = await apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    })

    const nextUser: AuthUser = {
      id: response.user.id,
      email: response.user.email,
      roles: response.user.roles,
      permissions: response.user.permissions ?? [],
    }

    localStorage.setItem(STORAGE_TOKEN_KEY, response.accessToken)
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser))
    setToken(response.accessToken)
    setUser(nextUser)
  }, [])

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false
    // Admin role always implies all permissions (mirrors backend short-circuit).
    if (user.roles.includes('Admin')) return true
    return user.permissions.includes(permission)
  }, [user])

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!user) return false
    if (user.roles.includes('Admin')) return true
    return permissions.some(p => user.permissions.includes(p))
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
    }),
    [isLoading, login, logout, token, user, hasPermission, hasAnyPermission],
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
