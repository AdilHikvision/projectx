import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr'
import { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Badge, Button, Input } from '../components/atoms'
import { PageHeader, Modal } from '../components/organisms'
import { useLoading } from '../context/LoadingContext'
import { apiRequest, getHubUrl } from '../lib/api'

type DeviceStatus = 'Online' | 'Offline'

const DEVICE_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'AccessController', label: 'Access Controllers' },
  { value: 'Intercom', label: 'Intercoms' },
  { value: 'ElevatorController', label: 'Elevators' },
] as const

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
  username?: string | null
  statusMessage?: string | null
  macAddress?: string | null
}

interface DeviceStatusResponse {
  deviceId: string
  deviceIdentifier: string
  status: DeviceStatus
  lastSeenUtc?: string | null
  statusMessage?: string | null
}

interface DiscoveredDevice {
  deviceIdentifier: string
  name: string
  ipAddress: string
  port: number
  model?: string | null
  deviceType?: string | null
  macAddress?: string | null
  firmwareVersion?: string | null
  isActivated?: boolean | null
}

interface DeviceFormData {
  deviceIdentifier: string
  name: string
  ipAddress: string
  port: number
  location: string
  deviceType: number
  username: string
  password: string
}

const emptyForm: DeviceFormData = {
  deviceIdentifier: '',
  name: '',
  ipAddress: '',
  port: 8000,
  location: '',
  deviceType: 1,
  username: 'admin',
  password: '',
}

function mergeStatus(device: Device, status?: DeviceStatusResponse): Device {
  if (!status) return device
  return {
    ...device,
    status: status.status,
    lastSeenUtc: status.lastSeenUtc ?? device.lastSeenUtc,
    statusMessage: status.statusMessage ?? device.statusMessage,
  }
}

function applyStatusUpdate(
  device: Device,
  status: DeviceStatusResponse | undefined
): Device {
  if (!status) return device
  return {
    ...device,
    status: status.status,
    lastSeenUtc: status.lastSeenUtc ?? device.lastSeenUtc,
    statusMessage: status.statusMessage ?? device.statusMessage,
  }
}

function getDeviceIcon(deviceType: string): string {
  if (deviceType === 'AccessController') return 'hub'
  if (deviceType === 'Intercom') return 'videocam'
  if (deviceType === 'ElevatorController') return 'elevator'
  if (deviceType === 'EnrollerStation') return 'how_to_reg'
  return 'devices'
}

function getDeviceTypeLabel(deviceType: string): string {
  if (deviceType === 'AccessController') return 'Access Controller'
  if (deviceType === 'Intercom') return 'Intercom'
  if (deviceType === 'AttendanceTerminal') return 'Attendance Terminal'
  if (deviceType === 'ElevatorController') return 'Elevator Controller'
  if (deviceType === 'EnrollerStation') return 'Enroller station'
  return deviceType
}

function deviceTypeStringToNumber(deviceType: string | null | undefined): number {
  switch (deviceType) {
    case 'AccessController':
      return 1
    case 'Intercom':
      return 2
    case 'AttendanceTerminal':
      return 3
    case 'ElevatorController':
      return 4
    case 'EnrollerStation':
      return 5
    default:
      return 1
  }
}

const DISCOVER_TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'camera', label: 'Cameras' },
  { value: 'access', label: 'Access Control' },
  { value: 'intercom', label: 'Intercoms' },
  { value: 'nvr', label: 'NVR' },
  { value: 'switch', label: 'Switches' },
  { value: 'other', label: 'Other' },
] as const

function inferDeviceTypeFromModel(model: string | null | undefined, serial?: string | null): string {
  const src = (model || serial || '').toUpperCase()
  if (!src) return 'other'
  if (src.startsWith('DS-2CD') || src.startsWith('DS-2DE') || src.startsWith('DS-2PT')) return 'camera'
  if (src.startsWith('DS-K') || src.startsWith('DS-KD') || src.startsWith('DS-KH')) return 'access'
  if (src.startsWith('CS-H') || src.startsWith('DS-2TD')) return 'intercom'
  if (src.startsWith('DS-77') || src.startsWith('IDS-72') || src.startsWith('DS-96') || src.startsWith('IDS-')) return 'nvr'
  if (src.startsWith('DS-3E')) return 'switch'
  return 'other'
}

