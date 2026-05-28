import { useCallback, useEffect, useState } from 'react'
import { AppLayout } from '../components/templates'
import { Button, Input } from '../components/atoms'
import { PageHeader, Modal } from '../components/organisms'
import { apiRequest } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { useExportReport } from '../hooks/useExportReport'

interface Employee {
  id: string
  firstName: string
  lastName: string
  employeeNo: string | null
}

interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  eventTimeUtc: string
  eventType: string
  source: string
}


function formatDT(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}

type PageTab = 'daily' | 'weekly' | 'monthly' | 'schedules' | 'leaves'

interface LeaveRow {
  id: string
  employeeId: string
  employeeName: string
  department: string | null
  leaveType: string
  isPaid: boolean
  startDate: string
  endDate: string
  reason: string | null
  status: string
  notes: string | null
  approvedAt: string | null
}

interface LeaveForm {
  employeeId: string
  leaveType: 'Vacation' | 'DayOff'
  isPaid: boolean
  startDate: string
  endDate: string
  reason: string
}

interface SelfServiceRequestRow {
  id: string
  employeeId: string
  employeeName: string
  type: string
  requestedTimeUtc: string
  requestedEndTimeUtc: string | null
  comment: string | null
  status: string
  reviewedAtUtc: string | null
  reviewComment: string | null
  createdUtc: string
}
type SubTab = 'all' | 'absent' | 'late' | 'early' | 'overtime' | 'incomplete'

interface PeriodRow {
  employeeId: string
  employeeName: string | null
  date: string
  scheduleName: string | null
  shiftStart: string | null
  shiftEnd: string | null
  checkInUtc: string | null
  checkOutUtc: string | null
  totalHours: number
  lateMinutes: number | null
  corrected: boolean
}

interface DailySummary {
  employeeId: string
  employeeName: string | null
  date: string
  scheduleName: string | null
  shiftStart: string | null
  shiftEnd: string | null
  checkInUtc: string | null
  checkOutUtc: string | null
  totalHours: number
  eventCount: number
  lateMinutes: number | null
  earlyLeaveMinutes: number | null
  corrected: boolean
  correctionComment: string | null
}

function formatDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function formatTimeOnly(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

interface WorkScheduleRow {
  id: string
  name: string
  type: string
  shiftStart: string | null
  shiftEnd: string | null
  requiredHoursPerDay: number
  color: string
  createdUtc: string
}


function timeToInput(isoOrSpan: string | null): string {
  if (!isoOrSpan) return ''
  const t = isoOrSpan.length >= 5 ? isoOrSpan.slice(0, 5) : isoOrSpan
  return /^\d{2}:\d{2}$/.test(t) ? t : ''
}

function inputTimeToApi(value: string): string | null {
  if (!value.trim()) return null
  return value.length === 5 ? `${value}:00` : value
}

/** Понедельник недели, содержащей дату (YYYY-MM-DD → YYYY-MM-DD). */
function weekRange(anchor: string): { from: string; to: string } {
  const d = new Date(anchor + 'T00:00:00')
  const dow = d.getDay() // 0=Sun..6=Sat
  const diffToMon = (dow + 6) % 7 // Mon=0
  const mon = new Date(d); mon.setDate(d.getDate() - diffToMon)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmt = (x: Date) => x.toISOString().slice(0, 10)
  return { from: fmt(mon), to: fmt(sun) }
}

/** Первый и последний день месяца YYYY-MM. */
function monthRange(yyyymm: string): { from: string; to: string } {
  const [y, m] = yyyymm.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const last = new Date(y, m, 0)
  const fmt = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  return { from: fmt(first), to: fmt(last) }
}

/**
 * Маска "HH:MM": при вводе цифр — двоеточие подставляется после первых двух.
 * Лишние символы и более 4 цифр отбрасываются.
 */
function maskHHMM(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

/**
 * Длина смены в часах от HH:MM до HH:MM. Если конец раньше начала — считаем
 * ночную смену (через полночь).
 */
function isEarlyCheckout(row: PeriodRow): boolean {
  if (!row.checkOutUtc || !row.shiftEnd) return false
  const outHHMM = new Date(row.checkOutUtc).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  const endHHMM = row.shiftEnd.slice(0, 5)
  return outHHMM < endHHMM
}

function rowMatchesSubTab(r: PeriodRow, st: SubTab): boolean {
  switch (st) {
    case 'absent': return !r.checkInUtc
    case 'late': return (r.lateMinutes ?? 0) > 0
    case 'early': return isEarlyCheckout(r)
    case 'overtime': {
      if (!r.checkInUtc || !r.shiftStart || !r.shiftEnd) return false
      const exp = computeShiftHours(r.shiftStart.slice(0, 5), r.shiftEnd.slice(0, 5))
      return exp !== null && r.totalHours > exp
    }
    case 'incomplete': return !!r.checkInUtc
    default: return true
  }
}

function computeShiftHours(start: string, end: string): number | null {
  const re = /^([01][0-9]|2[0-3]):([0-5][0-9])$/
  const ms = start.match(re); const me = end.match(re)
  if (!ms || !me) return null
  const startMin = parseInt(ms[1], 10) * 60 + parseInt(ms[2], 10)
  let endMin = parseInt(me[1], 10) * 60 + parseInt(me[2], 10)
  if (endMin <= startMin) endMin += 24 * 60
  return (endMin - startMin) / 60
}

export function WorkHoursTrackingPage() {
  const { token } = useAuth()
  const { exporting, downloadReport } = useExportReport(token)
  const [tab, setTab] = useState<PageTab>('daily')
  const [subTab, setSubTab] = useState<SubTab>('all')

  // Filters
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterFrom, setFilterFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10)
  })
  const [filterTo, setFilterTo] = useState(() => new Date().toISOString().slice(0, 10))
  // Daily-вкладка работает с одной датой (день, за который смотрим отчёт).
  const [filterDailyDate, setFilterDailyDate] = useState(() => new Date().toISOString().slice(0, 10))
  // Weekly/Monthly — anchor-даты, диапазон вычисляется автоматически.
  const [weeklyAnchor, setWeeklyAnchor] = useState(() => new Date().toISOString().slice(0, 10))
  const [monthlyAnchor, setMonthlyAnchor] = useState(() => new Date().toISOString().slice(0, 7)) // YYYY-MM

  // Модалка коррекции check-in/check-out для конкретного сотрудника на конкретный день.
  const [correctionModal, setCorrectionModal] = useState<DailySummary | null>(null)
  const [correctionForm, setCorrectionForm] = useState({ checkIn: '', checkOut: '', comment: '' })
  const [correctionSaving, setCorrectionSaving] = useState(false)

  // Data
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [daily, setDaily] = useState<DailySummary[]>([])
  const [period, setPeriod] = useState<PeriodRow[]>([])
  const [loading, setLoading] = useState(false)

  const [schedules, setSchedules] = useState<WorkScheduleRow[]>([])
  const [scheduleModal, setScheduleModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<WorkScheduleRow | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    type: 'Standard' as 'Standard' | 'Flexible',
    shiftStart: '09:00',
    shiftEnd: '18:00',
    requiredHoursPerDay: '8',
    color: '#6366f1',
  })
  const [scheduleSaving, setScheduleSaving] = useState(false)

  // ── Leaves ────────────────────────────────────────────────────────────────
  const [leaves, setLeaves] = useState<LeaveRow[]>([])
  const [leavesLoading, setLeavesLoading] = useState(false)
  const [selfServiceReqs, setSelfServiceReqs] = useState<SelfServiceRequestRow[]>([])
  const [selfServiceLoading, setSelfServiceLoading] = useState(false)
  const [leaveModal, setLeaveModal] = useState<'create' | null>(null)
  const [leaveSaving, setLeaveSaving] = useState(false)
  const [leaveForm, setLeaveForm] = useState<LeaveForm>({
    employeeId: '',
    leaveType: 'Vacation',
    isPaid: true,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: '',
  })

  // ── Email Report ──────────────────────────────────────────────────────────
  const [emailReportModal, setEmailReportModal] = useState(false)
  const [emailReportTo, setEmailReportTo] = useState('')
  const [emailReportSending, setEmailReportSending] = useState(false)

  const sendAttendanceReport = async () => {
    if (!token || !emailReportTo.trim()) return
    setEmailReportSending(true)
    try {
      let from = filterDailyDate
      let to = filterDailyDate
      if (tab === 'weekly') { const r = weekRange(weeklyAnchor); from = r.from; to = r.to }
      else if (tab === 'monthly') { const r = monthRange(monthlyAnchor); from = r.from; to = r.to }
      await apiRequest('/api/reports/attendance/send-email', {
        method: 'POST', token,
        body: JSON.stringify({ to: emailReportTo.trim(), from, to2: to }),
      })
      alert(`Report sent to ${emailReportTo.trim()}`)
      setEmailReportModal(false)
      setEmailReportTo('')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to send')
    } finally { setEmailReportSending(false) }
  }

  // ── Quick Assign ──────────────────────────────────────────────────────────
  const [assignSchedule, setAssignSchedule] = useState<WorkScheduleRow | null>(null)
  const [assignEmps, setAssignEmps] = useState<{ id: string; name: string; dept: string }[]>([])
  const [assignSelEmps, setAssignSelEmps] = useState<Set<string>>(new Set())
  const [assignSelDows, setAssignSelDows] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]))
  const [assignFrom, setAssignFrom] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [assignSearch, setAssignSearch] = useState('')
  const [assignSaving, setAssignSaving] = useState(false)

