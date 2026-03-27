const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
const API_BASE_URL =
  configuredApiBaseUrl ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5154')

const HUB_BASE_URL = (import.meta.env.VITE_HUB_URL as string | undefined)?.trim() ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  API_BASE_URL

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
  const method = (rest.method ?? 'GET').toString().toUpperCase()
  const hasBody = rest.body !== undefined && rest.body !== null
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData
  // GET/HEAD не должны иметь Content-Type: application/json без тела (часто 405 на прокси).
  // POST/PUT/PATCH с JSON-телом — всегда задаём application/json (нужно для ASP.NET minimal APIs).
  const useJsonContentType =
    hasBody && !isFormData && method !== 'GET' && method !== 'HEAD'
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(useJsonContentType ? { 'Content-Type': 'application/json' } : {}),
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
    let message = errorText || `Request failed with status ${response.status}`
    try {
      const json = JSON.parse(errorText)
      if (typeof json?.message === 'string') message = json.message
    } catch {
      /* use raw errorText */
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    const preview = text.slice(0, 80).replace(/\s+/g, ' ')
    throw new Error(
      `Server returned ${contentType || 'non-JSON'} instead of JSON. ` +
        (preview.toLowerCase().includes('<!doctype') || preview.toLowerCase().includes('<html')
          ? 'Is the backend running (port 5154)? Check VITE_API_BASE_URL.'
          : `Preview: ${preview}`)
    )
  }

  return (await response.json()) as T
}

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

export function getHubUrl(): string {
  return HUB_BASE_URL
}
