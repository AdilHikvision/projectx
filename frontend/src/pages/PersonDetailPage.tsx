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
import { AppLayout } from '../components/AppLayout'
import { Card, Badge, Button, Input, PageHeader, Modal } from '../components/ui'
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
  { value: 'cards', label: 'Карты' },
  { value: 'faces', label: 'Лица' },
  { value: 'fingerprints', label: 'Отпечатки' },
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
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
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
      setError('Номер карты обязателен')
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
      setError(e instanceof Error ? e.message : 'Ошибка добавления карты')
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
        throw new Error(err.message || 'Ошибка загрузки лица')
      }
      setAddModal(null)
      setFaceFile(null)
      setFaceDeviceIds([])
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка добавления лица')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddFingerprint() {
    if (!token || !detail) return
    if (!fpForm.templateData.trim()) {
      setError('Шаблон отпечатка (base64) обязателен')
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
      setError(e instanceof Error ? e.message : 'Ошибка добавления отпечатка')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!token || !confirm('Удалить карту?')) return
    try {
      await apiRequest(`/api/cards/${cardId}`, { method: 'DELETE', token })
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  async function handleDeleteFace(faceId: string) {
    if (!token || !confirm('Удалить лицо?')) return
    try {
      await apiRequest(`/api/faces/${faceId}`, { method: 'DELETE', token })
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  async function handleDeleteFingerprint(fpId: string) {
    if (!token || !confirm('Удалить отпечаток?')) return
    try {
      await apiRequest(`/api/fingerprints/${fpId}`, { method: 'DELETE', token })
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  if (!detail) {
    return (
      <AppLayout>
        <div className="p-4">
          {error ? (
            <div className="text-destructive">{error}</div>
          ) : (
            <div className="text-text-muted">Загрузка...</div>
          )}
        </div>
      </AppLayout>
    )
  }

  const name = `${detail.firstName} ${detail.lastName}`
  const secondary = type === 'employee' ? detail.personnelNumber : detail.documentNumber

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <PageHeader
          title={name}
          description={secondary ? `${type === 'employee' ? 'Табельный' : 'Документ'}: ${secondary}` : undefined}
          actions={
            <Button variant="outline" size="sm" icon="arrow_back" onClick={() => navigate('/people')}>
              Назад
            </Button>
          }
        />

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Уровни доступа</h3>
          <div className="flex flex-wrap gap-2">
            {detail.accessLevels.length > 0 ? (
              detail.accessLevels.map((a) => (
                <Badge key={a.id} variant="neutral">
                  {a.name}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-text-muted">Нет</span>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {CREDENTIAL_TABS.map((t) => (
                <Button
                  key={t.value}
                  size="sm"
                  variant={credentialTab === t.value ? 'secondary' : 'ghost'}
                  onClick={() => setCredentialTab(t.value)}
                >
                  {t.label}
                </Button>
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
              Добавить
            </Button>
          </div>

          {credentialTab === 'cards' && (
            <div className="space-y-2">
              {detail.cards.length === 0 ? (
                <p className="text-sm text-text-muted">Нет карт</p>
              ) : (
                detail.cards.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-75"
                  >
                    <span className="font-mono text-sm">{c.cardNo}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="delete"
                      className="p-2 h-auto text-destructive"
                      onClick={() => handleDeleteCard(c.id)}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {credentialTab === 'faces' && (
            <div className="space-y-2">
              {detail.faces.length === 0 ? (
                <p className="text-sm text-text-muted">Нет лиц</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {detail.faces.map((f) => (
                    <div key={f.id} className="relative group">
                      <FaceImage faceId={f.id} token={token} className="w-20 h-20 object-cover rounded-lg border" />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="delete"
                        className="absolute top-0 right-0 p-1 h-auto text-destructive opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteFace(f.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {credentialTab === 'fingerprints' && (
            <div className="space-y-2">
              {detail.fingerprints.length === 0 ? (
                <p className="text-sm text-text-muted">Нет отпечатков</p>
              ) : (
                detail.fingerprints.map((fp) => (
                  <div
                    key={fp.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-75"
                  >
                    <span className="text-sm">Палец #{fp.fingerIndex}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="delete"
                      className="p-2 h-auto text-destructive"
                      onClick={() => handleDeleteFingerprint(fp.id)}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>

      {addModal === 'card' && (
        <Modal
          isOpen
          title="Добавить карту"
          onClose={() => setAddModal(null)}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => setAddModal(null)}>Отмена</Button>
              <Button size="sm" onClick={handleAddCard} disabled={isSubmitting}>{isSubmitting ? '...' : 'Добавить'}</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase mb-1">Номер карты</p>
              <Input
                value={cardForm.cardNo}
                onChange={(e) => setCardForm((p) => ({ ...p, cardNo: e.target.value }))}
                placeholder="Обязательно"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase mb-1">CardNumber (опционально)</p>
              <Input
                value={cardForm.cardNumber}
                onChange={(e) => setCardForm((p) => ({ ...p, cardNumber: e.target.value }))}
              />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase mb-2">Синхронизировать на устройства</p>
              <div className="flex flex-wrap gap-2">
                {devices.map((d) => (
                  <label key={d.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer">
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
                    />
                    <span className="text-sm">{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {addModal === 'face' && (
        <Modal
          isOpen
          title="Добавить лицо"
          onClose={() => setAddModal(null)}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => setAddModal(null)}>Отмена</Button>
              <Button size="sm" onClick={handleAddFace} disabled={isSubmitting || !faceFile}>{isSubmitting ? '...' : 'Добавить'}</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase mb-2">Изображение</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFaceFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase mb-2">Синхронизировать на устройства</p>
              <div className="flex flex-wrap gap-2">
                {devices.map((d) => (
                  <label key={d.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faceDeviceIds.includes(d.id)}
                      onChange={() =>
                        setFaceDeviceIds((prev) =>
                          prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                        )
                      }
                    />
                    <span className="text-sm">{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {addModal === 'fingerprint' && (
        <Modal
          isOpen
          title="Добавить отпечаток"
          onClose={() => setAddModal(null)}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => setAddModal(null)}>Отмена</Button>
              <Button size="sm" onClick={handleAddFingerprint} disabled={isSubmitting}>{isSubmitting ? '...' : 'Добавить'}</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase mb-1">Шаблон (base64)</p>
              <Input
                value={fpForm.templateData}
                onChange={(e) => setFpForm((p) => ({ ...p, templateData: e.target.value }))}
                placeholder="Base64-encoded template"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase mb-1">Индекс пальца (1-10)</p>
              <Input
                type="number"
                min={1}
                max={10}
                value={fpForm.fingerIndex}
                onChange={(e) => setFpForm((p) => ({ ...p, fingerIndex: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase mb-2">Синхронизировать на устройства</p>
              <div className="flex flex-wrap gap-2">
                {devices.map((d) => (
                  <label key={d.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer">
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
                    />
                    <span className="text-sm">{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
