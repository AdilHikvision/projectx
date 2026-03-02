import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/AppLayout'
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

        {/* Desktop Title & Subnav */}
        <div className="hidden md:block mb-8">
          <h3 className="text-2xl font-bold">Devices Dashboard</h3>
          <p className="text-muted mt-1">Manage and monitor your enterprise access control hardware fleet.</p>
          {error && (
            <div className="mt-4 p-4 bg-rose-50 text-rose-500 rounded-xl text-xs font-bold border border-rose-100 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {error}
            </div>
          )}
          {info && (
            <div className="mt-4 p-4 bg-blue-50 text-blue-500 rounded-xl text-xs font-bold border border-blue-100 max-h-40 overflow-y-auto">
              {info}
            </div>
          )}
        </div>

        {/* Tabs (Responsive Style) */}
        <div className="flex border-b border-gray-100 mb-6 md:mb-8 overflow-x-auto no-scrollbar gap-6 md:gap-8">
          <a href="#" className="pb-2.5 text-xs md:text-[12px] font-bold border-b-2 border-primary text-primary whitespace-nowrap">
            ALL DEVICES
          </a>
          <a href="#" className="pb-2.5 text-xs md:text-[12px] font-bold text-muted hover:text-dark border-b-2 border-transparent transition-colors whitespace-nowrap">
            CONTROLLERS
          </a>
          <a href="#" className="pb-2.5 text-xs md:text-[12px] font-bold text-muted hover:text-dark border-b-2 border-transparent transition-colors whitespace-nowrap">
            READERS
          </a>
          <a href="#" className="pb-2.5 text-xs md:text-[12px] font-bold text-muted hover:text-dark border-b-2 border-transparent transition-colors whitespace-nowrap">
            CAMERAS
          </a>
          {/* Mobile only 'Add Device' tab mimic */}
          <a href="#" className="md:hidden pb-2.5 text-xs font-bold text-muted whitespace-nowrap" onClick={(e) => { e.preventDefault(); handleDiscover(); }}>
            {isDiscovering ? 'Scanning...' : 'Add Device'}
          </a>
        </div>

        {/* Stats Grid (Mobile version at top) */}
        <div className="md:hidden grid grid-cols-2 gap-4 mb-8 bg-[#f9fafb] p-6 rounded-2xl border border-gray-100">
          <div>
            <p className="text-[10px] font-extrabold text-muted tracking-widest uppercase">TOTAL DEVICES</p>
            <p className="text-3xl font-bold mt-1">{devices.length}</p>
            <p className="text-[10px] font-bold text-green-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">trending_up</span> Stable
            </p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted tracking-widest uppercase">ONLINE</p>
            <p className="text-3xl font-bold mt-1 text-green-500 font-mono">{onlineCount}</p>
            <p className="text-[10px] font-bold text-muted mt-1">Active</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted tracking-widest uppercase">OFFLINE</p>
            <p className="text-3xl font-bold mt-1 text-rose-500 font-mono">{devices.length - onlineCount}</p>
            <p className="text-[10px] font-bold text-muted mt-1">Requires Action</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted tracking-widest uppercase">LAST ACTIVITY</p>
            <p className="text-3xl font-bold mt-1">Just now</p>
            <p className="text-[10px] font-bold text-muted mt-1">System sync</p>
          </div>
        </div>

        {/* Devices List/Table */}
        <div className="space-y-4 md:space-y-0">
          {/* Mobile View Controls */}
          <div className="md:hidden flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-dark uppercase tracking-wider">DEVICE DETAILS</h4>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-muted text-xl">search</span>
              <span className="material-symbols-outlined text-muted text-xl">filter_list</span>
            </div>
          </div>

          {/* Table (Desktop) / Cards (Mobile) */}
          <div className="bg-white md:border border-gray-200 rounded-2xl md:overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-6 px-6 py-4 bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-muted tracking-widest uppercase">
              <div className="col-span-2">NAME</div>
              <div>MODEL</div>
              <div>IP ADDRESS</div>
              <div>STATUS</div>
              <div>UPTIME</div>
              <div className="text-right">ACTIONS</div>
            </div>

            {/* Rows / Cards */}
            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-8 text-center text-muted">Loading devices...</div>
              ) : devices.length === 0 ? (
                <div className="p-8 text-center text-muted italic">No devices found.</div>
              ) : (
                devices.map((device) => (
                  <div key={device.id} className="md:grid grid-cols-6 items-center px-4 py-4 md:px-6 md:py-5 border border-gray-100 md:border-none rounded-2xl md:rounded-none mb-4 md:mb-0 hover:bg-gray-50/50 transition-colors">
                    <div className="col-span-2 flex items-center gap-4">
                      <div className="w-12 h-12 md:w-10 md:h-10 bg-gray-50 rounded-full md:rounded-lg flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined !fill-1">{device.deviceType === '1' ? 'hub' : 'videocam'}</span>
                      </div>
                      <div>
                        <p className="text-[15px] md:text-[13px] font-bold">{device.name}</p>
                        <p className="md:hidden text-[10px] font-bold text-muted mt-0.5 tracking-tight">
                          {device.deviceIdentifier} • LOCATION
                        </p>
                      </div>
                      <div className="md:hidden ml-auto">
                        <div className="flex flex-col items-end">
                          {device.status === 'Online' ? (
                            <>
                              <span className="text-[13px] font-bold text-primary">Active</span>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-10 h-1 bg-primary rounded-full"></div>
                                <span className="text-[10px] font-extrabold text-green-500 tracking-tighter">ONLINE</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-[13px] font-bold text-rose-500">Offline</span>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-10 h-1 bg-rose-500 rounded-full"></div>
                                <span className="text-[10px] font-extrabold text-rose-500 tracking-tighter uppercase">FLAGGED</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block text-[13px] font-medium text-dark">{device.deviceType === '1' ? 'UA-Hub' : 'G5-Camera'}</div>
                    <div className="hidden md:block text-[13px] font-medium text-muted">{device.ipAddress}</div>
                    <div className="hidden md:block">
                      <span className={`px-2 py-0.5 ${device.status === 'Online' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-500'} text-[10px] font-bold rounded tracking-tighter uppercase`}>
                        {device.status}
                      </span>
                    </div>
                    <div className="hidden md:block text-[13px] font-medium text-dark">{device.status === 'Online' ? 'Active' : '0s'}</div>
                    <div className="hidden md:flex justify-end gap-3 text-[11px] font-bold text-primary cursor-pointer hover:underline uppercase tracking-tighter" onClick={() => handleToggleConnection(device)}>
                      {device.status === 'Online' ? 'DISCONNECT' : 'RECONNECT'}
                    </div>
                    {/* Mobile row chevron */}
                    <div className="md:hidden absolute right-8 top-1/2 -translate-y-1/2" onClick={() => handleToggleConnection(device)}>
                      <span className="material-symbols-outlined text-muted text-lg">chevron_right</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Table Pagination (Desktop) */}
            <div className="hidden md:flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
              <p className="text-[11px] font-bold text-muted uppercase tracking-widest">SHOWING {devices.length} DEVICES</p>
              <div className="flex gap-1.5">
                <button className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-muted hover:border-primary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                <button className="w-7 h-7 flex items-center justify-center bg-primary text-white rounded text-[10px] font-bold">1</button>
                <button className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-muted hover:border-primary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats (Desktop Only) */}
        <div className="hidden md:grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-extrabold text-muted tracking-widest uppercase">SYSTEM LOAD</p>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-3xl font-bold">12%</p>
              <div className="w-2 h-2 rounded-full bg-blue-100"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-extrabold text-muted tracking-widest uppercase">DEVICES HEALTHY</p>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-3xl font-bold">{onlineCount} / {devices.length || 1}</p>
              <span className="text-xs font-bold text-green-500">
                {devices.length > 0 ? Math.round((onlineCount / devices.length) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-extrabold text-muted tracking-widest uppercase">LAST SYNC</p>
            <p className="text-3xl font-bold mt-2">Just now</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
