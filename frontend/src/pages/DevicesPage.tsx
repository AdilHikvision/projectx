import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/AppLayout'
import { Card, Badge, Button, Avatar, PageHeader, Input, Modal } from '../components/ui'
import { useLoading } from '../context/LoadingContext'
import { apiRequest, getHubUrl } from '../lib/api'

type DeviceStatus = 'Online' | 'Offline'

const DEVICE_TYPES = [
  { value: 'all', label: 'Все' },
  { value: 'AccessController', label: 'Контроллеры доступа' },
  { value: 'Intercom', label: 'Интеркомы' },
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
  }
}

const OFFLINE_DEBOUNCE_COUNT = 2

function applyStatusWithDebounce(
  device: Device,
  status: DeviceStatusResponse | undefined,
  offlineCountMap: Map<string, number>
): Device {
  if (!status) return device
  const key = device.id
  if (status.status === 'Online') {
    offlineCountMap.delete(key)
    return { ...device, status: 'Online', lastSeenUtc: status.lastSeenUtc ?? device.lastSeenUtc }
  }
  const count = (offlineCountMap.get(key) ?? 0) + 1
  offlineCountMap.set(key, count)
  if (count >= OFFLINE_DEBOUNCE_COUNT) {
    offlineCountMap.delete(key)
    return { ...device, status: 'Offline', lastSeenUtc: status.lastSeenUtc ?? device.lastSeenUtc }
  }
  return device
}

function getOfflineReason(device: Device): string {
  if (device.status !== 'Offline') return ''
  if (!device.lastSeenUtc) return 'Устройство никогда не подключалось'
  try {
    const d = new Date(device.lastSeenUtc)
    return `Последняя активность: ${d.toLocaleString('ru-RU')}`
  } catch {
    return 'Соединение потеряно'
  }
}

function getDeviceIcon(deviceType: string): string {
  if (deviceType === 'AccessController') return 'hub'
  if (deviceType === 'Intercom') return 'videocam'
  return 'devices'
}

function getDeviceTypeLabel(deviceType: string): string {
  if (deviceType === 'AccessController') return 'Access Controller'
  if (deviceType === 'Intercom') return 'Intercom'
  if (deviceType === 'AttendanceTerminal') return 'Attendance Terminal'
  return deviceType
}

