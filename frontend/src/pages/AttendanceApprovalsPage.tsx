import { useEffect, useState } from 'react'
import { AppLayout } from '../components/templates'
import { Button } from '../components/atoms'
import { PageHeader, Modal } from '../components/organisms'
import { apiRequest } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

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
  latitude: number | null
  longitude: number | null
  geoZoneName: string | null
}

const TYPE_LABELS: Record<string, string> = {
  CheckIn: 'Check-in correction',
  CheckOut: 'Check-out correction',
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
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

export function AttendanceApprovalsPage() {
  const { token } = useAuth()
  const [requests, setRequests] = useState<AttendanceRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('Pending')
  const [filterType, setFilterType] = useState('')

  const [reviewModal, setReviewModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  const load = async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      const data = await apiRequest<AttendanceRequest[]>(`/api/attendance-requests?${params}`, { token })
      setRequests(filterType ? data.filter(r => r.type === filterType) : data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [token, filterStatus, filterType])

  const handleReview = async () => {
    if (!reviewModal) return
    setReviewLoading(true)
    try {
      await apiRequest(`/api/attendance-requests/${reviewModal.id}/${reviewModal.action}`, {
        method: 'PUT', token,
        body: JSON.stringify({ comment: reviewComment || null }),
      })
      setReviewModal(null)
      setReviewComment('')
      await load()
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <AppLayout onAction={() => {}}>
      <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
        <div className="p-6 md:p-10 space-y-6">
          <PageHeader
            className="p-0 border-none shadow-none bg-transparent"
            title="Attendance approvals"
            description="Review and approve attendance correction requests submitted by employees."
          />

          <div className="bg-surface rounded-2xl p-5 shadow-sm flex flex-wrap gap-4 items-end">
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
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-xl bg-background-light border-none px-3 py-2 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">All types</option>
                <option value="CheckIn">Check-in correction</option>
                <option value="CheckOut">Check-out correction</option>
                <option value="Absence">Absence</option>
                <option value="Vacation">Vacation</option>
                <option value="Overtime">Overtime</option>
              </select>
            </div>
          </div>

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
                <p className="text-sm">No requests in this filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                      <th className="px-5 py-3 text-left">Employee</th>
                      <th className="px-5 py-3 text-left">Type</th>
                      <th className="px-5 py-3 text-left">Requested time</th>
                      <th className="px-5 py-3 text-left">Location</th>
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
                          <td className="px-5 py-3 text-text-dark">{TYPE_LABELS[r.type] ?? r.type}</td>
                          <td className="px-5 py-3 text-text-light">{formatDT(r.requestedTimeUtc)}</td>
                          <td className="px-5 py-3 text-xs">
                            {r.latitude != null && r.longitude != null ? (
                              <div className="space-y-0.5">
                                {r.geoZoneName && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-green-700 bg-green-50">
                                    <span className="material-symbols-outlined text-[12px]">verified</span>
                                    {r.geoZoneName}
                                  </span>
                                )}
                                <a
                                  href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=18/${r.latitude}/${r.longitude}`}
                                  target="_blank" rel="noreferrer"
                                  className="block font-mono text-text-light hover:text-primary"
                                  title="Open in OpenStreetMap"
                                >
                                  {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
                                </a>
                              </div>
                            ) : (
                              <span className="text-text-light">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-text-light text-xs max-w-[240px] truncate">{r.comment ?? '—'}</td>
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
        </div>
      </div>

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
