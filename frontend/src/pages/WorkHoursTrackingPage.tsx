import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  normHours: number
  overtimeHours: number
  isDayOff: boolean
  isAbsent: boolean
  lateMinutes: number | null
  earlyLeaveMinutes: number | null
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
  normHours: number
  overtimeHours: number
  isDayOff: boolean
  isAbsent: boolean
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

/** Десятичные часы → "Hh Mm" (9.5 → "9h 30m", 0.5 → "30m", 9 → "9h"). */
function formatHM(hours: number): string {
  const totalMin = Math.round(hours * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0 && m === 0) return '0m'
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

interface WorkScheduleShiftRow {
  id?: string
  name: string
  shiftStart: string // "HH:MM"
  shiftEnd: string
  validEntryFrom: string // "HH:MM"
  validEntryTo: string
  requiredHoursPerDay: number
  sortOrder: number
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
  shifts?: WorkScheduleShiftRow[]
  countEarlyArrival?: boolean
  overtimeDailyThresholdMinutes?: number
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
  if (r.isDayOff) return st === 'all'
  switch (st) {
    case 'absent': return r.isAbsent
    case 'late': return (r.lateMinutes ?? 0) > 0
    case 'early': return (r.earlyLeaveMinutes ?? 0) > 0
    case 'overtime': return r.overtimeHours > 0
    case 'incomplete': return !!r.checkInUtc && !r.checkOutUtc
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
  const { t } = useTranslation()
  const { token } = useAuth()
  const { exporting, downloadReport } = useExportReport(token)
  const [tab, setTab] = useState<PageTab>('daily')
  const [subTab, setSubTab] = useState<SubTab>('all')

  // Filters
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10)
  })
  const [filterTo] = useState(() => new Date().toISOString().slice(0, 10))
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
  const [daily, setDaily] = useState<DailySummary[]>([])
  const [period, setPeriod] = useState<PeriodRow[]>([])
  const [loading, setLoading] = useState(false)

  const [schedules, setSchedules] = useState<WorkScheduleRow[]>([])
  const [scheduleModal, setScheduleModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<WorkScheduleRow | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    type: 'Standard' as 'Standard' | 'Flexible' | 'Multi' | 'Off',
    shiftStart: '09:00',
    shiftEnd: '18:00',
    requiredHoursPerDay: '8',
    color: '#6366f1',
    countEarlyArrival: true,
    overtimeDailyThresholdMinutes: '0',
  })
  const [scheduleShifts, setScheduleShifts] = useState<WorkScheduleShiftRow[]>([])
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
      alert(t('workHours.reportSentTo', { email: emailReportTo.trim() }))
      setEmailReportModal(false)
      setEmailReportTo('')
    } catch (e) {
      alert(e instanceof Error ? e.message : t('workHours.failedToSend'))
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
  const [assignSuccessCount, setAssignSuccessCount] = useState(0)
  const [assignLastDows, setAssignLastDows] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]))
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignRemoveMode, setAssignRemoveMode] = useState(false)
  useEffect(() => {
    if (assignSuccessCount > 0) { const t = setTimeout(() => setAssignSuccessCount(0), 3000); return () => clearTimeout(t) }
  }, [assignSuccessCount])

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
      countEarlyArrival: true,
      overtimeDailyThresholdMinutes: '0',
    })
    setScheduleShifts([])
    setEditingSchedule(null)
    setScheduleModal('create')
  }

  function openEditSchedule(s: WorkScheduleRow) {
    setEditingSchedule(s)
    setScheduleForm({
      name: s.name,
      type: (['Standard', 'Flexible', 'Multi', 'Off'].includes(s.type) ? s.type : 'Standard') as 'Standard' | 'Flexible' | 'Multi' | 'Off',
      shiftStart: timeToInput(s.shiftStart) || '09:00',
      shiftEnd: timeToInput(s.shiftEnd) || '18:00',
      requiredHoursPerDay: String(s.requiredHoursPerDay ?? 8),
      color: s.color || '#6366f1',
      countEarlyArrival: s.countEarlyArrival ?? true,
      overtimeDailyThresholdMinutes: String(s.overtimeDailyThresholdMinutes ?? 0),
    })
    // Load sub-shifts for Multi schedules
    setScheduleShifts(s.shifts?.map(sh => ({
      id: sh.id,
      name: sh.name,
      shiftStart: sh.shiftStart,
      shiftEnd: sh.shiftEnd,
      validEntryFrom: sh.validEntryFrom,
      validEntryTo: sh.validEntryTo,
      requiredHoursPerDay: sh.requiredHoursPerDay,
      sortOrder: sh.sortOrder,
    })) ?? [])
    setScheduleModal('edit')
  }

  async function saveSchedule() {
    if (!token) return
    const name = scheduleForm.name.trim()
    if (!name) return
    setScheduleSaving(true)
    try {
      const isFlex = scheduleForm.type === 'Flexible'
      const isMulti = scheduleForm.type === 'Multi'
      const isOff = scheduleForm.type === 'Off'
      // Для Standard/Shift Norm = (end − start), считается автоматически.
      const computed = (isFlex || isMulti || isOff) ? null : computeShiftHours(scheduleForm.shiftStart, scheduleForm.shiftEnd)
      const body: Record<string, unknown> = {
        name,
        type: scheduleForm.type,
        shiftStart: (isFlex || isMulti || isOff) ? null : inputTimeToApi(scheduleForm.shiftStart),
        shiftEnd: (isFlex || isMulti || isOff) ? null : inputTimeToApi(scheduleForm.shiftEnd),
        requiredHoursPerDay: isFlex
          ? (parseFloat(scheduleForm.requiredHoursPerDay) || 8)
          : (isMulti || isOff)
            ? 0
            : (computed ?? 8),
        color: scheduleForm.color,
        countEarlyArrival: scheduleForm.countEarlyArrival,
        overtimeDailyThresholdMinutes: Math.max(0, parseInt(scheduleForm.overtimeDailyThresholdMinutes, 10) || 0),
      }
      if (isMulti) {
        body.shifts = scheduleShifts.map((sh, idx) => ({
          name: sh.name,
          shiftStart: inputTimeToApi(sh.shiftStart),
          shiftEnd: inputTimeToApi(sh.shiftEnd),
          validEntryFrom: inputTimeToApi(sh.validEntryFrom),
          validEntryTo: inputTimeToApi(sh.validEntryTo),
          requiredHoursPerDay: sh.requiredHoursPerDay,
          sortOrder: idx,
        }))
      }
      if (scheduleModal === 'create') {
        await apiRequest('/api/work-schedules', { method: 'POST', token, body: JSON.stringify(body) })
      } else if (scheduleModal === 'edit' && editingSchedule) {
        await apiRequest(`/api/work-schedules/${editingSchedule.id}`, { method: 'PUT', token, body: JSON.stringify(body) })
      }
      setScheduleModal(null)
      setEditingSchedule(null)
      setScheduleShifts([])
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
    setAssignSearch('')
    setAssignError(null)
    setAssignRemoveMode(false)
    try {
      type EmpItem = { id: string; firstName: string; lastName: string; department?: { name: string } | null }
      type AssignmentState = { employeeIds: string[]; fromDate: string | null; toDate: string | null; daysOfWeek: number[] }

      const [empData, state] = await Promise.all([
        apiRequest<EmpItem[]>('/api/employees?isActive=true', { token }),
        apiRequest<AssignmentState>(`/api/work-schedules/${s.id}/assignment`, { token }),
      ])

      setAssignEmps(empData.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, dept: e.department?.name ?? '' })))
      setAssignSelEmps(new Set(state.employeeIds))

      // Days of week derived from actual patterns in DB (always accurate after clean overwrite)
      const dows = state.daysOfWeek.length > 0 ? state.daysOfWeek : [1, 2, 3, 4, 5]
      setAssignSelDows(new Set(dows))
      setAssignLastDows(new Set(dows))

      // Date range: from actual pattern min/max dates, or default to current month
      if (state.fromDate && state.toDate) {
        setAssignFrom(state.fromDate)
        setAssignTo(state.toDate)
      } else {
        const now = new Date()
        const y = now.getFullYear(), mo = now.getMonth()
        const pad = (n: number) => String(n).padStart(2, '0')
        setAssignFrom(`${y}-${pad(mo + 1)}-01`)
        setAssignTo(`${y}-${pad(mo + 1)}-${pad(new Date(y, mo + 1, 0).getDate())}`)
      }
    } catch {
      setAssignEmps([])
      setAssignSelEmps(new Set())
      setAssignSelDows(new Set(assignLastDows))
      const now = new Date()
      const y = now.getFullYear(), mo = now.getMonth()
      const pad = (n: number) => String(n).padStart(2, '0')
      setAssignFrom(`${y}-${pad(mo + 1)}-01`)
      setAssignTo(`${y}-${pad(mo + 1)}-${pad(new Date(y, mo + 1, 0).getDate())}`)
    }
  }

  async function doAssign() {
    if (!token || !assignSchedule || assignSelEmps.size === 0) return
    if (!assignRemoveMode && assignSelDows.size === 0) return
    setAssignSaving(true)
    setAssignError(null)
    try {
      const empIds = [...assignSelEmps]

      if (assignRemoveMode) {
        // Remove mode: clear WorkScheduleId + delete all day patterns via backend (one call).
        // Backend handles deleting all patterns when scheduleId = null.
        await apiRequest('/api/employees/bulk-schedule', {
          method: 'PUT', token,
          body: JSON.stringify({ employeeIds: empIds, scheduleId: null }),
        })
      } else {
        // Assign mode: build day-pattern payload for the date range + days of week
        const parseLocal = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
        const from = parseLocal(assignFrom), to = parseLocal(assignTo)
        const pad = (n: number) => String(n).padStart(2, '0')
        const days: { date: string; scheduleId: string; isDayOff: boolean; reset: boolean }[] = []
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
          const dow = d.getDay() === 0 ? 7 : d.getDay()
          if (assignSelDows.has(dow)) {
            const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
            days.push({ date: ds, scheduleId: assignSchedule.id, isDayOff: false, reset: false })
          }
        }
        if (days.length === 0) { setAssignError(t('workHours.noDatesMatch')); return }

        // Set WorkScheduleId for all employees
        await apiRequest('/api/employees/bulk-schedule', {
          method: 'PUT', token,
          body: JSON.stringify({ employeeIds: empIds, scheduleId: assignSchedule.id }),
        })
        // Delete old patterns for this schedule and write fresh ones (clean overwrite)
        await apiRequest('/api/schedule-planner/bulk-days', {
          method: 'PUT', token,
          body: JSON.stringify({ employeeIds: empIds, days, replaceScheduleId: assignSchedule.id }),
        })
        setAssignLastDows(new Set(assignSelDows))
      }

      setAssignSuccessCount(assignSelEmps.size)
      setAssignError(null)
      setAssignSchedule(null)
      setAssignRemoveMode(false)
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : t('workHours.assignmentFailed'))
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
              title={t('workHours.pageTitle')}
              description={t('workHours.pageDescription')}
            />
          </div>

          {/* Combined tab + sub-tab bar */}
          {(() => {
            const showSub = tab === 'daily' || tab === 'weekly' || tab === 'monthly'
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
            const subLabels: Record<SubTab, string> = {
              all: t('common.all'),
              absent: t('workHours.subTabAbsent'),
              late: t('workHours.subTabLate'),
              early: t('workHours.subTabEarly'),
              overtime: t('workHours.subTabOvertime'),
              incomplete: t('workHours.subTabIncomplete'),
            }
            const tabLabels: Record<PageTab, string> = {
              daily: t('workHours.tabDaily'),
              weekly: t('workHours.tabWeekly'),
              monthly: t('workHours.tabMonthly'),
              schedules: t('workHours.tabSchedules'),
              leaves: t('workHours.tabLeaves'),
            }
            const btnBase = 'flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap'
            const btnActive = 'bg-primary text-white shadow-sm'
            const btnIdle = 'text-text-light hover:text-text-dark'
            return (
              <div className="bg-surface rounded-2xl shadow-sm p-1 w-fit max-w-full">
                {/* Main tabs row */}
                <div className="flex gap-1">
                  {(['daily', 'weekly', 'monthly', 'schedules', 'leaves'] as PageTab[]).map(tt => (
                    <button
                      key={tt}
                      type="button"
                      onClick={() => { setTab(tt); setSubTab('all') }}
                      className={`${btnBase} px-5 ${tab === tt ? btnActive : btnIdle}`}
                    >
                      {tabLabels[tt]}
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
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.employee')}</label>
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="w-full rounded-xl bg-background-light border-none px-3 py-2 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">{t('workHours.allEmployees')}</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </div>

            {tab === 'daily' && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('common.date')}</label>
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
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.weekOf')}</label>
                <input type="date" value={weeklyAnchor} onChange={(e) => setWeeklyAnchor(e.target.value)}
                  className="rounded-xl bg-background-light border-none px-3 py-2 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            )}

            {tab === 'monthly' && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.month')}</label>
                <input type="month" value={monthlyAnchor} onChange={(e) => setMonthlyAnchor(e.target.value)}
                  className="rounded-xl bg-background-light border-none px-3 py-2 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            )}

            {(tab === 'daily' || tab === 'weekly' || tab === 'monthly') && (
              <div className="flex items-end gap-2 flex-wrap">
                <Button type="button" icon="send" variant="outline" onClick={() => setEmailReportModal(true)}>
                  {t('workHours.sendReport')}
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
                  {exporting === 'excel' ? t('workHours.exporting') : t('workHours.excel')}
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
                  {exporting === 'pdf' ? t('workHours.exporting') : t('workHours.pdf')}
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
                  {t('workHours.schedulesIntroPrefix')}{' '}
                  <span className="font-bold text-text-dark">{t('workHours.schedulesIntroPath')}</span>.
                </p>
                <Button type="button" icon="add" onClick={openCreateSchedule}>
                  {t('workHours.newSchedule')}
                </Button>
              </div>
              <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-black text-text-light uppercase tracking-widest">{t('workHours.schedulesCount', { count: schedules.length })}</p>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light px-4 text-center">
                    <span className="material-symbols-outlined text-4xl">calendar_month</span>
                    <p className="text-sm">{t('workHours.noSchedulesYet')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                          <th className="px-5 py-3 text-left">{t('common.name')}</th>
                          <th className="px-5 py-3 text-left">{t('common.type')}</th>
                          <th className="px-5 py-3 text-left">{t('workHours.hours')}</th>
                          <th className="px-5 py-3 text-left">{t('workHours.normPerDay')}</th>
                          <th className="px-5 py-3 text-right">{t('common.actions')}</th>
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
                            <td className="px-5 py-3 text-text-dark">{t(`workHours.scheduleType.${s.type}`, { defaultValue: s.type })}</td>
                            <td className="px-5 py-3 text-text-light text-xs">
                              {s.type === 'Flexible'
                                ? '—'
                                : s.type === 'Multi'
                                  ? (s.shifts && s.shifts.length > 0
                                    ? s.shifts.map(sh => `${sh.name} ${sh.shiftStart}–${sh.shiftEnd}`).join(', ')
                                    : '—')
                                  : `${timeToInput(s.shiftStart) || '—'} – ${timeToInput(s.shiftEnd) || '—'}`}
                            </td>
                            <td className="px-5 py-3 text-text-light">
                              {s.type === 'Multi' && s.shifts && s.shifts.length > 0
                                ? s.shifts.map(sh => `${sh.name}: ${sh.requiredHoursPerDay}h`).join(', ')
                                : `${s.requiredHoursPerDay} h`}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => openAssignModal(s)}
                                className="text-[10px] font-black uppercase tracking-wider hover:underline mr-3"
                                style={{ color: s.color || '#6366f1' }}
                              >
                                {t('workHours.assign')}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditSchedule(s)}
                                className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline mr-3"
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditingSchedule(s); setScheduleModal('delete') }}
                                className="text-[10px] font-black uppercase tracking-wider text-error-text hover:underline"
                              >
                                {t('common.delete')}
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
              if (d.isDayOff) return subTab === 'all'
              switch (subTab) {
                case 'absent': return d.isAbsent
                case 'late': return (d.lateMinutes ?? 0) > 0
                case 'early': return (d.earlyLeaveMinutes ?? 0) > 0
                case 'overtime': return d.overtimeHours > 0
                case 'incomplete': return !!d.checkInUtc && !d.checkOutUtc
                default: return true
              }
            })
            return (
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <p className="text-xs font-black text-text-light uppercase tracking-widest">
                  {t('workHours.employeesOnDate', { count: filteredDaily.length, date: formatDateOnly(filterDailyDate) })}
                </p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                </div>
              ) : daily.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light px-4 text-center">
                  <span className="material-symbols-outlined text-4xl">event_busy</span>
                  <p className="text-sm">{t('workHours.noEmployeesWithSchedule')}</p>
                </div>
              ) : filteredDaily.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                  <p className="text-sm">{t('workHours.noEmployeesMatchFilter')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                        <th className="px-5 py-3 text-left">{t('workHours.employee')}</th>
                        <th className="px-5 py-3 text-left">{t('workHours.schedule')}</th>
                        <th className="px-5 py-3 text-left">{t('workHours.shift')}</th>
                        <th className="px-5 py-3 text-left">{t('workHours.checkIn')}</th>
                        <th className="px-5 py-3 text-left">{t('workHours.checkOut')}</th>
                        <th className="px-5 py-3 text-right">{t('workHours.actual')}</th>
                        <th className="px-5 py-3 text-right">{t('workHours.norm')}</th>
                        {subTab !== 'incomplete' && <th className="px-5 py-3 text-right">{t('workHours.late')}</th>}
                        {subTab !== 'incomplete' && <th className="px-5 py-3 text-right">{t('workHours.early')}</th>}
                        {subTab !== 'incomplete' && <th className="px-5 py-3 text-right">{t('workHours.ot')}</th>}
                        <th className="px-5 py-3 text-right">{t('common.edit')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDaily.map((d) => (
                        <tr key={`${d.employeeId}-${d.date}`} className={`border-b border-border last:border-none hover:bg-background-light transition-colors ${d.isAbsent ? 'opacity-60' : ''}`}>
                          <td className="px-5 py-3 font-bold text-text-dark">
                            {d.employeeName ?? '—'}
                            {d.corrected && <span className="ml-1 text-[9px] font-black text-amber-700 uppercase tracking-widest" title={d.correctionComment ?? t('workHours.corrected')}>✎</span>}
                          </td>
                          <td className="px-5 py-3 text-text-light text-xs">
                            {d.isDayOff ? <span className="text-slate-400 italic">{t('workHours.dayOff')}</span> : (d.scheduleName ?? '—')}
                          </td>
                          <td className="px-5 py-3 text-text-light font-mono text-xs">{d.shiftStart && d.shiftEnd ? `${d.shiftStart}–${d.shiftEnd}` : '—'}</td>
                          <td className="px-5 py-3 font-mono">
                            {d.isDayOff ? <span className="text-slate-400">—</span>
                              : d.checkInUtc ? <span className="text-green-700">{formatTimeOnly(d.checkInUtc)}</span>
                              : <span className="text-error-text font-bold">{t('workHours.absent')}</span>}
                          </td>
                          <td className="px-5 py-3 font-mono">{d.checkOutUtc ? <span className="text-blue-700">{formatTimeOnly(d.checkOutUtc)}</span> : <span className="text-text-light">—</span>}</td>
                          <td className="px-5 py-3 text-right font-mono text-text-dark">{d.totalHours > 0 ? formatHM(d.totalHours) : <span className="text-text-light">—</span>}</td>
                          <td className="px-5 py-3 text-right font-mono text-text-light">{d.normHours > 0 ? formatHM(d.normHours) : '—'}</td>
                          {subTab !== 'incomplete' && <td className="px-5 py-3 text-right">{(d.lateMinutes ?? 0) > 0 ? <span className="text-amber-700 font-bold">+{d.lateMinutes}m</span> : <span className="text-text-light">—</span>}</td>}
                          {subTab !== 'incomplete' && <td className="px-5 py-3 text-right">{(d.earlyLeaveMinutes ?? 0) > 0 ? <span className="text-orange-600 font-bold">-{d.earlyLeaveMinutes}m</span> : <span className="text-text-light">—</span>}</td>}
                          {subTab !== 'incomplete' && <td className="px-5 py-3 text-right">{d.overtimeHours > 0 ? <span className="text-purple-700 font-bold">+{formatHM(d.overtimeHours)}</span> : <span className="text-text-light">—</span>}</td>}
                          <td className="px-5 py-3 text-right">
                            <button type="button" onClick={() => openCorrection(d)} className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline">{t('common.edit')}</button>
                          </td>
                        </tr>
                      ))}
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
                  {formatDateOnly(range.from + 'T00:00:00')} — {formatDateOnly(range.to + 'T00:00:00')} · {t('workHours.employeesCount', { count: filteredEmps.length })}
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                  </div>
                ) : byEmp.size === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light bg-surface rounded-2xl">
                    <span className="material-symbols-outlined text-4xl">event_busy</span>
                    <p className="text-sm">{t('workHours.noEmployeesAssignedShort')}</p>
                  </div>
                ) : filteredEmps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light bg-surface rounded-2xl">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                    <p className="text-sm">{t('workHours.noEmployeesMatchFilter')}</p>
                  </div>
                ) : (
                  filteredEmps.map((emp) => {
                    const workRows = emp.rows.filter(r => !r.isDayOff)
                    const present = workRows.filter(r => r.checkInUtc).length
                    const absent = workRows.filter(r => r.isAbsent).length
                    const totalActual = emp.rows.reduce((s, r) => s + r.totalHours, 0)
                    const totalNorm = workRows.reduce((s, r) => s + r.normHours, 0)
                    const totalOT = emp.rows.reduce((s, r) => s + r.overtimeHours, 0)
                    const totalLate = emp.rows.reduce((s, r) => s + (r.lateMinutes ?? 0), 0)
                    const totalEarlyDays = emp.rows.filter(r => (r.earlyLeaveMinutes ?? 0) > 0).length
                    const deficit = Math.max(0, totalNorm - totalActual - totalOT)
                    return (
                      <div key={emp.name} className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-black text-text-dark">{emp.name}</p>
                          <div className="flex flex-wrap gap-4 text-[10px] font-black text-text-light uppercase tracking-widest">
                            <span>{t('workHours.present')}: <strong className="text-text-dark">{present}/{workRows.length}</strong></span>
                            {absent > 0 && <span>{t('workHours.absentLabel')}: <strong className="text-error-text">{absent}d</strong></span>}
                            <span>{t('workHours.actual')}: <strong className="text-text-dark">{formatHM(totalActual)}</strong></span>
                            <span>{t('workHours.norm')}: <strong className="text-text-dark">{formatHM(totalNorm)}</strong></span>
                            {totalOT > 0 && <span>{t('workHours.ot')}: <strong className="text-purple-700">+{formatHM(totalOT)}</strong></span>}
                            {deficit > 0.05 && <span>{t('workHours.deficit')}: <strong className="text-red-600">-{formatHM(deficit)}</strong></span>}
                            {totalLate > 0 && <span>{t('workHours.late')}: <strong className="text-amber-700">{totalLate}m</strong></span>}
                            {totalEarlyDays > 0 && <span>{t('workHours.early')}: <strong className="text-orange-600">{totalEarlyDays}d</strong></span>}
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                                <th className="px-5 py-2 text-left">{t('common.date')}</th>
                                <th className="px-5 py-2 text-left">{t('workHours.checkIn')}</th>
                                <th className="px-5 py-2 text-left">{t('workHours.checkOut')}</th>
                                <th className="px-5 py-2 text-right">{t('workHours.actual')}</th>
                                <th className="px-5 py-2 text-right">{t('workHours.norm')}</th>
                                {subTab !== 'incomplete' && <th className="px-5 py-2 text-right">{t('workHours.late')}</th>}
                                {subTab !== 'incomplete' && <th className="px-5 py-2 text-right">{t('workHours.early')}</th>}
                                {subTab !== 'incomplete' && <th className="px-5 py-2 text-right">{t('workHours.ot')}</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {emp.visibleRows.map((r) => (
                                <tr key={r.date} className={`border-b border-border last:border-none ${r.isAbsent ? 'opacity-60' : ''} ${r.isDayOff ? 'bg-slate-50' : ''}`}>
                                  <td className="px-5 py-2 text-text-dark">
                                    {formatDateOnly(r.date)}
                                    {r.corrected && <span className="ml-1 text-[9px] text-amber-700" title={t('workHours.corrected')}>✎</span>}
                                    {r.isDayOff && <span className="ml-1 text-[9px] text-slate-400 italic">{t('workHours.dayOffLower')}</span>}
                                  </td>
                                  <td className="px-5 py-2 font-mono">
                                    {r.isDayOff ? <span className="text-slate-400">—</span>
                                      : r.checkInUtc ? <span className="text-green-700">{formatTimeOnly(r.checkInUtc)}</span>
                                      : <span className="text-error-text font-bold">{t('workHours.absent')}</span>}
                                  </td>
                                  <td className="px-5 py-2 font-mono">
                                    {r.checkOutUtc
                                      ? <span className={(r.earlyLeaveMinutes ?? 0) > 0 ? 'text-orange-600' : 'text-blue-700'}>{formatTimeOnly(r.checkOutUtc)}</span>
                                      : <span className="text-text-light">—</span>}
                                  </td>
                                  <td className="px-5 py-2 text-right font-mono text-text-dark">{r.totalHours > 0 ? formatHM(r.totalHours) : <span className="text-text-light">—</span>}</td>
                                  <td className="px-5 py-2 text-right font-mono text-text-light">{r.normHours > 0 ? formatHM(r.normHours) : '—'}</td>
                                  {subTab !== 'incomplete' && <td className="px-5 py-2 text-right">{(r.lateMinutes ?? 0) > 0 ? <span className="text-amber-700 font-bold">+{r.lateMinutes}m</span> : <span className="text-text-light">—</span>}</td>}
                                  {subTab !== 'incomplete' && <td className="px-5 py-2 text-right">{(r.earlyLeaveMinutes ?? 0) > 0 ? <span className="text-orange-600 font-bold">-{r.earlyLeaveMinutes}m</span> : <span className="text-text-light">—</span>}</td>}
                                  {subTab !== 'incomplete' && <td className="px-5 py-2 text-right">{r.overtimeHours > 0 ? <span className="text-purple-700 font-bold">+{formatHM(r.overtimeHours)}</span> : <span className="text-text-light">—</span>}</td>}
                                </tr>
                              ))}
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
                    <p className="text-sm font-bold text-text-dark">{t('workHours.adminAssignedLeaves')}</p>
                    <p className="text-xs text-text-light">{t('workHours.adminAssignedLeavesDesc')}</p>
                  </div>
                  <Button type="button" icon="add" onClick={() => setLeaveModal('create')}>
                    {t('workHours.newLeave')}
                  </Button>
                </div>
                <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <p className="text-xs font-black text-text-light uppercase tracking-widest">{t('workHours.leavesCount', { count: leaves.length })}</p>
                  </div>
                  {leavesLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                    </div>
                  ) : leaves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light px-4 text-center">
                      <span className="material-symbols-outlined text-4xl">beach_access</span>
                      <p className="text-sm">{t('workHours.noLeavesYet')}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                            <th className="px-5 py-3 text-left">{t('workHours.employee')}</th>
                            <th className="px-5 py-3 text-left">{t('common.type')}</th>
                            <th className="px-5 py-3 text-left">{t('workHours.dates')}</th>
                            <th className="px-5 py-3 text-left">{t('workHours.reason')}</th>
                            <th className="px-5 py-3 text-left">{t('common.status')}</th>
                            <th className="px-5 py-3 text-right">{t('common.actions')}</th>
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
                                  {lv.leaveType === 'Vacation' ? t('workHours.vacation') : t('workHours.dayOffNoun')}
                                </span>
                                <span className={`ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${lv.isPaid ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                  {lv.isPaid ? t('workHours.paid') : t('workHours.unpaid')}
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
                                  {t(`workHours.status.${lv.status}`, { defaultValue: lv.status })}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right space-x-2">
                                {lv.status === 'Pending' && (
                                  <>
                                    <button type="button" onClick={() => approveLeave(lv.id)} className="text-[10px] font-black uppercase tracking-wider text-green-700 hover:underline">
                                      {t('workHours.approve')}
                                    </button>
                                    <button type="button" onClick={() => rejectLeave(lv.id)} className="text-[10px] font-black uppercase tracking-wider text-error-text hover:underline">
                                      {t('workHours.reject')}
                                    </button>
                                  </>
                                )}
                                {(lv.status === 'Rejected' || lv.status === 'Cancelled') && (
                                  <button type="button" onClick={() => deleteLeave(lv.id)} className="text-[10px] font-black uppercase tracking-wider text-error-text hover:underline">
                                    {t('common.delete')}
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
                  <p className="text-sm font-bold text-text-dark">{t('workHours.selfServiceRequests')}</p>
                  <p className="text-xs text-text-light">{t('workHours.selfServiceRequestsDesc')}</p>
                </div>
                <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-border">
                    <p className="text-xs font-black text-text-light uppercase tracking-widest">{t('workHours.requestsCount', { count: selfServiceReqs.length })}</p>
                  </div>
                  {selfServiceLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                    </div>
                  ) : selfServiceReqs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light px-4 text-center">
                      <span className="material-symbols-outlined text-4xl">inbox</span>
                      <p className="text-sm">{t('workHours.noSelfServiceRequests')}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                            <th className="px-5 py-3 text-left">{t('workHours.employee')}</th>
                            <th className="px-5 py-3 text-left">{t('common.type')}</th>
                            <th className="px-5 py-3 text-left">{t('common.from')}</th>
                            <th className="px-5 py-3 text-left">{t('common.to')}</th>
                            <th className="px-5 py-3 text-left">{t('workHours.comment')}</th>
                            <th className="px-5 py-3 text-left">{t('common.status')}</th>
                            <th className="px-5 py-3 text-right">{t('common.actions')}</th>
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
                                  {t(`workHours.requestType.${req.type}`, { defaultValue: req.type })}
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
                                  {t(`workHours.status.${req.status}`, { defaultValue: req.status })}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right space-x-2">
                                {req.status === 'Pending' && (
                                  <>
                                    <button type="button" onClick={() => approveSelfServiceReq(req.id)} className="text-[10px] font-black uppercase tracking-wider text-green-700 hover:underline">
                                      {t('workHours.approve')}
                                    </button>
                                    <button type="button" onClick={() => rejectSelfServiceReq(req.id)} className="text-[10px] font-black uppercase tracking-wider text-error-text hover:underline">
                                      {t('workHours.reject')}
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
        title={scheduleModal === 'create' ? t('workHours.newWorkSchedule') : t('workHours.editWorkSchedule')}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('common.name')}</label>
            <Input
              value={scheduleForm.name}
              onChange={(e) => setScheduleForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t('workHours.scheduleNamePlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.color')}</label>
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
                title={t('workHours.customColor')}>
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
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('common.type')}</label>
            <select
              value={scheduleForm.type}
              onChange={(e) => {
                const newType = e.target.value as typeof scheduleForm.type
                setScheduleForm((p) => ({ ...p, type: newType }))
                if (newType === 'Multi' && scheduleShifts.length === 0) {
                  setScheduleShifts([{ name: 'Day', shiftStart: '08:00', shiftEnd: '17:00', validEntryFrom: '06:00', validEntryTo: '10:00', requiredHoursPerDay: 8, sortOrder: 0 }])
                }
              }}
              className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="Standard">{t('workHours.typeStandard')}</option>
              <option value="Flexible">{t('workHours.typeFlexible')}</option>
              <option value="Multi">{t('workHours.typeMulti')}</option>
              <option value="Off">{t('workHours.typeOff')}</option>
            </select>
          </div>
          {scheduleForm.type !== 'Flexible' && scheduleForm.type !== 'Off' && (
            <label className="flex items-start gap-2.5 rounded-xl bg-background-light px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-primary"
                checked={scheduleForm.countEarlyArrival}
                onChange={(e) => setScheduleForm((p) => ({ ...p, countEarlyArrival: e.target.checked }))}
              />
              <div className="text-xs leading-relaxed">
                <div className="font-black text-text-dark">{t('workHours.countEarlyArrival')}</div>
                <div className="text-text-muted">{t('workHours.countEarlyArrivalDesc')}</div>
              </div>
            </label>
          )}
          {scheduleForm.type !== 'Flexible' && scheduleForm.type !== 'Off' && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.overtimeDailyThreshold')}</label>
              <Input
                type="number"
                value={scheduleForm.overtimeDailyThresholdMinutes}
                onChange={(e) => setScheduleForm((p) => ({ ...p, overtimeDailyThresholdMinutes: e.target.value }))}
                min={0}
                step={1}
              />
              <p className="text-[10px] text-text-muted">{t('workHours.overtimeDailyThresholdDesc')}</p>
            </div>
          )}
          {scheduleForm.type === 'Flexible' && (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5 shrink-0">warning</span>
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong className="font-black">{t('workHours.flexibleScheduleTitle')}:</strong> {t('workHours.flexibleScheduleDesc')}
              </p>
            </div>
          )}
          {scheduleForm.type === 'Off' && (
            <div className="flex items-start gap-2.5 rounded-xl bg-info-bg border border-info-text/20 px-4 py-3">
              <span className="material-symbols-outlined text-info-text text-lg mt-0.5 shrink-0">event_busy</span>
              <p className="text-xs text-info-text leading-relaxed">
                <strong className="font-black">{t('workHours.offScheduleTitle')}:</strong> {t('workHours.offScheduleDesc')}
              </p>
            </div>
          )}
          {scheduleForm.type === 'Standard' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.shiftStart')}</label>
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
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.shiftEnd')}</label>
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
          {scheduleForm.type !== 'Flexible' && scheduleForm.type !== 'Multi' && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">
                {t('workHours.normComputed')}
              </label>
              <Input
                type="text"
                value={(() => {
                  const h = computeShiftHours(scheduleForm.shiftStart, scheduleForm.shiftEnd)
                  return h !== null ? `${h.toFixed(2)} h` : '—'
                })()}
                readOnly
                className="opacity-70 cursor-not-allowed"
              />
            </div>
          )}
          {scheduleForm.type === 'Flexible' && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.requiredHoursPerDay')}</label>
              <Input
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={scheduleForm.requiredHoursPerDay}
                onChange={(e) => setScheduleForm((p) => ({ ...p, requiredHoursPerDay: e.target.value }))}
              />
            </div>
          )}
          {scheduleForm.type === 'Multi' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.subShifts')}</label>
                <button
                  type="button"
                  onClick={() => setScheduleShifts(prev => [...prev, {
                    name: `Shift ${prev.length + 1}`,
                    shiftStart: '08:00', shiftEnd: '17:00',
                    validEntryFrom: '06:00', validEntryTo: '10:00',
                    requiredHoursPerDay: 8, sortOrder: prev.length,
                  }])}
                  className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span> {t('workHours.addShift')}
                </button>
              </div>
              {scheduleShifts.length === 0 && (
                <p className="text-xs text-text-light italic">{t('workHours.noSubShiftsYet')}</p>
              )}
              {scheduleShifts.map((sh, idx) => (
                <div key={idx} className="rounded-xl bg-background-light p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder={t('workHours.shiftNamePlaceholder')}
                      value={sh.name}
                      onChange={e => setScheduleShifts(prev => prev.map((s, i) => i === idx ? { ...s, name: e.target.value } : s))}
                      className="flex-1 rounded-lg bg-white border border-border px-2 py-1.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none mr-2"
                    />
                    <button
                      type="button"
                      onClick={() => setScheduleShifts(prev => prev.filter((_, i) => i !== idx))}
                      className="text-error-text hover:text-error-text/70"
                      title={t('workHours.removeShift')}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-text-light uppercase tracking-widest">{t('workHours.shiftStart')}</label>
                      <input
                        type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5}
                        value={sh.shiftStart}
                        onChange={e => setScheduleShifts(prev => prev.map((s, i) => i === idx ? { ...s, shiftStart: maskHHMM(e.target.value) } : s))}
                        className="w-full rounded-lg bg-white border border-border px-2 py-1.5 text-xs font-bold font-mono text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-text-light uppercase tracking-widest">{t('workHours.shiftEnd')}</label>
                      <input
                        type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5}
                        value={sh.shiftEnd}
                        onChange={e => setScheduleShifts(prev => prev.map((s, i) => i === idx ? { ...s, shiftEnd: maskHHMM(e.target.value) } : s))}
                        className="w-full rounded-lg bg-white border border-border px-2 py-1.5 text-xs font-bold font-mono text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-text-light uppercase tracking-widest">{t('workHours.entryWindowFrom')}</label>
                      <input
                        type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5}
                        value={sh.validEntryFrom}
                        onChange={e => setScheduleShifts(prev => prev.map((s, i) => i === idx ? { ...s, validEntryFrom: maskHHMM(e.target.value) } : s))}
                        className="w-full rounded-lg bg-white border border-border px-2 py-1.5 text-xs font-bold font-mono text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-text-light uppercase tracking-widest">{t('workHours.entryWindowTo')}</label>
                      <input
                        type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5}
                        value={sh.validEntryTo}
                        onChange={e => setScheduleShifts(prev => prev.map((s, i) => i === idx ? { ...s, validEntryTo: maskHHMM(e.target.value) } : s))}
                        className="w-full rounded-lg bg-white border border-border px-2 py-1.5 text-xs font-bold font-mono text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-text-light uppercase tracking-widest">{t('workHours.requiredHoursPerDayShort')}</label>
                    <input
                      type="number" min={0.5} max={24} step={0.5}
                      value={sh.requiredHoursPerDay}
                      onChange={e => setScheduleShifts(prev => prev.map((s, i) => i === idx ? { ...s, requiredHoursPerDay: parseFloat(e.target.value) || 8 } : s))}
                      className="w-full rounded-lg bg-white border border-border px-2 py-1.5 text-xs font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => { setScheduleModal(null); setEditingSchedule(null); setScheduleShifts([]) }}>{t('common.cancel')}</Button>
            <Button fullWidth isLoading={scheduleSaving} onClick={saveSchedule} disabled={!scheduleForm.name.trim() || (scheduleForm.type === 'Multi' && scheduleShifts.length === 0)}>
              {scheduleModal === 'create' ? t('common.create') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={scheduleModal === 'delete'}
        onClose={() => { setScheduleModal(null); setEditingSchedule(null); setScheduleShifts([]) }}
        title={t('workHours.deleteSchedule')}
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-text-dark">
            <span dangerouslySetInnerHTML={{ __html: t('workHours.deleteScheduleConfirm', { name: editingSchedule?.name ?? '' }) }} />
          </p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => { setScheduleModal(null); setEditingSchedule(null); setScheduleShifts([]) }}>{t('common.cancel')}</Button>
            <Button variant="danger" fullWidth isLoading={scheduleSaving} onClick={deleteSchedule}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={correctionModal !== null}
        onClose={() => setCorrectionModal(null)}
        title={t('workHours.correctAttendanceTitle', { name: correctionModal?.employeeName ?? '' })}
      >
        <div className="space-y-4 pt-2">
          <p className="text-[11px] text-text-light">
            {t('common.date')}: <strong className="text-text-dark">{correctionModal ? formatDateOnly(correctionModal.date) : ''}</strong>.
            {' '}{t('workHours.correctionOverrideHint')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.checkInHHMM')}</label>
              <input
                type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5}
                value={correctionForm.checkIn}
                onChange={(e) => setCorrectionForm((p) => ({ ...p, checkIn: maskHHMM(e.target.value) }))}
                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold font-mono text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.checkOutHHMM')}</label>
              <input
                type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5}
                value={correctionForm.checkOut}
                onChange={(e) => setCorrectionForm((p) => ({ ...p, checkOut: maskHHMM(e.target.value) }))}
                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold font-mono text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.comment')}</label>
            <input
              type="text" placeholder={t('workHours.correctionReasonPlaceholder')}
              value={correctionForm.comment}
              onChange={(e) => setCorrectionForm((p) => ({ ...p, comment: e.target.value }))}
              className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setCorrectionModal(null)}>{t('common.cancel')}</Button>
            {correctionModal?.corrected && (
              <Button variant="danger" fullWidth isLoading={correctionSaving} onClick={clearCorrection}>{t('common.reset')}</Button>
            )}
            <Button fullWidth isLoading={correctionSaving} onClick={saveCorrection}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={leaveModal === 'create'}
        onClose={() => setLeaveModal(null)}
        title={t('workHours.newLeave')}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.employee')}</label>
            <select
              value={leaveForm.employeeId}
              onChange={(e) => setLeaveForm(p => ({ ...p, employeeId: e.target.value }))}
              className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">{t('workHours.selectEmployee')}</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.leaveType')}</label>
              <select
                value={leaveForm.leaveType}
                onChange={(e) => setLeaveForm(p => ({ ...p, leaveType: e.target.value as 'Vacation' | 'DayOff' }))}
                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="Vacation">{t('workHours.vacation')}</option>
                <option value="DayOff">{t('workHours.dayOffOption')}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.payment')}</label>
              <label className="flex items-center gap-2 h-10 px-3 rounded-xl bg-background-light cursor-pointer">
                <input
                  type="checkbox"
                  checked={leaveForm.isPaid}
                  onChange={(e) => setLeaveForm(p => ({ ...p, isPaid: e.target.checked }))}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm font-bold text-text-dark">{t('workHours.paid')}</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.startDate')}</label>
              <input
                type="date"
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm(p => ({ ...p, startDate: e.target.value }))}
                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.endDate')}</label>
              <input
                type="date"
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm(p => ({ ...p, endDate: e.target.value }))}
                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.reasonOptional')}</label>
            <input
              type="text"
              placeholder={t('workHours.reasonPlaceholder')}
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
              className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setLeaveModal(null)}>{t('common.cancel')}</Button>
            <Button fullWidth isLoading={leaveSaving} onClick={createLeave} disabled={!leaveForm.employeeId}>
              {t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Quick Assign Modal ── */}
      {assignSchedule && (() => {
        const DOW_LABELS = [
          t('workHours.dow.mon'),
          t('workHours.dow.tue'),
          t('workHours.dow.wed'),
          t('workHours.dow.thu'),
          t('workHours.dow.fri'),
          t('workHours.dow.sat'),
          t('workHours.dow.sun'),
        ]
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

        // count matching dates (only relevant for Assign mode)
        const parseLocal = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
        let dateCount = 0
        if (!assignRemoveMode && assignFrom && assignTo) {
          const from = parseLocal(assignFrom), to = parseLocal(assignTo)
          for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
            const dow = d.getDay() === 0 ? 7 : d.getDay()
            if (assignSelDows.has(dow)) dateCount++
          }
        }
        const canAssign = assignSelEmps.size > 0 && (assignRemoveMode || (assignSelDows.size > 0 && dateCount > 0))

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
                    <h2 className="text-base font-black text-text-dark">{t('workHours.assignTitle', { name: assignSchedule.name })}</h2>
                    <p className="text-[11px] text-text-muted">
                      {assignSchedule.shiftStart && assignSchedule.shiftEnd
                        ? `${assignSchedule.shiftStart} – ${assignSchedule.shiftEnd}`
                        : t('workHours.flexibleHoursPerDay', { hours: assignSchedule.requiredHoursPerDay })}
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
                        {t('workHours.employees')}
                        {assignSelEmps.size > 0 && (
                          <span className="ml-2 text-primary bg-primary/10 px-1.5 py-0.5 rounded font-black">{assignSelEmps.size}</span>
                        )}
                      </span>
                      <button onClick={toggleAll}
                        className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline">
                        {allSelected ? t('workHours.deselectAll') : t('common.selectAll')}
                      </button>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[14px]">search</span>
                      <input type="text" placeholder={t('common.search')} value={assignSearch}
                        onChange={e => setAssignSearch(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-xs bg-black/[0.04] rounded-xl border border-black/10 outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {assignEmps.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-text-muted text-sm">{t('common.loading')}</div>
                    ) : filtered.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-text-muted text-sm">{t('workHours.noEmployeesMatch')}</div>
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

                  {/* Remove mode message */}
                  {assignRemoveMode && (
                    <div className="rounded-2xl p-4 bg-red-50 border border-red-200 text-xs font-bold text-red-600 space-y-1">
                      <p className="flex items-center gap-2"><span className="material-symbols-outlined text-base">warning</span>{t('workHours.removeSchedule')}</p>
                      <p className="font-normal text-red-500">{t('workHours.removeScheduleDesc')}</p>
                    </div>
                  )}

                  {/* Days of week — hidden in remove mode */}
                  {!assignRemoveMode && <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('workHours.daysOfWeek')}</p>
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
                        className="text-[10px] font-black text-text-muted hover:text-text-dark transition-colors">{t('workHours.weekdays')}</button>
                      <span className="text-text-muted/40">·</span>
                      <button onClick={() => setAssignSelDows(new Set([6,7]))}
                        className="text-[10px] font-black text-text-muted hover:text-text-dark transition-colors">{t('workHours.weekends')}</button>
                      <span className="text-text-muted/40">·</span>
                      <button onClick={() => setAssignSelDows(new Set([1,2,3,4,5,6,7]))}
                        className="text-[10px] font-black text-text-muted hover:text-text-dark transition-colors">{t('common.all')}</button>
                    </div>
                  </div>}

                  {/* Date range — hidden in remove mode */}
                  {!assignRemoveMode && <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('workHours.dateRange')}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-text-muted font-bold">{t('common.from')}</label>
                        <input type="date" value={assignFrom} onChange={e => setAssignFrom(e.target.value)}
                          className="w-full rounded-xl bg-black/[0.04] border border-black/10 px-3 py-2 text-sm font-bold text-text-dark outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-text-muted font-bold">{t('common.to')}</label>
                        <input type="date" value={assignTo} onChange={e => setAssignTo(e.target.value)}
                          className="w-full rounded-xl bg-black/[0.04] border border-black/10 px-3 py-2 text-sm font-bold text-text-dark outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </div>
                  </div>}

                  {/* Summary */}
                  {canAssign && !assignRemoveMode && (
                    <div className="rounded-2xl px-4 py-3 text-[11px] font-bold space-y-1"
                      style={{ backgroundColor: assignSchedule.color + '15', color: assignSchedule.color }}>
                      <p>{t('workHours.willAssignSummary', { days: dateCount, employees: assignSelEmps.size })}</p>
                      <p className="opacity-70">{t('workHours.willAssignDefaultNote')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-black/[0.07] flex flex-col gap-3 shrink-0">
                {/* Assign / Remove toggle */}
                <div className="flex rounded-2xl overflow-hidden border border-black/[0.08] text-[11px] font-black">
                  <button
                    type="button"
                    onClick={() => setAssignRemoveMode(false)}
                    className={`flex-1 py-2 transition-colors ${!assignRemoveMode ? 'text-white' : 'text-text-muted bg-black/[0.04] hover:bg-black/[0.07]'}`}
                    style={!assignRemoveMode ? { backgroundColor: assignSchedule.color } : {}}>
                    {t('workHours.assign')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignRemoveMode(true)}
                    className={`flex-1 py-2 transition-colors ${assignRemoveMode ? 'bg-red-500 text-white' : 'text-text-muted bg-black/[0.04] hover:bg-black/[0.07]'}`}>
                    {t('common.remove')}
                  </button>
                </div>
                {assignError && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {assignError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => { setAssignSchedule(null); setAssignError(null); setAssignRemoveMode(false) }}
                    className="flex-1 py-2.5 text-sm font-bold text-text-muted bg-black/[0.05] rounded-2xl hover:bg-black/[0.08] transition-colors">
                    {t('common.cancel')}
                  </button>
                  <button onClick={doAssign} disabled={!canAssign || assignSaving}
                    className={`flex-1 py-2.5 text-sm font-bold text-white rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${assignRemoveMode ? 'bg-red-500' : ''}`}
                    style={!assignRemoveMode ? { backgroundColor: assignSchedule.color } : {}}>
                    {assignSaving && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                    {assignSaving
                      ? (assignRemoveMode ? t('workHours.removing') : t('workHours.assigning'))
                      : (assignRemoveMode
                          ? t('workHours.removeFromEmployees', { count: assignSelEmps.size || '?' })
                          : t('workHours.assignToEmployees', { count: assignSelEmps.size || '?' }))}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {emailReportModal && (
        <Modal isOpen title={t('workHours.sendAttendanceReport')} onClose={() => { setEmailReportModal(false); setEmailReportTo('') }}>
          <div className="space-y-4">
            <p className="text-xs text-text-light">
              {t('workHours.sendReportHint', { period: tab === 'daily' ? t('workHours.periodDay') : tab === 'weekly' ? t('workHours.periodWeek') : t('workHours.periodMonth') })}
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-light uppercase tracking-widest">{t('workHours.recipientEmail')}</label>
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
                {t('common.send')}
              </Button>
              <Button fullWidth variant="outline" onClick={() => { setEmailReportModal(false); setEmailReportTo('') }} disabled={emailReportSending}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Success toast after assign */}
      {assignSuccessCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 bg-green-600 text-white px-4 py-3 rounded-2xl shadow-xl">
            <span className="material-symbols-outlined text-xl">check_circle</span>
            <span className="text-sm font-bold">{t('workHours.assignedToEmployees', { count: assignSuccessCount })}</span>
            <button
              type="button"
              onClick={() => setAssignSuccessCount(0)}
              className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
