import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/templates'
import { useLoading } from '../context/LoadingContext'
import { apiRequest } from '../lib/api'
import { Badge, Button } from '../components/atoms'
import { PageHeader } from '../components/organisms'

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


interface SdkHealthResponse {
  initialized: boolean
  platform: string
  connectedDevices: number
  lastErrorCode?: string | null
  lastErrorMessage?: string | null
  lastErrorHint?: string | null
  lastErrorDevice?: string | null
  lastErrorCategory?: string | null
  librarySearchPaths: string[]
}

type TFn = (key: string, opts?: Record<string, unknown>) => string

function formatSdkError(sdk: SdkHealthResponse, t: TFn): { summary: string; detail: string } {
  if (!sdk.lastErrorCode) return { summary: t('systemStatus.sdkError.noErrors'), detail: '' }
  const cat = sdk.lastErrorCategory || 'other'
  const device = sdk.lastErrorDevice ? ` (${sdk.lastErrorDevice})` : ''
  if (cat === 'network') {
    return {
      summary: t('systemStatus.sdkError.networkSummary', { device }),
      detail: sdk.lastErrorMessage || t('systemStatus.sdkError.networkDetail')
    }
  }
  if (cat === 'auth') {
    return {
      summary: t('systemStatus.sdkError.authSummary', { device }),
      detail: sdk.lastErrorMessage || t('systemStatus.sdkError.authDetail')
    }
  }
  return {
    summary: `${sdk.lastErrorCode}: ${sdk.lastErrorMessage || t('systemStatus.sdkError.genericLabel')}${device}`,
    detail: sdk.lastErrorHint || ''
  }
}

