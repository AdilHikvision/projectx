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

export function SystemStatusPage() {
  const { token } = useAuth()
  const [status, setStatus] = useState<SystemStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const authToken = token
  const localControlKey = (import.meta.env.VITE_LOCAL_CONTROL_KEY as string | undefined)?.trim()

  const loadStatus = useCallback(async () => {
    if (!authToken) return
    const response = await apiRequest<SystemStatusResponse>('/api/system/status', {
      token: authToken,
    })
    setStatus(response)
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

  async function controlService(action: 'start' | 'stop' | 'restart') {
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
          <button onClick={() => controlService('start')} disabled={isSubmitting}>
            Start
          </button>
          <button onClick={() => controlService('stop')} disabled={isSubmitting}>
            Stop
          </button>
          <button onClick={() => controlService('restart')} disabled={isSubmitting}>
            Restart
          </button>
        </div>
        <p className="muted">
          Команды принимаются только с loopback-адреса. Опционально можно включить ключ `X-Local-Control-Key`.
        </p>
      </section>
    </div>
  )
}
