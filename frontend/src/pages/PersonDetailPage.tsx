import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function FaceImage({ faceId, token, className }: { faceId: string; token: string | null; className?: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)
  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch(`${getApiBaseUrl()}/api/faces/${faceId}/image`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (!cancelled && blob) {
          if (urlRef.current) URL.revokeObjectURL(urlRef.current)
          urlRef.current = URL.createObjectURL(blob)
          setSrc(urlRef.current)
        }
      })
    return () => {
      cancelled = true
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
      setSrc(null)
    }
  }, [faceId, token])
  if (!src) return <div className={className} />
  return <img src={src} alt="Face" className={className} />
}
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/templates'
import { Badge, Button, Input } from '../components/atoms'
import { Modal } from '../components/organisms'
import { useLoading } from '../context/LoadingContext'
import { apiRequest, getApiBaseUrl } from '../lib/api'

interface PersonDetail {
  id: string
  firstName: string
  lastName: string
  personnelNumber?: string | null
  documentNumber?: string | null
  visitDateUtc?: string
  isActive: boolean
  accessLevels: { id: string; name: string }[]
  cards: { id: string; cardNo: string; cardNumber?: string | null }[]
  faces: { id: string; fdid: number }[]
  fingerprints: { id: string; fingerIndex: number }[]
}

interface Device {
  id: string
  name: string
}

type CredentialTab = 'cards' | 'faces' | 'fingerprints'

const CREDENTIAL_TABS: { value: CredentialTab; label: string }[] = [
  { value: 'cards', label: 'Cards' },
  { value: 'faces', label: 'Faces' },
  { value: 'fingerprints', label: 'Fingerprints' },
]

