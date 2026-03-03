import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/AppLayout'
import { Card, Badge, Button, Avatar, PageHeader } from '../components/ui'
import { apiRequest, getApiBaseUrl } from '../lib/api'

type DeviceStatus = 'Online' | 'Offline'

interface Device {
  id: string
  deviceIdentifier: string
  name: string
  ipAddress: string
  port: number
  location?: string | null
  deviceType: string
  status: DeviceStatus
  lastSeenUtc?: string | null
}

interface DeviceStatusResponse {
  deviceId: string
  deviceIdentifier: string
  status: DeviceStatus
  lastSeenUtc?: string | null
}

interface DiscoveredDevice {
  deviceIdentifier: string
  name: string
  ipAddress: string
  port: number
  model?: string | null
}

function mergeStatus(device: Device, status?: DeviceStatusResponse): Device {
  if (!status) return device
  return {
    ...device,
    status: status.status,
    lastSeenUtc: status.lastSeenUtc ?? device.lastSeenUtc,
  }
}

export function DevicesPage() {
  const { token } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!token) return
    setError(null)
    try {
      const [devicesResult, statusesResult] = await Promise.all([
        apiRequest<Device[]>('/api/devices', { token }),
        apiRequest<DeviceStatusResponse[]>('/api/devices/statuses', { token }),
      ])
      const statusesById = new Map(statusesResult.map((s) => [s.deviceId, s]))
      setDevices(devicesResult.map((d) => mergeStatus(d, statusesById.get(d.id))))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load devices')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const fetchStatuses = useCallback(async () => {
    if (!token) return
    try {
      const statuses = await apiRequest<DeviceStatusResponse[]>('/api/devices/statuses', { token })
      const byDeviceId = new Map(statuses.map((s) => [s.deviceId, s]))
      setDevices((prev) => prev.map((d) => mergeStatus(d, byDeviceId.get(d.id))))
    } catch { /* ignore */ }
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!token) return
    let isDisposed = false
    let hub: HubConnection | null = null
    let pollTimer: number | null = null

    async function startConnection() {
      try {
        hub = new HubConnectionBuilder()
          .withUrl(`${getApiBaseUrl()}/hubs/devices`, { accessTokenFactory: () => token! })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Warning)
          .build()

        hub.on('DeviceStatusChanged', (payload: DeviceStatusResponse) => {
          setDevices((prev) => prev.map((d) => (d.id === payload.deviceId || d.deviceIdentifier === payload.deviceIdentifier ? mergeStatus(d, payload) : d)))
        })

        await hub.start()
      } catch { /* fallback */ }

      if (!isDisposed) {
        pollTimer = window.setInterval(fetchStatuses, 5000)
      }
    }

    startConnection()

    return () => {
      isDisposed = true
      if (pollTimer) window.clearInterval(pollTimer)
      if (hub) hub.stop()
    }
  }, [token, fetchStatuses])

  async function handleDiscover() {
    if (!token) return
    setIsDiscovering(true)
    setError(null)
    setInfo(null)
    try {
      const discovered = await apiRequest<DiscoveredDevice[]>('/api/devices/discover', { token })
      setInfo(discovered.length > 0 ? `Found ${discovered.length} devices.` : 'No devices found.')
      if (discovered.length > 0) await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Discovery failed')
    } finally {
      setIsDiscovering(false)
    }
  }

  async function handleToggleConnection(device: Device) {
    if (!token) return
    const action = device.status === 'Online' ? 'disconnect' : 'connect'
    setError(null)
    try {
      const updated = await apiRequest<Device>(`/api/devices/${device.id}/${action}`, { method: 'POST', token })
      setDevices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to change connection state')
    }
  }

  const onlineCount = devices.filter(d => d.status === 'Online').length

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">

        {/* Unified Page Header */}
        <PageHeader
          title="Devices Dashboard"
          description="Manage and monitor your enterprise access control hardware fleet."
          actions={
            <>
              <Button variant="outline" size="sm" icon="sync" onClick={loadData} isLoading={isLoading}>Refresh</Button>
              <Button size="sm" icon="add" onClick={handleDiscover} isLoading={isDiscovering}>
                {isDiscovering ? 'Scanning...' : 'Add Device'}
              </Button>
            </>
          }
        />

        {error && (
          <div className="p-4 bg-error-bg text-error-text rounded-xl text-xs font-bold border border-error-text/10 max-h-40 overflow-y-auto whitespace-pre-wrap">
            {error}
          </div>
        )}
        {info && (
          <div className="p-4 bg-primary/5 text-primary rounded-xl text-xs font-bold border border-primary/20 max-h-40 overflow-y-auto">
            {info}
          </div>
        )}

        {/* Tabs (Responsive Style) */}
        <div className="flex border-b border-border-light overflow-x-auto no-scrollbar gap-8">
          <button className="pb-2.5 text-xs font-black border-b-2 border-primary text-primary whitespace-nowrap uppercase tracking-widest">
            All Devices
          </button>
          <button className="pb-2.5 text-xs font-bold text-text-muted hover:text-text-dark border-b-2 border-transparent transition-colors whitespace-nowrap uppercase tracking-widest">
            Controllers
          </button>
          <button className="pb-2.5 text-xs font-bold text-text-muted hover:text-text-dark border-b-2 border-transparent transition-colors whitespace-nowrap uppercase tracking-widest">
            Readers
          </button>
          <button className="pb-2.5 text-xs font-bold text-text-muted hover:text-text-dark border-b-2 border-transparent transition-colors whitespace-nowrap uppercase tracking-widest">
            Cameras
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="flex flex-col gap-2 transition-all hover:border-primary/20">
            <p className="text-xs font-black text-text-muted tracking-widest uppercase">Total Fleet</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-text-dark">{devices.length}</p>
              <span className="text-xs font-bold text-success-text flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">check_circle</span> stable
              </span>
            </div>
          </Card>
          <Card className="flex flex-col gap-2 transition-all hover:border-primary/20">
            <p className="text-xs font-black text-text-muted tracking-widest uppercase">Operational</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-success-text">{onlineCount}</p>
              <span className="text-xs font-bold text-text-muted">Active Node</span>
            </div>
          </Card>
          <Card className="flex flex-col gap-2 transition-all hover:border-primary/20">
            <p className="text-xs font-black text-text-muted tracking-widest uppercase">Fault Events</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-error-text">{devices.length - onlineCount}</p>
              <span className="text-xs font-bold text-text-muted">Requires Sync</span>
            </div>
          </Card>
          <Card className="flex flex-col gap-2 transition-all hover:border-primary/20">
            <p className="text-xs font-black text-text-muted tracking-widest uppercase">Status Sync</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-text-dark">99.8<span className="text-sm">%</span></p>
              <span className="text-xs font-bold text-text-muted">Uptime Score</span>
            </div>
          </Card>
        </div>

        {/* Devices List/Table */}
        <Card noPadding className="overflow-hidden">
          <div className="hidden md:grid grid-cols-6 px-8 py-4 bg-slate-75 border-b border-border-base text-xs font-black text-text-muted tracking-widest uppercase">
            <div className="col-span-2">Identity & Label</div>
            <div>Hardware Profile</div>
            <div>Network Node</div>
            <div>Operational State</div>
            <div className="text-right">Controls</div>
          </div>

          <div className="divide-y divide-border-light">
            {isLoading ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                <p className="mt-4 text-xs font-bold text-text-muted uppercase tracking-widest">Querying device manifest...</p>
              </div>
            ) : devices.length === 0 ? (
              <div className="p-12 text-center text-text-muted italic text-sm">No hardware nodes registered. Run discovery to populate fleet.</div>
            ) : (
              devices.map((device) => (
                <div key={device.id} className="flex flex-col md:grid grid-cols-6 items-center px-6 py-5 md:px-8 hover:bg-slate-75/50 transition-colors relative group">
                  <div className="col-span-2 flex items-center gap-4">
                    <Avatar icon={device.deviceType === '1' ? 'hub' : 'videocam'} variant="primary" size="lg" className="!rounded-xl shadow-sm" />
                    <div>
                      <p className="text-base font-black text-text-dark group-hover:text-primary transition-colors">{device.name}</p>
                      <p className="text-xs font-bold text-text-muted mt-0.5 tracking-tight uppercase">
                        {device.deviceIdentifier} • {device.location || 'SECURE ZONE'}
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:block text-sm font-bold text-text-dark">{device.deviceType === '1' ? 'UA-Hub Gen2' : 'G5-Enterprise'}</div>
                  <div className="hidden md:block">
                    <code className="text-xs bg-slate-75 text-text-muted px-2 py-0.5 rounded font-bold border border-border-base">{device.ipAddress}</code>
                  </div>
                  <div className="flex items-center gap-6 md:block">
                    <Badge dot variant={device.status === 'Online' ? 'success' : 'error'}>
                      {device.status}
                    </Badge>
                    <span className="md:hidden text-xs font-bold text-text-muted uppercase tracking-widest">{device.status === 'Online' ? 'Active 12d' : 'Offline'}</span>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 md:mt-0">
                    <Button variant="outline" size="sm" className="font-black text-[10px] tracking-widest" onClick={() => handleToggleConnection(device)}>
                      {device.status === 'Online' ? 'DROP' : 'START'}
                    </Button>
                    <Button variant="ghost" size="icon" icon="settings" className="text-text-muted hover:text-text-dark" />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-8 py-4 border-t border-border-base bg-slate-75 flex items-center justify-between">
            <p className="text-xs font-black text-text-muted uppercase tracking-widest">Sync cycle active • {devices.length} nodes indexed</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon="chevron_left" className="h-7 w-7 p-0" />
              <Button variant="outline" size="sm" icon="chevron_right" className="h-7 w-7 p-0" />
            </div>
          </div>
        </Card>

        {/* Bottom Metrics (Desktop) */}
        <div className="hidden lg:grid grid-cols-3 gap-8 mt-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <span className="material-symbols-outlined text-2xl">sensors</span>
            </div>
            <div>
              <p className="text-xs font-black text-text-dark uppercase tracking-wider">Controller Load</p>
              <div className="w-32 h-1.5 bg-slate-75 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 border-x border-border-base px-8">
            <div className="p-3 bg-success-bg rounded-xl text-success-text">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div>
              <p className="text-xs font-black text-text-dark uppercase tracking-wider">Credential Auth</p>
              <p className="text-sm font-bold text-success-text">99.9% Success Rate</p>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-end">
            <div className="text-right">
              <p className="text-xs font-black text-text-dark uppercase tracking-wider">Audit Log Status</p>
              <p className="text-sm font-bold text-text-muted">Writing to DB Node 4...</p>
            </div>
            <div className="p-3 bg-slate-75 rounded-xl text-text-muted">
              <span className="material-symbols-outlined text-2xl">history</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
