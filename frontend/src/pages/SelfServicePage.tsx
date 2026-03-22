import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/atoms'
import { Modal } from '../components/organisms'
import { apiRequest } from '../lib/api'

const SS_TOKEN_KEY = 'projectx.ss.token'

interface SelfServiceMe {
  id: string
  firstName: string
  lastName: string
  employeeNo: string | null
  department: string | null
  workSchedule: { id: string; name: string; type: string } | null
  todayRecords: AttendanceRecord[]
}

interface AttendanceRecord {
  id: string
  eventTimeUtc: string
  eventType: string
  source: string
}

interface AttendanceRequest {
  id: string
  type: string
  requestedTimeUtc: string
  requestedEndTimeUtc: string | null
  comment: string | null
  status: string
  createdUtc: string
}

type RequestType = 'CheckIn' | 'CheckOut' | 'Absence' | 'Vacation' | 'Overtime'

const REQUEST_TYPES: { type: RequestType; label: string; icon: string; color: string }[] = [
  { type: 'CheckIn', label: 'Check-in', icon: 'login', color: 'bg-green-500/10 text-green-600' },
  { type: 'CheckOut', label: 'Check-out', icon: 'logout', color: 'bg-blue-500/10 text-blue-600' },
  { type: 'Absence', label: 'Absence', icon: 'person_off', color: 'bg-amber-500/10 text-amber-600' },
  { type: 'Vacation', label: 'Vacation', icon: 'beach_access', color: 'bg-purple-500/10 text-purple-600' },
  { type: 'Overtime', label: 'Overtime', icon: 'more_time', color: 'bg-indigo-500/10 text-indigo-600' },
]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50' },
  Approved: { label: 'Approved', color: 'text-green-600 bg-green-50' },
  Rejected: { label: 'Rejected', color: 'text-red-600 bg-red-50' },
}

const TYPE_LABELS: Record<string, string> = {
  CheckIn: 'Check-in',
  CheckOut: 'Check-out',
  Absence: 'Absence',
  Vacation: 'Vacation',
  Overtime: 'Overtime',
}

function ssApiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(SS_TOKEN_KEY)
  return apiRequest<T>(path, { ...options, token })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function SelfServicePage() {
  const navigate = useNavigate()
  const [me, setMe] = useState<SelfServiceMe | null>(null)
  const [requests, setRequests] = useState<AttendanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<RequestType>('CheckIn')
  const [reqDateTime, setReqDateTime] = useState(new Date().toISOString().slice(0, 16))
  const [reqEndDateTime, setReqEndDateTime] = useState('')
  const [reqComment, setReqComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const token = localStorage.getItem(SS_TOKEN_KEY)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadData()
  }, [token])

  const loadData = async () => {
    try {
      const [meData, reqData] = await Promise.all([
        ssApiRequest<SelfServiceMe>('/api/self-service/me'),
        ssApiRequest<AttendanceRequest[]>('/api/self-service/requests'),
      ])
      setMe(meData)
      setRequests(reqData)
    } catch {
      setError('Failed to load data. Please sign in again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (type: RequestType) => {
    setSelectedType(type)
    setReqDateTime(new Date().toISOString().slice(0, 16))
    setReqEndDateTime('')
    setReqComment('')
    setSubmitSuccess(false)
    setModalOpen(true)
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await ssApiRequest('/api/self-service/requests', {
        method: 'POST',
        body: JSON.stringify({
          type: selectedType,
          requestedTimeUtc: new Date(reqDateTime).toISOString(),
          requestedEndTimeUtc: reqEndDateTime ? new Date(reqEndDateTime).toISOString() : null,
          comment: reqComment || null,
        }),
      })
      setSubmitSuccess(true)
      await loadData()
    } catch {
      // keep modal open to show error
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(SS_TOKEN_KEY)
    localStorage.removeItem('projectx.ss.user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background-light">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
      </div>
    )
  }

  if (error || !me) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background-light gap-4">
        <p className="text-error-text font-bold">{error ?? 'Failed to load.'}</p>
        <Button onClick={handleLogout}>Sign out</Button>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const needsEndDate = selectedType === 'Vacation' || selectedType === 'Absence' || selectedType === 'Overtime'

  return (
    <div className="min-h-screen bg-background-light font-sans antialiased">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">badge</span>
            </div>
            <div>
              <p className="font-black text-text-dark text-sm">{me.firstName} {me.lastName}</p>
              <p className="text-text-light text-xs">{me.department ?? 'No department'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-text-light hover:text-error-text text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Date & Schedule */}
        <div className="bg-surface rounded-2xl p-5 shadow-sm">
          <p className="text-text-light text-xs font-bold uppercase tracking-widest capitalize">{today}</p>
          {me.workSchedule && (
            <p className="text-text-dark text-sm mt-1">
              <span className="material-symbols-outlined text-sm align-middle mr-1 text-primary">schedule</span>
              {me.workSchedule.name}
            </p>
          )}
          {me.todayRecords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {me.todayRecords.map((r) => (
                <span
                  key={r.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    r.eventType === 'In' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{r.eventType === 'In' ? 'login' : 'logout'}</span>
                  {formatTime(r.eventTimeUtc)}
                </span>
              ))}
            </div>
          )}
          {me.todayRecords.length === 0 && (
            <p className="text-text-light text-xs mt-2">No events today.</p>
          )}
        </div>

        {/* Action Buttons */}
        <div>
          <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-3">Submit a request</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {REQUEST_TYPES.map(({ type, label, icon, color }) => (
              <button
                key={type}
                onClick={() => handleOpenModal(type)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl ${color} font-bold text-sm transition-all active:scale-95 hover:shadow-md`}
              >
                <span className="material-symbols-outlined text-3xl">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Requests */}
        <div>
          <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-3">My requests</p>
          {requests.length === 0 ? (
            <div className="bg-surface rounded-2xl p-6 text-center text-text-light text-sm">
              No requests yet.
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => {
                const statusInfo = STATUS_LABELS[r.status] ?? { label: r.status, color: 'text-text-light bg-background-light' }
                return (
                  <div key={r.id} className="bg-surface rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-text-dark text-sm">{TYPE_LABELS[r.type] ?? r.type}</p>
                      <p className="text-text-light text-xs">{formatDateTime(r.requestedTimeUtc)}</p>
                      {r.comment && <p className="text-text-light text-xs italic">"{r.comment}"</p>}
                    </div>
                    <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Request Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Request: ${TYPE_LABELS[selectedType]}`}
      >
        {submitSuccess ? (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
            </div>
            <p className="font-bold text-text-dark">Request submitted for review.</p>
            <Button onClick={() => setModalOpen(false)}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">
                {needsEndDate ? 'Start date & time' : 'Date & time'}
              </label>
              <input
                type="datetime-local"
                value={reqDateTime}
                onChange={(e) => setReqDateTime(e.target.value)}
                required
                className="w-full rounded-xl bg-background-light border-none px-4 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            {needsEndDate && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">End date & time</label>
                <input
                  type="datetime-local"
                  value={reqEndDateTime}
                  onChange={(e) => setReqEndDateTime(e.target.value)}
                  className="w-full rounded-xl bg-background-light border-none px-4 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Comment (optional)</label>
              <textarea
                value={reqComment}
                onChange={(e) => setReqComment(e.target.value)}
                rows={3}
                placeholder="Reason or details..."
                className="w-full rounded-xl bg-background-light border-none px-4 py-2.5 text-sm text-text-dark focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              />
            </div>
            <Button type="submit" isLoading={submitting} fullWidth size="lg" className="rounded-2xl">
              Submit request
            </Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
