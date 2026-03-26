import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/templates'
import { Badge, Button } from '../components/atoms'
import { PageHeader } from '../components/organisms'
import { apiRequest } from '../lib/api'

interface AccessLevelDoor {
  deviceId: string
  deviceName: string
  doorIndex: number
  isElevator?: boolean
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
  isElevator?: boolean
}

function floorOrDoorLine(d: AccessLevelDoor) {
  const no = d.doorIndex + 1
  if (d.isElevator) return `Floor ${no} (ISAPI door ${no})`
  return `Door ${no}`
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

  async function handleElevatorControl(
    deviceId: string,
    doorIndex: number,
    action: 'visitorCallLadder' | 'householdCallLadder',
    callElevatorType?: 'up' | 'down'
  ) {
    if (!token) return
    const key = `${deviceId}-${doorIndex}-${action}-${callElevatorType ?? ''}`
    setDoorControlLoading(key)
    setError(null)
    try {
      await apiRequest(`/api/devices/${deviceId}/doors/${doorIndex}/control`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          action,
          ...(action === 'householdCallLadder' ? { callElevatorType: callElevatorType ?? 'up' } : {}),
        }),
      })
      await loadOnlineDoors()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Elevator control failed')
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
    <AppLayout onAction={() => { loadAccessLevels(); loadOnlineDoors(); loadEvents(); }}>
      <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
        <div className="p-6 md:p-8 space-y-6">
          <PageHeader
            className="hidden md:flex"
            title="Real-time Monitoring"
            description="Live oversight of your entire security infrastructure."
            actions={
              <Button variant="outline" icon="refresh" onClick={() => { loadAccessLevels(); loadOnlineDoors(); loadEvents(); }}>
                Sync Fleet
              </Button>
            }
          />

          {error && (
            <div className="p-4 bg-error-bg text-error-text rounded-2xl text-xs font-bold border border-error-text/10 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black text-text-light uppercase tracking-widest">Global Status</h2>
              <Badge variant="primary" className="animate-pulse">Live Feed</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-surface p-4 rounded-2xl shadow-md">
                <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Active Doors</p>
                <p className="text-2xl font-black text-primary leading-none">{onlineDoors.length}</p>
              </div>
              <div className="bg-surface p-4 rounded-2xl shadow-md">
                <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Total Levels</p>
                <p className="text-2xl font-black text-text-dark leading-none">{accessLevels.length}</p>
              </div>
            </div>
          </div>

          {/* Access Levels Section */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-text-light uppercase tracking-widest">Doors & elevators</h2>
            <div className="space-y-3">
              {accessLevels.length === 0 ? (
                <div className="py-20 text-center bg-surface rounded-2xl border border-divider-light shadow-sm">
                  <span className="material-symbols-outlined text-4xl text-text-light mb-2">lock_reset</span>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No access levels defined</p>
                </div>
              ) : (
                accessLevels.map((level) => (
                  <div key={level.id} className="bg-surface rounded-2xl shadow-md overflow-hidden transition-all group active:scale-[0.99] border-none">
                    <div className="px-5 py-4 border-b border-border-light bg-slate-50/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-xl">shield_lock</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-text-dark leading-tight">{level.name}</h3>
                          {level.description && <p className="text-[10px] font-bold text-text-light uppercase tracking-tight">{level.description}</p>}
                        </div>
                      </div>
                      <Badge variant="neutral">{level.doors?.length || 0} points</Badge>
                    </div>
                    <div className="p-2 space-y-1">
                      {(level.doors ?? []).map((d) => {
                        const online = isDoorOnline(d.deviceId, d.doorIndex)
                        const controlKey = `${d.deviceId}-${d.doorIndex}`
                        return (
                          <div key={controlKey} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="text-xs font-bold text-text-dark">{d.deviceName}</p>
                              <p className="text-[10px] font-bold text-text-light uppercase tracking-widest">{floorOrDoorLine(d)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {online ? (
                                d.isElevator ? (
                                  <div className="flex flex-wrap gap-1 justify-end max-w-[220px]">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      icon="badge"
                                      title="Call elevator (visitor)"
                                      onClick={() => handleElevatorControl(d.deviceId, d.doorIndex, 'visitorCallLadder')}
                                      disabled={!!doorControlLoading}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      icon="north"
                                      title="Call elevator (resident, up)"
                                      onClick={() => handleElevatorControl(d.deviceId, d.doorIndex, 'householdCallLadder', 'up')}
                                      disabled={!!doorControlLoading}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      icon="south"
                                      title="Call elevator (resident, down)"
                                      onClick={() => handleElevatorControl(d.deviceId, d.doorIndex, 'householdCallLadder', 'down')}
                                      disabled={!!doorControlLoading}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" icon="lock_open" title="Open" onClick={() => handleDoorControl(d.deviceId, d.doorIndex, 'open')} disabled={!!doorControlLoading} />
                                    <Button variant="ghost" size="icon" icon="lock" title="Close" onClick={() => handleDoorControl(d.deviceId, d.doorIndex, 'close')} disabled={!!doorControlLoading} />
                                    <Button variant="ghost" size="icon" icon="door_open" title="Remain Open" onClick={() => handleDoorControl(d.deviceId, d.doorIndex, 'alwaysopen')} disabled={!!doorControlLoading} />
                                    <Button variant="ghost" size="icon" icon="lock_clock" title="Remain Closed" onClick={() => handleDoorControl(d.deviceId, d.doorIndex, 'alwaysclose')} disabled={!!doorControlLoading} />
                                  </div>
                                )
                              ) : (
                                <span className="text-[8px] font-black text-error-text uppercase tracking-widest px-2 py-1 bg-error-bg/30 rounded-full">Offline</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Event Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black text-text-light uppercase tracking-widest">Live Activity Timeline</h2>
              <div className="flex gap-1 border border-divider-light rounded-lg p-0.5 bg-white">
                {(['all', 'doors', 'access'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setEventsFilter(f)}
                    className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${eventsFilter === f ? 'bg-primary text-white shadow-sm' : 'text-text-light hover:text-text-dark'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="py-20 text-center bg-surface/50 rounded-2xl border border-dashed border-divider-light">
                  <span className="material-symbols-outlined text-4xl text-text-light/50 mb-2">browse_activity</span>
                  <p className="text-[10px] font-black text-text-light uppercase tracking-widest">Awaiting system heartbeats...</p>
                </div>
              ) : (
                [...filteredEvents].reverse().slice(0, 50).map((evt, idx) => {
                  const isGranted = evt.eventType === 2
                  const isDenied = evt.eventType === 3
                  const timeStr = new Date(evt.occurredUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  const icon = isDenied ? 'block' : isGranted ? 'verified_user' : 'meeting_room'

                  return (
                    <div key={`${evt.occurredUtc}-${idx}`} className="flex gap-4 group animate-in slide-in-from-left-2 duration-300">
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${isGranted ? 'bg-emerald-50 text-emerald-500' :
                          isDenied ? 'bg-error-bg text-error-text' :
                            'bg-surface text-primary'
                          }`}>
                          <span className="material-symbols-outlined text-xl">{icon}</span>
                        </div>
                        <div className="w-0.5 flex-1 bg-border-light group-last:bg-transparent mt-2" />
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-xs font-black uppercase tracking-widest ${isDenied ? 'text-error-text' : 'text-text-dark'}`}>
                            {EVENT_TYPES[evt.eventType] || 'System Message'}
                          </p>
                          <p className="text-[10px] font-bold text-text-light font-mono">{timeStr}</p>
                        </div>
                        <div className="bg-surface p-3 rounded-2xl shadow-md">
                          <p className="text-xs font-bold text-text-dark leading-tight mb-1">{evt.payload || 'Signal received from hub'}</p>
                          <p className="text-[10px] font-black text-text-light uppercase tracking-tighter opacity-70">Station: {evt.deviceIdentifier}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
