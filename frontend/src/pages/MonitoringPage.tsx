import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/AppLayout'
import { Card, Badge, Button, PageHeader } from '../components/ui'
import { apiRequest } from '../lib/api'

interface AccessLevelDoor {
  deviceId: string
  deviceName: string
  doorIndex: number
}

interface AccessLevel {
  id: string
  name: string
  description?: string | null
  doors: AccessLevelDoor[]
}

interface DeviceDoor {
  deviceId: string
  deviceName: string
  doorIndex: number
  doorName?: string | null
  status?: string | null
}

interface DeviceEvent {
  deviceIdentifier: string
  eventType: number
  occurredUtc: string
  payload: string
}

const EVENT_TYPES: Record<number, string> = {
  0: 'Unknown',
  1: 'DoorOpened',
  2: 'AccessGranted',
  3: 'AccessDenied',
  4: 'Heartbeat',
}

export function MonitoringPage() {
  const { token } = useAuth()
  const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([])
  const [onlineDoors, setOnlineDoors] = useState<DeviceDoor[]>([])
  const [events, setEvents] = useState<DeviceEvent[]>([])
  const [doorControlLoading, setDoorControlLoading] = useState<string | null>(null)
  const [eventsFilter, setEventsFilter] = useState<'all' | 'doors' | 'access'>('all')
  const [error, setError] = useState<string | null>(null)

  const loadAccessLevels = useCallback(async () => {
    if (!token) return
    try {
      const list = await apiRequest<AccessLevel[]>('/api/access-levels', { token })
      setAccessLevels(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load access levels')
    }
  }, [token])

  const loadOnlineDoors = useCallback(async () => {
    if (!token) return
    try {
      const list = await apiRequest<DeviceDoor[]>('/api/devices/doors', { token })
      setOnlineDoors(list)
    } catch {
      setOnlineDoors([])
    }
  }, [token])

  const loadEvents = useCallback(async () => {
    if (!token) return
    try {
      const list = await apiRequest<DeviceEvent[]>('/api/devices/events?take=200', { token })
      setEvents(list)
    } catch {
      setEvents([])
    }
  }, [token])

  useEffect(() => {
    loadAccessLevels()
    loadOnlineDoors()
  }, [loadAccessLevels, loadOnlineDoors])

  useEffect(() => {
    loadEvents()
    const interval = setInterval(loadEvents, 3000)
    return () => clearInterval(interval)
  }, [loadEvents])

  const onlineDoorSet = useMemo(
    () => new Set(onlineDoors.map((d) => `${d.deviceId}:${d.doorIndex}`)),
    [onlineDoors]
  )

  const isDoorOnline = (deviceId: string, doorIndex: number) =>
    onlineDoorSet.has(`${deviceId}:${doorIndex}`)

  async function handleDoorControl(deviceId: string, doorIndex: number, action: string) {
    if (!token) return
    const key = `${deviceId}-${doorIndex}-${action}`
    setDoorControlLoading(key)
    setError(null)
    try {
      await apiRequest(`/api/devices/${deviceId}/doors/${doorIndex}/control`, {
        method: 'POST',
        token,
        body: JSON.stringify({ action }),
      })
      await loadOnlineDoors()
    } catch (e) {
      setError(e instanceof Error ? e.message : `Door control failed: ${action}`)
    } finally {
      setDoorControlLoading(null)
    }
  }

  const filteredEvents = useMemo(() => {
    if (eventsFilter === 'all') return events
    if (eventsFilter === 'doors')
      return events.filter((e) => e.eventType === 1) // DoorOpened
    if (eventsFilter === 'access')
      return events.filter((e) => e.eventType === 2 || e.eventType === 3) // AccessGranted, AccessDenied
    return events
  }, [events, eventsFilter])

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
        <PageHeader
          title="Мониторинг"
          description="Управление дверями по уровням доступа, лог событий и проходов."
        />

        {error && (
          <div className="p-4 bg-error-bg text-error-text rounded-xl text-xs font-bold border border-error-text/10">
            {error}
          </div>
        )}

        {/* Access Levels with Doors */}
        <Card noPadding className="overflow-hidden">
          <div className="px-8 py-4 bg-slate-75 border-b border-border-base">
            <h2 className="text-sm font-black text-text-dark uppercase tracking-widest">
              Уровни доступа и двери
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Управление дверями, привязанными к уровням доступа (из БД)
            </p>
          </div>
          <div className="divide-y divide-border-light">
            {accessLevels.length === 0 ? (
              <div className="p-12 text-center text-text-muted italic text-sm">
                Нет уровней доступа. Создайте политики на странице Access Levels.
              </div>
            ) : (
              accessLevels.map((level) => (
                <div key={level.id} className="px-8 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-xl text-primary">shield_lock</span>
                    <h3 className="text-base font-bold text-text-dark">{level.name}</h3>
                    {level.description && (
                      <span className="text-xs text-text-muted">— {level.description}</span>
                    )}
                  </div>
                  {(level.doors ?? []).length === 0 ? (
                    <p className="text-sm text-text-light italic pl-8">Нет привязанных дверей</p>
                  ) : (
                    <div className="pl-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {(level.doors ?? []).map((d) => {
                        const online = isDoorOnline(d.deviceId, d.doorIndex)
                        return (
                          <div
                            key={`${d.deviceId}-${d.doorIndex}`}
                            className="flex items-center justify-between gap-2 p-3 bg-slate-75 rounded-lg border border-border-light"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-text-dark truncate">
                                {d.deviceName} — Дверь #{d.doorIndex}
                              </p>
                              <Badge
                                variant={online ? 'primary' : 'neutral'}
                                className="text-[10px] mt-1"
                              >
                                {online ? 'Online' : 'Offline'}
                              </Badge>
                            </div>
                            {online ? (
                              <div className="flex flex-wrap gap-1 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon="lock_open"
                                  className="text-[10px]"
                                  onClick={() => handleDoorControl(d.deviceId, d.doorIndex, 'open')}
                                  disabled={!!doorControlLoading}
                                  title="Открыть"
                                >
                                  Открыть
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon="lock"
                                  className="text-[10px]"
                                  onClick={() => handleDoorControl(d.deviceId, d.doorIndex, 'close')}
                                  disabled={!!doorControlLoading}
                                  title="Закрыть"
                                >
                                  Закрыть
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon="door_open"
                                  className="text-[10px]"
                                  onClick={() =>
                                    handleDoorControl(d.deviceId, d.doorIndex, 'alwaysOpen')
                                  }
                                  disabled={!!doorControlLoading}
                                  title="Всегда открыта"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon="door_sliding"
                                  className="text-[10px]"
                                  onClick={() =>
                                    handleDoorControl(d.deviceId, d.doorIndex, 'alwaysClose')
                                  }
                                  disabled={!!doorControlLoading}
                                  title="Всегда закрыта"
                                />
                              </div>
                            ) : (
                              <span className="text-[10px] text-error-text font-bold">
                                Управление недоступно
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="px-8 py-4 border-t border-border-base bg-slate-75 flex justify-between items-center">
            <p className="text-xs font-black text-text-muted uppercase tracking-widest">
              {accessLevels.length} уровней доступа
            </p>
            <Button variant="ghost" size="sm" icon="refresh" onClick={() => { loadAccessLevels(); loadOnlineDoors(); }}>
              Обновить
            </Button>
          </div>
        </Card>

        {/* Events Log */}
        <Card noPadding className="overflow-hidden">
          <div className="px-8 py-4 bg-slate-75 border-b border-border-base flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-text-dark uppercase tracking-widest">
                Лог событий (обновление каждые 3 сек)
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Открытие/закрытие дверей и проходы людей в реальном времени
              </p>
            </div>
            <div className="flex gap-2">
              {(['all', 'doors', 'access'] as const).map((f) => (
                <Button
                  key={f}
                  variant={eventsFilter === f ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setEventsFilter(f)}
                >
                  {f === 'all' ? 'Все' : f === 'doors' ? 'Двери' : 'Проходы'}
                </Button>
              ))}
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <div className="hidden md:grid grid-cols-12 px-8 py-3 bg-slate-50 border-b border-border-light text-xs font-black text-text-muted tracking-widest uppercase">
              <div className="col-span-2">Время</div>
              <div className="col-span-2">Тип</div>
              <div className="col-span-3">Устройство</div>
              <div className="col-span-5">Данные</div>
            </div>
            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-text-muted italic text-sm">
                Нет событий. События поступают с подключённых устройств.
              </div>
            ) : (
              <div className="divide-y divide-border-light">
                {[...filteredEvents].reverse().map((evt, idx) => (
                  <div
                    key={`${evt.occurredUtc}-${idx}`}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 px-8 py-3 hover:bg-slate-75/50 text-sm"
                  >
                    <div className="md:col-span-2 text-xs text-text-muted font-mono">
                      {new Date(evt.occurredUtc).toLocaleString('ru-RU')}
                    </div>
                    <div className="md:col-span-2">
                      <Badge
                        variant={
                          evt.eventType === 2
                            ? 'primary'
                            : evt.eventType === 3
                              ? 'error'
                              : 'neutral'
                        }
                        className="text-[10px]"
                      >
                        {EVENT_TYPES[evt.eventType] ?? 'Unknown'}
                      </Badge>
                    </div>
                    <div className="md:col-span-3 text-xs font-mono text-text-dark truncate">
                      {evt.deviceIdentifier}
                    </div>
                    <div className="md:col-span-5 text-xs text-text-muted break-all">
                      {evt.payload || '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-8 py-4 border-t border-border-base bg-slate-75">
            <p className="text-xs font-black text-text-muted uppercase tracking-widest">
              {filteredEvents.length} событий
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
