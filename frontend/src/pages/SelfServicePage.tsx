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
  { type: 'CheckIn', label: 'Check-in correction', icon: 'login', color: 'bg-green-500/10 text-green-600' },
  { type: 'CheckOut', label: 'Check-out correction', icon: 'logout', color: 'bg-blue-500/10 text-blue-600' },
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
  CheckIn: 'Check-in correction',
  CheckOut: 'Check-out correction',
  Absence: 'Absence',
  Vacation: 'Vacation',
  Overtime: 'Overtime',
}

function maskHHMM(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function ssApiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(SS_TOKEN_KEY)
  return apiRequest<T>(path, { ...options, token })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
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
  // Поля корректировки (только для type === 'Correction').
  const [corrDate, setCorrDate] = useState(new Date().toISOString().slice(0, 10))
  const [corrCheckIn, setCorrCheckIn] = useState('')
  const [, setCorrCheckOut] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Принудительная смена сгенерированного пароля при первом входе.
  const [pwModal, setPwModal] = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSubmitting, setPwSubmitting] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  const token = localStorage.getItem(SS_TOKEN_KEY)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    // Если admin создал учётку с генерированным паролем — заставляем сменить.
    try {
      const userData = JSON.parse(localStorage.getItem('projectx.ss.user') ?? '{}')
      if (userData.requiresPasswordSetup) {
        setPwCurrent(userData.currentPassword ?? '')
        setPwModal(true)
      }
    } catch { /* ignore parse errors */ }
    loadData()
  }, [token])

  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    if (pwNew.length < 6) { setPwError('Password must be at least 6 characters.'); return }
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match.'); return }
    setPwSubmitting(true)
    try {
      await ssApiRequest('/api/self-service/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      })
      // Снимаем флаг локально, чтобы при следующем mount модалка не открывалась.
      try {
        const userData = JSON.parse(localStorage.getItem('projectx.ss.user') ?? '{}')
        userData.requiresPasswordSetup = false
        delete userData.currentPassword
        localStorage.setItem('projectx.ss.user', JSON.stringify(userData))
      } catch { /* ignore */ }
      setPwModal(false)
      setPwCurrent(''); setPwNew(''); setPwConfirm('')
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password.')
    } finally {
      setPwSubmitting(false)
    }
  }

  const loadData = async () => {
    try {
      const [meData, reqData] = await Promise.all([
        ssApiRequest<SelfServiceMe>('/api/self-service/me'),
        ssApiRequest<AttendanceRequest[]>('/api/self-service/requests'),
      ])
      setMe(meData)
      setRequests(reqData)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        localStorage.removeItem(SS_TOKEN_KEY)
        navigate('/login')
        return
      }
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
    setCorrDate(new Date().toISOString().slice(0, 10))
    setCorrCheckIn('')
    setCorrCheckOut('')
    setSubmitSuccess(false)
    setSubmitError(null)
    setModalOpen(true)
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      let requestedTimeUtc: string
      let requestedEndTimeUtc: string | null = null
      let latitude: number | null = null
      let longitude: number | null = null
      if (selectedType === 'CheckIn' || selectedType === 'CheckOut') {
        const m = corrCheckIn.match(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
        if (!m) {
          setSubmitError('Enter time in HH:MM format (e.g. 09:00).')
          setSubmitting(false)
          return
        }
        const d = new Date(corrDate + 'T00:00:00')
        d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0)
        requestedTimeUtc = d.toISOString()
        requestedEndTimeUtc = null

        // Запрос геолокации. Если разрешена — отправим вместе с запросом, на бэке проверится
        // GeoZone и при попадании запрос авто-аппрувится (минуя админа).
        if ('geolocation' in navigator) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
            )
            latitude = pos.coords.latitude
            longitude = pos.coords.longitude
          } catch { /* пользователь отказал — отправим без координат, уйдёт в Pending */ }
        }
      } else {
        requestedTimeUtc = new Date(reqDateTime).toISOString()
        requestedEndTimeUtc = reqEndDateTime ? new Date(reqEndDateTime).toISOString() : null
      }
      await ssApiRequest('/api/self-service/requests', {
        method: 'POST',
        body: JSON.stringify({
          type: selectedType,
          requestedTimeUtc,
          requestedEndTimeUtc,
          comment: reqComment || null,
          latitude,
          longitude,
        }),
      })
      setSubmitSuccess(true)
      await loadData()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(SS_TOKEN_KEY)
    localStorage.removeItem('projectx.ss.user')
    navigate('/login')
  }

  // Quick action: Check-in/Check-out at current time with current location.
  // Если координаты в зоне — бэк auto-approved; иначе уйдёт в Pending.
  const [quickBusy, setQuickBusy] = useState<'CheckIn' | 'CheckOut' | null>(null)
  const [quickResult, setQuickResult] = useState<string | null>(null)

  const quickCheck = async (type: 'CheckIn' | 'CheckOut') => {
    if (quickBusy) return
    setQuickBusy(type)
    setQuickResult(null)
    try {
      let latitude: number | null = null
      let longitude: number | null = null
      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
          )
          latitude = pos.coords.latitude
          longitude = pos.coords.longitude
        } catch {
          setQuickResult('Location access denied — request will need admin approval.')
        }
      }
      const res = await ssApiRequest<{ status: string; autoApproved?: boolean; matchedZone?: string | null }>(
        '/api/self-service/requests',
        {
          method: 'POST',
          body: JSON.stringify({
            type,
            requestedTimeUtc: new Date().toISOString(),
            requestedEndTimeUtc: null,
            comment: null,
            latitude,
            longitude,
          }),
        }
      )
      if (res.autoApproved) {
        setQuickResult(`✓ ${type === 'CheckIn' ? 'Checked in' : 'Checked out'} (zone: ${res.matchedZone ?? 'verified'})`)
      } else {
        setQuickResult(`Sent — pending admin approval (you are outside any geo-zone or location was unavailable).`)
      }
      await loadData()
    } catch {
      setQuickResult('Failed to send. Try again.')
    } finally {
      setQuickBusy(null)
    }
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setPwCurrent(''); setPwNew(''); setPwConfirm(''); setPwError(null); setPwModal(true) }}
              className="flex items-center gap-1 text-text-light hover:text-primary text-xs font-bold uppercase tracking-widest transition-colors"
              title="Change password"
            >
              <span className="material-symbols-outlined text-base">key</span>
              Password
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-text-light hover:text-error-text text-xs font-bold uppercase tracking-widest transition-colors"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Sign out
            </button>
          </div>
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

        {/* Quick check-in / check-out by location */}
        <div className="bg-surface rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-[10px] font-black text-text-light uppercase tracking-widest">Check by location</p>
          <p className="text-[12px] text-text-light">
            We'll use your current location. If you're inside an authorized zone, the entry is auto-approved.
            Otherwise the request is sent to admin for approval.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              size="lg"
              icon="login"
              isLoading={quickBusy === 'CheckIn'}
              disabled={quickBusy !== null}
              onClick={() => quickCheck('CheckIn')}
              className="rounded-2xl"
            >
              Check in now
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              icon="logout"
              isLoading={quickBusy === 'CheckOut'}
              disabled={quickBusy !== null}
              onClick={() => quickCheck('CheckOut')}
              className="rounded-2xl"
            >
              Check out now
            </Button>
          </div>
          {quickResult && (
            <p className={`text-[12px] font-bold ${quickResult.startsWith('✓') ? 'text-green-700' : 'text-amber-700'}`}>
              {quickResult}
            </p>
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
            {selectedType === 'CheckIn' || selectedType === 'CheckOut' ? (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Date</label>
                  <input
                    type="date"
                    value={corrDate}
                    onChange={(e) => setCorrDate(e.target.value)}
                    required
                    className="w-full rounded-xl bg-background-light border-none px-4 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">
                    {selectedType === 'CheckIn' ? 'Check-in time (HH:MM)' : 'Check-out time (HH:MM)'}
                  </label>
                  <input
                    type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5}
                    value={corrCheckIn}
                    onChange={(e) => setCorrCheckIn(maskHHMM(e.target.value))}
                    required
                    className="w-full rounded-xl bg-background-light border-none px-4 py-2.5 text-sm font-bold font-mono text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">
                    {needsEndDate ? 'Start date & time' : 'Date & time'}
                  </label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      type="date"
                      value={reqDateTime.slice(0, 10)}
                      onChange={(e) => setReqDateTime(`${e.target.value}T${reqDateTime.slice(11) || '09:00'}`)}
                      required
                      className="rounded-xl bg-background-light border-none px-4 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                    <input
                      type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5}
                      value={reqDateTime.slice(11, 16)}
                      onChange={(e) => setReqDateTime(`${reqDateTime.slice(0, 10) || new Date().toISOString().slice(0, 10)}T${maskHHMM(e.target.value)}`)}
                      required
                      className="w-24 rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold font-mono text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
                {needsEndDate && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">End date & time</label>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <input
                        type="date"
                        value={reqEndDateTime.slice(0, 10)}
                        onChange={(e) => setReqEndDateTime(`${e.target.value}T${reqEndDateTime.slice(11) || '18:00'}`)}
                        className="rounded-xl bg-background-light border-none px-4 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                      <input
                        type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5}
                        value={reqEndDateTime.slice(11, 16)}
                        onChange={(e) => setReqEndDateTime(`${reqEndDateTime.slice(0, 10) || new Date().toISOString().slice(0, 10)}T${maskHHMM(e.target.value)}`)}
                        className="w-24 rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold font-mono text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </div>
                )}
              </>
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
            {submitError && (
              <p className="text-red-600 text-xs font-bold bg-red-50 rounded-xl px-3 py-2">{submitError}</p>
            )}
            <Button type="submit" isLoading={submitting} fullWidth size="lg" className="rounded-2xl">
              Submit request
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={pwModal}
        onClose={() => {
          // При обязательной первой смене (requiresPasswordSetup=true) запрещаем закрывать.
          try {
            const u = JSON.parse(localStorage.getItem('projectx.ss.user') ?? '{}')
            if (u.requiresPasswordSetup) return
          } catch { /* ignore */ }
          setPwModal(false)
        }}
        title={(() => {
          try {
            const u = JSON.parse(localStorage.getItem('projectx.ss.user') ?? '{}')
            return u.requiresPasswordSetup ? 'Set your password' : 'Change password'
          } catch { return 'Change password' }
        })()}
      >
        <form onSubmit={submitPasswordChange} className="space-y-4 pt-2">
          {(() => {
            let mustSetup = false
            try {
              const u = JSON.parse(localStorage.getItem('projectx.ss.user') ?? '{}')
              mustSetup = !!u.requiresPasswordSetup
            } catch { /* ignore */ }
            return mustSetup ? (
              <p className="text-[12px] text-text-light">
                You signed in with a temporary password. Please set your own password to continue.
              </p>
            ) : (
              <p className="text-[12px] text-text-light">
                Enter your current password and a new one to update.
              </p>
            )
          })()}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Current password</label>
            <input
              type="password"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              required
              className="w-full rounded-xl bg-background-light border-none px-4 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">New password</label>
            <input
              type="password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              minLength={6}
              required
              className="w-full rounded-xl bg-background-light border-none px-4 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Confirm new password</label>
            <input
              type="password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              required
              className="w-full rounded-xl bg-background-light border-none px-4 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          {pwError && <p className="text-error-text text-[12px] font-bold">{pwError}</p>}
          <div className="flex gap-3">
            {(() => {
              let mustSetup = false
              try {
                const u = JSON.parse(localStorage.getItem('projectx.ss.user') ?? '{}')
                mustSetup = !!u.requiresPasswordSetup
              } catch { /* ignore */ }
              return !mustSetup
                ? <Button type="button" variant="outline" fullWidth onClick={() => setPwModal(false)}>Cancel</Button>
                : null
            })()}
            <Button type="submit" isLoading={pwSubmitting} fullWidth size="lg" className="rounded-2xl">
              {(() => {
                let mustSetup = false
                try {
                  const u = JSON.parse(localStorage.getItem('projectx.ss.user') ?? '{}')
                  mustSetup = !!u.requiresPasswordSetup
                } catch { /* ignore */ }
                return mustSetup ? 'Set password' : 'Update password'
              })()}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