export function SystemStatusPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const { startLoading, stopLoading, isLoading } = useLoading()
  const [status, setStatus] = useState<SystemStatusResponse | null>(null)
  const [sdkHealth, setSdkHealth] = useState<SdkHealthResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const authToken = token
  const localControlKey = (import.meta.env.VITE_LOCAL_CONTROL_KEY as string | undefined)?.trim()

  const loadStatus = useCallback(async (showLoading = false) => {
    if (!authToken) return
    if (showLoading) startLoading()
    try {
      const [systemResponse, sdkResponse] = await Promise.all([
        apiRequest<SystemStatusResponse>('/api/system/status', { token: authToken }),
        apiRequest<SdkHealthResponse>('/api/health/sdk'),
      ])
      setStatus(systemResponse)
      setSdkHealth(sdkResponse)
    } finally {
      if (showLoading) stopLoading()
    }
  }, [authToken, startLoading, stopLoading])

  useEffect(() => {
    let isDisposed = false
    let timer: number | null = null

      ; (async () => {
        try {
          await loadStatus(true)
        } catch (e) {
          if (!isDisposed) {
            setError(e instanceof Error ? e.message : t('systemStatus.errors.loadFailed'))
          }
        }
      })()

    timer = window.setInterval(() => {
      loadStatus(false).catch(() => undefined)
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
      setError(e instanceof Error ? e.message : t('systemStatus.errors.serviceFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }



  return (
    <AppLayout onAction={() => loadStatus(true)}>
      <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
        <div className="p-6 md:p-8 space-y-6">
          <PageHeader
            className="hidden md:flex"
            title={t('systemStatus.title')}
            description={t('systemStatus.description')}
            actions={
              <Button variant="outline" icon="sync" onClick={() => loadStatus(true)} isLoading={isLoading}>
                {t('systemStatus.syncDiagnostics')}
              </Button>
            }
          />

          {error && (
            <div className="p-4 bg-error-bg text-error-text rounded-2xl text-[10px] font-black uppercase tracking-widest border border-error-text/10 shadow-sm animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            </div>
          )}

          {actionMessage && (
            <div className="p-4 bg-primary/5 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest border border-primary/20 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">info</span>
                {actionMessage}
              </div>
            </div>
          )}

          {/* Main Node Card */}
          <div className="bg-surface rounded-3xl shadow-md overflow-hidden border-none text-text-light">
            <div className="px-6 py-5 border-b border-border-light flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">dns</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-dark leading-tight lowercase first-letter:uppercase">{t('systemStatus.masterController')}</h3>
                  <p className="text-[10px] font-bold text-text-light uppercase tracking-widest">{t('systemStatus.globalNodeStatus')}</p>
                </div>
              </div>
              <Badge variant={status?.serverStatus === 'Online' ? 'success' : 'error'} dot>
                {status?.serverStatus || t('systemStatus.offline')}
              </Badge>
            </div>

            <div className="p-6 space-y-6">
              {!status ? (
                <div className="py-12 text-center text-[10px] font-black text-text-light uppercase tracking-widest">{t('systemStatus.awaitingBroadcast')}</div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: t('systemStatus.metrics.latency'), value: status.dbLatencyMs ? `${status.dbLatencyMs.toFixed(1)}ms` : '—', icon: 'speed' },
                    { label: t('systemStatus.metrics.platform'), value: status.serviceState, icon: 'deployed_code' },
                    { label: t('systemStatus.metrics.database'), value: status.dbStatus, icon: 'database' },
                    { label: t('systemStatus.metrics.checkIn'), value: new Date(status.utc).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }), icon: 'schedule' },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-background-light rounded-2xl shadow-sm border-none">
                      <div className="flex items-center gap-2 mb-1 opacity-50">
                        <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                      </div>
                      <p className="text-xs font-bold text-text-dark truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <Button fullWidth size="sm" onClick={() => controlMainService('start')} isLoading={isSubmitting} icon="play_arrow">{t('systemStatus.actions.start')}</Button>
                <Button fullWidth size="sm" variant="outline" onClick={() => controlMainService('stop')} isLoading={isSubmitting} icon="stop">{t('systemStatus.actions.stop')}</Button>
                <Button fullWidth size="sm" variant="outline" onClick={() => controlMainService('restart')} isLoading={isSubmitting} icon="restart_alt">{t('systemStatus.actions.reset')}</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SDK Card */}
            <div className="bg-surface rounded-3xl shadow-md p-6 space-y-4 border-none text-text-light leading-none">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest">{t('systemStatus.sdkHealth.title')}</h3>
                <Badge variant={sdkHealth?.initialized ? 'primary' : 'error'}>{sdkHealth?.initialized ? t('systemStatus.sdkHealth.initialized') : t('systemStatus.sdkHealth.void')}</Badge>
              </div>

              {!sdkHealth ? (
                <div className="py-8 text-center text-xs italic text-text-light">{t('systemStatus.sdkHealth.synchronizing')}</div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-background-light rounded-xl hover:shadow-sm transition-shadow">
                    <span className="text-[10px] font-black text-text-light uppercase tracking-widest">{t('systemStatus.sdkHealth.activeLinks')}</span>
                    <span className="text-sm font-black text-primary">{t('systemStatus.sdkHealth.stationCount', { count: sdkHealth.connectedDevices })}</span>
                  </div>

                  <div className={`p-4 rounded-2xl shadow-sm ${sdkHealth.lastErrorCode ? 'bg-error-bg text-error-text' : 'bg-slate-50 text-text-dark'}`}>
                    {(() => {
                      const { summary, detail } = formatSdkError(sdkHealth, t)
                      return (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-base">emergency_home</span>
                            <p className="text-[10px] font-black uppercase tracking-widest">{summary}</p>
                          </div>
                          {detail && <p className="text-[10px] font-medium opacity-70 leading-snug pl-6">{detail}</p>}
                        </>
                      )
                    })()}
                  </div>
                </>
              )}
            </div>

            {/* Library Paths */}
            <div className="bg-surface rounded-3xl shadow-md p-6 space-y-4 border-none text-text-light">
              <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest">{t('systemStatus.runtimeBinaryPaths')}</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {sdkHealth?.librarySearchPaths.map((path, idx) => (
                  <code key={idx} className="block w-full text-[9px] font-mono bg-slate-50 px-2 py-1.5 rounded-lg truncate text-text-muted hover:shadow-sm transition-shadow">
                    {path}
                  </code>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
