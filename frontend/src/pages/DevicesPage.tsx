import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
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

interface DeviceEvent {
  deviceIdentifier: string
  eventType: string
  occurredUtc: string
  payload: string
}

interface DeviceFormState {
  deviceIdentifier: string
  name: string
  ipAddress: string
  port: string
  location: string
  deviceType: string
}

const DEFAULT_FORM_STATE: DeviceFormState = {
  deviceIdentifier: '',
  name: '',
  ipAddress: '',
  port: '8000',
  location: '',
  deviceType: '1',
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
  const { token, user, logout } = useAuth()

  const [devices, setDevices] = useState<Device[]>([])
  const [events, setEvents] = useState<DeviceEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hubStatus, setHubStatus] = useState<'connecting' | 'connected' | 'polling'>('connecting')
  const [form, setForm] = useState<DeviceFormState>(DEFAULT_FORM_STATE)

  const authToken = token

  const loadData = useCallback(async () => {
    if (!authToken) return

    setError(null)
    const [devicesResult, statusesResult, eventsResult] = await Promise.all([
      apiRequest<Device[]>('/api/devices', { token: authToken }),
      apiRequest<DeviceStatusResponse[]>('/api/devices/statuses', { token: authToken }),
      apiRequest<DeviceEvent[]>('/api/devices/events?take=20', { token: authToken }),
    ])

    const statusesById = new Map(statusesResult.map((status) => [status.deviceId, status]))
    setDevices(devicesResult.map((device) => mergeStatus(device, statusesById.get(device.id))))
    setEvents(eventsResult)
  }, [authToken])

  const fetchStatuses = useCallback(async () => {
    if (!authToken) return

    const statuses = await apiRequest<DeviceStatusResponse[]>('/api/devices/statuses', { token: authToken })
    const byDeviceId = new Map(statuses.map((status) => [status.deviceId, status]))
    setDevices((prev) => prev.map((device) => mergeStatus(device, byDeviceId.get(device.id))))
  }, [authToken])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        await loadData()
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Не удалось загрузить устройства')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loadData])

  useEffect(() => {
    if (!authToken) return
    const tokenForHub = authToken

    let isDisposed = false
    let hubConnection: HubConnection | null = null
    let pollTimer: number | null = null

    async function startConnection() {
      try {
        setHubStatus('connecting')
        hubConnection = new HubConnectionBuilder()
          .withUrl(`${getApiBaseUrl()}/hubs/devices`, {
            accessTokenFactory: () => tokenForHub,
          })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Warning)
          .build()

        hubConnection.on('DeviceStatusChanged', (payload: DeviceStatusResponse) => {
          setDevices((prev) =>
            prev.map((device) => {
              if (device.id !== payload.deviceId && device.deviceIdentifier !== payload.deviceIdentifier) {
                return device
              }
              return mergeStatus(device, payload)
            }),
          )
        })

        await hubConnection.start()
        if (isDisposed) return
        if (hubConnection.state === HubConnectionState.Connected) {
          setHubStatus('connected')
          return
        }
      } catch {
        // fallback ниже
      }

      if (!isDisposed) {
        setHubStatus('polling')
        pollTimer = window.setInterval(() => {
          fetchStatuses().catch(() => undefined)
        }, 5000)
      }
    }

    startConnection().catch(() => undefined)

    return () => {
      isDisposed = true
      if (pollTimer) {
        window.clearInterval(pollTimer)
      }
      if (hubConnection) {
        hubConnection.stop().catch(() => undefined)
      }
    }
  }, [authToken, fetchStatuses])

  const handleChange = useCallback((key: keyof DeviceFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  async function handleCreateDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!authToken) return

    setIsSubmitting(true)
    setError(null)
    try {
      await apiRequest<Device>('/api/devices', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
          deviceIdentifier: form.deviceIdentifier,
          name: form.name,
          ipAddress: form.ipAddress,
          port: Number(form.port),
          location: form.location || null,
          deviceType: Number(form.deviceType),
        }),
      })

      setForm(DEFAULT_FORM_STATE)
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить устройство')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteDevice(deviceId: string) {
    if (!authToken) return

    setError(null)
    try {
      await apiRequest<void>(`/api/devices/${deviceId}`, {
        method: 'DELETE',
        token: authToken,
      })
      setDevices((prev) => prev.filter((device) => device.id !== deviceId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить устройство')
    }
  }

  async function handleToggleConnection(device: Device) {
    if (!authToken) return
    const action = device.status === 'Online' ? 'disconnect' : 'connect'

    setError(null)
    try {
      const updated = await apiRequest<Device>(`/api/devices/${device.id}/${action}`, {
        method: 'POST',
        token: authToken,
      })
      setDevices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось изменить состояние подключения')
    }
  }

  const sortedDevices = useMemo(
    () => [...devices].sort((a, b) => a.name.localeCompare(b.name)),
    [devices],
  )

  return (
    <div className="page-container">
      <header className="topbar">
        <div>
          <h1>Устройства</h1>
          <p className="muted">
            Пользователь: {user?.email ?? '-'} · Realtime: {hubStatus === 'connected' ? 'SignalR' : 'Polling'}
          </p>
        </div>
        <div className="actions-cell">
          <Link to="/system">Система</Link>
          <button onClick={logout}>Выйти</button>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}

      <section className="card">
        <h2>Добавить устройство</h2>
        <form className="device-form" onSubmit={handleCreateDevice}>
          <input
            placeholder="DeviceIdentifier"
            value={form.deviceIdentifier}
            onChange={(event) => handleChange('deviceIdentifier', event.target.value)}
            required
          />
          <input
            placeholder="Name"
            value={form.name}
            onChange={(event) => handleChange('name', event.target.value)}
            required
          />
          <input
            placeholder="IP Address"
            value={form.ipAddress}
            onChange={(event) => handleChange('ipAddress', event.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Port"
            value={form.port}
            onChange={(event) => handleChange('port', event.target.value)}
            required
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={(event) => handleChange('location', event.target.value)}
          />
          <select value={form.deviceType} onChange={(event) => handleChange('deviceType', event.target.value)}>
            <option value="1">AccessController</option>
            <option value="2">Intercom</option>
            <option value="3">AttendanceTerminal</option>
          </select>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Добавить'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Таблица устройств</h2>
        {isLoading ? (
          <div className="page-message">Загрузка...</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Identifier</th>
                  <th>IP</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>LastSeen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDevices.map((device) => (
                  <tr key={device.id}>
                    <td>{device.name}</td>
                    <td>{device.deviceIdentifier}</td>
                    <td>
                      {device.ipAddress}:{device.port}
                    </td>
                    <td>{device.deviceType}</td>
                    <td>
                      <span className={`status-pill ${device.status === 'Online' ? 'online' : 'offline'}`}>
                        {device.status}
                      </span>
                    </td>
                    <td>{device.lastSeenUtc ? new Date(device.lastSeenUtc).toLocaleString() : '-'}</td>
                    <td className="actions-cell">
                      <button onClick={() => handleToggleConnection(device)}>
                        {device.status === 'Online' ? 'Отключить' : 'Подключить'}
                      </button>
                      <button className="danger" onClick={() => handleDeleteDevice(device.id)}>
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Последние события</h2>
        <div className="events-list">
          {events.length === 0 ? (
            <div className="page-message">Событий пока нет</div>
          ) : (
            events.map((eventItem, index) => (
              <div className="event-row" key={`${eventItem.deviceIdentifier}-${eventItem.occurredUtc}-${index}`}>
                <strong>{eventItem.eventType}</strong>
                <span>{eventItem.deviceIdentifier}</span>
                <span>{new Date(eventItem.occurredUtc).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