const DISCOVER_TYPE_TABS = [
  { value: 'all', label: 'Все' },
  { value: 'camera', label: 'Камеры' },
  { value: 'access', label: 'Контроль доступа' },
  { value: 'intercom', label: 'Интеркомы' },
  { value: 'nvr', label: 'NVR' },
  { value: 'switch', label: 'Коммутаторы' },
  { value: 'other', label: 'Другое' },
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

function getDiscoverTypeLabel(type: string): string {
  const t = DISCOVER_TYPE_TABS.find((x) => x.value === type)
  return t?.label ?? type
}

export function DevicesPage() {
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
  const [discoverSortActive, setDiscoverSortActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [discoverSearchQuery, setDiscoverSearchQuery] = useState('')
  const [discoverIpSort, setDiscoverIpSort] = useState<'asc' | 'desc'>('asc')
  const [showAddedDevices, setShowAddedDevices] = useState(false)
  const [formData, setFormData] = useState<DeviceFormData>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addFromDevice, setAddFromDevice] = useState<DiscoveredDevice | null>(null)
  const [addDeviceName, setAddDeviceName] = useState('')
  const [addDeviceUsername, setAddDeviceUsername] = useState('admin')
  const [addDevicePassword, setAddDevicePassword] = useState('')
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
      const byDeviceId = new Map(statuses.map((s) => [s.deviceId, s]))
      const offlineMap = offlineDebounceRef.current
      setDevices((prev) => prev.map((d) => applyStatusWithDebounce(d, byDeviceId.get(d.id), offlineMap)))
    } catch { /* ignore */ }
  }, [token])

  const fetchStatusesRef = useRef(fetchStatuses)
  fetchStatusesRef.current = fetchStatuses
  const hubRef = useRef<HubConnection | null>(null)
  const offlineDebounceRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (modalMode === 'discover') {
      setDiscoverTypeTab('all')
      setDiscoverSortActive('all')
      setDiscoverSearchQuery('')
      setDiscoverIpSort('asc')
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
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Warning)
          .build()

        hub.on('DeviceStatusChanged', (payload: DeviceStatusResponse) => {
          const offlineMap = offlineDebounceRef.current
          setDevices((prev) =>
            prev.map((d) =>
              d.id === payload.deviceId || d.deviceIdentifier === payload.deviceIdentifier
                ? applyStatusWithDebounce(d, payload, offlineMap)
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

  function openCreateModal() {
    setFormData(emptyForm)
    setModalMode('create')
  }

  function openEditModal(device: Device) {
    setEditingDevice(device)
    setFormData({
      deviceIdentifier: device.deviceIdentifier,
      name: device.name,
      ipAddress: device.ipAddress,
      port: device.port,
      location: device.location ?? '',
      deviceType: device.deviceType === 'AccessController' ? 1 : device.deviceType === 'Intercom' ? 2 : 3,
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
      // При ошибке API разрешаем продолжить
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
          deviceType: 1,
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
      setError('Для активации требуется MAC-адрес устройства.')
      return
    }
    if (activatePassword !== activateConfirm) {
      setError('Пароли не совпадают.')
      return
    }
    if (activatePassword.length < 8) {
      setError('Пароль должен быть не менее 8 символов.')
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
      setInfo(`Устройство ${activatingDevice.ipAddress} активировано. Запускаем повторный поиск...`)
      closeActivateModal()
      await startDiscovery()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка активации'
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
      // При ошибке API разрешаем продолжить
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
      setError('Введите имя устройства')
      return
    }
    if (!addDevicePassword) {
      setError('Введите пароль устройства (тот же, что при активации)')
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
      setInfo(`Устройство "${addDeviceName.trim()}" добавлено.`)
      closeAddFromDiscoveredModal()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add device')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onlineCount = devices.filter((d) => d.status === 'Online').length

  const canCreate = formData.name.trim() && formData.ipAddress.trim()
  const canCreateOrUpdate = canCreate && formData.port > 0

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
        <PageHeader
          title="Devices Dashboard"
          description="Manage and monitor your enterprise access control hardware fleet."
          actions={
            <>
              <Button variant="outline" size="sm" icon="sync" onClick={loadData} isLoading={isLoading}>
                Refresh
              </Button>
              <Button variant="outline" size="sm" icon="add" onClick={openCreateModal}>
                Add manually
              </Button>
              <Button size="sm" icon="search" onClick={handleDiscover}>
                Discover
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

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <Input
              placeholder="Поиск по имени, IP, серийному номеру, типу, локации..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon="search"
              className="pr-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-dark hover:bg-slate-100 transition-colors"
                aria-label="Очистить поиск"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Type filter tabs */}
        <div className="flex border-b border-border-light overflow-x-auto no-scrollbar gap-8">
          {DEVICE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTypeFilter(t.value)}
              className={`pb-2.5 text-xs font-bold whitespace-nowrap uppercase tracking-widest border-b-2 transition-colors ${
                typeFilter === t.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-dark'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="flex flex-col gap-2 transition-all hover:border-primary/20">
            <p className="text-xs font-black text-text-muted tracking-widest uppercase">Total Fleet</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-text-dark">{devices.length}</p>
              <span className="text-xs font-bold text-success-text flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">check_circle</span> registered
              </span>
            </div>
          </Card>
          <Card className="flex flex-col gap-2 transition-all hover:border-primary/20">
            <p className="text-xs font-black text-text-muted tracking-widest uppercase">Operational</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-success-text">{onlineCount}</p>
              <span className="text-xs font-bold text-text-muted">Active</span>
            </div>
          </Card>
          <Card className="flex flex-col gap-2 transition-all hover:border-primary/20">
            <p className="text-xs font-black text-text-muted tracking-widest uppercase">Offline</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-error-text">{devices.length - onlineCount}</p>
              <span className="text-xs font-bold text-text-muted">Requires Sync</span>
            </div>
          </Card>
        </div>

        {/* Devices List/Table */}
        <Card noPadding className="overflow-hidden">
          <div className="hidden md:grid grid-cols-6 px-8 py-4 bg-slate-75 border-b border-border-base text-xs font-black text-text-muted tracking-widest uppercase">
            <div className="col-span-2">Identity & Label</div>
            <div>Type</div>
            <div>Network</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="divide-y divide-border-light">
            {filteredDevices.length === 0 ? (
              <div className="p-12 text-center text-text-muted italic text-sm">
                {devices.length === 0
                  ? 'No devices registered. Use Discover or Add manually to add devices.'
                  : 'No devices match your search or filter.'}
              </div>
            ) : (
              filteredDevices.map((device) => (
                <div
                  key={device.id}
                  className="flex flex-col md:grid grid-cols-6 items-center px-6 py-5 md:px-8 hover:bg-slate-75/50 transition-colors relative group"
                >
                  <div className="col-span-2 flex items-center gap-4">
                    <Avatar
                      icon={getDeviceIcon(device.deviceType)}
                      variant="primary"
                      size="lg"
                      className="!rounded-xl shadow-sm"
                    />
                    <div>
                      <p className="text-base font-black text-text-dark group-hover:text-primary transition-colors">
                        {device.name}
                      </p>
                      <p className="text-xs font-bold text-text-muted mt-0.5 tracking-tight uppercase">
                        {device.deviceIdentifier} • {device.location || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:block text-sm font-bold text-text-dark">
                    {getDeviceTypeLabel(device.deviceType)}
                  </div>
                  <div className="hidden md:block">
                    <code className="text-xs bg-slate-75 text-text-muted px-2 py-0.5 rounded font-bold border border-border-base">
                      {device.ipAddress}:{device.port}
                    </code>
                  </div>
                  <div className="flex items-center gap-6 md:block">
                    <span
                      title={device.status === 'Offline' ? getOfflineReason(device) : undefined}
                      className={device.status === 'Offline' ? 'cursor-help' : ''}
                    >
                      <Badge dot variant={device.status === 'Online' ? 'success' : 'error'}>
                        {device.status}
                      </Badge>
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 md:mt-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      icon="edit"
                      className="text-text-muted hover:text-text-dark"
                      onClick={() => openEditModal(device)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      icon="delete"
                      className="text-text-muted hover:text-error-text hover:bg-error-bg"
                      onClick={() => openDeleteModal(device)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-8 py-4 border-t border-border-base bg-slate-75 flex items-center justify-between">
            <p className="text-xs font-black text-text-muted uppercase tracking-widest">
              {filteredDevices.length} of {devices.length} devices
            </p>
          </div>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={closeModals}
        title={modalMode === 'create' ? 'Add Device' : 'Edit Device'}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (modalMode === 'create') handleCreate()
            else handleUpdate()
          }}
        >
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Entrance Controller"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1">IP Address</label>
            <Input
              value={formData.ipAddress}
              onChange={(e) => setFormData((p) => ({ ...p, ipAddress: e.target.value }))}
              placeholder="192.168.1.50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1">Port</label>
            <Input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData((p) => ({ ...p, port: parseInt(e.target.value, 10) || 8000 }))}
              min={1}
              max={65535}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1">Location (optional)</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
              placeholder="HQ / Gate A"
            />
          </div>
          {modalMode === 'edit' && (
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">Device Type</label>
              <p className="h-9 px-3 flex items-center bg-slate-75 border border-border-base rounded-md text-xs text-text-base">
                {getDeviceTypeLabel(editingDevice?.deviceType ?? 'AccessController')}
              </p>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1">Username</label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1">
              Password {modalMode === 'edit' && '(оставьте пустым, чтобы не менять)'}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              placeholder={modalMode === 'edit' ? '••••••' : 'Пароль устройства'}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={!canCreateOrUpdate || isSubmitting} isLoading={isSubmitting}>
              {modalMode === 'create' ? 'Create' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={closeModals}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discover Modal */}
      <Modal
        isOpen={modalMode === 'discover' || modalMode === 'activate'}
        onClose={closeModals}
        title="Discovered Devices"
        fullScreen
        actions={
          <Button
            variant="outline"
            size="sm"
            icon="sync"
            onClick={handleDiscoverRefresh}
            isLoading={isDiscovering}
          >
            {isDiscovering ? 'Поиск...' : 'Обновить'}
          </Button>
        }
      >
        {discovered.length === 0 ? (
          <p className="text-xs text-text-muted">{isDiscovering ? 'Сканирование сети...' : 'Устройства не найдены.'}</p>
        ) : (
          <div className="flex flex-col min-h-0 flex-1 gap-4">
            <p className="text-xs text-text-muted">
              {discovered.length} устройств найдено. Нажмите «Добавить» для регистрации.
            </p>

            {/* Tabs by type */}
            <div className="flex flex-wrap gap-2 border-b border-border-base pb-2">
              {DISCOVER_TYPE_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setDiscoverTypeTab(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    discoverTypeTab === t.value
                      ? 'bg-primary text-white'
                      : 'bg-slate-75 text-text-muted hover:bg-slate-100 hover:text-text-dark'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search + Show added */}
            <div className="flex flex-wrap items-center gap-4">
              <Input
                placeholder="Поиск по IP, серийному номеру, MAC..."
                value={discoverSearchQuery}
                onChange={(e) => setDiscoverSearchQuery(e.target.value)}
                icon="search"
                className="max-w-xs"
              />
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAddedDevices}
                  onChange={(e) => setShowAddedDevices(e.target.checked)}
                  className="w-4 h-4 rounded border-border-base text-primary focus:ring-primary/20"
                />
                <span className="text-xs font-bold text-text-dark">Показывать добавленные</span>
              </label>
            </div>

            {/* Sort: active / inactive + IP */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-2 items-center">
                <span className="text-xs font-bold text-text-muted uppercase">Сортировка:</span>
                {(['all', 'active', 'inactive'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDiscoverSortActive(s)}
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      discoverSortActive === s ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text-dark'
                    }`}
                  >
                    {s === 'all' ? 'Все' : s === 'active' ? 'Активные' : 'Неактивные'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs font-bold text-text-muted uppercase">IP:</span>
                <button
                  type="button"
                  onClick={() => setDiscoverIpSort((p) => (p === 'asc' ? 'desc' : 'asc'))}
                  className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                    'bg-primary/20 text-primary'
                  }`}
                >
                  {discoverIpSort === 'asc' ? '↑ Возрастание' : '↓ Убывание'}
                </button>
              </div>
              <span className="text-xs text-text-muted">
                (Активные = с MAC и прошивкой)
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-border-base">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="bg-slate-75 border-b border-border-base text-left text-xs font-black text-text-muted tracking-widest uppercase">
                    <th className="px-4 py-3">Тип</th>
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-primary"
                      onClick={() => setDiscoverIpSort((p) => (p === 'asc' ? 'desc' : 'asc'))}
                    >
                      IP Address {discoverIpSort === 'asc' ? '↑' : '↓'}
                    </th>
                    <th className="px-4 py-3">MAC Address</th>
                    <th className="px-4 py-3">Serial Number</th>
                    <th className="px-4 py-3">Firmware</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const addedKeys = new Set(
                      devices.flatMap((dev) => [
                        dev.deviceIdentifier,
                        `${dev.ipAddress}:${dev.port}`,
                      ])
                    )
                    const isAdded = (d: { deviceIdentifier: string; ipAddress: string; port: number }) =>
                      addedKeys.has(d.deviceIdentifier) || addedKeys.has(`${d.ipAddress}:${d.port}`)
                    return discovered
                      .map((d) => ({
                        ...d,
                        inferredType: inferDeviceTypeFromModel(d.model, d.deviceIdentifier),
                        isActive: d.isActivated ?? !!(d.macAddress && d.firmwareVersion),
                      }))
                      .filter((d) => showAddedDevices || !isAdded(d))
                      .filter((d) => discoverTypeTab === 'all' || d.inferredType === discoverTypeTab)
                      .filter((d) =>
                        discoverSortActive === 'all' ? true : discoverSortActive === 'active' ? d.isActive : !d.isActive
                      )
                      .filter((d) => {
                        const q = discoverSearchQuery.trim().toLowerCase()
                        if (!q) return true
                        const ip = (d.ipAddress ?? '').toLowerCase()
                        const serial = (d.deviceIdentifier ?? '').toLowerCase()
                        const mac = (d.macAddress ?? '').toLowerCase().replace(/[:-]/g, '')
                        const qNorm = q.replace(/[:-]/g, '')
                        return ip.includes(q) || serial.includes(q) || mac.includes(qNorm)
                      })
                      .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1))
                      .sort((a, b) => {
                        const cmp = a.ipAddress.localeCompare(b.ipAddress)
                        return discoverIpSort === 'asc' ? cmp : -cmp
                      })
                      .map((d) => {
                        const added = isAdded(d)
                        return (
                          <tr
                            key={`${d.ipAddress}:${d.port}:${d.deviceIdentifier}`}
                            className={`border-b border-border-light last:border-0 hover:bg-slate-75/50 ${
                              added ? 'bg-emerald-50/70' : !d.isActive ? 'bg-error-bg border-l-4 border-l-error-text' : ''
                            }`}
                          >
                            <td className="px-4 py-3 font-bold text-text-dark">{getDiscoverTypeLabel(d.inferredType)}</td>
                            <td className="px-4 py-3">
                              <code className="text-xs bg-slate-75 px-2 py-0.5 rounded font-bold">{d.ipAddress}:{d.port}</code>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">{d.macAddress || '—'}</td>
                            <td className="px-4 py-3 font-mono text-xs">{d.deviceIdentifier}</td>
                            <td className="px-4 py-3 text-xs">{d.firmwareVersion || '—'}</td>
                            <td className="px-4 py-3 text-right">
                              {added ? (
                                <span className="text-xs font-bold text-success-text inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-base">check_circle</span>
                                  Добавлено
                                </span>
                              ) : d.isActive ? (
                                <Button size="sm" icon="add" onClick={() => openAddFromDiscoveredModal(d)}>
                                  Добавить
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  icon="lock_open"
                                  variant="outline"
                                  onClick={() => openActivateModal(d)}
                                  disabled={!d.macAddress}
                                  title={!d.macAddress ? 'Для активации нужен MAC-адрес' : 'Активировать устройство'}
                                >
                                  Активация
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                  })()}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-text-muted">
                Показано:{' '}
                {discovered
                  .map((d) => ({ ...d, inferredType: inferDeviceTypeFromModel(d.model, d.deviceIdentifier), isActive: d.isActivated ?? !!(d.macAddress && d.firmwareVersion) }))
                  .filter((d) => {
                    const added = devices.some((dev) => dev.deviceIdentifier === d.deviceIdentifier || `${dev.ipAddress}:${dev.port}` === `${d.ipAddress}:${d.port}`)
                    return showAddedDevices || !added
                  })
                  .filter((d) => discoverTypeTab === 'all' || d.inferredType === discoverTypeTab)
                  .filter((d) => discoverSortActive === 'all' ? true : discoverSortActive === 'active' ? d.isActive : !d.isActive)
                  .filter((d) => {
                    const q = discoverSearchQuery.trim().toLowerCase()
                    if (!q) return true
                    const ip = (d.ipAddress ?? '').toLowerCase()
                    const serial = (d.deviceIdentifier ?? '').toLowerCase()
                    const mac = (d.macAddress ?? '').toLowerCase().replace(/[:-]/g, '')
                    const qNorm = q.replace(/[:-]/g, '')
                    return ip.includes(q) || serial.includes(q) || mac.includes(qNorm)
                  })
                  .length}{' '}
                из {discovered.length}
              </p>
              <Button variant="outline" onClick={closeModals}>
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add from Discovered Modal */}
      <Modal isOpen={!!addFromDevice} onClose={closeAddFromDiscoveredModal} title="Добавить устройство">
        {addFromDevice && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              handleAddFromDiscoveredSubmit()
            }}
          >
            <p className="text-sm text-text-muted">
              Устройство: <strong>{addFromDevice.ipAddress}:{addFromDevice.port}</strong>
            </p>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">Имя устройства</label>
              <Input
                value={addDeviceName}
                onChange={(e) => setAddDeviceName(e.target.value)}
                placeholder="По умолчанию — IP-адрес"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">Логин</label>
              <Input
                value={addDeviceUsername}
                onChange={(e) => setAddDeviceUsername(e.target.value)}
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">Пароль устройства</label>
              <Input
                type="password"
                value={addDevicePassword}
                onChange={(e) => setAddDevicePassword(e.target.value)}
                placeholder="Пароль для подключения"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={!addDeviceName.trim() || !addDevicePassword || isSubmitting} isLoading={isSubmitting} icon="add">
                Добавить
              </Button>
              <Button type="button" variant="outline" onClick={closeAddFromDiscoveredModal} disabled={isSubmitting}>
                Отмена
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Network warning dialog */}
      <Modal
        isOpen={!!networkWarningMessage}
        onClose={() => setNetworkWarningMessage(null)}
        title="Устройство не в одной сети с сервером"
        actions={
          <Button variant="outline" onClick={() => setNetworkWarningMessage(null)}>
            Понятно
          </Button>
        }
      >
        <p className="text-sm text-text-muted">{networkWarningMessage ?? 'Устройство не в одной сети с сервером.'}</p>
        <p className="mt-3 text-sm font-medium text-text-dark">
          Для активации или добавления устройство должно находиться в одной сети с сервером.
        </p>
      </Modal>

      {/* Activation Modal */}
      <Modal isOpen={modalMode === 'activate'} onClose={closeActivateModal} title="Активация устройства">
        {activatingDevice && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              handleActivate()
            }}
          >
            <p className="text-sm text-text-muted">
              Устройство: <strong>{activatingDevice.ipAddress}:{activatingDevice.port}</strong>
              {activatingDevice.macAddress && (
                <span className="block text-xs mt-1">MAC: {activatingDevice.macAddress}</span>
              )}
            </p>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">Пароль (мин. 8 символов)</label>
              <Input
                type="password"
                value={activatePassword}
                onChange={(e) => setActivatePassword(e.target.value)}
                placeholder="Введите пароль"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">Подтверждение пароля</label>
              <Input
                type="password"
                value={activateConfirm}
                onChange={(e) => setActivateConfirm(e.target.value)}
                placeholder="Повторите пароль"
                required
                minLength={8}
              />
            </div>
            {activatePassword && activateConfirm && activatePassword !== activateConfirm && (
              <p className="text-xs font-bold text-error-text">Пароли не совпадают</p>
            )}
            {activateError && (
              <div className="p-3 bg-error-bg text-error-text rounded-lg text-sm font-medium border border-error-text/20">
                {activateError}
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={activatePassword.length < 8 || activatePassword !== activateConfirm || isSubmitting}
                isLoading={isSubmitting}
                icon="lock_open"
              >
                Активировать
              </Button>
              <Button type="button" variant="outline" onClick={closeActivateModal} disabled={isSubmitting}>
                Отмена
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete confirmation Modal */}
      <Modal isOpen={modalMode === 'delete'} onClose={closeModals} title="Delete Device">
        {deletingDevice && (
          <div className="space-y-4">
            <p className="text-sm text-text-dark">
              Are you sure you want to delete <strong>{deletingDevice.name}</strong> ({deletingDevice.deviceIdentifier})?
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={handleDelete} isLoading={isSubmitting}>
                Delete
              </Button>
              <Button variant="outline" onClick={closeModals} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
