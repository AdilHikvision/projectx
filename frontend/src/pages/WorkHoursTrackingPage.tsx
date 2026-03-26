import { useEffect, useState } from 'react'
import { AppLayout } from '../components/templates'
import { Button } from '../components/atoms'
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

type PageTab = 'records' | 'requests'

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

  useEffect(() => {
    loadMeta()
  }, [])

  useEffect(() => {
    if (tab === 'records') loadRecords()
    else loadRequests()
  }, [tab, filterEmployee, filterFrom, filterTo, filterStatus])

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

  return (
    <AppLayout onAction={() => {}}>
      <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
        <div className="p-6 md:p-10 space-y-6">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
            <PageHeader
              className="p-0 border-none shadow-none bg-transparent"
              title="Time & attendance"
              description="Clock-in/out records and employee requests."
            />
          </div>

          {/* Tab Bar */}
          <div className="flex rounded-2xl bg-surface p-1 gap-1 max-w-xs shadow-sm">
            <button
              onClick={() => setTab('records')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'records' ? 'bg-primary text-white shadow-sm' : 'text-text-light hover:text-text-dark'}`}
            >
              Records
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'requests' ? 'bg-primary text-white shadow-sm' : 'text-text-light hover:text-text-dark'}`}
            >
              Requests
            </button>
          </div>

          {/* Filters */}
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
    </AppLayout>
  )
}