export const DevicesTab = forwardRef((_props, ref) => {
  const { token } = useAuth()
  const { startLoading, stopLoading, isLoading } = useLoading()

  const [devices, setDevices] = useState<Device[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'discover' | 'delete' | 'activate' | null>(null)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null)
  const [activatingDevice, setActivatingDevice] = useState<(DiscoveredDevice & { inferredType: string; isActive: boolean }) | null>(null)
  const [activatePassword, setActivatePassword] = useState('')
  const [activateConfirm, setActivateConfirm] = useState('')
  const [activateError, setActivateError] = useState<string | null>(null)
  const [discovered, setDiscovered] = useState<DiscoveredDevice[]>([])
  const [discoverTypeTab, setDiscoverTypeTab] = useState<string>('all')
  const [discoverIpSort, setDiscoverIpSort] = useState<'asc' | 'desc'>('asc')
  const [showAddedDevices, setShowAddedDevices] = useState(false)
  const [formData, setFormData] = useState<DeviceFormData>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addFromDevice, setAddFromDevice] = useState<DiscoveredDevice | null>(null)
  const [addDeviceName, setAddDeviceName] = useState('')
  const [addDeviceUsername, setAddDeviceUsername] = useState('admin')
  const [addDevicePassword, setAddDevicePassword] = useState('')
  const [discoverSearchQuery, setDiscoverSearchQuery] = useState('')
  const [networkWarningMessage, setNetworkWarningMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!token) return
    setError(null)
    startLoading()
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
      stopLoading()
    }
  }, [token, startLoading, stopLoading])

  const fetchStatuses = useCallback(async () => {
    if (!token) return
    try {
      const statuses = await apiRequest<DeviceStatusResponse[]>('/api/devices/statuses', { token })
      const byId = new Map(statuses.map((s) => [s.deviceId, s]))
      const byIdent = new Map(statuses.map((s) => [s.deviceIdentifier, s]))
      setDevices((prev) => prev.map((d) => {
        const s = byId.get(d.id) || byIdent.get(d.deviceIdentifier)
        return applyStatusUpdate(d, s)
      }))
    } catch { /* ignore */ }
  }, [token])

  const fetchStatusesRef = useRef(fetchStatuses)
  fetchStatusesRef.current = fetchStatuses
  const hubRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (modalMode === 'discover') {
      setDiscoverTypeTab('all')
      setDiscoverIpSort('asc')
      setDiscoverSearchQuery('')
    }
  }, [modalMode])

  useEffect(() => {
    if (!token) return
    let isDisposed = false
    let hub: HubConnection | null = null
    let pollTimer: number | null = null

    async function startConnection() {
      try {
        hub = new HubConnectionBuilder()
          .withUrl(`${getHubUrl()}/hubs/devices`, {
            accessTokenFactory: () => token!,
            skipNegotiation: true,
            transport: HttpTransportType.WebSockets,
          })
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) =>
              Math.min(1000 * 2 ** retryContext.previousRetryCount, 30000),
          })
          .configureLogging(LogLevel.Error)
          .build()

        hub.onreconnecting(() => {
          setInfo('Reconnecting to server...')
        })
        hub.onreconnected(() => {
          setInfo(null)
          fetchStatusesRef.current()
        })
        hub.onclose((err) => {
          if (err) setInfo('Connection lost. Refreshing status via polling.')
        })

        hub.on('DeviceStatusChanged', (payload: DeviceStatusResponse) => {
          setDevices((prev) =>
            prev.map((d) =>
              d.id === payload.deviceId || d.deviceIdentifier === payload.deviceIdentifier
                ? applyStatusUpdate(d, payload)
                : d
            )
          )
        })

        hub.on('DeviceFound', (device: DiscoveredDevice) => {
          setDiscovered((prev) => {
            const key = `${device.ipAddress}:${device.port}`
            const idx = prev.findIndex((x) => `${x.ipAddress}:${x.port}` === key)
            const next = { ...device }
            if (idx >= 0) return prev.map((x, i) => (i === idx ? next : x))
            return [...prev, next]
          })
        })

        hub.on('DiscoveryComplete', (count: number) => {
          setIsDiscovering(false)
          setInfo(count > 0 ? `Found ${count} devices.` : 'No devices found.')
        })

        await hub.start()
        hubRef.current = hub
      } catch { /* fallback */ }

      if (!isDisposed) {
        pollTimer = window.setInterval(() => fetchStatusesRef.current(), 3000)
      }
    }

    startConnection()

    return () => {
      isDisposed = true
      hubRef.current = null
      if (pollTimer) window.clearInterval(pollTimer)
      hub?.stop().catch(() => { /* ignore — cleanup */ })
    }
  }, [token])

  const filteredDevices = useMemo(() => {
    let result = devices

    if (typeFilter !== 'all') {
      result = result.filter((d) => d.deviceType === typeFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim().replace(/\s+/g, ' ')
      const terms = q.split(' ').filter(Boolean)
      result = result.filter((d) => {
        const name = (d.name ?? '').toLowerCase()
        const identifier = (d.deviceIdentifier ?? '').toLowerCase()
        const ip = (d.ipAddress ?? '').toLowerCase()
        const location = (d.location ?? '').toLowerCase()
        const typeLabel = getDeviceTypeLabel(d.deviceType ?? '').toLowerCase()
        const portStr = String(d.port ?? '')
        const searchable = `${name} ${identifier} ${ip} ${location} ${typeLabel} ${portStr}`
        return terms.every((term) => searchable.includes(term))
      })
    }

    return result
  }, [devices, typeFilter, searchQuery])

  function openDiscoverModal() {
    setError(null)
    setInfo(null)
    setModalMode('discover')
  }

  async function startDiscovery() {
    if (!token) return
    setDiscovered([])
    setIsDiscovering(true)
    setError(null)

    const hub = hubRef.current
    if (hub?.state !== 'Connected') {
      setError('Realtime connection not ready. Wait a moment and try again.')
      setIsDiscovering(false)
      return
    }

    try {
      await hub.invoke('StartDiscovery')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Discovery failed')
      setIsDiscovering(false)
    }
  }

  async function handleDiscover() {
    openDiscoverModal()
    await startDiscovery()
  }

  async function handleDiscoverRefresh() {
    await startDiscovery()
  }

  const openCreateModal = useCallback(() => {
    setFormData(emptyForm)
    setModalMode('create')
  }, [])

  useImperativeHandle(ref, () => ({
    triggerAction: openCreateModal
  }))

  function openEditModal(device: Device) {
    setEditingDevice(device)
    setFormData({
      deviceIdentifier: device.deviceIdentifier,
      name: device.name,
      ipAddress: device.ipAddress,
      port: device.port,
      location: device.location ?? '',
      deviceType: deviceTypeStringToNumber(device.deviceType),
      username: device.username ?? 'admin',
      password: '',
    })
    setModalMode('edit')
  }

  function openDeleteModal(device: Device) {
    setDeletingDevice(device)
    setModalMode('delete')
  }

  function closeModals() {
    setModalMode(null)
    setEditingDevice(null)
    setDeletingDevice(null)
    setActivatingDevice(null)
    setActivatePassword('')
    setActivateConfirm('')
    setDiscovered([])
    closeAddFromDiscoveredModal()
  }

  function closeActivateModal() {
    setModalMode('discover')
    setActivatingDevice(null)
    setActivatePassword('')
    setActivateConfirm('')
    setActivateError(null)
  }

  async function openActivateModal(d: DiscoveredDevice & { inferredType: string; isActive: boolean }) {
    try {
      const res = await apiRequest<{ inSameSubnet: boolean; message?: string }>(
        `/api/devices/check-network?ipAddress=${encodeURIComponent(d.ipAddress)}`,
        { token: token ?? undefined }
      )
      if (!res.inSameSubnet && res.message) {
        setNetworkWarningMessage(res.message)
        return
      }
    } catch {
      // On API error allow to continue
    }
    setActivatingDevice(d)
    setActivatePassword('')
    setActivateConfirm('')
    setActivateError(null)
    setModalMode('activate')
  }

  async function handleCreate() {
    if (!token) return
    setIsSubmitting(true)
    setError(null)
    try {
      const created = await apiRequest<Device>('/api/devices', {
        method: 'POST',
        token,
        body: JSON.stringify({
          deviceIdentifier: `${formData.ipAddress.trim()}:${formData.port}`,
          name: formData.name.trim(),
          ipAddress: formData.ipAddress.trim(),
          port: formData.port,
          location: formData.location.trim() || null,
          deviceType: formData.deviceType,
          username: formData.username.trim() || null,
          password: formData.password || null,
        }),
      })
      setDevices((prev) => [...prev, { ...created, status: 'Offline' }])
      closeModals()
      fetchStatusesRef.current()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create device')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate() {
    if (!token || !editingDevice) return
    setIsSubmitting(true)
    setError(null)
    try {
      const updated = await apiRequest<Device>(`/api/devices/${editingDevice.id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          deviceIdentifier: formData.deviceIdentifier.trim(),
          name: formData.name.trim(),
          ipAddress: formData.ipAddress.trim(),
          port: formData.port,
          location: formData.location.trim() || null,
          deviceType: formData.deviceType,
          username: formData.username.trim() || null,
          password: formData.password || null,
        }),
      })
      setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
      closeModals()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update device')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!token || !deletingDevice) return
    setIsSubmitting(true)
    setError(null)
    try {
      await apiRequest(`/api/devices/${deletingDevice.id}`, { method: 'DELETE', token })
      setDevices((prev) => prev.filter((d) => d.id !== deletingDevice.id))
      closeModals()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete device')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleActivate() {
    if (!activatingDevice || !activatingDevice.macAddress) {
      setError('Device MAC address is required for activation.')
      return
    }
    if (activatePassword !== activateConfirm) {
      setError('Passwords do not match.')
      return
    }
    if (activatePassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    setActivateError(null)
    try {
      await apiRequest('/api/devices/activate', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          ipAddress: activatingDevice.ipAddress,
          port: activatingDevice.port,
          macAddress: activatingDevice.macAddress,
          password: activatePassword,
        }),
      })
      setInfo(`Device ${activatingDevice.ipAddress} activated. Initiating re-scan...`)
      closeActivateModal()
      await startDiscovery()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Activation failed'
      setActivateError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function openAddFromDiscoveredModal(d: DiscoveredDevice) {
    try {
      const res = await apiRequest<{ inSameSubnet: boolean; message?: string }>(
        `/api/devices/check-network?ipAddress=${encodeURIComponent(d.ipAddress)}`,
        { token: token ?? undefined }
      )
      if (!res.inSameSubnet && res.message) {
        setNetworkWarningMessage(res.message)
        return
      }
    } catch {
      // On API error allow to continue
    }
    setAddFromDevice(d)
    setAddDeviceName(d.ipAddress)
    setAddDeviceUsername('admin')
    setAddDevicePassword('')
  }

  function closeAddFromDiscoveredModal() {
    setAddFromDevice(null)
    setAddDeviceName('')
    setAddDeviceUsername('admin')
    setAddDevicePassword('')
  }

  async function handleAddFromDiscoveredSubmit() {
    if (!token || !addFromDevice) return
    if (!addDeviceName.trim()) {
      setError('Please enter a device name')
      return
    }
    if (!addDevicePassword) {
      setError('Please enter the device password (same as used during activation)')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const created = await apiRequest<Device>('/api/devices', {
        method: 'POST',
        token,
        body: JSON.stringify({
          deviceIdentifier: addFromDevice.deviceIdentifier,
          name: addDeviceName.trim(),
          ipAddress: addFromDevice.ipAddress,
          port: addFromDevice.port,
          location: null,
          deviceType: 1,
          username: addDeviceUsername.trim() || null,
          password: addDevicePassword || null,
        }),
      })
      const deviceWithStatus: Device = {
        ...created,
        status: 'Offline',
      }
      setDevices((prev) => [...prev, deviceWithStatus])
      setDiscovered((prev) => prev.filter((x) => x.deviceIdentifier !== addFromDevice.deviceIdentifier))
      fetchStatusesRef.current()
      setInfo(`Device "${addDeviceName.trim()}" added.`)
      closeAddFromDiscoveredModal()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add device')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onlineCount = devices.filter((d) => d.status === 'Online').length
  const canCreateOrUpdate = formData.name.trim() && formData.ipAddress.trim() && formData.port > 0

  return (
    <div className="space-y-6">
      <PageHeader
        className="hidden md:flex"
        title="Devices Fleet"
        description="Manage and monitor your enterprise access control hardware fleet."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="md" icon="sync" onClick={loadData} isLoading={isLoading}>
              Refresh
            </Button>
            <Button variant="outline" size="md" icon="search" onClick={handleDiscover}>
              Discover
            </Button>
            <Button size="md" icon="add" onClick={openCreateModal}>
              Add Manually
            </Button>
          </div>
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

      {/* Mobile Quick Actions */}
      <div className="flex md:hidden gap-2">
        <Button fullWidth variant="outline" size="sm" icon="sync" onClick={loadData} isLoading={isLoading}>Refresh</Button>
        <Button fullWidth variant="outline" size="sm" icon="search" onClick={handleDiscover}>Discover</Button>
      </div>

      {/* Stats Tier */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:grid-cols-6">
        <div className="bg-surface p-4 rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
          <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Total</p>
          <p className="text-2xl font-black text-primary leading-none">{devices.length}</p>
        </div>
        <div className="bg-surface p-4 rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
          <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Online</p>
          <p className="text-2xl font-black text-emerald-500 leading-none">{onlineCount}</p>
        </div>
        <div className="bg-surface p-4 rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
          <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Offline</p>
          <p className="text-2xl font-black text-error-text leading-none">{devices.length - onlineCount}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon="search"
            className="bg-white border-divider-light shadow-sm-bottom"
          />
        </div>
        <div className="flex overflow-x-auto no-scrollbar gap-8 border-b border-divider-light md:border-none">
          {DEVICE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`pb-2.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${typeFilter === t.value ? 'border-primary text-primary' : 'border-transparent text-text-light'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Layout */}
      <div className="space-y-3">
        {filteredDevices.length === 0 ? (
          <div className="py-20 text-center bg-surface rounded-2xl shadow-md">
            <span className="material-symbols-outlined text-text-light text-5xl mb-3">router</span>
            <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No devices found</p>
          </div>
        ) : (
          filteredDevices.map((device) => (
            <div
              key={device.id}
              onClick={() => openEditModal(device)}
              className="flex items-center justify-between p-4 bg-surface rounded-2xl shadow-md hover:shadow-xl active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-2xl text-primary shadow-inner">
                  <span className="material-symbols-outlined text-2xl">{getDeviceIcon(device.deviceType)}</span>
                </div>
                <div>
                  <h4 className="text-base font-black text-text-dark leading-tight">{device.name}</h4>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[10px] font-bold text-text-light uppercase tracking-widest">
                      {device.ipAddress}:{device.port} • {getDeviceTypeLabel(device.deviceType)}
                    </p>
                    <div className="flex gap-3 text-[9px] font-bold text-text-muted/60 uppercase tracking-tight">
                      <span>SN: {device.deviceIdentifier}</span>
                      {device.macAddress && <span>MAC: {device.macAddress}</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant={device.status === 'Online' ? 'success' : 'error'}
                  dot
                  title={device.status === 'Offline' ? (device.statusMessage || 'Connection lost / Timeout') : undefined}
                >
                  {device.status}
                </Badge>
                <span className="material-symbols-outlined text-text-light group-hover:text-text-muted transition-colors">chevron_right</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={closeModals}
        title={modalMode === 'create' ? 'Add Access Device' : 'Device Configuration'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Label / Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Main Entrance Controller"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">IP Address</label>
              <Input
                value={formData.ipAddress}
                onChange={(e) => setFormData((p) => ({ ...p, ipAddress: e.target.value }))}
                placeholder="192.168.1.50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Service Port</label>
              <Input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData((p) => ({ ...p, port: parseInt(e.target.value, 10) || 8000 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Physical Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                placeholder="e.g. 1st Floor Lobby"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Device type</label>
            <select
              value={formData.deviceType}
              onChange={(e) => setFormData((p) => ({ ...p, deviceType: parseInt(e.target.value, 10) }))}
              className="w-full h-9 px-3 bg-slate-75 border border-border-base rounded-md text-xs outline-none"
            >
              <option value={1}>Access Controller</option>
              <option value={2}>Intercom</option>
              <option value={3}>Attendance Terminal</option>
              <option value={4}>Elevator Controller</option>
              <option value={5}>Enroller station</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Username</label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Secret Key / Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button fullWidth onClick={modalMode === 'create' ? handleCreate : handleUpdate} isLoading={isSubmitting} disabled={!canCreateOrUpdate || isSubmitting}>
              {modalMode === 'create' ? 'Register Device' : 'Save Changes'}
            </Button>
            <Button fullWidth variant="outline" onClick={closeModals}>Cancel</Button>
          </div>

          {modalMode === 'edit' && (
            <div className="pt-4 border-t border-divider-light">
              <Button fullWidth variant="danger" icon="delete" onClick={() => openDeleteModal(editingDevice!)}>Remove Device</Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Discover Modal */}
      <Modal
        isOpen={modalMode === 'discover' || modalMode === 'activate'}
        onClose={closeModals}
        title="Network Discovery"
        fullScreen
        className="bg-background-light"
      >
        <div className="h-full flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest min-w-[100px]">
                {isDiscovering ? 'Scanning...' : `Found (${discovered.length})`}
              </p>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAddedDevices}
                  onChange={(e) => setShowAddedDevices(e.target.checked)}
                  className="w-4 h-4 rounded border-divider-light text-primary focus:ring-primary/20 transition-all"
                />
                <span className="text-[10px] font-black text-text-light uppercase tracking-widest">Show Registered</span>
              </label>
            </div>
            <div className="flex-1 max-w-md relative">
              <Input
                size="sm"
                placeholder="Search by IP, Serial, or Model..."
                value={discoverSearchQuery}
                onChange={(e) => setDiscoverSearchQuery(e.target.value)}
                icon="search"
                className="bg-white border-divider-light"
              />
            </div>
            <Button size="sm" variant="outline" icon="sync" onClick={handleDiscoverRefresh} isLoading={isDiscovering}>
              {isDiscovering ? 'Scanning' : 'Rescan'}
            </Button>
          </div>

          {/* Discovery Filter Tabs */}
          <div className="flex overflow-x-auto no-scrollbar gap-6 border-b border-divider-light">
            {DISCOVER_TYPE_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setDiscoverTypeTab(t.value)}
                className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${discoverTypeTab === t.value ? 'border-primary text-primary' : 'border-transparent text-text-light'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pb-4">
            {(() => {
              const addedKeys = new Set(devices.flatMap((dev) => [dev.deviceIdentifier, `${dev.ipAddress}:${dev.port}`]))
              const isAdded = (d: { deviceIdentifier: string; ipAddress: string; port: number }) =>
                addedKeys.has(d.deviceIdentifier) || addedKeys.has(`${d.ipAddress}:${d.port}`)

              const filtered = discovered
                .map((d) => ({
                  ...d,
                  inferredType: inferDeviceTypeFromModel(d.model, d.deviceIdentifier),
                  isActive: d.isActivated ?? !!(d.macAddress && d.firmwareVersion),
                }))
                .filter((d) => showAddedDevices || !isAdded(d))
                .filter((d) => discoverTypeTab === 'all' || d.inferredType === discoverTypeTab)
                .filter((d) => {
                  if (!discoverSearchQuery.trim()) return true
                  const q = discoverSearchQuery.toLowerCase().trim()
                  const searchable = `${d.ipAddress} ${d.deviceIdentifier} ${d.model || ''} ${d.macAddress || ''}`.toLowerCase()
                  return searchable.includes(q)
                })
                .sort((a, b) => {
                  const cmp = a.ipAddress.localeCompare(b.ipAddress)
                  return discoverIpSort === 'asc' ? cmp : -cmp
                })

              if (filtered.length === 0) {
                return (
                  <div className="py-20 text-center">
                    <span className="material-symbols-outlined text-4xl text-text-light mb-2">radar</span>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">No matching devices</p>
                  </div>
                )
              }

              return filtered.map((d) => {
                const added = isAdded(d)
                return (
                  <div
                    key={d.deviceIdentifier}
                    className={`p-4 rounded-2xl border-none transition-all duration-300 ${added
                      ? 'bg-emerald-50 shadow-sm opacity-80'
                      : 'bg-surface shadow-md hover:shadow-xl hover:-translate-y-0.5 cursor-pointer'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-text-dark leading-none">{d.model || 'Unknown Model'}</p>
                          {added ? (
                            <Badge variant="success" className="text-[8px] px-1.5 py-0">Added</Badge>
                          ) : (
                            <Badge variant={d.isActive ? 'neutral' : 'error'} className="text-[8px] px-1.5 py-0">{d.isActive ? 'Activated' : 'Inactive'}</Badge>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{d.ipAddress}:{d.port}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <div className="flex items-center gap-1.5 opacity-60">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider">MAC: {d.macAddress || 'NO MAC'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-60">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider">SN: {d.deviceIdentifier}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      {added ? null : d.isActive ? (
                        <Button className="w-full md:w-fit md:px-6" size="sm" icon="add" onClick={() => openAddFromDiscoveredModal(d)}>Add Device</Button>
                      ) : (
                        <Button className="w-full md:w-fit md:px-6" variant="outline" icon="lock_open" onClick={() => openActivateModal(d)}>Activate</Button>
                      )}
                    </div>
                  </div>
                )
              })
            })()}
          </div>

          <div className="flex justify-end">
            <Button className="w-full md:w-fit md:px-12" variant="outline" onClick={closeModals}>Close Explorer</Button>
          </div>
        </div>
      </Modal>

      {/* Activation Sub-Modal */}
      <Modal isOpen={modalMode === 'activate'} onClose={closeActivateModal} title="Security Activation">
        <div className="space-y-4 p-2">
          <p className="text-[10px] font-black text-text-light uppercase tracking-widest">Set activation password for {activatingDevice?.ipAddress}</p>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl shadow-inner border-none">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2 px-1">New Password (Min 8)</label>
              <Input type="password" value={activatePassword} onChange={e => setActivatePassword(e.target.value)} placeholder="Minimum 8 characters" className="bg-white" />
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl shadow-inner border-none">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2 px-1">Confirm Identity</label>
              <Input type="password" value={activateConfirm} onChange={e => setActivateConfirm(e.target.value)} placeholder="Repeat password" className="bg-white" />
            </div>
          </div>
          {activateError && <div className="p-3 bg-error-bg text-error-text rounded-xl text-xs font-bold border border-error-text/10">{activateError}</div>}
          <div className="flex gap-2 pt-4">
            <Button fullWidth onClick={handleActivate} isLoading={isSubmitting} disabled={activatePassword.length < 8 || activatePassword !== activateConfirm || isSubmitting}>Activate</Button>
            <Button fullWidth variant="outline" onClick={closeActivateModal}>Abort</Button>
          </div>
        </div>
      </Modal>

      {/* Add from Discovery Shortcut Modal */}
      <Modal isOpen={!!addFromDevice} onClose={closeAddFromDiscoveredModal} title="Register Discovered">
        <div className="space-y-4">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Add {addFromDevice?.ipAddress} to fleet</p>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Friendly Name</label>
              <Input value={addDeviceName} onChange={e => setAddDeviceName(e.target.value)} placeholder="e.g. Back Door Intercom" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Credentials (Username)</label>
              <Input value={addDeviceUsername} onChange={e => setAddDeviceUsername(e.target.value)} placeholder="admin" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Secret Key / Password</label>
              <Input type="password" value={addDevicePassword} onChange={e => setAddDevicePassword(e.target.value)} placeholder="Required" />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button fullWidth onClick={handleAddFromDiscoveredSubmit} isLoading={isSubmitting} disabled={!addDeviceName || !addDevicePassword || isSubmitting}>Add Device</Button>
            <Button fullWidth variant="outline" onClick={closeAddFromDiscoveredModal}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Network warning dialog */}
      <Modal
        isOpen={!!networkWarningMessage}
        onClose={() => setNetworkWarningMessage(null)}
        title="Network Configuration Alert"
      >
        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-2">
            <span className="material-symbols-outlined text-2xl">router</span>
          </div>
          <p className="text-sm font-black text-text-dark leading-tight">{networkWarningMessage ?? 'Subnet mismatch detected.'}</p>
          <p className="text-xs text-text-light leading-relaxed">
            The target device must be reachable on the same local network as the server to perform activation or registration.
          </p>
          <Button fullWidth variant="outline" onClick={() => setNetworkWarningMessage(null)}>Acknowledge</Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={modalMode === 'delete'} onClose={closeModals} title="System Deletion">
        <div className="space-y-4">
          <p className="text-sm font-bold text-text-dark">Remove {deletingDevice?.name} from your fleet management?</p>
          <p className="text-xs text-text-light leading-relaxed">Warning: This will stop all monitoring and data collection for this device. This operation is permanent.</p>
          <div className="flex gap-2 pt-4">
            <Button variant="danger" fullWidth onClick={handleDelete} isLoading={isSubmitting}>Confirm Deletion</Button>
            <Button variant="outline" fullWidth onClick={closeModals} disabled={isSubmitting}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
})