export function PersonDetailPage() {
  const { type, id } = useParams<{ type: 'employee' | 'visitor'; id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()
  const { startLoading, stopLoading } = useLoading()
  const [detail, setDetail] = useState<PersonDetail | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [credentialTab, setCredentialTab] = useState<CredentialTab>('cards')
  const [error, setError] = useState<string | null>(null)
  const [addModal, setAddModal] = useState<'card' | 'face' | 'fingerprint' | null>(null)
  const [cardForm, setCardForm] = useState({ cardNo: '', cardNumber: '', deviceIds: [] as string[] })
  const [faceFile, setFaceFile] = useState<File | null>(null)
  const [faceDeviceIds, setFaceDeviceIds] = useState<string[]>([])
  const [fpForm, setFpForm] = useState({ templateData: '', fingerIndex: 1, deviceIds: [] as string[] })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const apiPath = type === 'employee' ? '/api/employees' : '/api/visitors'

  const loadDetail = useCallback(async () => {
    if (!token || !id) return
    setError(null)
    startLoading()
    try {
      const data = await apiRequest<PersonDetail>(`${apiPath}/${id}`, { token })
      setDetail(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      stopLoading()
    }
  }, [token, id, apiPath, startLoading, stopLoading])

  const loadDevices = useCallback(async () => {
    if (!token) return
    try {
      const list = await apiRequest<Device[]>(`/api/devices`, { token })
      setDevices(list)
    } catch {
      setDevices([])
    }
  }, [token])

  useEffect(() => {
    loadDetail()
    loadDevices()
  }, [loadDetail, loadDevices])

  async function handleAddCard() {
    if (!token || !detail) return
    if (!cardForm.cardNo.trim()) {
      setError('Card number is required')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await apiRequest('/api/cards', {
        method: 'POST',
        token,
        body: JSON.stringify({
          cardNo: cardForm.cardNo.trim(),
          cardNumber: cardForm.cardNumber.trim() || null,
          employeeId: type === 'employee' ? id : null,
          visitorId: type === 'visitor' ? id : null,
          deviceIds: cardForm.deviceIds,
        }),
      })
      setAddModal(null)
      setCardForm({ cardNo: '', cardNumber: '', deviceIds: [] })
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add card')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddFace() {
    if (!token || !detail || !faceFile) return
    setIsSubmitting(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('EmployeeId', type === 'employee' ? id! : '')
      formData.append('VisitorId', type === 'visitor' ? id! : '')
      formData.append('FDID', '1')
      formData.append('Image', faceFile)
      faceDeviceIds.forEach((d) => formData.append('DeviceIds', d))

      const res = await fetch(`${getApiBaseUrl()}/api/faces`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to upload face')
      }
      setAddModal(null)
      setFaceFile(null)
      setFaceDeviceIds([])
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add face')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddFingerprint() {
    if (!token || !detail) return
    if (!fpForm.templateData.trim()) {
      setError('Fingerprint template (base64) is required')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await apiRequest('/api/fingerprints', {
        method: 'POST',
        token,
        body: JSON.stringify({
          templateData: fpForm.templateData.trim(),
          fingerIndex: fpForm.fingerIndex,
          employeeId: type === 'employee' ? id : null,
          visitorId: type === 'visitor' ? id : null,
          deviceIds: fpForm.deviceIds,
        }),
      })
      setAddModal(null)
      setFpForm({ templateData: '', fingerIndex: 1, deviceIds: [] })
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add fingerprint')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!token || !confirm('Delete card?')) return
    try {
      await apiRequest(`/api/cards/${cardId}`, { method: 'DELETE', token })
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  async function handleDeleteFace(faceId: string) {
    if (!token || !confirm('Delete face?')) return
    try {
      await apiRequest(`/api/faces/${faceId}`, { method: 'DELETE', token })
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  async function handleDeleteFingerprint(fpId: string) {
    if (!token || !confirm('Delete fingerprint?')) return
    try {
      await apiRequest(`/api/fingerprints/${fpId}`, { method: 'DELETE', token })
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (!detail) {
    return (
      <AppLayout onAction={() => navigate('/people')}>
        <div className="flex-1 flex items-center justify-center bg-background-light">
          {error ? (
            <div className="text-error-text font-black uppercase tracking-widest text-[10px] animate-pulse">
              Error Protocol: {error}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black text-text-light uppercase tracking-widest">Initializing Profile Data...</p>
            </div>
          )}
        </div>
      </AppLayout>
    )
  }

  const name = `${detail.firstName} ${detail.lastName}`
  const initials = `${detail.firstName[0] || ''}${detail.lastName[0] || ''}`.toUpperCase()
  const secondary = type === 'employee' ? detail.personnelNumber : detail.documentNumber

  return (
    <AppLayout onAction={() => navigate('/people')}>
      <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
        <div className="p-6 md:p-10 space-y-8">
          {error && (
            <div className="p-4 bg-error-bg text-error-text rounded-2xl text-[10px] font-black uppercase tracking-widest border border-error-text/10 shadow-sm animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            </div>
          )}
          {/* Identity Header */}
          <div className="flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-4 duration-500">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary text-3xl md:text-4xl font-black shadow-inner border-2 border-primary/5">
              {detail.faces.length > 0 ? (
                <FaceImage faceId={detail.faces[0].id} token={token} className="w-full h-full object-cover rounded-[2rem]" />
              ) : initials}
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl font-black text-text-dark leading-tight">{name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="primary" className="px-3 py-1">{type === 'employee' ? 'Internal Staff' : 'Guest Visitor'}</Badge>
                {secondary && (
                  <span className="text-[10px] font-black text-text-light uppercase tracking-widest bg-white/50 px-2 py-1 rounded-lg border border-divider-light">
                    {type === 'employee' ? 'ID' : 'DOC'} • {secondary}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Access Rights Cluster */}
              <div className="bg-surface rounded-3xl shadow-md p-6 space-y-4 border-none">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">security</span>
                  <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest">Active Access Privileges</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {detail.accessLevels.length > 0 ? (
                    detail.accessLevels.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-divider-light rounded-2xl group hover:shadow-sm transition-all">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-sm font-bold text-text-dark">{a.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="w-full p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-divider-light">
                      <p className="text-xs font-bold text-text-muted uppercase tracking-widest italic leading-relaxed">No active protocols assigned.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Credentials Orchestration */}
              <div className="bg-surface rounded-3xl shadow-md overflow-hidden border-none text-text-light">
                <div className="px-6 py-4 border-b border-border-light flex items-center justify-between bg-slate-50/50">
                  <div className="flex gap-1 bg-white border border-divider-light p-1 rounded-xl">
                    {CREDENTIAL_TABS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setCredentialTab(t.value)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${credentialTab === t.value ? 'bg-primary text-white shadow-md' : 'text-text-light hover:text-text-dark'
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    icon="add"
                    onClick={() =>
                      setAddModal(
                        credentialTab === 'cards'
                          ? 'card'
                          : credentialTab === 'faces'
                            ? 'face'
                            : 'fingerprint'
                      )
                    }
                  >
                    Enroll
                  </Button>
                </div>

                <div className="p-6">
                  {credentialTab === 'cards' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {detail.cards.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-[10px] font-black text-text-light uppercase tracking-widest opacity-50">No proximity tokens enrolled</div>
                      ) : (
                        detail.cards.map((c) => (
                          <div key={c.id} className="relative bg-background-light p-4 rounded-2xl shadow-md group hover:shadow-xl transition-all border-none">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-xl shadow-inner flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-2xl">nfc</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-text-light uppercase tracking-widest opacity-50 mb-0.5">Token ID</p>
                                <p className="text-sm font-mono font-black text-text-dark truncate tracking-wider">{c.cardNo}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                icon="delete"
                                className="text-error-text opacity-0 group-hover:opacity-100"
                                onClick={() => handleDeleteCard(c.id)}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {credentialTab === 'faces' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {detail.faces.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-[10px] font-black text-text-light uppercase tracking-widest opacity-50">No biometric templates found</div>
                      ) : (
                        detail.faces.map((f) => (
                          <div key={f.id} className="relative group">
                            <div className="aspect-square rounded-2xl overflow-hidden shadow-md transition-transform group-hover:scale-105 border-none">
                              <FaceImage faceId={f.id} token={token} className="w-full h-full object-cover" />
                            </div>
                            <button
                              onClick={() => handleDeleteFace(f.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-error-bg text-error-text border border-error-text/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {credentialTab === 'fingerprints' && (
                    <div className="space-y-3">
                      {detail.fingerprints.length === 0 ? (
                        <div className="py-12 text-center text-[10px] font-black text-text-light uppercase tracking-widest opacity-50">No biological signatures registered</div>
                      ) : (
                        detail.fingerprints.map((fp) => (
                          <div key={fp.id} className="flex items-center justify-between p-4 bg-background-light rounded-2xl shadow-md group hover:shadow-xl transition-all border-none">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-xl shadow-inner flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-2xl">fingerprint</span>
                              </div>
                              <div>
                                <p className="text-xs font-black text-text-dark">Index ID #{fp.fingerIndex}</p>
                                <p className="text-[10px] font-bold text-text-light uppercase tracking-widest">Biometric Template</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              icon="delete"
                              className="text-error-text opacity-0 group-hover:opacity-100"
                              onClick={() => handleDeleteFingerprint(fp.id)}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-surface rounded-3xl shadow-md p-6 space-y-4 border-none">
                <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest">Global Status</h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl transition-colors">
                  <span className="text-xs font-black text-text-dark uppercase tracking-widest">Active State</span>
                  <Badge variant={detail.isActive ? 'success' : 'error'} dot>{detail.isActive ? 'OPERATIONAL' : 'LOCKED'}</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl opacity-60">
                  <span className="text-xs font-black text-text-dark uppercase tracking-widest">Last Activity</span>
                  <span className="text-[10px] font-bold text-text-light font-mono truncate max-w-[120px]">
                    {detail.visitDateUtc ? new Date(detail.visitDateUtc).toLocaleString() : 'Never Recorded'}
                  </span>
                </div>
              </div>

              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">System Maintenance</h3>
                <Button fullWidth variant="danger" icon="delete" size="md">Retire Profile</Button>
                <p className="text-[9px] text-text-light text-center leading-relaxed">Retiring a profile will permanently revoke all biometric and token access across the fleet.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Modals with Premium Mobile Layout */}
      {addModal === 'card' && (
        <Modal
          isOpen
          title="NFC Token Enrollment"
          onClose={() => setAddModal(null)}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1.5 ml-1">Serial ID / Label</label>
              <Input
                value={cardForm.cardNo}
                onChange={(e) => setCardForm((p) => ({ ...p, cardNo: e.target.value }))}
                placeholder="Required"
                icon="nfc"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1.5 ml-1">Legacy Number (Optional)</label>
              <Input
                value={cardForm.cardNumber}
                onChange={(e) => setCardForm((p) => ({ ...p, cardNumber: e.target.value }))}
                placeholder="External mapping"
                icon="fingerprint"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2.5 ml-1">Propagation Targets</label>
              <div className="space-y-1.5">
                {devices.map((d) => (
                  <label key={d.id} className="flex items-center justify-between p-3 rounded-xl border border-divider-light/50 hover:bg-slate-50 cursor-pointer group transition-all">
                    <span className="text-xs font-bold text-text-dark group-hover:text-primary transition-colors">{d.name}</span>
                    <input
                      type="checkbox"
                      checked={cardForm.deviceIds.includes(d.id)}
                      onChange={() =>
                        setCardForm((p) => ({
                          ...p,
                          deviceIds: p.deviceIds.includes(d.id)
                            ? p.deviceIds.filter((x) => x !== d.id)
                            : [...p.deviceIds, d.id],
                        }))
                      }
                      className="w-5 h-5 rounded-md border-divider-light text-primary focus:ring-primary/20 transition-all"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button fullWidth onClick={handleAddCard} isLoading={isSubmitting}>Enroll Token</Button>
              <Button fullWidth variant="outline" onClick={() => setAddModal(null)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {addModal === 'face' && (
        <Modal
          isOpen
          title="Face Signature Capture"
          onClose={() => setAddModal(null)}
        >
          <div className="space-y-5">
            <div className="p-10 border-2 border-dashed border-divider-light rounded-3xl bg-slate-50 flex flex-col items-center justify-center group hover:border-primary/50 transition-all relative overflow-hidden">
              {faceFile ? (
                <img src={URL.createObjectURL(faceFile)} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-4xl text-text-light/50 mb-3">add_a_photo</span>
                  <p className="text-[10px] font-black text-text-light uppercase tracking-widest">Select Image Asset</p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFaceFile(e.target.files?.[0] ?? null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2.5 ml-1">Propagation Targets</label>
              <div className="space-y-1.5">
                {devices.map((d) => (
                  <label key={d.id} className="flex items-center justify-between p-3 rounded-xl border border-divider-light/50 hover:bg-slate-50 cursor-pointer group transition-all">
                    <span className="text-xs font-bold text-text-dark group-hover:text-primary transition-colors">{d.name}</span>
                    <input
                      type="checkbox"
                      checked={faceDeviceIds.includes(d.id)}
                      onChange={() =>
                        setFaceDeviceIds((prev) =>
                          prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                        )
                      }
                      className="w-5 h-5 rounded-md border-divider-light text-primary focus:ring-primary/20 transition-all"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button fullWidth onClick={handleAddFace} isLoading={isSubmitting} disabled={!faceFile}>Upload Sample</Button>
              <Button fullWidth variant="outline" onClick={() => setAddModal(null)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {addModal === 'fingerprint' && (
        <Modal
          isOpen
          title="Dermal ID Registration"
          onClose={() => setAddModal(null)}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1.5 ml-1">Binary Template Data</label>
              <Input
                value={fpForm.templateData}
                onChange={(e) => setFpForm((p) => ({ ...p, templateData: e.target.value }))}
                placeholder="Base64-encoded asset"
                icon="data_object"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1.5 ml-1">Anatomical Index (1-10)</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={fpForm.fingerIndex}
                onChange={(e) => setFpForm((p) => ({ ...p, fingerIndex: parseInt(e.target.value) || 1 }))}
                icon="pin"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2.5 ml-1">Propagation Targets</label>
              <div className="space-y-1.5">
                {devices.map((d) => (
                  <label key={d.id} className="flex items-center justify-between p-3 rounded-xl border border-divider-light/50 hover:bg-slate-50 cursor-pointer group transition-all">
                    <span className="text-xs font-bold text-text-dark group-hover:text-primary transition-colors">{d.name}</span>
                    <input
                      type="checkbox"
                      checked={fpForm.deviceIds.includes(d.id)}
                      onChange={() =>
                        setFpForm((p) => ({
                          ...p,
                          deviceIds: p.deviceIds.includes(d.id)
                            ? p.deviceIds.filter((x) => x !== d.id)
                            : [...p.deviceIds, d.id],
                        }))
                      }
                      className="w-5 h-5 rounded-md border-divider-light text-primary focus:ring-primary/20 transition-all"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button fullWidth onClick={handleAddFingerprint} isLoading={isSubmitting}>Register Signature</Button>
              <Button fullWidth variant="outline" onClick={() => setAddModal(null)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
