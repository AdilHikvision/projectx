import { useCallback, useEffect, useState } from 'react'
import { AppLayout } from '../components/templates'
import { Button, Input } from '../components/atoms'
import { PageHeader, Modal } from '../components/organisms'
import { apiRequest } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

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

interface AttendanceRequest {
  id: string
  employeeId: string
  employeeName: string
  type: string
  requestedTimeUtc: string
  requestedEndTimeUtc: string | null
  comment: string | null
  status: string
  reviewedByUserId: string | null
  reviewedAtUtc: string | null
  reviewComment: string | null
  createdUtc: string
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  CheckIn: 'Check-in',
  CheckOut: 'Check-out',
  Absence: 'Absence',
  Vacation: 'Vacation',
  Overtime: 'Overtime',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50' },
  Approved: { label: 'Approved', color: 'text-green-600 bg-green-50' },
  Rejected: { label: 'Rejected', color: 'text-red-600 bg-red-50' },
}

function formatDT(iso: string) {
  return new Date(iso).toLocaleString('en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

type PageTab = 'records' | 'requests' | 'schedules'

interface WorkScheduleRow {
  id: string
  name: string
  type: string
  shiftStart: string | null
  shiftEnd: string | null
  requiredHoursPerDay: number
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

export function WorkHoursTrackingPage() {
  const { token } = useAuth()
  const [tab, setTab] = useState<PageTab>('records')

  // Filters
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterFrom, setFilterFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10)
  })
  const [filterTo, setFilterTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [filterStatus, setFilterStatus] = useState('')

  // Data
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [requests, setRequests] = useState<AttendanceRequest[]>([])
  const [loading, setLoading] = useState(false)

  // Review modal
  const [reviewModal, setReviewModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  const [schedules, setSchedules] = useState<WorkScheduleRow[]>([])
  const [scheduleModal, setScheduleModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<WorkScheduleRow | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    type: 'Standard' as 'Standard' | 'Shift' | 'Flexible',
    shiftStart: '09:00',
    shiftEnd: '18:00',
    requiredHoursPerDay: '8',
  })
  const [scheduleSaving, setScheduleSaving] = useState(false)

  useEffect(() => {
    loadMeta()
  }, [])

  useEffect(() => {
    if (tab === 'records') loadRecords()
    else if (tab === 'requests') loadRequests()
  }, [tab, filterEmployee, filterFrom, filterTo, filterStatus])

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

  const loadRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterEmployee) params.set('employeeId', filterEmployee)
      if (filterStatus) params.set('status', filterStatus)
      const data = await apiRequest<AttendanceRequest[]>(`/api/attendance-requests?${params}`, authOpts)
      setRequests(data)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    if (!reviewModal) return
    setReviewLoading(true)
    try {
      await apiRequest(`/api/attendance-requests/${reviewModal.id}/${reviewModal.action}`, {
        method: 'PUT',
        body: JSON.stringify({ comment: reviewComment || null }),
        token,
      })
      setReviewModal(null)
      setReviewComment('')
      await loadRequests()
    } finally {
      setReviewLoading(false)
    }
  }

  function openCreateSchedule() {
    setScheduleForm({
      name: '',
      type: 'Standard',
      shiftStart: '09:00',
      shiftEnd: '18:00',
      requiredHoursPerDay: '8',
    })
    setEditingSchedule(null)
    setScheduleModal('create')
  }

  function openEditSchedule(s: WorkScheduleRow) {
    setEditingSchedule(s)
    setScheduleForm({
      name: s.name,
      type: (['Standard', 'Shift', 'Flexible'].includes(s.type) ? s.type : 'Standard') as 'Standard' | 'Shift' | 'Flexible',
      shiftStart: timeToInput(s.shiftStart) || '09:00',
      shiftEnd: timeToInput(s.shiftEnd) || '18:00',
      requiredHoursPerDay: String(s.requiredHoursPerDay ?? 8),
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
      const body = {
        name,
        type: scheduleForm.type,
        shiftStart: isFlex ? null : inputTimeToApi(scheduleForm.shiftStart),
        shiftEnd: isFlex ? null : inputTimeToApi(scheduleForm.shiftEnd),
        requiredHoursPerDay: isFlex ? parseFloat(scheduleForm.requiredHoursPerDay) || 8 : parseFloat(scheduleForm.requiredHoursPerDay) || 8,
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

  return (
    <AppLayout onAction={() => {}}>
      <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
        <div className="p-6 md:p-10 space-y-6">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
            <PageHeader
              className="p-0 border-none shadow-none bg-transparent"
              title="Time & attendance"
              description="Records, requests, and work schedules (assign a schedule to each employee in their profile)."
            />
          </div>

          {/* Tab Bar */}
          <div className="flex rounded-2xl bg-surface p-1 gap-1 max-w-md shadow-sm flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setTab('records')}
              className={`flex-1 min-w-[88px] py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'records' ? 'bg-primary text-white shadow-sm' : 'text-text-light hover:text-text-dark'}`}
            >
              Records
            </button>
            <button
              type="button"
              onClick={() => setTab('requests')}
              className={`flex-1 min-w-[88px] py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'requests' ? 'bg-primary text-white shadow-sm' : 'text-text-light hover:text-text-dark'}`}
            >
              Requests
            </button>
            <button
              type="button"
              onClick={() => setTab('schedules')}
              className={`flex-1 min-w-[88px] py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'schedules' ? 'bg-primary text-white shadow-sm' : 'text-text-light hover:text-text-dark'}`}
            >
              Schedules
            </button>
          </div>

          {/* Filters */}
          {tab !== 'schedules' && (
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

            {tab === 'requests' && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl bg-background-light border-none px-3 py-2 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
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
                            <td className="px-5 py-3 font-bold text-text-dark">{s.name}</td>
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

          {/* Records Table */}
          {tab === 'records' && (
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <p className="text-xs font-black text-text-light uppercase tracking-widest">{records.length} record{records.length === 1 ? '' : 's'}</p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light">
                  <span className="material-symbols-outlined text-4xl">event_busy</span>
                  <p className="text-sm">No records found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                        <th className="px-5 py-3 text-left">Employee</th>
                        <th className="px-5 py-3 text-left">Date & time</th>
                        <th className="px-5 py-3 text-left">Event</th>
                        <th className="px-5 py-3 text-left">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-none hover:bg-background-light transition-colors">
                          <td className="px-5 py-3 font-bold text-text-dark">{r.employeeName}</td>
                          <td className="px-5 py-3 text-text-light">{formatDT(r.eventTimeUtc)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${r.eventType === 'In' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                              <span className="material-symbols-outlined text-sm">{r.eventType === 'In' ? 'login' : 'logout'}</span>
                              {r.eventType === 'In' ? 'In' : 'Out'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-text-light text-xs">{r.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Requests Table */}
          {tab === 'requests' && (
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-xs font-black text-text-light uppercase tracking-widest">{requests.length} request{requests.length === 1 ? '' : 's'}</p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-light">
                  <span className="material-symbols-outlined text-4xl">inbox</span>
                  <p className="text-sm">No requests found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                        <th className="px-5 py-3 text-left">Employee</th>
                        <th className="px-5 py-3 text-left">Type</th>
                        <th className="px-5 py-3 text-left">Date/time</th>
                        <th className="px-5 py-3 text-left">Comment</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => {
                        const statusInfo = STATUS_LABELS[r.status] ?? { label: r.status, color: 'text-text-light bg-background-light' }
                        return (
                          <tr key={r.id} className="border-b border-border last:border-none hover:bg-background-light transition-colors">
                            <td className="px-5 py-3 font-bold text-text-dark">{r.employeeName}</td>
                            <td className="px-5 py-3 text-text-dark">{REQUEST_TYPE_LABELS[r.type] ?? r.type}</td>
                            <td className="px-5 py-3 text-text-light">{formatDT(r.requestedTimeUtc)}</td>
                            <td className="px-5 py-3 text-text-light text-xs max-w-[160px] truncate">{r.comment ?? '—'}</td>
                            <td className="px-5 py-3">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {r.status === 'Pending' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => { setReviewModal({ id: r.id, action: 'approve' }); setReviewComment('') }}
                                    className="text-[10px] font-black uppercase tracking-wider text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-lg transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => { setReviewModal({ id: r.id, action: 'reject' }); setReviewComment('') }}
                                    className="text-[10px] font-black uppercase tracking-wider text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewModal}
        onClose={() => setReviewModal(null)}
        title={reviewModal?.action === 'approve' ? 'Approve request' : 'Reject request'}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Comment (optional)</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              placeholder="Reason for decision..."
              className="w-full rounded-xl bg-background-light border-none px-4 py-2.5 text-sm text-text-dark focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setReviewModal(null)}>Cancel</Button>
            <Button
              fullWidth
              isLoading={reviewLoading}
              className={reviewModal?.action === 'reject' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : ''}
              onClick={handleReview}
            >
              {reviewModal?.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>

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
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Type</label>
            <select
              value={scheduleForm.type}
              onChange={(e) => setScheduleForm((p) => ({ ...p, type: e.target.value as typeof p.type }))}
              className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="Standard">Standard (fixed shift)</option>
              <option value="Shift">Shift</option>
              <option value="Flexible">Flexible (hours per day)</option>
            </select>
          </div>
          {scheduleForm.type !== 'Flexible' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Shift start</label>
                <input
                  type="time"
                  value={scheduleForm.shiftStart}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, shiftStart: e.target.value }))}
                  className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Shift end</label>
                <input
                  type="time"
                  value={scheduleForm.shiftEnd}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, shiftEnd: e.target.value }))}
                  className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">
              {scheduleForm.type === 'Flexible' ? 'Required hours per day' : 'Norm (hours / day, for reports)'}
            </label>
            <Input
              type="number"
              min={0.5}
              max={24}
              step={0.5}
              value={scheduleForm.requiredHoursPerDay}
              onChange={(e) => setScheduleForm((p) => ({ ...p, requiredHoursPerDay: e.target.value }))}
            />
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
    </AppLayout>
  )
}
