import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function FaceImage({ faceId, token, className }: { faceId: string; token: string | null; className?: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  const urlRef = useRef<string | null>(null)
  useEffect(() => {
    if (!token) return
    setMissing(false)
    let cancelled = false
    fetch(`${getApiBaseUrl()}/api/faces/${faceId}/image`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404 && !cancelled) setMissing(true)
          return null
        }
        return r.blob()
      })
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
      setMissing(false)
    }
  }, [faceId, token])
  if (missing)
    return (
      <div className={`bg-background-light flex items-center justify-center text-text-light ${className ?? ''}`} title="Изображение недоступно">
        <span className="material-symbols-outlined text-3xl">person</span>
      </div>
    )
  if (!src) return <div className={className} />
  return <img src={src} alt="Face" className={className} />
}
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/templates'
import { Badge, Button, Input } from '../components/atoms'
import { ConfirmDialog } from '../components/molecules'
import { Modal } from '../components/organisms'

import { apiRequest, getApiBaseUrl } from '../lib/api'

interface DepartmentRef {
  id: string
  name: string
}

interface PersonDetail {
  id: string
  firstName: string
  lastName: string
  documentNumber?: string | null
  gender?: string | null
  validFromUtc?: string | null
  validToUtc?: string | null
  isActive: boolean
  onlyVerify?: boolean
  department?: DepartmentRef | null
  companyId?: string | null
  accessLevels: { id: string; name: string }[]
  cards: { id: string; cardNo: string; cardNumber?: string | null }[]
  faces: { id: string; fdid: number }[]
  fingerprints: { id: string; fingerIndex: number }[]
}

interface DepartmentTreeItem {
  id: string
  name: string
  description?: string | null
  sortOrder: number
  parentId?: string | null
  employeesCount: number
  visitorsCount: number
  companyId?: string | null
}

interface AccessLevelDoor {
  deviceId: string
  deviceName: string
  doorIndex: number
}

interface Company {
  id: string
  name: string
  description?: string | null
}

interface AccessLevel {
  id: string
  name: string
  description?: string | null
  doors?: AccessLevelDoor[]
}


type CredentialTab = 'cards' | 'faces' | 'fingerprints'

const CREDENTIAL_TABS: { value: CredentialTab; label: string }[] = [
  { value: 'cards', label: 'Cards' },
  { value: 'faces', label: 'Faces' },
  { value: 'fingerprints', label: 'Fingerprints' },
]

export interface DeviceCapabilities {
  isSupportFingerPrintCfg: boolean
  isSupportFDLib: boolean
  isSupportIrisInfo: boolean
  isSupportEventCardLinkageCfg: boolean
  isSupportCardInfo?: boolean
}