useEffect(() => {
    loadMeta()
  }, [])

  useEffect(() => {
    if (tab === 'daily') loadDaily()
    else if (tab === 'weekly' || tab === 'monthly') loadPeriod()
  }, [tab, filterEmployee, filterFrom, filterTo, filterDailyDate, weeklyAnchor, monthlyAnchor])

  const loadSchedules = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await apiRequest<WorkScheduleRow[]>('/api/work-schedules', { token })
      setSchedules(data)
    } catch {
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (tab === 'schedules') void loadSchedules()
  }, [tab, loadSchedules])

  const loadLeaves = useCallback(async () => {
    if (!token) return
    setLeavesLoading(true)
    setSelfServiceLoading(true)
    try {
      const [leavesData, reqsData] = await Promise.all([
        apiRequest<LeaveRow[]>('/api/leaves', { token }),
        apiRequest<SelfServiceRequestRow[]>('/api/attendance-requests?types=Vacation,Absence,Overtime', { token }),
      ])
      setLeaves(leavesData)
      setSelfServiceReqs(reqsData)
    } catch {
      setLeaves([])
      setSelfServiceReqs([])
    } finally {
      setLeavesLoading(false)
      setSelfServiceLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (tab === 'leaves') void loadLeaves()
  }, [tab, loadLeaves])

  const authOpts = { token }

  const loadMeta = async () => {
    const emps = await apiRequest<Employee[]>('/api/employees', authOpts).catch(() => [] as Employee[])
    setEmployees(emps)
  }

  const loadRecords = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterEmployee) params.set('employeeId', filterEmployee)
      if (filterFrom) params.set('from', new Date(filterFrom).toISOString())
      if (filterTo) { const d = new Date(filterTo); d.setDate(d.getDate() + 1); params.set('to', d.toISOString()) }
      const data = await apiRequest<AttendanceRecord[]>(`/api/attendance?${params}`, authOpts)
      setRecords(data)
    } finally {
      setLoading(false)
    }
  }

  function openCorrection(d: DailySummary) {
    const toLocalHHMM = (iso: string | null) => iso
      ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
      : ''
    setCorrectionForm({
      checkIn: toLocalHHMM(d.checkInUtc),
      checkOut: toLocalHHMM(d.checkOutUtc),
      comment: d.correctionComment ?? '',
    })
    setCorrectionModal(d)
  }

  async function saveCorrection() {
    if (!correctionModal || !token) return
    setCorrectionSaving(true)
    try {
      // HH:MM (local) → ISO UTC, привязанные к выбранному дню в local TZ.
      const toIsoUtc = (hhmm: string): string | null => {
        const m = hhmm.match(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
        if (!m) return null
        const d = new Date(filterDailyDate + 'T00:00:00')
        d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0)
        return d.toISOString()
      }
      await apiRequest('/api/attendance/daily/correction', {
        method: 'POST',
        token,
        body: JSON.stringify({
          employeeId: correctionModal.employeeId,
          date: new Date(filterDailyDate).toISOString(),
          checkInUtc: toIsoUtc(correctionForm.checkIn),
          checkOutUtc: toIsoUtc(correctionForm.checkOut),
          comment: correctionForm.comment.trim() || null,
        }),
      })
      setCorrectionModal(null)
      await loadDaily()
    } finally {
      setCorrectionSaving(false)
    }
  }

  async function clearCorrection() {
    if (!correctionModal || !token) return
    setCorrectionSaving(true)
    try {
      const params = new URLSearchParams({
        employeeId: correctionModal.employeeId,
        date: new Date(filterDailyDate).toISOString(),
      })
      await apiRequest(`/api/attendance/daily/correction?${params}`, { method: 'DELETE', token })
      setCorrectionModal(null)
      await loadDaily()
    } finally {
      setCorrectionSaving(false)
    }
  }

  const loadPeriod = async () => {
    setLoading(true)
    try {
      const range = tab === 'weekly' ? weekRange(weeklyAnchor) : monthRange(monthlyAnchor)
      const params = new URLSearchParams()
      if (filterEmployee) params.set('employeeId', filterEmployee)
      params.set('from', new Date(range.from + 'T00:00:00').toISOString())
      params.set('to', new Date(range.to + 'T00:00:00').toISOString())
      const data = await apiRequest<PeriodRow[]>(`/api/attendance/period?${params}`, authOpts)
      setPeriod(data)
    } finally {
      setLoading(false)
    }
  }

  const loadDaily = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterEmployee) params.set('employeeId', filterEmployee)
      if (filterDailyDate) params.set('date', new Date(filterDailyDate).toISOString())
      const data = await apiRequest<DailySummary[]>(`/api/attendance/daily?${params}`, authOpts)
      setDaily(data)
    } finally {
      setLoading(false)
    }
  }


  function openCreateSchedule() {
    setScheduleForm({
      name: '',
      type: 'Standard',
      shiftStart: '09:00',
      shiftEnd: '18:00',
      requiredHoursPerDay: '8',
      color: '#6366f1',
    })
    setEditingSchedule(null)
    setScheduleModal('create')
  }

  function openEditSchedule(s: WorkScheduleRow) {
    setEditingSchedule(s)
    setScheduleForm({
      name: s.name,
      type: (['Standard', 'Flexible'].includes(s.type) ? s.type : 'Standard') as 'Standard' | 'Flexible',
      shiftStart: timeToInput(s.shiftStart) || '09:00',
      shiftEnd: timeToInput(s.shiftEnd) || '18:00',
      requiredHoursPerDay: String(s.requiredHoursPerDay ?? 8),
      color: s.color || '#6366f1',
    })
    setScheduleModal('edit')
  }

  async function saveSchedule() {
    if (!token) return
    const name = scheduleForm.name.trim()
    if (!name) return
    setScheduleSaving(true)
    try {
      const isFlex = scheduleForm.type === 'Flexible'
      // Для Standard/Shift Norm = (end − start), считается автоматически.
      const computed = isFlex ? null : computeShiftHours(scheduleForm.shiftStart, scheduleForm.shiftEnd)
      const body = {
        name,
        type: scheduleForm.type,
        shiftStart: isFlex ? null : inputTimeToApi(scheduleForm.shiftStart),
        shiftEnd: isFlex ? null : inputTimeToApi(scheduleForm.shiftEnd),
        requiredHoursPerDay: isFlex
          ? (parseFloat(scheduleForm.requiredHoursPerDay) || 8)
          : (computed ?? 8),
        color: scheduleForm.color,
      }
      if (scheduleModal === 'create') {
        await apiRequest('/api/work-schedules', { method: 'POST', token, body: JSON.stringify(body) })
      } else if (scheduleModal === 'edit' && editingSchedule) {
        await apiRequest(`/api/work-schedules/${editingSchedule.id}`, { method: 'PUT', token, body: JSON.stringify(body) })
      }
      setScheduleModal(null)
      setEditingSchedule(null)
      await loadSchedules()
    } finally {
      setScheduleSaving(false)
    }
  }

  async function deleteSchedule() {
    if (!token || !editingSchedule) return
    setScheduleSaving(true)
    try {
      await apiRequest(`/api/work-schedules/${editingSchedule.id}`, { method: 'DELETE', token })
      setScheduleModal(null)
      setEditingSchedule(null)
      await loadSchedules()
    } finally {
      setScheduleSaving(false)
    }
  }

  async function openAssignModal(s: WorkScheduleRow) {
    setAssignSchedule(s)
    setAssignSelEmps(new Set())
    setAssignSelDows(new Set([1, 2, 3, 4, 5]))
    setAssignSearch('')
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth()
    const pad = (n: number) => String(n).padStart(2, '0')
    setAssignFrom(`${y}-${pad(m + 1)}-01`)
    const lastDay = new Date(y, m + 1, 0).getDate()
    setAssignTo(`${y}-${pad(m + 1)}-${pad(lastDay)}`)
    try {
      type EmpItem = { id: string; firstName: string; lastName: string; department?: { name: string } | null }
      const data = await apiRequest<EmpItem[]>('/api/employees?isActive=true', { token })
      setAssignEmps(data.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, dept: e.department?.name ?? '' })))
    } catch { setAssignEmps([]) }
  }

  async function doAssign() {
    if (!token || !assignSchedule || assignSelEmps.size === 0 || assignSelDows.size === 0) return
    setAssignSaving(true)
    try {
      const from = new Date(assignFrom), to = new Date(assignTo)
      const payload: { date: string; scheduleId: string; isDayOff: boolean; reset: boolean }[] = []
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay() === 0 ? 7 : d.getDay()
        if (assignSelDows.has(dow)) {
          const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          payload.push({ date: ds, scheduleId: assignSchedule.id, isDayOff: false, reset: false })
        }
      }
      if (payload.length === 0) return
      await Promise.all([...assignSelEmps].map(empId =>
        apiRequest(`/api/schedule-planner/${empId}/days`, {
          method: 'PUT', token,
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        })
      ))
      setAssignSchedule(null)
    } finally {
      setAssignSaving(false)
    }
  }

  async function createLeave() {
    if (!token || !leaveForm.employeeId) return
    setLeaveSaving(true)
    try {
      await apiRequest('/api/leaves', {
        method: 'POST', token,
        body: JSON.stringify({
          employeeId: leaveForm.employeeId,
          leaveType: leaveForm.leaveType,
          isPaid: leaveForm.isPaid,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          reason: leaveForm.reason.trim() || null,
          notes: null,
        }),
      })
      setLeaveModal(null)
      setLeaveForm({ employeeId: '', leaveType: 'Vacation', isPaid: true, startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), reason: '' })
      await loadLeaves()
    } finally {
      setLeaveSaving(false)
    }
  }

  async function approveLeave(id: string) {
    if (!token) return
    await apiRequest(`/api/leaves/${id}/approve`, { method: 'POST', token })
    await loadLeaves()
  }

  async function rejectLeave(id: string) {
    if (!token) return
    await apiRequest(`/api/leaves/${id}/reject`, { method: 'POST', token })
    await loadLeaves()
  }

  async function deleteLeave(id: string) {
    if (!token) return
    await apiRequest(`/api/leaves/${id}`, { method: 'DELETE', token })
    await loadLeaves()
  }

  async function approveSelfServiceReq(id: string) {
    if (!token) return
    await apiRequest(`/api/attendance-requests/${id}/approve`, { method: 'PUT', token })
    await loadLeaves()
  }

  async function rejectSelfServiceReq(id: string) {
    if (!token) return
    await apiRequest(`/api/attendance-requests/${id}/reject`, { method: 'PUT', token })
    await loadLeaves()
  }

  return (
    <AppLayout onAction={() => {}}>
      <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
        <div className="p-6 md:p-10 space-y-6">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
            <PageHeader
              className="p-0 border-none shadow-none bg-transparent"
              title="Time & attendance"
              description="Daily, weekly and monthly attendance reports based on device authentication logs."
            />
          </div>

          {/* Combined tab + sub-tab bar */}
          {(() => {
            const showSub = (tab === 'daily' || tab === 'weekly' || tab === 'monthly') && tab !== 'leaves' && tab !== 'schedules'
            const subTabCounts: Record<SubTab, number> = (() => {
              if (!showSub) return { all: 0, absent: 0, late: 0, early: 0, overtime: 0, incomplete: 0 }
              if (tab === 'daily') {
                return {
                  all: daily.length,
                  absent: daily.filter(d => !d.checkInUtc).length,
                  late: daily.filter(d => (d.lateMinutes ?? 0) > 0).length,
                  early: daily.filter(d => (d.earlyLeaveMinutes ?? 0) > 0).length,
                  overtime: daily.filter(d => {
                    if (!d.checkInUtc || !d.shiftStart || !d.shiftEnd) return false
                    const exp = computeShiftHours(d.shiftStart.slice(0, 5), d.shiftEnd.slice(0, 5))
                    return exp !== null && d.totalHours > exp
                  }).length,
                  incomplete: daily.filter(d => !!d.checkInUtc).length,
                }
              }
              const empMap = new Map<string, PeriodRow[]>()
              for (const r of period) {
                if (!empMap.has(r.employeeId)) empMap.set(r.employeeId, [])
                empMap.get(r.employeeId)!.push(r)
              }
              const emps = Array.from(empMap.values())
              return {
                all: emps.length,
                absent: emps.filter(rows => rows.some(r => !r.checkInUtc)).length,
                late: emps.filter(rows => rows.some(r => (r.lateMinutes ?? 0) > 0)).length,
                early: emps.filter(rows => rows.some(r => isEarlyCheckout(r))).length,
                overtime: emps.filter(rows => rows.some(r => {
                  if (!r.checkInUtc || !r.shiftStart || !r.shiftEnd) return false
                  const exp = computeShiftHours(r.shiftStart.slice(0, 5), r.shiftEnd.slice(0, 5))
                  return exp !== null && r.totalHours > exp
                })).length,
                incomplete: emps.filter(rows => rows.some(r => !!r.checkInUtc)).length,
              }
            })()
            const subLabels: Record<SubTab, string> = { all: 'All', absent: 'Absent', late: 'Late', early: 'Early', overtime: 'Overtime', incomplete: 'Check-in / out' }
            const btnBase = 'flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap'
            const btnActive = 'bg-primary text-white shadow-sm'
            const btnIdle = 'text-text-light hover:text-text-dark'
            return (
              <div className="bg-surface rounded-2xl shadow-sm p-1 w-fit max-w-full">
                {/* Main tabs row */}
                <div className="flex gap-1">
                  {(['daily', 'weekly', 'monthly', 'schedules', 'leaves'] as PageTab[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setTab(t); setSubTab('all') }}
                      className={`${btnBase} px-5 ${tab === t ? btnActive : btnIdle}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Sub-tabs row — grows from the active main tab */}
                {showSub && (
                  <>
                    <div className="h-px bg-black/[0.06] mx-1 my-1" />
                    <div className="flex gap-1">
                      {(['all', 'absent', 'late', 'early', 'overtime', 'incomplete'] as SubTab[]).map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSubTab(st)}
                          className={`${btnBase} flex items-center justify-center gap-1.5 px-3 ${subTab === st ? btnActive : btnIdle}`}
                        >
                          {subLabels[st]}
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none ${subTab === st ? 'bg-white/20' : 'bg-background-light text-text-muted'}`}>
                            {subTabCounts[st]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })()}

          {/* Filters */}
          {tab !== 'schedules' && tab !== 'leaves' && (
          <div className="bg-surface rounded-2xl p-5 shadow-sm flex flex-wrap gap-4 items-end">
            <div className="space-y-1 flex-1 min-w-[160px]">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Employee</label>
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="w-full rounded-xl bg-background-light border-none px-3 py-2 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">All employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </div>

            {tab === 'records' && (
              <>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">From</label>
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    className="rounded-xl bg-background-light border-none px-3 py-2 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">To</label>
                  <input
                    type="date"
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                    className="rounded-xl bg-background-light border-none px-3 py-2 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </>
            )}

            {tab === 'daily' && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Date</label>
                <input
                  type="date"
                  value={filterDailyDate}
                  onChange={(e) => setFilterDailyDate(e.target.value)}
                  className="rounded-xl bg-background-light border-none px-3 py-2 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            )}

            {tab === 'weekly' && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Week of</label>
                <input type="date" value={weeklyAnchor} onChange={(e) => setWeeklyAnchor(e.target.value)}
                  className="rounded-xl bg-background-light border-none px-3 py-2 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            )}

            {tab === 'monthly' && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Month</label>
                <input type="month" value={monthlyAnchor} onChange={(e) => setMonthlyAnchor(e.target.value)}
                  className="rounded-xl bg-background-light border-none px-3 py-2 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            )}

            {(tab === 'daily' || tab === 'weekly' || tab === 'monthly') && (
              <div className="flex items-end gap-2 flex-wrap">
                <Button type="button" icon="send" variant="outline" onClick={() => setEmailReportModal(true)}>
                  Send Report
                </Button>
                <Button
                  type="button"
                  icon="table_view"
                  variant="outline"
                  disabled={!!exporting}
                  onClick={() => {
                    const range = tab === 'daily'
                      ? { from: filterDailyDate, to: filterDailyDate }
                      : tab === 'weekly'
                        ? weekRange(weeklyAnchor)
                        : monthRange(monthlyAnchor)
                    const params = new URLSearchParams({ from: range.from, to: range.to })
                    if (filterEmployee) params.set('employeeId', filterEmployee)
                    downloadReport(`/api/reports/work-hours/excel?${params}`, 'excel')
                  }}
                >
                  {exporting === 'excel' ? 'Exporting...' : 'Excel'}
                </Button>
                <Button
                  type="button"
                  icon="picture_as_pdf"
                  variant="outline"
                  disabled={!!exporting}
                  onClick={() => {
                    const range = tab === 'daily'
                      ? { from: filterDailyDate, to: filterDailyDate }
                      : tab === 'weekly'
                        ? weekRange(weeklyAnchor)
                        : monthRange(monthlyAnchor)
                    const params = new URLSearchParams({ from: range.from, to: range.to })
                    if (filterEmployee) params.set('employeeId', filterEmployee)
                    downloadReport(`/api/reports/work-hours/pdf?${params}`, 'pdf')
                  }}
                >
                  {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
                </Button>
              </div>
            )}
          </div>
          )}

          {/* Schedules — company work time templates */}
          {tab === 'schedules' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-text-light max-w-xl">
                  Create templates (standard hours, shift, or flexible norm). Assign a schedule to an employee under{' '}
                  <span className="font-bold text-text-dark">People → employee → Schedule &amp; self-service</span>.
                </p>
                <Button type="button" icon="add" onClick={openCreateSchedule}>
                  New schedule
                </Button>
              </div>
              <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-black text-text-light uppercase tracking-widest">{schedules.length} schedule{schedules.length === 1 ? '' : 's'}</p>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light px-4 text-center">
                    <span className="material-symbols-outlined text-4xl">calendar_month</span>
                    <p className="text-sm">No work schedules yet. Create one to assign in employee profiles.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                          <th className="px-5 py-3 text-left">Name</th>
                          <th className="px-5 py-3 text-left">Type</th>
                          <th className="px-5 py-3 text-left">Hours</th>
                          <th className="px-5 py-3 text-left">Norm / day</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((s) => (
                          <tr key={s.id} className="border-b border-border last:border-none hover:bg-background-light transition-colors">
                            <td className="px-5 py-3 font-bold text-text-dark">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color || '#6366f1' }} />
                                {s.name}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-text-dark">{s.type}</td>
                            <td className="px-5 py-3 text-text-light text-xs">
                              {s.type === 'Flexible'
                                ? '—'
                                : `${timeToInput(s.shiftStart) || '—'} – ${timeToInput(s.shiftEnd) || '—'}`}
                            </td>
                            <td className="px-5 py-3 text-text-light">{s.requiredHoursPerDay} h</td>
                            <td className="px-5 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => openAssignModal(s)}
                                className="text-[10px] font-black uppercase tracking-wider hover:underline mr-3"
                                style={{ color: s.color || '#6366f1' }}
                              >
                                Assign
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditSchedule(s)}
                                className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline mr-3"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditingSchedule(s); setScheduleModal('delete') }}
                                className="text-[10px] font-black uppercase tracking-wider text-error-text hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Daily Report — one day, only employees with assigned schedule */}
          {tab === 'daily' && (() => {
            const filteredDaily = daily.filter(d => {
              switch (subTab) {
                case 'absent': return !d.checkInUtc
                case 'late': return (d.lateMinutes ?? 0) > 0
                case 'early': return (d.earlyLeaveMinutes ?? 0) > 0
                case 'overtime': {
                  if (!d.checkInUtc || !d.shiftStart || !d.shiftEnd) return false
                  const exp = computeShiftHours(d.shiftStart.slice(0, 5), d.shiftEnd.slice(0, 5))
                  return exp !== null && d.totalHours > exp
                }
                case 'incomplete': return !!d.checkInUtc
                default: return true
              }
            })
            return (
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <p className="text-xs font-black text-text-light uppercase tracking-widest">
                  {filteredDaily.length} employee{filteredDaily.length === 1 ? '' : 's'} on {formatDateOnly(filterDailyDate)}
                </p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                </div>
              ) : daily.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light px-4 text-center">
                  <span className="material-symbols-outlined text-4xl">event_busy</span>
                  <p className="text-sm">No employees with assigned schedule. Assign a schedule under People → employee → Schedule & self-service.</p>
                </div>
              ) : filteredDaily.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                  <p className="text-sm">No employees match this filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                        <th className="px-5 py-3 text-left">Employee</th>
                        <th className="px-5 py-3 text-left">Schedule</th>
                        <th className="px-5 py-3 text-left">Shift</th>
                        <th className="px-5 py-3 text-left">Check-in</th>
                        <th className="px-5 py-3 text-left">Check-out</th>
                        <th className="px-5 py-3 text-right">Hours</th>
                        {subTab !== 'incomplete' && <th className="px-5 py-3 text-right">Late</th>}
                        {subTab !== 'incomplete' && <th className="px-5 py-3 text-right">Early</th>}
                        {subTab === 'all' && <th className="px-5 py-3 text-right">OT</th>}
                        <th className="px-5 py-3 text-right">Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDaily.map((d) => {
                        const absent = !d.checkInUtc
                        const otHours = (() => {
                          if (!d.checkInUtc || !d.shiftStart || !d.shiftEnd) return null
                          const exp = computeShiftHours(d.shiftStart.slice(0, 5), d.shiftEnd.slice(0, 5))
                          if (exp === null) return null
                          const diff = d.totalHours - exp
                          return diff > 0 ? diff : null
                        })()
                        return (
                          <tr key={`${d.employeeId}-${d.date}`} className={`border-b border-border last:border-none hover:bg-background-light transition-colors ${absent ? 'opacity-60' : ''}`}>
                            <td className="px-5 py-3 font-bold text-text-dark">
                              {d.employeeName ?? '—'}
                              {d.corrected && <span className="ml-1 text-[9px] font-black text-amber-700 uppercase tracking-widest" title={d.correctionComment ?? 'Corrected'}>✎</span>}
                            </td>
                            <td className="px-5 py-3 text-text-light text-xs">{d.scheduleName ?? '—'}</td>
                            <td className="px-5 py-3 text-text-light font-mono text-xs">{d.shiftStart && d.shiftEnd ? `${d.shiftStart}–${d.shiftEnd}` : '—'}</td>
                            <td className="px-5 py-3 font-mono">{d.checkInUtc ? <span className="text-green-700">{formatTimeOnly(d.checkInUtc)}</span> : <span className="text-error-text font-bold">absent</span>}</td>
                            <td className="px-5 py-3 font-mono">{d.checkOutUtc ? <span className="text-blue-700">{formatTimeOnly(d.checkOutUtc)}</span> : <span className="text-text-light">—</span>}</td>
                            <td className="px-5 py-3 text-right text-text-dark">{d.totalHours.toFixed(2)}</td>
                            {subTab !== 'incomplete' && <td className="px-5 py-3 text-right">{(d.lateMinutes ?? 0) > 0 ? <span className="text-amber-700 font-bold">+{d.lateMinutes}m</span> : <span className="text-text-light">—</span>}</td>}
                            {subTab !== 'incomplete' && <td className="px-5 py-3 text-right">{(d.earlyLeaveMinutes ?? 0) > 0 ? <span className="text-orange-600 font-bold">-{d.earlyLeaveMinutes}m</span> : <span className="text-text-light">—</span>}</td>}
                            {subTab === 'all' && <td className="px-5 py-3 text-right">{otHours !== null ? <span className="text-purple-700 font-bold">+{otHours.toFixed(2)}h</span> : <span className="text-text-light">—</span>}</td>}
                            <td className="px-5 py-3 text-right">
                              <button type="button" onClick={() => openCorrection(d)} className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline">
                                Edit
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            )
          })()}


          {/* Weekly / Monthly Period Reports — per-employee per-day breakdown + totals */}
          {(tab === 'weekly' || tab === 'monthly') && (() => {
            const range = tab === 'weekly' ? weekRange(weeklyAnchor) : monthRange(monthlyAnchor)
            const byEmp = new Map<string, { name: string; rows: PeriodRow[] }>()
            for (const r of period) {
              if (!byEmp.has(r.employeeId)) byEmp.set(r.employeeId, { name: r.employeeName ?? '—', rows: [] })
              byEmp.get(r.employeeId)!.rows.push(r)
            }
            // For each employee: filter rows by subTab, then hide employee if no rows match
            const filteredEmps = Array.from(byEmp.values())
              .map(emp => ({
                ...emp,
                visibleRows: subTab === 'all' ? emp.rows : emp.rows.filter(r => rowMatchesSubTab(r, subTab)),
              }))
              .filter(emp => emp.visibleRows.length > 0)

            return (
              <div className="space-y-4">
                <div className="bg-surface rounded-2xl shadow-sm px-5 py-3 text-xs font-black text-text-light uppercase tracking-widest">
                  {formatDateOnly(range.from + 'T00:00:00')} — {formatDateOnly(range.to + 'T00:00:00')} · {filteredEmps.length} employee(s)
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                  </div>
                ) : byEmp.size === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light bg-surface rounded-2xl">
                    <span className="material-symbols-outlined text-4xl">event_busy</span>
                    <p className="text-sm">No employees with assigned schedule.</p>
                  </div>
                ) : filteredEmps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light bg-surface rounded-2xl">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                    <p className="text-sm">No employees match this filter.</p>
                  </div>
                ) : (
                  filteredEmps.map((emp) => {
                    const totalHours = emp.rows.reduce((s, r) => s + (r.totalHours ?? 0), 0)
                    const totalLate = emp.rows.reduce((s, r) => s + (r.lateMinutes ?? 0), 0)
                    const present = emp.rows.filter(r => r.checkInUtc).length
                    const totalEarly = emp.rows.filter(r => isEarlyCheckout(r)).length
                    const totalOT = emp.rows.filter(r => {
                      if (!r.checkInUtc || !r.shiftStart || !r.shiftEnd) return false
                      const exp = computeShiftHours(r.shiftStart.slice(0, 5), r.shiftEnd.slice(0, 5))
                      return exp !== null && r.totalHours > exp
                    }).length
                    return (
                      <div key={emp.name} className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-black text-text-dark">{emp.name}</p>
                          <div className="flex flex-wrap gap-4 text-[10px] font-black text-text-light uppercase tracking-widest">
                            <span>Present: <strong className="text-text-dark">{present}/{emp.rows.length}</strong></span>
                            <span>Hours: <strong className="text-text-dark">{totalHours.toFixed(2)}</strong></span>
                            {totalLate > 0 && <span>Late: <strong className="text-amber-700">{totalLate}m</strong></span>}
                            {totalEarly > 0 && <span>Early: <strong className="text-orange-600">{totalEarly}d</strong></span>}
                            {totalOT > 0 && <span>OT: <strong className="text-purple-700">{totalOT}d</strong></span>}
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                                <th className="px-5 py-2 text-left">Date</th>
                                <th className="px-5 py-2 text-left">Check-in</th>
                                <th className="px-5 py-2 text-left">Check-out</th>
                                <th className="px-5 py-2 text-right">Hours</th>
                                {subTab !== 'incomplete' && <th className="px-5 py-2 text-right">Late</th>}
                                {subTab !== 'incomplete' && <th className="px-5 py-2 text-right">Early</th>}
                                {subTab === 'all' && <th className="px-5 py-2 text-right">OT</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {emp.visibleRows.map((r) => {
                                const rowEarly = subTab !== 'incomplete' && isEarlyCheckout(r)
                                const rowOtHours = subTab === 'all' ? (() => {
                                  if (!r.checkInUtc || !r.shiftStart || !r.shiftEnd) return null
                                  const exp = computeShiftHours(r.shiftStart.slice(0, 5), r.shiftEnd.slice(0, 5))
                                  if (exp === null) return null
                                  const diff = r.totalHours - exp
                                  return diff > 0 ? diff : null
                                })() : null
                                return (
                                <tr key={r.date} className={`border-b border-border last:border-none ${!r.checkInUtc ? 'opacity-60' : ''}`}>
                                  <td className="px-5 py-2 text-text-dark">
                                    {formatDateOnly(r.date)}
                                    {r.corrected && <span className="ml-1 text-[9px] text-amber-700" title="Corrected">✎</span>}
                                  </td>
                                  <td className="px-5 py-2 font-mono">{r.checkInUtc ? <span className="text-green-700">{formatTimeOnly(r.checkInUtc)}</span> : <span className="text-error-text font-bold">absent</span>}</td>
                                  <td className="px-5 py-2 font-mono">
                                    {r.checkOutUtc
                                      ? <span className={rowEarly ? 'text-orange-600' : 'text-blue-700'}>{formatTimeOnly(r.checkOutUtc)}</span>
                                      : <span className="text-text-light">—</span>}
                                  </td>
                                  <td className="px-5 py-2 text-right text-text-dark">{r.totalHours.toFixed(2)}</td>
                                  {subTab !== 'incomplete' && <td className="px-5 py-2 text-right">{(r.lateMinutes ?? 0) > 0 ? <span className="text-amber-700 font-bold">+{r.lateMinutes}m</span> : <span className="text-text-light">—</span>}</td>}
                                  {subTab !== 'incomplete' && <td className="px-5 py-2 text-right">{rowEarly ? <span className="text-orange-600 font-bold">early</span> : <span className="text-text-light">—</span>}</td>}
                                  {subTab === 'all' && <td className="px-5 py-2 text-right">{rowOtHours !== null ? <span className="text-purple-700 font-bold">+{rowOtHours.toFixed(2)}h</span> : <span className="text-text-light">—</span>}</td>}
                                </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })()}

          {/* Leaves tab */}
          {tab === 'leaves' && (
            <div className="space-y-6">
              {/* Admin-assigned leaves */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text-dark">Admin-assigned leaves</p>
                    <p className="text-xs text-text-light">Vacations and days-off assigned by HR. Approved paid leaves count as worked days in payroll.</p>
                  </div>
                  <Button type="button" icon="add" onClick={() => setLeaveModal('create')}>
                    New leave
                  </Button>
                </div>
                <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <p className="text-xs font-black text-text-light uppercase tracking-widest">{leaves.length} leave{leaves.length === 1 ? '' : 's'}</p>
                  </div>
                  {leavesLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                    </div>
                  ) : leaves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light px-4 text-center">
                      <span className="material-symbols-outlined text-4xl">beach_access</span>
                      <p className="text-sm">No leaves yet. Create one to assign vacation or day-off to an employee.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                            <th className="px-5 py-3 text-left">Employee</th>
                            <th className="px-5 py-3 text-left">Type</th>
                            <th className="px-5 py-3 text-left">Dates</th>
                            <th className="px-5 py-3 text-left">Reason</th>
                            <th className="px-5 py-3 text-left">Status</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaves.map((lv) => (
                            <tr key={lv.id} className="border-b border-border last:border-none hover:bg-background-light transition-colors">
                              <td className="px-5 py-3 font-bold text-text-dark">
                                <p>{lv.employeeName}</p>
                                {lv.department && <p className="text-[10px] text-text-muted">{lv.department}</p>}
                              </td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${lv.leaveType === 'Vacation' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                                  {lv.leaveType === 'Vacation' ? 'Vacation' : 'Day-off'}
                                </span>
                                <span className={`ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${lv.isPaid ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                  {lv.isPaid ? 'Paid' : 'Unpaid'}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-text-light font-mono text-xs">
                                {lv.startDate} — {lv.endDate}
                              </td>
                              <td className="px-5 py-3 text-text-light text-xs max-w-[200px] truncate">{lv.reason ?? '—'}</td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  lv.status === 'Approved' ? 'bg-green-50 text-green-700' :
                                  lv.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                                  lv.status === 'Cancelled' ? 'bg-slate-100 text-slate-500' :
                                  'bg-amber-50 text-amber-700'
                                }`}>
                                  {lv.status}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right space-x-2">
                                {lv.status === 'Pending' && (
                                  <>
                                    <button type="button" onClick={() => approveLeave(lv.id)} className="text-[10px] font-black uppercase tracking-wider text-green-700 hover:underline">
                                      Approve
                                    </button>
                                    <button type="button" onClick={() => rejectLeave(lv.id)} className="text-[10px] font-black uppercase tracking-wider text-error-text hover:underline">
                                      Reject
                                    </button>
                                  </>
                                )}
                                {(lv.status === 'Rejected' || lv.status === 'Cancelled') && (
                                  <button type="button" onClick={() => deleteLeave(lv.id)} className="text-[10px] font-black uppercase tracking-wider text-error-text hover:underline">
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Self-service requests */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-bold text-text-dark">Self-service requests</p>
                  <p className="text-xs text-text-light">Vacation, absence and overtime requests submitted by employees via the self-service portal.</p>
                </div>
                <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-border">
                    <p className="text-xs font-black text-text-light uppercase tracking-widest">{selfServiceReqs.length} request{selfServiceReqs.length === 1 ? '' : 's'}</p>
                  </div>
                  {selfServiceLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                    </div>
                  ) : selfServiceReqs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light px-4 text-center">
                      <span className="material-symbols-outlined text-4xl">inbox</span>
                      <p className="text-sm">No self-service requests yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                            <th className="px-5 py-3 text-left">Employee</th>
                            <th className="px-5 py-3 text-left">Type</th>
                            <th className="px-5 py-3 text-left">From</th>
                            <th className="px-5 py-3 text-left">To</th>
                            <th className="px-5 py-3 text-left">Comment</th>
                            <th className="px-5 py-3 text-left">Status</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selfServiceReqs.map((req) => (
                            <tr key={req.id} className="border-b border-border last:border-none hover:bg-background-light transition-colors">
                              <td className="px-5 py-3 font-bold text-text-dark">{req.employeeName}</td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  req.type === 'Vacation' ? 'bg-emerald-50 text-emerald-700' :
                                  req.type === 'Overtime' ? 'bg-amber-50 text-amber-700' :
                                  'bg-blue-50 text-blue-700'
                                }`}>
                                  {req.type}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-text-light font-mono text-xs">
                                {new Date(req.requestedTimeUtc).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                              </td>
                              <td className="px-5 py-3 text-text-light font-mono text-xs">
                                {req.requestedEndTimeUtc ? new Date(req.requestedEndTimeUtc).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                              </td>
                              <td className="px-5 py-3 text-text-light text-xs max-w-[180px] truncate">{req.comment ?? '—'}</td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  req.status === 'Approved' ? 'bg-green-50 text-green-700' :
                                  req.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                                  'bg-amber-50 text-amber-700'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right space-x-2">
                                {req.status === 'Pending' && (
                                  <>
                                    <button type="button" onClick={() => approveSelfServiceReq(req.id)} className="text-[10px] font-black uppercase tracking-wider text-green-700 hover:underline">
                                      Approve
                                    </button>
                                    <button type="button" onClick={() => rejectSelfServiceReq(req.id)} className="text-[10px] font-black uppercase tracking-wider text-error-text hover:underline">
                                      Reject
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={scheduleModal === 'create' || scheduleModal === 'edit'}
        onClose={() => { setScheduleModal(null); setEditingSchedule(null) }}
        title={scheduleModal === 'create' ? 'New work schedule' : 'Edit work schedule'}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Name</label>
            <Input
              value={scheduleForm.name}
              onChange={(e) => setScheduleForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Office 9–18"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#64748b'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setScheduleForm(p => ({ ...p, color: c }))}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: scheduleForm.color === c ? '#000' : 'transparent',
                    outline: scheduleForm.color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
              <label className="w-7 h-7 rounded-full border-2 border-dashed border-black/20 flex items-center justify-center cursor-pointer hover:border-black/40 transition-colors overflow-hidden relative"
                title="Custom color">
                <input
                  type="color"
                  value={scheduleForm.color}
                  onChange={e => setScheduleForm(p => ({ ...p, color: e.target.value }))}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="material-symbols-outlined text-[14px] text-text-muted pointer-events-none">colorize</span>
              </label>
              <span className="text-xs font-mono text-text-muted ml-1">{scheduleForm.color}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Type</label>
            <select
              value={scheduleForm.type}
              onChange={(e) => setScheduleForm((p) => ({ ...p, type: e.target.value as typeof p.type }))}
              className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="Standard">Standard (fixed shift)</option>
              <option value="Flexible">Flexible (hours per day)</option>
            </select>
          </div>
          {scheduleForm.type === 'Flexible' && (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5 shrink-0">warning</span>
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong className="font-black">Flexible schedule:</strong> late arrival, early departure and overtime will <strong className="font-black">not</strong> be calculated — only total worked hours per day are tracked.
              </p>
            </div>
          )}
          {scheduleForm.type !== 'Flexible' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Shift start</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="HH:MM"
                  maxLength={5}
                  value={scheduleForm.shiftStart}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, shiftStart: maskHHMM(e.target.value) }))}
                  className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Shift end</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="HH:MM"
                  maxLength={5}
                  value={scheduleForm.shiftEnd}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, shiftEnd: maskHHMM(e.target.value) }))}
                  className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">
              {scheduleForm.type === 'Flexible' ? 'Required hours per day' : 'Norm (hours / day, computed from shift)'}
            </label>
            {scheduleForm.type === 'Flexible' ? (
              <Input
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={scheduleForm.requiredHoursPerDay}
                onChange={(e) => setScheduleForm((p) => ({ ...p, requiredHoursPerDay: e.target.value }))}
              />
            ) : (
              <Input
                type="text"
                value={(() => {
                  const h = computeShiftHours(scheduleForm.shiftStart, scheduleForm.shiftEnd)
                  return h !== null ? `${h.toFixed(2)} h` : '—'
                })()}
                readOnly
                className="opacity-70 cursor-not-allowed"
              />
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => { setScheduleModal(null); setEditingSchedule(null) }}>Cancel</Button>
            <Button fullWidth isLoading={scheduleSaving} onClick={saveSchedule} disabled={!scheduleForm.name.trim()}>
              {scheduleModal === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={scheduleModal === 'delete'}
        onClose={() => { setScheduleModal(null); setEditingSchedule(null) }}
        title="Delete schedule"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-text-dark">
            Delete <strong>{editingSchedule?.name}</strong>? Employees using this schedule will need another one assigned.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => { setScheduleModal(null); setEditingSchedule(null) }}>Cancel</Button>
            <Button variant="danger" fullWidth isLoading={scheduleSaving} onClick={deleteSchedule}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={correctionModal !== null}
        onClose={() => setCorrectionModal(null)}
        title={`Correct attendance — ${correctionModal?.employeeName ?? ''}`}
      >
        <div className="space-y-4 pt-2">
          <p className="text-[11px] text-text-light">
            Date: <strong className="text-text-dark">{correctionModal ? formatDateOnly(correctionModal.date) : ''}</strong>.
            Override raw device authentications. Leave empty to keep auto value.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Check-in (HH:MM)</label>
              <input
                type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5}
                value={correctionForm.checkIn}
                onChange={(e) => setCorrectionForm((p) => ({ ...p, checkIn: maskHHMM(e.target.value) }))}
                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold font-mono text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Check-out (HH:MM)</label>
              <input
                type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5}
                value={correctionForm.checkOut}
                onChange={(e) => setCorrectionForm((p) => ({ ...p, checkOut: maskHHMM(e.target.value) }))}
                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold font-mono text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Comment</label>
            <input
              type="text" placeholder="Reason for the correction"
              value={correctionForm.comment}
              onChange={(e) => setCorrectionForm((p) => ({ ...p, comment: e.target.value }))}
              className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setCorrectionModal(null)}>Cancel</Button>
            {correctionModal?.corrected && (
              <Button variant="danger" fullWidth isLoading={correctionSaving} onClick={clearCorrection}>Reset</Button>
            )}
            <Button fullWidth isLoading={correctionSaving} onClick={saveCorrection}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={leaveModal === 'create'}
        onClose={() => setLeaveModal(null)}
        title="New leave"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Employee</label>
            <select
              value={leaveForm.employeeId}
              onChange={(e) => setLeaveForm(p => ({ ...p, employeeId: e.target.value }))}
              className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">Select employee…</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Leave type</label>
              <select
                value={leaveForm.leaveType}
                onChange={(e) => setLeaveForm(p => ({ ...p, leaveType: e.target.value as 'Vacation' | 'DayOff' }))}
                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="Vacation">Vacation</option>
                <option value="DayOff">Day-off (отгул)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Payment</label>
              <label className="flex items-center gap-2 h-10 px-3 rounded-xl bg-background-light cursor-pointer">
                <input
                  type="checkbox"
                  checked={leaveForm.isPaid}
                  onChange={(e) => setLeaveForm(p => ({ ...p, isPaid: e.target.checked }))}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm font-bold text-text-dark">Paid</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Start date</label>
              <input
                type="date"
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm(p => ({ ...p, startDate: e.target.value }))}
                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">End date</label>
              <input
                type="date"
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm(p => ({ ...p, endDate: e.target.value }))}
                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Reason (optional)</label>
            <input
              type="text"
              placeholder="e.g. Annual vacation, personal"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
              className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setLeaveModal(null)}>Cancel</Button>
            <Button fullWidth isLoading={leaveSaving} onClick={createLeave} disabled={!leaveForm.employeeId}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Quick Assign Modal ── */}
      {assignSchedule && (() => {
        const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const filtered = assignEmps.filter(e =>
          e.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
          e.dept.toLowerCase().includes(assignSearch.toLowerCase())
        )
        const allSelected = filtered.length > 0 && filtered.every(e => assignSelEmps.has(e.id))

        const toggleEmp = (id: string) =>
          setAssignSelEmps(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
        const toggleDow = (d: number) =>
          setAssignSelDows(prev => { const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n })
        const toggleAll = () =>
          setAssignSelEmps(prev => {
            const n = new Set(prev)
            if (allSelected) { filtered.forEach(e => n.delete(e.id)) }
            else { filtered.forEach(e => n.add(e.id)) }
            return n
          })

        // count matching dates
        let dateCount = 0
        if (assignFrom && assignTo) {
          const from = new Date(assignFrom), to = new Date(assignTo)
          for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
            const dow = d.getDay() === 0 ? 7 : d.getDay()
            if (assignSelDows.has(dow)) dateCount++
          }
        }
        const canAssign = assignSelEmps.size > 0 && assignSelDows.size > 0 && dateCount > 0

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
            onClick={() => setAssignSchedule(null)}>
            <div className="bg-surface rounded-3xl shadow-2xl w-[760px] max-h-[88vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-black/[0.07] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: assignSchedule.color }} />
                  <div>
                    <h2 className="text-base font-black text-text-dark">Assign "{assignSchedule.name}"</h2>
                    <p className="text-[11px] text-text-muted">
                      {assignSchedule.shiftStart && assignSchedule.shiftEnd
                        ? `${assignSchedule.shiftStart} – ${assignSchedule.shiftEnd}`
                        : `Flexible · ${assignSchedule.requiredHoursPerDay} h/day`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setAssignSchedule(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-black/[0.06] text-text-muted">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-1 min-h-0">

                {/* Left — Employees */}
                <div className="flex flex-col w-[420px] border-r border-black/[0.07] min-h-0">
                  <div className="px-4 py-3 border-b border-black/[0.06] shrink-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                        Employees
                        {assignSelEmps.size > 0 && (
                          <span className="ml-2 text-primary bg-primary/10 px-1.5 py-0.5 rounded font-black">{assignSelEmps.size}</span>
                        )}
                      </span>
                      <button onClick={toggleAll}
                        className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline">
                        {allSelected ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[14px]">search</span>
                      <input type="text" placeholder="Search…" value={assignSearch}
                        onChange={e => setAssignSearch(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-xs bg-black/[0.04] rounded-xl border border-black/10 outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {assignEmps.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-text-muted text-sm">Loading…</div>
                    ) : filtered.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-text-muted text-sm">No employees match</div>
                    ) : filtered.map(e => {
                      const sel = assignSelEmps.has(e.id)
                      return (
                        <label key={e.id}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-black/[0.04] last:border-none
                            ${sel ? 'bg-primary/5' : 'hover:bg-black/[0.03]'}`}>
                          <input type="checkbox" checked={sel} onChange={() => toggleEmp(e.id)}
                            className="w-4 h-4 rounded accent-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${sel ? 'text-primary' : 'text-text-dark'}`}>{e.name}</p>
                            {e.dept && <p className="text-[10px] text-text-muted truncate">{e.dept}</p>}
                          </div>
                          {sel && <span className="material-symbols-outlined text-primary text-[16px] shrink-0">check_circle</span>}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Right — Settings */}
                <div className="flex-1 flex flex-col p-5 gap-5 overflow-y-auto">

                  {/* Days of week */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Days of week</p>
                    <div className="grid grid-cols-7 gap-1.5">
                      {DOW_LABELS.map((label, i) => {
                        const dow = i + 1
                        const sel = assignSelDows.has(dow)
                        const isWeekend = dow >= 6
                        return (
                          <button key={dow} type="button" onClick={() => toggleDow(dow)}
                            className={`rounded-xl py-2.5 text-[11px] font-black transition-all border
                              ${sel
                                ? isWeekend
                                  ? 'bg-rose-500 border-rose-500 text-white'
                                  : 'border-transparent text-white'
                                : isWeekend
                                  ? 'bg-rose-50 border-rose-100 text-rose-400'
                                  : 'bg-black/[0.04] border-transparent text-text-muted hover:bg-black/[0.08]'}`}
                            style={sel && !isWeekend ? { backgroundColor: assignSchedule.color, borderColor: assignSchedule.color } : {}}>
                            {label}
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setAssignSelDows(new Set([1,2,3,4,5]))}
                        className="text-[10px] font-black text-text-muted hover:text-text-dark transition-colors">Weekdays</button>
                      <span className="text-text-muted/40">·</span>
                      <button onClick={() => setAssignSelDows(new Set([6,7]))}
                        className="text-[10px] font-black text-text-muted hover:text-text-dark transition-colors">Weekends</button>
                      <span className="text-text-muted/40">·</span>
                      <button onClick={() => setAssignSelDows(new Set([1,2,3,4,5,6,7]))}
                        className="text-[10px] font-black text-text-muted hover:text-text-dark transition-colors">All</button>
                    </div>
                  </div>

                  {/* Date range */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Date range</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-text-muted font-bold">From</label>
                        <input type="date" value={assignFrom} onChange={e => setAssignFrom(e.target.value)}
                          className="w-full rounded-xl bg-black/[0.04] border border-black/10 px-3 py-2 text-sm font-bold text-text-dark outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-text-muted font-bold">To</label>
                        <input type="date" value={assignTo} onChange={e => setAssignTo(e.target.value)}
                          className="w-full rounded-xl bg-black/[0.04] border border-black/10 px-3 py-2 text-sm font-bold text-text-dark outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {canAssign && (
                    <div className="rounded-2xl px-4 py-3 text-[11px] font-bold" style={{ backgroundColor: assignSchedule.color + '15', color: assignSchedule.color }}>
                      Will assign <strong>{dateCount}</strong> day{dateCount !== 1 ? 's' : ''} to{' '}
                      <strong>{assignSelEmps.size}</strong> employee{assignSelEmps.size !== 1 ? 's' : ''}{' '}
                      → <strong>{assignSelEmps.size * dateCount}</strong> total assignments
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-black/[0.07] flex gap-3 shrink-0">
                <button onClick={() => setAssignSchedule(null)}
                  className="flex-1 py-2.5 text-sm font-bold text-text-muted bg-black/[0.05] rounded-2xl hover:bg-black/[0.08] transition-colors">
                  Cancel
                </button>
                <button onClick={doAssign} disabled={!canAssign || assignSaving}
                  className="flex-1 py-2.5 text-sm font-bold text-white rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ backgroundColor: assignSchedule.color }}>
                  {assignSaving && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                  {assignSaving ? 'Assigning…' : `Assign to ${assignSelEmps.size || '?'} employee${assignSelEmps.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {emailReportModal && (
        <Modal isOpen title="Send Attendance Report" onClose={() => { setEmailReportModal(false); setEmailReportTo('') }}>
          <div className="space-y-4">
            <p className="text-xs text-text-light">
              The report for the selected {tab === 'daily' ? 'day' : tab === 'weekly' ? 'week' : 'month'} will be sent as an HTML email.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-light uppercase tracking-widest">Recipient email</label>
              <Input
                type="email"
                placeholder="manager@company.com"
                value={emailReportTo}
                onChange={e => setEmailReportTo(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button fullWidth onClick={sendAttendanceReport} isLoading={emailReportSending} disabled={!emailReportTo.trim()}>
                Send
              </Button>
              <Button fullWidth variant="outline" onClick={() => { setEmailReportModal(false); setEmailReportTo('') }} disabled={emailReportSending}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
