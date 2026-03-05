const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
const API_BASE_URL =
  configuredApiBaseUrl ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5055')

const HUB_BASE_URL = (import.meta.env.VITE_HUB_URL as string | undefined)?.trim() ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  'http://localhost:5154'

export interface ApiRequestOptions extends RequestInit {
  token?: string | null
}

export const SESSION_EXPIRED_KEY = 'projectx.session.expired'

export function dispatchSessionExpired(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:session-expired'))
  }
}

export function consumeSessionExpiredFlag(): boolean {
  if (typeof window === 'undefined') return false
  const flag = sessionStorage.getItem(SESSION_EXPIRED_KEY)
  if (flag) {
    sessionStorage.removeItem(SESSION_EXPIRED_KEY)
    return true
  }
  return false
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  })

  if (response.status === 401 && !path.includes('/api/auth/login')) {
    dispatchSessionExpired()
    throw new Error('Session expired')
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

export function getHubUrl(): string {
  return HUB_BASE_URL
}
