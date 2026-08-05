import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiRequest } from '../lib/api'

/* ═══ Блоки портала самообслуживания, которых не хватало: сводка за месяц,
   уведомления и расчётные листы. Данные для них бэкенд отдавал давно
   (/api/self-service/summary|notifications|payroll), но в интерфейс выведены не были. ═══ */

const SS_TOKEN_KEY = 'projectx.ss.token'

function ssRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, token: localStorage.getItem(SS_TOKEN_KEY) })
}

const CARD = 'bg-surface rounded-2xl p-5 shadow-sm'
const CAPTION = 'text-[10px] font-black text-text-light uppercase tracking-widest'

const money = (v: number | null | undefined) => (v ?? 0).toFixed(2)

// ─────────────────────────── Сводка за месяц ───────────────────────────

interface Summary {
  year: number
  month: number
  workedDays: number
  recordsCount: number
  pendingRequests: number
  pendingLeaves: number
  leaveDaysApproved: number
}

export function SelfServiceSummary() {
  const { t } = useTranslation()
  const [data, setData] = useState<Summary | null>(null)

  useEffect(() => {
    ssRequest<Summary>('/api/self-service/summary').then(setData).catch(() => setData(null))
  }, [])

  if (!data) return null

  const tiles = [
    { key: 'workedDays', value: data.workedDays, icon: 'event_available' },
    { key: 'leaveDays', value: data.leaveDaysApproved, icon: 'beach_access' },
    { key: 'pendingRequests', value: data.pendingRequests + data.pendingLeaves, icon: 'hourglass_top' },
    { key: 'records', value: data.recordsCount, icon: 'fingerprint' },
  ] as const

  return (
    <div>
      <p className={`${CAPTION} mb-3`}>
        {t('selfService.monthSummary')} · {String(data.month).padStart(2, '0')}.{data.year}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <div key={tile.key} className="bg-surface rounded-2xl p-4 shadow-sm text-center">
            <span className="material-symbols-outlined text-primary text-xl">{tile.icon}</span>
            <p className="text-2xl font-black text-text-dark leading-tight mt-1">{tile.value}</p>
            <p className="text-[10px] font-bold text-text-light leading-tight mt-1">
              {t(`selfService.summary.${tile.key}`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────── Уведомления ───────────────────────────

interface Notification {
  id: string
  title: string
  body: string
  isRead: boolean
  /** Имя поля из AppNotificationDto — именно createdAtUtc, не createdUtc. */
  createdAtUtc: string
}

/** Заголовки и тексты приходят как {"k":"ключ","p":{…}} — переводим на языке интерфейса. */
function useNotifText() {
  const { t } = useTranslation()
  return (raw: string | null | undefined): string => {
    if (!raw) return ''
    const trimmed = raw.trim()
    if (!trimmed.startsWith('{')) return raw
    try {
      const parsed = JSON.parse(trimmed) as { k?: string; p?: Record<string, unknown> }
      if (!parsed.k) return raw
      const params: Record<string, unknown> = { ...(parsed.p ?? {}) }
      for (const key of ['type', 'leaveType']) {
        if (typeof params[key] === 'string') {
          params[key] = t(`notifications.enums.${params[key] as string}`, { defaultValue: params[key] as string })
        }
      }
      return t(parsed.k, { ...params, defaultValue: raw })
    } catch {
      return raw
    }
  }
}

export function SelfServiceNotifications() {
  const { t } = useTranslation()
  const render = useNotifText()
  const [items, setItems] = useState<Notification[]>([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    ssRequest<Notification[]>('/api/self-service/notifications')
      .then((list) => setItems(list.slice(0, 8)))
      .catch(() => setItems([]))
  }, [])

  useEffect(() => { load() }, [load])

  const unread = items.filter((n) => !n.isRead).length

  const markAll = async () => {
    setBusy(true)
    try {
      await ssRequest('/api/self-service/notifications/read-all', { method: 'POST' })
      load()
    } catch { /* ignore */ } finally { setBusy(false) }
  }

  const markOne = async (id: string) => {
    try {
      await ssRequest(`/api/self-service/notifications/${id}/read`, { method: 'POST' })
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch { /* ignore */ }
  }

  if (items.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className={CAPTION}>
          {t('selfService.notifications')}
          {unread > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-black align-middle">
              {unread}
            </span>
          )}
        </p>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => void markAll()}
            disabled={busy}
            className="text-[10px] font-black uppercase tracking-widest text-primary disabled:opacity-50"
          >
            {t('selfService.markAllRead')}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => { if (!n.isRead) void markOne(n.id) }}
            className={`w-full text-left rounded-2xl p-4 shadow-sm transition-colors ${n.isRead ? 'bg-surface' : 'bg-primary/5 ring-1 ring-primary/15'}`}
          >
            <div className="flex items-start gap-3">
              <span className={`material-symbols-outlined text-lg shrink-0 ${n.isRead ? 'text-text-light' : 'text-primary'}`}>
                {n.isRead ? 'notifications' : 'notifications_active'}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${n.isRead ? 'font-bold text-text-dark' : 'font-black text-text-dark'}`}>{render(n.title)}</p>
                {n.body && <p className="text-xs text-text-light mt-0.5 leading-relaxed">{render(n.body)}</p>}
                <p className="text-[10px] text-text-light mt-1">
                  {new Date(n.createdAtUtc).toLocaleString('en-GB', {
                    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
                  })}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────── Расчётные листы ───────────────────────────

interface Payslip {
  id: string
  year: number
  month: number
  workedDays: number
  workedHours: number
  overtimeHours: number
  latenessMinutes: number
  earlyLeaveMinutes: number
  absentDays: number
  basePay: number
  overtimePay: number
  allowancesTotal: number
  bonusesTotal: number
  grossPay: number
  deductionsTotal: number
  latenessDeduction: number
  earlyLeaveDeduction: number
  taxRate: number
  taxAmount: number
  netPay: number
  periodStatus: string
}

export function SelfServicePayslips() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Payslip[]>([])
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    ssRequest<Payslip[]>('/api/self-service/payroll').then(setItems).catch(() => setItems([]))
  }, [])

  // Показываем только утверждённые и выплаченные периоды — их и отдаёт бэкенд.
  if (items.length === 0) return null

  const rows = (p: Payslip) => [
    { label: t('selfService.payslip.workedDays'), value: `${p.workedDays}` },
    { label: t('selfService.payslip.workedHours'), value: `${p.workedHours.toFixed(1)}` },
    { label: t('selfService.payslip.overtimeHours'), value: `${p.overtimeHours.toFixed(1)}` },
    { label: t('selfService.payslip.basePay'), value: money(p.basePay) },
    { label: t('selfService.payslip.overtimePay'), value: money(p.overtimePay) },
    { label: t('selfService.payslip.allowances'), value: money(p.allowancesTotal) },
    { label: t('selfService.payslip.bonuses'), value: money(p.bonusesTotal) },
    { label: t('selfService.payslip.gross'), value: money(p.grossPay) },
    { label: t('selfService.payslip.deductions'), value: money(p.deductionsTotal) },
    { label: t('selfService.payslip.tax', { rate: p.taxRate }), value: money(p.taxAmount) },
  ]

  return (
    <div>
      <p className={`${CAPTION} mb-3`}>{t('selfService.payslips')}</p>
      <div className="space-y-2">
        {items.map((p) => {
          const isOpen = openId === p.id
          return (
            <div key={p.id} className={CARD}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : p.id)}
                className="w-full flex items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-black text-text-dark">
                    {String(p.month).padStart(2, '0')}.{p.year}
                  </p>
                  <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mt-0.5">
                    {t(`selfService.payslip.status.${p.periodStatus}`, { defaultValue: p.periodStatus })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-text-light uppercase tracking-widest">{t('selfService.payslip.net')}</p>
                    <p className="text-lg font-black text-text-dark leading-tight">{money(p.netPay)}</p>
                  </div>
                  <span className="material-symbols-outlined text-text-light">{isOpen ? 'expand_less' : 'expand_more'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="mt-4 pt-4 border-t border-border space-y-1.5">
                  {rows(p).map((r) => (
                    <div key={r.label} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-text-light">{r.label}</span>
                      <span className="font-mono font-bold text-text-dark">{r.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3 pt-2 mt-2 border-t border-border">
                    <span className="text-xs font-black text-text-dark uppercase tracking-widest">{t('selfService.payslip.net')}</span>
                    <span className="font-mono text-base font-black text-text-dark">{money(p.netPay)}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
