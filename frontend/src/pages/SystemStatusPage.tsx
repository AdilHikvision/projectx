import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/AppLayout'
import { apiRequest } from '../lib/api'
import { Card, Badge, Button, PageHeader } from '../components/ui'

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

      ; (async () => {
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
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
        {/* Unified Page Header */}
        <PageHeader
          title="System Operational Status"
          description="Real-time monitoring and control of backend services."
          actions={
            <Button variant="outline" size="sm" icon="restart_alt" onClick={() => loadStatus()} isLoading={isLoading}>
              Refresh Status
            </Button>
          }
        />

        {error && (
          <div className="bg-error-bg text-error-text p-4 rounded-xl text-sm font-bold border border-error-text/10 flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {actionMessage && (
          <div className="bg-primary/5 text-primary p-4 rounded-xl text-sm font-bold border border-primary/20 flex items-center gap-3">
            <span className="material-symbols-outlined">info</span>
            {actionMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-text-dark uppercase tracking-widest">Main Node Status</h3>
              <Badge variant={status?.serverStatus === 'Online' ? 'success' : 'error'} dot>
                {status?.serverStatus || 'Offline'}
              </Badge>
            </div>
            {isLoading || !status ? (
              <div className="flex items-center justify-center py-12">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                {[
                  { label: 'Service Identity', value: status.serviceName },
                  { label: 'Execution State', value: status.serviceState, isBadge: true },
                  { label: 'Database Engine', value: status.dbStatus, isBadge: true },
                  { label: 'DB Latency', value: status.dbLatencyMs ? `${status.dbLatencyMs.toFixed(1)} ms` : '-' },
                  { label: 'Last Check-in', value: new Date(status.utc).toLocaleString() },
                  { label: 'Health Message', value: status.serviceMessage },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1 border-b border-border-light pb-2">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{item.label}</span>
                    {item.isBadge ? (
                      <Badge variant={item.value === 'Running' || item.value === 'Online' ? 'success' : 'warning'}>
                        {item.value}
                      </Badge>
                    ) : (
                      <span className="text-sm font-bold text-text-dark">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-border-base flex items-center justify-between">
              <div className="flex gap-2">
                <Button size="sm" onClick={() => controlMainService('start')} isLoading={isSubmitting}>Start</Button>
                <Button size="sm" variant="outline" onClick={() => controlMainService('stop')} isLoading={isSubmitting}>Stop</Button>
                <Button size="sm" variant="secondary" onClick={() => controlMainService('restart')} isLoading={isSubmitting}>Restart</Button>
              </div>
              <p className="text-xs text-text-muted font-medium italic">Requires elevated loopback privileges</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-text-dark uppercase tracking-widest">SDK Diagnosis</h3>
              <Badge variant={sdkHealth?.initialized ? 'success' : 'error'} dot>
                {sdkHealth?.initialized ? 'Initialized' : 'Idle'}
              </Badge>
            </div>
            {!sdkHealth ? (
              <div className="flex items-center justify-center py-12 text-text-muted italic text-sm">
                Waiting for SDK heartbeat...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted uppercase">Platform</span>
                  <span className="text-sm font-black text-text-dark">{sdkHealth.platform}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted uppercase">Active Devices</span>
                  <span className="text-sm font-black text-primary">{sdkHealth.connectedDevices}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-text-muted uppercase">Last Error Event</span>
                  <div className={`p-3 rounded-lg text-xs ${sdkHealth.lastErrorCode ? 'bg-error-bg text-error-text border border-error-text/10' : 'bg-slate-75 text-text-muted'}`}>
                    <p className="font-bold">{sdkHealth.lastErrorCode ? `${sdkHealth.lastErrorCode}: ${sdkHealth.lastErrorMessage}` : 'No fault events logged'}</p>
                    {sdkHealth.lastErrorHint && <p className="mt-1 opacity-80">{sdkHealth.lastErrorHint}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-text-muted uppercase">Dynamic Search Paths</span>
                  <div className="flex flex-wrap gap-1">
                    {sdkHealth.librarySearchPaths.map((path, idx) => (
                      <code key={idx} className="block w-full text-xs bg-slate-75 px-2 py-1 rounded truncate text-text-muted" title={path}>{path}</code>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card noPadding className="overflow-hidden">
          <div className="p-6 border-b border-border-base flex items-center justify-between bg-slate-75/30">
            <h3 className="text-sm font-black text-text-dark uppercase tracking-widest">Service Process Manager</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => controlAll('restart')} isLoading={isSubmitting}>Restart All</Button>
              <Button variant="primary" size="sm" onClick={() => controlAll('start')} isLoading={isSubmitting}>Start All Assets</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-75 border-b border-border-base">
                  <th className="px-8 py-4 text-xs font-black text-text-muted uppercase tracking-widest">Service Identity</th>
                  <th className="px-8 py-4 text-xs font-black text-text-muted uppercase tracking-widest text-center">Listener</th>
                  <th className="px-8 py-4 text-xs font-black text-text-muted uppercase tracking-widest">Runtime State</th>
                  <th className="px-8 py-4 text-xs font-black text-text-muted uppercase tracking-widest">Log Summary</th>
                  <th className="px-8 py-4 text-xs font-black text-text-muted uppercase tracking-widest text-right">Process Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {services.map((service) => (
                  <tr key={service.key} className="hover:bg-slate-75 transition-colors">
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-text-dark">{service.displayName || service.serviceName}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <code className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">{service.port ?? 'N/A'}</code>
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant={service.serviceState === 'Running' ? 'success' : 'error'} dot>
                        {service.serviceState}
                      </Badge>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs text-text-muted italic">{service.message}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          icon="play_arrow"
                          disabled={isSubmitting || !service.isControllable || service.serviceState === 'Running'}
                          onClick={() => controlServiceByKey(service.key, 'start')}
                          className="text-success-text hover:bg-success-bg"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          icon="stop"
                          disabled={isSubmitting || !service.isControllable || service.serviceState === 'Stopped'}
                          onClick={() => controlServiceByKey(service.key, 'stop')}
                          className="text-error-text hover:bg-error-bg"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          icon="refresh"
                          disabled={isSubmitting || !service.isControllable}
                          onClick={() => controlServiceByKey(service.key, 'restart')}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