export function PersonDetailPage() {
  const { type, id } = useParams<{ type: 'employee' | 'visitor'; id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [detail, setDetail] = useState<PersonDetail | null>(null)
  const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([])
  const [credentialTab, setCredentialTab] = useState<CredentialTab>('cards')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    validFrom: '',
    validTo: '',
    isActive: true,
    onlyVerify: false,
    accessLevelIds: [] as string[],
    departmentId: null as string | null,
    companyId: null as string | null,
  })
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyMode, setCompanyMode] = useState<'None' | 'Single' | 'Multiple'>('None')
  const [departments, setDepartments] = useState<DepartmentTreeItem[]>([])
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addModal, setAddModal] = useState<'card' | 'face' | 'fingerprint' | null>(null)
  const [faceSourceMode, setFaceSourceMode] = useState<'device' | 'computer' | 'webcam'>('computer')
  const [cardForm, setCardForm] = useState({ cardNo: '' })
  const [faceFile, setFaceFile] = useState<File | null>(null)
  const [faceCaptureDeviceId, setFaceCaptureDeviceId] = useState<string>('')
  const [faceCaptureProgress, setFaceCaptureProgress] = useState<{ status: string; progress?: number; message?: string } | null>(null)
  const [webcamError, setWebcamError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cardSourceMode, setCardSourceMode] = useState<'manual' | 'device'>('manual')
  const [cardCaptureDeviceId, setCardCaptureDeviceId] = useState<string>('')
  const [cardCaptureProgress, setCardCaptureProgress] = useState<{ status: string; message?: string } | null>(null)
  
  const [fingerprintCaptureDeviceId, setFingerprintCaptureDeviceId] = useState<string>('')
  const [fingerprintCaptureProgress, setFingerprintCaptureProgress] = useState<{ status: string; message?: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deviceCapabilities, setDeviceCapabilities] = useState<Record<string, DeviceCapabilities>>({})

  const apiPath = type === 'employee' ? '/api/employees' : '/api/visitors'

  const loadDetail = useCallback(async () => {
    if (!token || !id) return
    setError(null)
    try {
      const data = await apiRequest<PersonDetail>(`${apiPath}/${id}`, { token })
      setDetail(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    }
  }, [token, id, apiPath])

  const loadCompanies = useCallback(async (): Promise<Company[]> => {
    if (!token) return []
    try {
      const list = await apiRequest<Company[]>(`/api/companies`, { token })
      setCompanies(list)
      return list
    } catch {
      setCompanies([])
      return []
    }
  }, [token])

  const loadCompanyMode = useCallback(async (): Promise<string> => {
    if (!token) return 'None'
    try {
      const setting = await apiRequest<{ key: string; value: string }>(`/api/system-settings/CompanyMode`, { token })
      setCompanyMode(setting.value as any)
      return setting.value
    } catch {
      setCompanyMode('None')
      return 'None'
    }
  }, [token])

  const loadAccessLevels = useCallback(async () => {
    if (!token) return
    try {
      const list = await apiRequest<AccessLevel[]>(`/api/access-levels`, { token })
      setAccessLevels(list)
    } catch {
      setAccessLevels([])
    }
  }, [token])

  const loadDepartments = useCallback(async (cId?: string | null) => {
    if (!token) return
    
    // В режиме группы компаний, если компания не выбрана - не показываем отделы
    if (companyMode === 'Multiple' && !cId) {
      setDepartments([])
      return
    }

    try {
      const params = new URLSearchParams()
      if (cId) params.set('companyId', cId)
      const list = await apiRequest<DepartmentTreeItem[]>(`/api/departments/tree?${params}`, { token })
      setDepartments(list)
    } catch {
      setDepartments([])
    }
  }, [token, companyMode])

  const devicesFromAccessLevels = useMemo(() => {
    const levelIds = formData.accessLevelIds
    const levels = accessLevels.filter((al) => levelIds.includes(al.id))
    const map = new Map<string, string>()
    for (const level of levels) {
      for (const door of level.doors ?? []) {
        map.set(door.deviceId, door.deviceName)
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [accessLevels, formData.accessLevelIds])

  // Показывать устройство, если capabilities ещё не загружены (cap == null) или устройство поддерживает функцию
  const devicesSupportingCard = useMemo(() =>
    devicesFromAccessLevels.filter((d) => {
      const cap = deviceCapabilities[d.id]
      return cap == null || cap.isSupportEventCardLinkageCfg
    }),
  [devicesFromAccessLevels, deviceCapabilities])
  const devicesSupportingFace = useMemo(() =>
    devicesFromAccessLevels.filter((d) => {
      const cap = deviceCapabilities[d.id]
      return cap == null || cap.isSupportFDLib
    }),
  [devicesFromAccessLevels, deviceCapabilities])
  const devicesSupportingFingerprint = useMemo(() =>
    devicesFromAccessLevels.filter((d) => {
      const cap = deviceCapabilities[d.id]
      return cap == null || cap.isSupportFingerPrintCfg
    }),
  [devicesFromAccessLevels, deviceCapabilities])

  useEffect(() => {
    loadDetail()
    loadAccessLevels()
    loadCompanies()
    loadCompanyMode()
  }, [loadDetail, loadAccessLevels, loadCompanies, loadCompanyMode])

  useEffect(() => {
    loadDepartments(formData.companyId)
  }, [loadDepartments, formData.companyId])

  useEffect(() => {
    if (addModal !== 'face' || faceSourceMode !== 'webcam') return
    setWebcamError(null)
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch((err) => setWebcamError(err.message || 'Не удалось получить доступ к камере'))
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [addModal, faceSourceMode])

  // При заходе на страницу пользователя — запрос GET /ISAPI/AccessControl/capabilities по каждому устройству, сохранение в state и вывод в консоль
  useEffect(() => {
    if (!id || !token) return
    const base = getApiBaseUrl()
    const controller = new AbortController()
    const next: Record<string, DeviceCapabilities> = {}
    ;(async () => {
      try {
        const devicesRes = await fetch(`${base}/api/devices`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!devicesRes.ok) return
        const devices: { id: string; name?: string }[] = await devicesRes.json()
        for (const dev of devices) {
          try {
            const capRes = await fetch(`${base}/api/devices/${dev.id}/access-control/capabilities`, {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal,
            })
            const text = await capRes.text()
            const data = (() => {
              try { return JSON.parse(text) as DeviceCapabilities } catch { return null }
            })()
            if (data && typeof data === 'object') {
              next[dev.id] = {
                isSupportFingerPrintCfg: Boolean(data.isSupportFingerPrintCfg),
                isSupportFDLib: Boolean(data.isSupportFDLib),
                isSupportIrisInfo: Boolean(data.isSupportIrisInfo),
                isSupportEventCardLinkageCfg: Boolean(data.isSupportEventCardLinkageCfg),
                isSupportCardInfo: Boolean(data.isSupportCardInfo),
              }
            }
            console.log('[ISAPI/AccessControl/capabilities]', dev.name ?? dev.id, data ?? text)
          } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') return
            console.warn('[ISAPI/AccessControl/capabilities]', dev.name ?? dev.id, e)
          }
        }
        setDeviceCapabilities((prev) => ({ ...prev, ...next }))
      } catch (_) { /* unmount or abort */ }
    })()
    return () => controller.abort()
  }, [id, token])

  useEffect(() => {
    if (!detail) return
    const validFrom = detail.validFromUtc ? detail.validFromUtc.slice(0, 10) : new Date().toISOString().slice(0, 10)
    const validTo = detail.validToUtc ? detail.validToUtc.slice(0, 10) : '2037-12-31'
    
    let cId = detail.companyId ?? null;
    if (!cId && companyMode === 'Single' && companies.length > 0) {
      cId = companies[0].id;
    }

    setFormData({
      firstName: detail.firstName,
      lastName: detail.lastName,
      gender: (detail as PersonDetail & { gender?: string }).gender ?? '',
      validFrom,
      validTo,
      isActive: detail.isActive,
      onlyVerify: (detail as PersonDetail & { onlyVerify?: boolean }).onlyVerify ?? false,
      accessLevelIds: detail.accessLevels?.map((a) => a.id) ?? [],
      departmentId: detail.department?.id ?? null,
      companyId: cId,
    })
  }, [detail, companies, companyMode])

  function showSyncWarnings(res: { syncWarnings?: string[] | null }) {
    const w = res?.syncWarnings
    if (Array.isArray(w) && w.length > 0) {
      setError('Ошибки синхронизации с устройствами:\n' + w.join('\n'))
    }
  }

  async function handleAddCardFromDevice() {
    if (!token || !detail || !cardCaptureDeviceId) return
    const cap = deviceCapabilities[cardCaptureDeviceId]
    if (cap != null && !cap.isSupportEventCardLinkageCfg) {
      setError('Устройство не поддерживает добавление карт на этом устройстве.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    setCardCaptureProgress({ status: 'starting', message: 'Запуск захвата...' })
    try {
      const startRes = await fetch(`${getApiBaseUrl()}/api/devices/${cardCaptureDeviceId}/cards/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ personId: id, personType: type }),
      })
      if (!startRes.ok) {
        const err = await startRes.json().catch(() => ({}))
        throw new Error(err.message || 'Ошибка запуска захвата карты')
      }
      const pollProgress = async (): Promise<void> => {
        const progRes = await fetch(`${getApiBaseUrl()}/api/devices/${cardCaptureDeviceId}/cards/capture/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const prog = await progRes.json().catch(() => ({}))
        const st = String(prog.status ?? '').toLowerCase()
        setCardCaptureProgress({ status: st || 'capturing', message: prog.message })
        if (st === 'completed') {
          setCardCaptureProgress(null)
          setCardCaptureDeviceId('')
          setAddModal(null)
          await loadDetail()
          return
        }
        if (st === 'failed') throw new Error(prog.message || 'Захват карты не удался')
        await new Promise((r) => setTimeout(r, 1500))
        return pollProgress()
      }
      await pollProgress()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка захвата карты с устройства')
      setCardCaptureProgress(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddCard() {
    if (!token || !detail) return
    if (cardSourceMode === 'device') {
      await handleAddCardFromDevice()
      return
    }
    if (!cardForm.cardNo.trim()) {
      setError('Card number is required')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await apiRequest<{ syncWarnings?: string[] }>('/api/cards', {
        method: 'POST',
        token,
        body: JSON.stringify({
          cardNo: cardForm.cardNo.trim(),
          cardNumber: null,
          employeeId: type === 'employee' ? id : null,
          visitorId: type === 'visitor' ? id : null,
          deviceIds: [],
        }),
      })
      showSyncWarnings(res)
      setAddModal(null)
      setCardForm({ cardNo: '' })
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add card')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function uploadFaceImage(imageBlob: Blob) {
    if (!token || !detail) return
    const fd = new FormData()
    fd.append('EmployeeId', type === 'employee' ? id! : '')
    fd.append('VisitorId', type === 'visitor' ? id! : '')
    fd.append('FDID', '1')
    fd.append('Image', imageBlob, 'face.jpg')
    const res = await fetch(`${getApiBaseUrl()}/api/faces`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Failed to upload face')
    showSyncWarnings(data)
    setAddModal(null)
    setFaceFile(null)
    await loadDetail()
  }

  async function handleAddFace() {
    if (!token || !detail) return
    if (faceSourceMode === 'device') {
      await handleAddFaceFromDevice()
      return
    }
    if (faceSourceMode === 'webcam') {
      handleCaptureFromWebcam()
      return
    }
    if (!faceFile) return
    setIsSubmitting(true)
    setError(null)
    try {
      await uploadFaceImage(faceFile)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload face')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddFaceFromDevice() {
    if (!token || !detail || !faceCaptureDeviceId) return
    const cap = deviceCapabilities[faceCaptureDeviceId]
    if (cap != null && !cap.isSupportFDLib) {
      setError('Устройство не поддерживает добавление лиц на этом устройстве.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    setFaceCaptureProgress({ status: 'starting', message: 'Запуск захвата...' })
    try {
      const startRes = await fetch(`${getApiBaseUrl()}/api/devices/${faceCaptureDeviceId}/faces/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ personId: id, personType: type }),
      })
      if (!startRes.ok) {
        const err = await startRes.json().catch(() => ({}))
        throw new Error(err.message || 'Ошибка запуска захвата')
      }
      const pollProgress = async (): Promise<void> => {
        const progRes = await fetch(`${getApiBaseUrl()}/api/devices/${faceCaptureDeviceId}/faces/capture/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const prog = await progRes.json().catch(() => ({}))
        setFaceCaptureProgress({ status: prog.status ?? 'capturing', progress: prog.progress, message: prog.message })
        if (prog.status === 'completed') {
          setAddModal(null)
          setFaceCaptureDeviceId('')
          setFaceCaptureProgress(null)
          if (prog.faceId) await loadDetail()
          else if (prog.message) setError(prog.message)
          return
        }
        if (prog.status === 'failed') throw new Error(prog.message || 'Захват не удался')
        await new Promise((r) => setTimeout(r, 1500))
        return pollProgress()
      }
      await pollProgress()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка захвата с устройства')
      setFaceCaptureProgress(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCaptureFromWebcam() {
    if (!videoRef.current || !canvasRef.current || !token || !detail) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      async (blob) => {
        if (!blob) return
        setIsSubmitting(true)
        setError(null)
        try {
          await uploadFaceImage(blob)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Ошибка загрузки')
        } finally {
          setIsSubmitting(false)
        }
      },
      'image/jpeg',
      0.92
    )
  }

  async function handleAddFingerprintFromDevice() {
    if (!token || !detail || !fingerprintCaptureDeviceId) return
    const cap = deviceCapabilities[fingerprintCaptureDeviceId]
    if (cap != null && !cap.isSupportFingerPrintCfg) {
      setError('Устройство не поддерживает добавление отпечатков на этом устройстве.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    setFingerprintCaptureProgress({ status: 'starting', message: 'Запуск захвата...' })
    try {
      const startRes = await fetch(`${getApiBaseUrl()}/api/devices/${fingerprintCaptureDeviceId}/fingerprints/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ personId: id, personType: type, fingerIndex: 1 }),
      })
      if (!startRes.ok) {
        const err = await startRes.json().catch(() => ({}))
        throw new Error(err.message || 'Ошибка запуска захвата отпечатка')
      }
      const pollProgress = async (): Promise<void> => {
        const progRes = await fetch(`${getApiBaseUrl()}/api/devices/${fingerprintCaptureDeviceId}/fingerprints/capture/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const prog = await progRes.json().catch(() => ({}))
        setFingerprintCaptureProgress({ status: prog.status ?? 'capturing', message: prog.message })
        if (prog.status === 'completed') {
          setAddModal(null)
          setFingerprintCaptureDeviceId('')
          setFingerprintCaptureProgress(null)
          if (prog.fingerprintId) await loadDetail()
          else if (prog.message) setError(prog.message)
          return
        }
        if (prog.status === 'failed') throw new Error(prog.message || 'Захват отпечатка не удался')
        await new Promise((r) => setTimeout(r, 1500))
        return pollProgress()
      }
      await pollProgress()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка захвата отпечатка с устройства')
      setFingerprintCaptureProgress(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddFingerprint() {
    if (!token || !detail) return
    await handleAddFingerprintFromDevice()
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
    if (!token || !confirm('Удалить лицо? Оно будет удалено со всех устройств.')) return
    setError(null)
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/faces/${faceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 204) {
        await loadDetail()
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Ошибка удаления')
      showSyncWarnings(data)
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления лица')
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

  async function handleSave() {
    if (!token || !id || !detail) return
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Имя и фамилия обязательны')
      return
    }
    setSaveLoading(true)
    setError(null)
    try {
      if (type === 'employee') {
        const res = await apiRequest<PersonDetail & { syncWarnings?: string[] }>(`${apiPath}/${id}`, {
          method: 'PUT',
          token,
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            gender: formData.gender.trim() || null,
            validFromUtc: formData.validFrom ? formData.validFrom + 'T00:00:00Z' : null,
            validToUtc: formData.validTo ? formData.validTo + 'T23:59:59Z' : null,
            isActive: formData.isActive,
            onlyVerify: formData.onlyVerify,
            accessLevelIds: formData.accessLevelIds,
            departmentId: formData.departmentId || null,
            companyId: formData.companyId || null,
          }),
        })
        showSyncWarnings(res)
        setDetail(res)
      } else {
        const res = await apiRequest<PersonDetail & { syncWarnings?: string[] }>(`${apiPath}/${id}`, {
          method: 'PUT',
          token,
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            documentNumber: detail.documentNumber ?? null,
            validFromUtc: formData.validFrom ? formData.validFrom + 'T00:00:00Z' : null,
            validToUtc: formData.validTo ? formData.validTo + 'T23:59:59Z' : null,
            isActive: formData.isActive,
            accessLevelIds: formData.accessLevelIds,
            departmentId: formData.departmentId || null,
            companyId: formData.companyId || null,
          }),
        })
        showSyncWarnings(res)
        setDetail(res)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaveLoading(false)
    }
  }

  function toggleAccessLevel(levelId: string) {
    setFormData((prev) => ({
      ...prev,
      accessLevelIds: prev.accessLevelIds.includes(levelId)
        ? prev.accessLevelIds.filter((x) => x !== levelId)
        : [...prev.accessLevelIds, levelId],
    }))
  }

  async function handleRetireProfile() {
    if (!token || !id || !type) return
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await apiRequest<{ syncWarnings?: string[] } | void>(`${apiPath}/${id}`, { method: 'DELETE', token })
      const warnings = res && typeof res === 'object' && Array.isArray((res as { syncWarnings?: string[] }).syncWarnings)
        ? (res as { syncWarnings: string[] }).syncWarnings
        : null
      setDeleteConfirmOpen(false)
      navigate('/people', { state: warnings?.length ? { syncError: 'Ошибки синхронизации с устройствами:\n' + warnings.join('\n') } : undefined })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete profile')
    } finally {
      setIsSubmitting(false)
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

  const name = `${formData.firstName || detail.firstName} ${formData.lastName || detail.lastName}`.trim() || 'Профиль'
  const initials = `${(formData.firstName || detail.firstName)[0] || ''}${(formData.lastName || detail.lastName)[0] || ''}`.toUpperCase()

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
          {/* Identity Header + Editable Form */}
          <div className="flex flex-col md:flex-row items-start gap-6 animate-in slide-in-from-top-4 duration-500">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary text-3xl md:text-4xl font-black shadow-inner border-2 border-primary/5 flex-shrink-0">
              {detail.faces.length > 0 ? (
                <FaceImage faceId={detail.faces[0].id} token={token} className="w-full h-full object-cover rounded-[2rem]" />
              ) : initials}
            </div>
            <div className="flex-1 w-full space-y-4">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="primary" className="px-3 py-1">{type === 'employee' ? 'Сотрудник' : 'Посетитель'}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Имя</label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="Обязательно"
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Фамилия</label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="Обязательно"
                    className="bg-white"
                  />
                </div>
                {type === 'employee' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Пол</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                        className="w-full h-10 px-3 rounded-xl border border-divider-light bg-white text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                      >
                        <option value="">Не указан</option>
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                      </select>
                    </div>
                  </>
                ) : null}
                <div>
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Действителен с</label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData((p) => ({ ...p, validFrom: e.target.value }))}
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Действителен до</label>
                  <Input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => setFormData((p) => ({ ...p, validTo: e.target.value }))}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                  <div className="bg-surface rounded-3xl shadow-md p-6 space-y-4 border-none">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">corporate_fare</span>
                      <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest">Компания</h3>
                    </div>
                    {companyMode === 'Multiple' ? (
                      <select
                        value={formData.companyId ?? ''}
                        onChange={(e) => setFormData((p) => ({ ...p, companyId: e.target.value || null, departmentId: null }))}
                        className="w-full h-10 px-3 rounded-xl border border-divider-light bg-white text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                      >
                        <option value="">— Не выбрана —</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : companyMode === 'Single' ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-divider-light text-sm font-bold text-text-dark">
                        {companies.find(c => c.id === formData.companyId)?.name || 'Основная компания'}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted">Компании не используются</p>
                    )}
                  </div>
                  {/* Отдел */}
              <div className="bg-surface rounded-3xl shadow-md p-6 space-y-4 border-none">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">business</span>
                  <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest">Отдел</h3>
                </div>
                <select
                  value={formData.departmentId ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, departmentId: e.target.value || null }))}
                  className="w-full h-10 px-3 rounded-xl border border-divider-light bg-white text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                >
                  <option value="">— Не назначен —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Access Rights - editable */}
              <div className="bg-surface rounded-3xl shadow-md p-6 space-y-4 border-none">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">security</span>
                  <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest">Уровни доступа</h3>
                </div>
                {accessLevels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {accessLevels.map((level) => (
                      <label
                        key={level.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl border cursor-pointer transition-all ${
                          formData.accessLevelIds.includes(level.id)
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-slate-50 border-divider-light hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.accessLevelIds.includes(level.id)}
                          onChange={() => toggleAccessLevel(level.id)}
                          className="rounded border-divider-light text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-bold text-text-dark">{level.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">Нет доступных уровней доступа</p>
                )}
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
                    <div className="flex flex-col items-center gap-4">
                      {detail.faces.length === 0 ? (
                        <div className="py-12 text-center text-[10px] font-black text-text-light uppercase tracking-widest opacity-50">Лицо не зарегистрировано</div>
                      ) : (
                        <div className="relative group">
                          <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-md transition-transform group-hover:scale-105 border-none">
                            <FaceImage faceId={detail.faces[0].id} token={token} className="w-full h-full object-cover" />
                          </div>
                          <button
                            onClick={() => handleDeleteFace(detail.faces[0].id)}
                            className="absolute -top-2 -right-2 w-7 h-7 bg-error-bg text-error-text border border-error-text/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      )}
                      <p className="text-[10px] text-text-light text-center">
                        {detail.faces.length > 0
                          ? 'Нажмите «Enroll» чтобы заменить лицо. Синхронизация при сохранении профиля.'
                          : 'Нажмите «Enroll» чтобы захватить лицо с устройства.'}
                      </p>
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
                <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest">Статус</h3>
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <span className="text-xs font-black text-text-dark uppercase tracking-widest">
                    {type === 'employee' ? (formData.isActive ? 'Активен' : 'Уволен') : (formData.isActive ? 'Активен' : 'Заблокирован')}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                      className="w-5 h-5 rounded border-divider-light text-primary focus:ring-primary"
                    />
                    <Badge variant={formData.isActive ? 'success' : 'error'} dot>
                      {type === 'employee' ? (formData.isActive ? 'Активен' : 'Уволен') : (formData.isActive ? 'Активен' : 'Заблокирован')}
                    </Badge>
                  </div>
                </label>
                {type === 'employee' && (
                  <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.onlyVerify}
                      onChange={(e) => setFormData((p) => ({ ...p, onlyVerify: e.target.checked }))}
                      className="w-5 h-5 mt-0.5 rounded border-divider-light text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-xs font-black text-text-dark uppercase tracking-widest block">Только учёт рабочего времени</span>
                      <p className="text-[10px] text-text-light mt-1 leading-relaxed">При включении у работника будет учитываться рабочее время, но дверь открываться не будет.</p>
                    </div>
                  </label>
                )}
              </div>

              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Действия</h3>
                <Button fullWidth icon="save" size="md" onClick={handleSave} isLoading={saveLoading}>Сохранить</Button>
                <Button fullWidth variant="danger" icon="delete" size="md" onClick={() => setDeleteConfirmOpen(true)}>Удалить профиль</Button>
                <p className="text-[9px] text-text-light text-center leading-relaxed">Удаление профиля отзовёт все права доступа и учётные данные.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Modals with Premium Mobile Layout */}
      {addModal === 'card' && (
        <Modal
          isOpen
          title="Добавить карту"
          onClose={() => {
            setAddModal(null)
            setCardCaptureProgress(null)
            setCardCaptureDeviceId('')
          }}
        >
          <div className="space-y-5">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              {(['manual', 'device'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCardSourceMode(mode)}
                  className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                    cardSourceMode === mode ? 'bg-white text-primary shadow' : 'text-text-light hover:text-text-dark'
                  }`}
                >
                  {mode === 'device' ? 'С устройства' : 'Вручную'}
                </button>
              ))}
            </div>
            {cardSourceMode === 'device' && (
              <>
                <div>
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2">Устройство</label>
                  <select
                    value={devicesSupportingCard.some((d) => d.id === cardCaptureDeviceId) ? cardCaptureDeviceId : ''}
                    onChange={(e) => setCardCaptureDeviceId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-divider-light bg-surface text-sm font-bold"
                  >
                    <option value="">Выберите устройство</option>
                    {devicesSupportingCard.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {devicesFromAccessLevels.length > 0 && devicesSupportingCard.length === 0 && (
                    <p className="text-xs text-error-text mt-1.5">Нет устройств с поддержкой добавления карт</p>
                  )}
                </div>
                {cardCaptureProgress && (
                  <div className="p-4 bg-slate-50 rounded-xl text-sm">
                    <p className="font-bold">{cardCaptureProgress.message || cardCaptureProgress.status}</p>
                  </div>
                )}
              </>
            )}
            {cardSourceMode === 'manual' && (
              <>
                <div>
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1.5 ml-1">Serial ID / Label</label>
                  <Input
                    value={cardForm.cardNo}
                    onChange={(e) => setCardForm((p) => ({ ...p, cardNo: e.target.value }))}
                    placeholder="Required"
                    icon="nfc"
                  />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-4">
              <Button
                fullWidth
                onClick={handleAddCard}
                isLoading={isSubmitting}
                disabled={cardSourceMode === 'device' ? !cardCaptureDeviceId || devicesSupportingCard.length === 0 || !devicesSupportingCard.some((d) => d.id === cardCaptureDeviceId) : !cardForm.cardNo.trim()}
              >
                {cardSourceMode === 'device' ? 'Запустить захват' : 'Enroll Token'}
              </Button>
              <Button fullWidth variant="outline" onClick={() => setAddModal(null)}>Отмена</Button>
            </div>
          </div>
        </Modal>
      )}

      {addModal === 'face' && (
        <Modal
          isOpen
          title="Добавить лицо"
          onClose={() => {
            setAddModal(null)
            setFaceCaptureProgress(null)
            setFaceCaptureDeviceId('')
          }}
        >
          <div className="space-y-5">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              {(['device', 'computer', 'webcam'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFaceSourceMode(mode)}
                  className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                    faceSourceMode === mode ? 'bg-white text-primary shadow' : 'text-text-light hover:text-text-dark'
                  }`}
                >
                  {mode === 'device' ? 'С устройства' : mode === 'computer' ? 'С компьютера' : 'С веб-камеры'}
                </button>
              ))}
            </div>

            {faceSourceMode === 'device' && (
              <>
                <div>
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2">Устройство</label>
                  <select
                    value={devicesSupportingFace.some((d) => d.id === faceCaptureDeviceId) ? faceCaptureDeviceId : ''}
                    onChange={(e) => setFaceCaptureDeviceId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-divider-light bg-surface text-sm font-bold"
                  >
                    <option value="">Выберите устройство</option>
                    {devicesSupportingFace.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {devicesFromAccessLevels.length > 0 && devicesSupportingFace.length === 0 && (
                    <p className="text-xs text-error-text mt-1.5">Нет устройств с поддержкой добавления лиц</p>
                  )}
                </div>
                {faceCaptureProgress && (
                  <div className="p-4 bg-slate-50 rounded-xl text-sm">
                    <p className="font-bold">{faceCaptureProgress.message || faceCaptureProgress.status}</p>
                    {faceCaptureProgress.progress != null && (
                      <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${faceCaptureProgress.progress}%` }} />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {faceSourceMode === 'computer' && (
              <div className="p-10 border-2 border-dashed border-divider-light rounded-3xl bg-slate-50 flex flex-col items-center justify-center group hover:border-primary/50 transition-all relative overflow-hidden min-h-[160px]">
                {faceFile ? (
                  <img src={URL.createObjectURL(faceFile)} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl text-text-light/50 mb-3">add_a_photo</span>
                    <p className="text-[10px] font-black text-text-light uppercase tracking-widest">Выберите файл изображения</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFaceFile(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            )}

            {faceSourceMode === 'webcam' && (
              <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden">
                {webcamError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-error-text p-4">
                    <span className="material-symbols-outlined text-4xl mb-2">videocam_off</span>
                    <p className="text-xs text-center">{webcamError}</p>
                  </div>
                ) : (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {(faceSourceMode === 'computer' || faceSourceMode === 'webcam') && (
              <p className="text-[10px] text-text-light bg-slate-50 rounded-xl p-3">
                Лицо будет автоматически синхронизировано с устройствами из назначенных уровней доступа при сохранении профиля.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                fullWidth
                onClick={handleAddFace}
                isLoading={isSubmitting}
                disabled={
                  faceSourceMode === 'computer' ? !faceFile :
                  faceSourceMode === 'device' ? !faceCaptureDeviceId || devicesSupportingFace.length === 0 || !devicesSupportingFace.some((d) => d.id === faceCaptureDeviceId) :
                  faceSourceMode === 'webcam' ? !!webcamError : true
                }
              >
                {faceSourceMode === 'device' ? 'Запустить захват' : faceSourceMode === 'webcam' ? 'Сделать снимок' : 'Загрузить'}
              </Button>
              <Button fullWidth variant="outline" onClick={() => setAddModal(null)}>Отмена</Button>
            </div>
          </div>
        </Modal>
      )}

      {addModal === 'fingerprint' && (
        <Modal
          isOpen
          title="Добавить отпечаток"
          onClose={() => {
            setAddModal(null)
            setFingerprintCaptureProgress(null)
            setFingerprintCaptureDeviceId('')
          }}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2">Устройство</label>
              <select
                value={devicesSupportingFingerprint.some((d) => d.id === fingerprintCaptureDeviceId) ? fingerprintCaptureDeviceId : ''}
                onChange={(e) => setFingerprintCaptureDeviceId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-divider-light bg-surface text-sm font-bold"
              >
                <option value="">Выберите устройство</option>
                {devicesSupportingFingerprint.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {devicesFromAccessLevels.length > 0 && devicesSupportingFingerprint.length === 0 && (
                <p className="text-xs text-error-text mt-1.5">Нет устройств с поддержкой добавления отпечатков</p>
              )}
            </div>
            {fingerprintCaptureProgress && (
              <div className="p-4 bg-slate-50 rounded-xl text-sm">
                <p className="font-bold">{fingerprintCaptureProgress.message || fingerprintCaptureProgress.status}</p>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button
                fullWidth
                onClick={handleAddFingerprint}
                isLoading={isSubmitting}
                disabled={!fingerprintCaptureDeviceId || devicesSupportingFingerprint.length === 0 || !devicesSupportingFingerprint.some((d) => d.id === fingerprintCaptureDeviceId)}
              >
                Запустить захват
              </Button>
              <Button fullWidth variant="outline" onClick={() => setAddModal(null)}>Отмена</Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleRetireProfile}
        title="Retire Profile"
        message={`Are you sure you want to permanently delete ${name}? This will remove all cards, faces, and fingerprints from the system and from all devices.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </AppLayout>
  )
}
