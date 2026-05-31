import { useCallback, useEffect, useRef, useState } from 'react'
import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr'
import { useAuth } from '../auth/AuthContext'
import { apiRequest, getHubUrl } from '../lib/api'

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  createdAtUtc: string
  referenceId?: string | null
  isBroadcast: boolean
}

export function useNotifications() {
  const { token, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const hubRef = useRef<HubConnection | null>(null)

  const recalcUnread = useCallback((list: AppNotification[]) => {
    setUnreadCount(list.filter(n => !n.isRead).length)
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      const items = await apiRequest<AppNotification[]>('/api/notifications', { token })
      setNotifications(items)
      recalcUnread(items)
    } catch {
      // ignore fetch errors silently
    }
  }, [token, recalcUnread])

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) void fetchNotifications()
  }, [isAuthenticated, fetchNotifications])

  // SignalR subscription for real-time push
  useEffect(() => {
    if (!token || !isAuthenticated) return
    let cancelled = false

    const hub = new HubConnectionBuilder()
      .withUrl(`${getHubUrl()}/hubs/devices`, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect({ nextRetryDelayInMilliseconds: ctx => Math.min(1000 * 2 ** ctx.previousRetryCount, 30000) })
      .configureLogging(LogLevel.Error)
      .build()

    hubRef.current = hub

    hub.on('ReceiveNotification', (notif: AppNotification) => {
      if (cancelled) return
      setNotifications(prev => {
        const next = [notif, ...prev.filter(n => n.id !== notif.id)]
        recalcUnread(next)
        return next
      })
    })

    // Keep the start promise so cleanup can stop ONLY after start settles —
    // calling stop() mid-start throws "Failed to start the HttpConnection before stop() was called"
    // (common under React StrictMode's mount→unmount→remount in dev).
    const startPromise = hub.start().catch(() => { /* start aborted/failed — ignore */ })

    return () => {
      cancelled = true
      hubRef.current = null
      void startPromise.finally(() => { hub.stop().catch(() => {}) })
    }
  }, [token, isAuthenticated, recalcUnread])

  const markRead = useCallback(async (id: string) => {
    if (!token) return
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      recalcUnread(next)
      return next
    })
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'POST', token })
    } catch {
      // optimistic update already applied
    }
  }, [token, recalcUnread])

  const markAllRead = useCallback(async () => {
    if (!token) return
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, isRead: true }))
      recalcUnread(next)
      return next
    })
    try {
      await apiRequest('/api/notifications/read-all', { method: 'POST', token })
    } catch {
      // optimistic update already applied
    }
  }, [token, recalcUnread])

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetchNotifications }
}
