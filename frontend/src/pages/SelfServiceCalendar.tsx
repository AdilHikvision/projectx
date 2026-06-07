import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiRequest } from '../lib/api'

const SS_TOKEN_KEY = 'projectx.ss.token'

interface CalDay {
  date: string
  scheduleName: string | null
  shiftStart: string | null
  shiftEnd: string | null
  color: string | null
  isDayOff: boolean
  isAbsent: boolean
  onLeave: boolean
  checkInUtc: string | null
  checkOutUtc: string | null
  leaveType: string | null
  leaveStatus: string | null
}

function hhmm(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** JS getDay() (0=Sun) → Monday-based index (0=Mon … 6=Sun). */
const mondayIndex = (jsDay: number) => (jsDay + 6) % 7

export function SelfServiceCalendar() {
  const { t, i18n } = useTranslation()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-11
  const [days, setDays] = useState<CalDay[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const mm = String(month + 1).padStart(2, '0')
        const last = new Date(year, month + 1, 0).getDate()
        const token = localStorage.getItem(SS_TOKEN_KEY)
        const res = await apiRequest<{ days: CalDay[] }>(
          `/api/self-service/schedule?from=${year}-${mm}-01&to=${year}-${mm}-${String(last).padStart(2, '0')}`,
          { token },
        )
        if (!cancelled) setDays(res.days)
      } catch {
        if (!cancelled) setDays([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [year, month])

  const byDate = new Map(days.map((d) => [d.date, d]))
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const lead = mondayIndex(new Date(year, month, 1).getDay())
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(i18n.language, { weekday: 'short' }))
  const monthLabel = new Date(year, month, 1).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
  const todayStr = new Date().toLocaleDateString('en-CA') // yyyy-MM-dd (local)

  const prev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1) }

  const cellFor = (d: CalDay | undefined) => {
    if (!d) return { bg: 'bg-transparent', fg: 'text-text-light', label: '', sub: '' }
    if (d.checkInUtc) return { bg: 'bg-green-50', fg: 'text-green-700', label: hhmm(d.checkInUtc), sub: d.checkOutUtc ? hhmm(d.checkOutUtc) : '' }
    if (d.leaveType) {
      const pending = d.leaveStatus === 'Pending'
      const sub = pending ? t('selfService.statuses.Pending') : ''
      if (d.leaveType === 'Vacation') return { bg: pending ? 'bg-purple-50' : 'bg-purple-100', fg: 'text-purple-700', label: t('selfService.legend.vacation'), sub }
      return { bg: pending ? 'bg-amber-50' : 'bg-amber-100', fg: 'text-amber-700', label: t('selfService.legend.dayOffLeave'), sub }
    }
    if (d.isAbsent) return { bg: 'bg-red-50', fg: 'text-red-600', label: t('selfService.legend.absent'), sub: '' }
    if (d.isDayOff) return { bg: 'bg-slate-100', fg: 'text-slate-400', label: t('selfService.legend.dayOff'), sub: '' }
    return { bg: 'bg-background-light', fg: 'text-text-dark', label: '', sub: '' }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black text-text-light uppercase tracking-widest">{t('selfService.attendanceCalendar')}</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={prev} className="w-8 h-8 rounded-lg bg-surface shadow-sm flex items-center justify-center hover:bg-background-light transition-colors">
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <span className="text-xs font-bold text-text-dark capitalize min-w-[120px] text-center">{monthLabel}</span>
          <button type="button" onClick={next} className="w-8 h-8 rounded-lg bg-surface shadow-sm flex items-center justify-center hover:bg-background-light transition-colors">
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-2 shadow-sm">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdays.map((w, i) => (
            <div key={i} className="text-center text-[9px] font-black text-text-light uppercase py-1">{w}</div>
          ))}
        </div>
        <div className={`grid grid-cols-7 gap-1 ${loading ? 'opacity-50' : ''}`}>
          {Array.from({ length: lead }).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            const d = byDate.get(dateStr)
            const c = cellFor(d)
            const isToday = dateStr === todayStr
            return (
              <div
                key={dateStr}
                title={d?.scheduleName ?? ''}
                className={`rounded-lg ${c.bg} ${isToday ? 'ring-2 ring-primary' : ''} min-h-[46px] p-1 flex flex-col overflow-hidden`}
              >
                <span className={`text-[10px] font-bold ${c.fg}`}>{dayNum}</span>
                {c.label && <span className={`text-[8px] leading-tight font-mono ${c.fg} truncate`}>{c.label}</span>}
                {c.sub && <span className="text-[7px] leading-tight text-text-light truncate">{c.sub}</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 px-1">
        {([
          ['bg-green-200', t('selfService.legend.present')],
          ['bg-slate-200', t('selfService.legend.dayOff')],
          ['bg-purple-200', t('selfService.legend.vacation')],
          ['bg-amber-200', t('selfService.legend.dayOffLeave')],
          ['bg-red-200', t('selfService.legend.absent')],
        ] as const).map(([cls, lbl]) => (
          <span key={lbl} className="flex items-center gap-1 text-[9px] text-text-light">
            <span className={`w-2.5 h-2.5 rounded-sm ${cls}`} />{lbl}
          </span>
        ))}
      </div>
    </div>
  )
}
