import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../lib/api'

interface SystemStatusResponse {
  serverStatus: string
  serviceName: string
  serviceState: string
  serviceMessage: string
  dbStatus: string
  dbLatencyMs?: number | null
  dbMessage: string
  utc: string
}

interface ServiceControlResponse {
  success: boolean
  serviceName: string
  serviceState: string
  message: string
}

interface ManagedServiceResponse {
  key: string
  serviceName: string
  displayName: string
  port?: string | null
  isControllable: boolean
  serviceState: string
  message: string
}

interface SdkHealthResponse {
  initialized: boolean
  platform: string
  connectedDevices: number
  lastErrorCode?: string | null
  lastErrorMessage?: string | null
  lastErrorHint?: string | null
  librarySearchPaths: string[]
}

export function SystemStatusPage() {
  const { token } = useAuth()
  const [status, setStatus] = useState<SystemStatusResponse | null>(null)
  const [sdkHealth, setSdkHealth] = useState<SdkHealthResponse | null>(null)
  const [services, setServices] = useState<ManagedServiceResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const authToken = token
  const localControlKey = (import.meta.env.VITE_LOCAL_CONTROL_KEY as string | undefined)?.trim()

  const loadStatus = useCallback(async () => {
    if (!authToken) return
    const [systemResponse, sdkResponse, servicesResponse] = await Promise.all([
      apiRequest<SystemStatusResponse>('/api/system/status', { token: authToken }),
      apiRequest<SdkHealthResponse>('/api/health/sdk'),
      apiRequest<ManagedServiceResponse[]>('/api/system/services', { token: authToken }),
    ])
    setStatus(systemResponse)
    setSdkHealth(sdkResponse)
    setServices(servicesResponse)
  }, [authToken])

  useEffect(() => {
    let isDisposed = false
    let timer: number | null = null

    ;(async () => {
      try {
        await loadStatus()
      } catch (e) {
        if (!isDisposed) {
          setError(e instanceof Error ? e.message : 'Не удалось загрузить статус системы')
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false)
        }
      }
    })()

    timer = window.setInterval(() => {
      loadStatus().catch(() => undefined)
    }, 4000)

    return () => {
      isDisposed = true
      if (timer) {
        window.clearInterval(timer)
      }
    }
  }, [loadStatus])

  async function controlMainService(action: 'start' | 'stop' | 'restart') {
    if (!authToken) return
    setIsSubmitting(true)
    setError(null)
    setActionMessage(null)
    try {
      const response = await apiRequest<ServiceControlResponse>(`/api/system/service/${action}`, {
        method: 'POST',
        token: authToken,
        headers: localControlKey ? { 'X-Local-Control-Key': localControlKey } : undefined,
      })

      setActionMessage(response.message)
      await loadStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Операция над службой завершилась ошибкой')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function controlServiceByKey(key: string, action: 'start' | 'stop' | 'restart') {
    if (!authToken) return
    setIsSubmitting(true)
    setError(null)
    setActionMessage(null)
    try {
      const response = await apiRequest<ServiceControlResponse>(`/api/system/services/${key}/${action}`, {
        method: 'POST',
        token: authToken,
        headers: localControlKey ? { 'X-Local-Control-Key': localControlKey } : undefined,
      })
      setActionMessage(response.message)
      await loadStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Операция над сервисом завершилась ошибкой')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function controlAll(action: 'start' | 'stop' | 'restart') {
    if (!authToken) return
    setIsSubmitting(true)
    setError(null)
    setActionMessage(null)
    try {
      const response = await apiRequest<ServiceControlResponse[]>(`/api/system/services/${action}-all`, {
        method: 'POST',
        token: authToken,
        headers: localControlKey ? { 'X-Local-Control-Key': localControlKey } : undefined,
      })
      const failed = response.filter((x) => !x.success)
      setActionMessage(
        failed.length === 0
          ? `Команда ${action.toUpperCase()} ALL выполнена успешно`
          : `${action.toUpperCase()} ALL: ${failed.length} сервис(ов) завершились с ошибкой`,
      )
      await loadStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Массовая операция завершилась ошибкой')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <header className="topbar">
        <div>
          <h1>Состояние системы</h1>
          <p className="muted">Локальный мониторинг backend-службы и PostgreSQL</p>
        </div>
        <Link to="/devices">К устройствам</Link>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {actionMessage ? <div className="info-box">{actionMessage}</div> : null}

      <section className="card">
        <h2>Текущий статус</h2>
        {isLoading || !status ? (
          <div className="page-message">Загрузка...</div>
        ) : (
          <div className="status-grid">
            <div className="status-row">
              <span>Сервер</span>
              <strong>{status.serverStatus}</strong>
            </div>
            <div className="status-row">
              <span>Служба</span>
              <strong>{status.serviceName}</strong>
            </div>
            <div className="status-row">
              <span>Состояние службы</span>
              <strong>{status.serviceState}</strong>
            </div>
            <div className="status-row">
              <span>БД</span>
              <strong>{status.dbStatus}</strong>
            </div>
            <div className="status-row">
              <span>Latency БД</span>
              <strong>{status.dbLatencyMs ? `${status.dbLatencyMs.toFixed(1)} ms` : '-'}</strong>
            </div>
            <div className="status-row">
              <span>Последнее обновление</span>
              <strong>{new Date(status.utc).toLocaleString()}</strong>
            </div>
            <div className="status-row">
              <span>Service message</span>
              <strong>{status.serviceMessage}</strong>
            </div>
            <div className="status-row">
              <span>DB message</span>
              <strong>{status.dbMessage}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Управление службой</h2>
        <div className="actions-cell">
          <button onClick={() => controlMainService('start')} disabled={isSubmitting}>
            Start
          </button>
          <button onClick={() => controlMainService('stop')} disabled={isSubmitting}>
            Stop
          </button>
          <button onClick={() => controlMainService('restart')} disabled={isSubmitting}>
            Restart
          </button>
        </div>
        <p className="muted">
          Команды принимаются только с loopback-адреса. Опционально можно включить ключ `X-Local-Control-Key`.
        </p>
      </section>

      <section className="card">
        <h2>Service Manager</h2>
        <div className="actions-cell">
          <button onClick={() => controlAll('start')} disabled={isSubmitting}>
            Start All
          </button>
          <button onClick={() => controlAll('stop')} disabled={isSubmitting}>
            Stop All
          </button>
          <button onClick={() => controlAll('restart')} disabled={isSubmitting}>
            Restart All
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Port</th>
                <th>Status</th>
                <th>Message</th>
                <th>Operation</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.key}>
                  <td>{service.displayName || service.serviceName}</td>
                  <td>{service.port ?? '-'}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        service.serviceState === 'Running'
                          ? 'online'
                          : service.serviceState === 'Stopped'
                            ? 'offline'
                            : ''
                      }`}
                    >
                      {service.serviceState}
                    </span>
                  </td>
                  <td>{service.message}</td>
                  <td className="actions-cell">
                    <button
                      disabled={isSubmitting || !service.isControllable}
                      onClick={() => controlServiceByKey(service.key, 'start')}
                    >
                      Start
                    </button>
                    <button
                      disabled={isSubmitting || !service.isControllable}
                      onClick={() => controlServiceByKey(service.key, 'stop')}
                    >
                      Stop
                    </button>
                    <button
                      disabled={isSubmitting || !service.isControllable}
                      onClick={() => controlServiceByKey(service.key, 'restart')}
                    >
                      Restart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Диагностика SDK</h2>
        {!sdkHealth ? (
          <div className="page-message">Загрузка...</div>
        ) : (
          <div className="status-grid">
            <div className="status-row">
              <span>SDK initialized</span>
              <strong>{sdkHealth.initialized ? 'Yes' : 'No'}</strong>
            </div>
            <div className="status-row">
              <span>Platform</span>
              <strong>{sdkHealth.platform}</strong>
            </div>
            <div className="status-row">
              <span>Connected devices</span>
              <strong>{sdkHealth.connectedDevices}</strong>
            </div>
            <div className="status-row">
              <span>Last error</span>
              <div className="sdk-error-block">
                <strong>
                  {sdkHealth.lastErrorCode
                    ? `${sdkHealth.lastErrorCode}: ${sdkHealth.lastErrorMessage ?? 'Unknown'}`
                    : 'No errors'}
                </strong>
                {sdkHealth.lastErrorCode && sdkHealth.lastErrorHint ? (
                  <small className="sdk-error-hint">{sdkHealth.lastErrorHint}</small>
                ) : null}
              </div>
            </div>
            <div className="status-row">
              <span>Library search paths</span>
              <div className="sdk-paths">
                {sdkHealth.librarySearchPaths.length === 0
                  ? '-'
                  : sdkHealth.librarySearchPaths.map((path) => <code key={path}>{path}</code>)}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
