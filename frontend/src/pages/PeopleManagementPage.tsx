import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/AppLayout'
import { Card, Badge, Button, Input, Avatar, PageHeader, Modal } from '../components/ui'
import { useLoading } from '../context/LoadingContext'
import { apiRequest } from '../lib/api'

interface AccessLevelRef {
  id: string
  name: string
}

interface EmployeeResponse {
  id: string
  firstName: string
  lastName: string
  personnelNumber?: string | null
  employeeNo?: string | null
  gender?: string | null
  validFromUtc?: string | null
  validToUtc?: string | null
  isActive: boolean
  accessLevelNames: string[]
  cardsCount: number
  facesCount: number
  fingerprintsCount: number
}

interface EmployeeDetailResponse extends EmployeeResponse {
  accessLevels: AccessLevelRef[]
  cards: { id: string; cardNo: string; cardNumber?: string | null }[]
  faces: { id: string; fdid: number }[]
  fingerprints: { id: string; fingerIndex: number }[]
}

interface VisitorResponse {
  id: string
  firstName: string
  lastName: string
  documentNumber?: string | null
  visitDateUtc: string
  isActive: boolean
  accessLevelNames: string[]
  cardsCount: number
  facesCount: number
  fingerprintsCount: number
}

interface VisitorDetailResponse extends VisitorResponse {
  accessLevels: AccessLevelRef[]
  cards: { id: string; cardNo: string; cardNumber?: string | null }[]
  faces: { id: string; fdid: number }[]
  fingerprints: { id: string; fingerIndex: number }[]
}

interface AccessLevel {
  id: string
  name: string
  description?: string | null
}

type TabType = 'employees' | 'visitors'

const TABS: { value: TabType; label: string }[] = [
  { value: 'employees', label: 'Employers' },
  { value: 'visitors', label: 'Visitor' },
]

export function PeopleManagementPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { startLoading, stopLoading, isLoading } = useLoading()
  const [tab, setTab] = useState<TabType>('employees')
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [visitors, setVisitors] = useState<VisitorResponse[]>([])
  const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [error, setError] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDetailResponse | null>(null)
  const [editingVisitor, setEditingVisitor] = useState<VisitorDetailResponse | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    personnelNumber: '',
    employeeNo: '',
    gender: '',
    validFrom: '',
    validTo: '',
    documentNumber: '',
    visitDateUtc: new Date().toISOString().slice(0, 10),
    accessLevelIds: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncResult, setSyncResult] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [devices, setDevices] = useState<{ id: string; name: string; ipAddress: string }[]>([])
  const [importSelectedDeviceIds, setImportSelectedDeviceIds] = useState<string[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<{
    importedCount: number
    skippedCount: number
    errorCount: number
    items: { employeeNo: string; name: string; deviceName: string; success: boolean; message?: string }[]
  } | null>(null)

  const loadEmployees = useCallback(async () => {
    if (!token) return
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (statusFilter === 'active') params.set('isActive', 'true')
      if (statusFilter === 'inactive') params.set('isActive', 'false')
      const list = await apiRequest<EmployeeResponse[]>(`/api/employees?${params}`, { token })
      setEmployees(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки сотрудников')
    }
  }, [token, searchQuery, statusFilter])

  const loadVisitors = useCallback(async () => {
    if (!token) return
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (statusFilter === 'active') params.set('isActive', 'true')
      if (statusFilter === 'inactive') params.set('isActive', 'false')
      const list = await apiRequest<VisitorResponse[]>(`/api/visitors?${params}`, { token })
      setVisitors(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки посетителей')
    }
  }, [token, searchQuery, statusFilter])

  const loadAccessLevels = useCallback(async () => {
    if (!token) return
    try {
      const list = await apiRequest<AccessLevel[]>(`/api/access-levels`, { token })
      setAccessLevels(list)
    } catch {
      setAccessLevels([])
    }
  }, [token])

  useEffect(() => {
    loadAccessLevels()
  }, [loadAccessLevels])

  useEffect(() => {
    if (!token) return
    startLoading()
    if (tab === 'employees') {
      loadEmployees().finally(stopLoading)
    } else {
      loadVisitors().finally(stopLoading)
    }
  }, [tab, token, loadEmployees, loadVisitors, startLoading, stopLoading])

  const filteredEmployees = useMemo(() => employees, [employees])
  const filteredVisitors = useMemo(() => visitors, [visitors])

  const activeCount = useMemo(() => {
    if (tab === 'employees') return employees.filter((e) => e.isActive).length
    return visitors.filter((v) => v.isActive).length
  }, [tab, employees, visitors])

  async function openCreateModal() {
    setEditingEmployee(null)
    setEditingVisitor(null)
    setModalMode('create')
    setError(null)
    try {
      if (tab === 'employees') {
        const res = await apiRequest<{ nextPersonnelNumber: string }>('/api/employees/next-personnel-number', { token: token ?? undefined })
        setFormData({
          firstName: '',
          lastName: '',
          personnelNumber: res.nextPersonnelNumber,
          employeeNo: res.nextPersonnelNumber,
          gender: '',
          validFrom: '',
          validTo: '',
          documentNumber: '',
          visitDateUtc: new Date().toISOString().slice(0, 10),
          accessLevelIds: [],
        })
      } else {
        const res = await apiRequest<{ nextDocumentNumber: string }>('/api/visitors/next-document-number', { token: token ?? undefined })
        setFormData({
          firstName: '',
          lastName: '',
          personnelNumber: '',
          employeeNo: '',
          gender: '',
          validFrom: '',
          validTo: '',
          documentNumber: res.nextDocumentNumber,
          visitDateUtc: new Date().toISOString().slice(0, 10),
          accessLevelIds: [],
        })
      }
    } catch (e) {
      setFormData({
        firstName: '',
        lastName: '',
        personnelNumber: '',
        employeeNo: '',
        gender: '',
        validFrom: '',
        validTo: '',
        documentNumber: '',
        visitDateUtc: new Date().toISOString().slice(0, 10),
        accessLevelIds: [],
      })
      setError(e instanceof Error ? e.message : 'Ошибка загрузки следующего ID')
    }
  }

  function openEditEmployee(item: EmployeeResponse) {
    if (!token) return
    setError(null)
    apiRequest<EmployeeDetailResponse>(`/api/employees/${item.id}`, { token })
      .then((detail) => {
        setEditingEmployee(detail)
        setEditingVisitor(null)
        setFormData({
          firstName: detail.firstName,
          lastName: detail.lastName,
          personnelNumber: detail.personnelNumber ?? '',
          employeeNo: detail.employeeNo ?? '',
          gender: detail.gender ?? '',
          validFrom: detail.validFromUtc ? detail.validFromUtc.slice(0, 10) : '',
          validTo: detail.validToUtc ? detail.validToUtc.slice(0, 10) : '',
          documentNumber: '',
          visitDateUtc: new Date().toISOString().slice(0, 10),
          accessLevelIds: detail.accessLevels.map((a) => a.id),
        })
        setModalMode('edit')
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
  }

  function openEditVisitor(item: VisitorResponse) {
    if (!token) return
    setError(null)
    apiRequest<VisitorDetailResponse>(`/api/visitors/${item.id}`, { token })
      .then((detail) => {
        setEditingVisitor(detail)
        setEditingEmployee(null)
        setFormData({
          firstName: detail.firstName,
          lastName: detail.lastName,
          personnelNumber: '',
          employeeNo: '',
          gender: '',
          validFrom: '',
          validTo: '',
          documentNumber: detail.documentNumber ?? '',
          visitDateUtc: detail.visitDateUtc.slice(0, 10),
          accessLevelIds: detail.accessLevels.map((a) => a.id),
        })
        setModalMode('edit')
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
  }

  async function handleSubmit() {
    if (!token) return
    setIsSubmitting(true)
    setError(null)
    try {
      if (modalMode === 'create') {
        if (tab === 'employees') {
          await apiRequest('/api/employees', {
            method: 'POST',
            token,
            body: JSON.stringify({
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              personnelNumber: formData.personnelNumber.trim() || null,
              employeeNo: formData.employeeNo.trim() || null,
              gender: formData.gender.trim() || null,
              validFromUtc: formData.validFrom ? formData.validFrom + 'T00:00:00Z' : null,
              validToUtc: formData.validTo ? formData.validTo + 'T23:59:59Z' : null,
              accessLevelIds: formData.accessLevelIds,
            }),
          })
          await loadEmployees()
          setHasChanges(true)
        } else {
          await apiRequest('/api/visitors', {
            method: 'POST',
            token,
            body: JSON.stringify({
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              documentNumber: formData.documentNumber.trim() || null,
              visitDateUtc: formData.visitDateUtc + 'T00:00:00Z',
              accessLevelIds: formData.accessLevelIds,
            }),
          })
          await loadVisitors()
        }
      } else {
        if (editingEmployee) {
          await apiRequest(`/api/employees/${editingEmployee.id}`, {
            method: 'PUT',
            token,
            body: JSON.stringify({
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              personnelNumber: formData.personnelNumber.trim() || null,
              employeeNo: formData.employeeNo.trim() || null,
              gender: formData.gender.trim() || null,
              validFromUtc: formData.validFrom ? formData.validFrom + 'T00:00:00Z' : null,
              validToUtc: formData.validTo ? formData.validTo + 'T23:59:59Z' : null,
              accessLevelIds: formData.accessLevelIds,
            }),
          })
          await loadEmployees()
          setHasChanges(true)
        } else if (editingVisitor) {
          await apiRequest(`/api/visitors/${editingVisitor.id}`, {
            method: 'PUT',
            token,
            body: JSON.stringify({
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              documentNumber: formData.documentNumber.trim() || null,
              visitDateUtc: formData.visitDateUtc + 'T00:00:00Z',
              accessLevelIds: formData.accessLevelIds,
            }),
          })
          await loadVisitors()
        }
      }
      setModalMode(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(item: EmployeeResponse | VisitorResponse) {
    if (!token) return
    if (!confirm(`Удалить ${item.firstName} ${item.lastName} из БД и со всех устройств?`)) return
    try {
      if (tab === 'employees') {
        await apiRequest(`/api/employees/${item.id}`, { method: 'DELETE', token })
        await loadEmployees()
        setHasChanges(true)
      } else {
        await apiRequest(`/api/visitors/${item.id}`, { method: 'DELETE', token })
        await loadVisitors()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  function toggleAccessLevel(id: string) {
    setFormData((prev) => ({
      ...prev,
      accessLevelIds: prev.accessLevelIds.includes(id)
        ? prev.accessLevelIds.filter((x) => x !== id)
        : [...prev.accessLevelIds, id],
    }))
  }

  async function runSync() {
    if (!token) return
    setSyncModalOpen(true)
    setSyncResult('loading')
    setSyncError(null)
    setSyncProgress(0)

    const progressInterval = setInterval(() => {
      setSyncProgress((p) => Math.min(p + 8, 90))
    }, 200)

    try {
      const res = await apiRequest<{ results: { success: boolean; deviceName: string; error?: string }[] }>(
        '/api/sync/employees',
        { method: 'POST', token }
      )
      clearInterval(progressInterval)
      setSyncProgress(100)

      const failed = res.results?.filter((r) => !r.success) ?? []
      if (failed.length > 0) {
        setSyncResult('error')
        setSyncError(
          failed.map((f) => `Устройство «${f.deviceName}»: ${f.error ?? 'Ошибка'}`).join('\n')
        )
      } else {
        setSyncResult('success')
        setHasChanges(false)
      }
    } catch (e) {
      clearInterval(progressInterval)
      setSyncProgress(100)
      setSyncResult('error')
      setSyncError(e instanceof Error ? e.message : 'Ошибка синхронизации')
    }
  }

  function closeSyncModal() {
    setSyncModalOpen(false)
    setSyncResult('idle')
    setSyncError(null)
    setSyncProgress(0)
  }

  async function openImportModal() {
    if (!token) return
    setImportModalOpen(true)
    setImportResult(null)
    setImportSelectedDeviceIds([])
    setError(null)
    try {
      const list = await apiRequest<{ id: string; name: string; ipAddress: string }[]>('/api/devices', { token })
      setDevices(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки устройств')
    }
  }

  function closeImportModal() {
    setImportModalOpen(false)
    setImportResult(null)
    setImportSelectedDeviceIds([])
    setDevices([])
  }

  function toggleImportDevice(id: string) {
    setImportSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function selectAllImportDevices() {
    setImportSelectedDeviceIds(devices.map((d) => d.id))
  }

  async function runImport() {
    if (!token || importSelectedDeviceIds.length === 0) return
    setImportLoading(true)
    setImportResult(null)
    setError(null)
    try {
      const res = await apiRequest<{
        importedCount: number
        skippedCount: number
        errorCount: number
        items: { employeeNo: string; name: string; deviceName: string; success: boolean; message?: string }[]
      }>('/api/people/import-from-devices', {
        method: 'POST',
        token,
        body: JSON.stringify({ deviceIds: importSelectedDeviceIds }),
      })
      setImportResult(res)
      await loadEmployees()
      setHasChanges(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка импорта')
    } finally {
      setImportLoading(false)
    }
  }

  const list = tab === 'employees' ? filteredEmployees : filteredVisitors

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
        <PageHeader
          title="People"
          description="Manage employees and visitors with their access levels."
          actions={
            <div className="flex items-center gap-2">
              {tab === 'employees' && (
                <Button
                  size="sm"
                  icon="sync"
                  variant={hasChanges ? 'secondary' : 'outline'}
                  disabled={!hasChanges}
                  onClick={() => runSync()}
                  className={
                    hasChanges
                      ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 border-amber-400'
                      : 'bg-white text-slate-400 border-slate-200'
                  }
                >
                  Sync
                </Button>
              )}
              <Button size="sm" icon="upload" variant="outline" onClick={openImportModal}>
                Import
              </Button>
              <Button size="sm" icon="person_add" onClick={openCreateModal}>
                {tab === 'employees' ? 'Add Employer' : 'Add Visitor'}
              </Button>
            </div>
          }
        />

        {error && (
          <div className="p-4 bg-error-bg text-error-text rounded-xl text-xs font-bold border border-error-text/10 max-h-40 overflow-y-auto whitespace-pre-wrap">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <Input
              placeholder="Поиск по имени, табельному номеру, документу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon="search"
              className="pr-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-dark hover:bg-slate-100 transition-colors"
                aria-label="Очистить поиск"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-text-muted uppercase">Статус:</span>
            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'all' ? 'active' : statusFilter === 'active' ? 'inactive' : 'all'
                )
              }
              className="px-2 py-1 rounded text-xs font-bold bg-slate-75 text-text-muted hover:text-text-dark hover:bg-slate-100 transition-colors"
            >
              {statusFilter === 'all' ? 'Все' : statusFilter === 'active' ? 'Активные' : 'Неактивные'}
            </button>
          </div>
        </div>

        {/* Type filter tabs */}
        <div className="flex border-b border-border-light overflow-x-auto no-scrollbar gap-8">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`pb-2.5 text-xs font-bold whitespace-nowrap uppercase tracking-widest border-b-2 transition-colors ${
                tab === t.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-dark'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* People List/Table */}
        <Card noPadding className="overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] px-8 py-4 bg-slate-75 border-b border-border-base text-xs font-black text-text-muted tracking-widest uppercase">
            <div className="col-span-2">Identity & Label</div>
            <div>Status</div>
            <div>Access Levels</div>
            <div>Cards / Faces / FPs</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="divide-y divide-border-light">
            {isLoading ? (
              <div className="p-12 text-center text-text-muted italic text-sm">Загрузка...</div>
            ) : list.length === 0 ? (
              <div className="p-12 text-center text-text-muted italic text-sm">
                {tab === 'employees'
                  ? employees.length === 0
                    ? 'No employers registered. Use Add Employer to create.'
                    : 'No employers match your search or filter.'
                  : visitors.length === 0
                    ? 'No visitors registered. Use Add Visitor to create.'
                    : 'No visitors match your search or filter.'}
              </div>
            ) : (
              list.map((item) => {
                const name = `${item.firstName} ${item.lastName}`
                const initials = `${item.firstName[0] || ''}${item.lastName[0] || ''}`.toUpperCase()
                const secondary =
                  tab === 'employees'
                    ? (item as EmployeeResponse).personnelNumber
                    : (item as VisitorResponse).documentNumber
                const visitDate =
                  tab === 'visitors' ? (item as VisitorResponse).visitDateUtc?.slice(0, 10) : null
                return (
                  <div
                    key={item.id}
                    className="flex flex-col md:grid md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-center px-6 py-5 md:px-8 hover:bg-slate-75/50 transition-colors relative group cursor-pointer"
                    onClick={() => navigate(`/people/${tab === 'employees' ? 'employee' : 'visitor'}/${item.id}`)}
                  >
                    <div className="col-span-2 flex items-center gap-4 min-w-0">
                      <Avatar
                        initials={initials || '?'}
                        variant={item.isActive ? 'primary' : 'neutral'}
                        size="lg"
                        className="!rounded-xl shadow-sm"
                      />
                      <div>
                        <p className="text-base font-black text-text-dark group-hover:text-primary transition-colors">
                          {name}
                        </p>
                        <p className="text-xs font-bold text-text-muted mt-0.5 tracking-tight uppercase">
                          {secondary ?? '—'}
                          {visitDate ? ` • ${visitDate}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 md:block">
                      <Badge dot variant={item.isActive ? 'success' : 'neutral'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="hidden md:block">
                      <div className="flex flex-wrap gap-1">
                        {item.accessLevelNames.length > 0
                          ? item.accessLevelNames.map((n) => (
                              <Badge key={n} variant="neutral">
                                {n}
                              </Badge>
                            ))
                          : '—'}
                      </div>
                    </div>
                    <div className="hidden md:block text-sm text-text-muted">
                      {item.cardsCount} / {item.facesCount} / {item.fingerprintsCount}
                    </div>
                    <div
                      className="flex justify-end gap-2 mt-4 md:mt-0 md:justify-self-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        icon="edit"
                        className="text-text-muted hover:text-text-dark"
                        onClick={() =>
                          tab === 'employees'
                            ? openEditEmployee(item as EmployeeResponse)
                            : openEditVisitor(item as VisitorResponse)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        icon="delete"
                        className="text-text-muted hover:text-error-text hover:bg-error-bg"
                        onClick={() => handleDelete(item)}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="px-8 py-4 border-t border-border-base bg-slate-75 flex items-center justify-between">
            <p className="text-xs font-black text-text-muted uppercase tracking-widest">
              {list.length} of {tab === 'employees' ? employees.length : visitors.length} records, {activeCount} active
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex items-center gap-4 transition-all hover:border-primary/20">
            <div className="size-12 rounded-full bg-success-bg text-success-text flex items-center justify-center">
              <span className="material-symbols-outlined">person_check</span>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Активных</p>
              <p className="text-2xl font-black text-text-dark">{activeCount}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 transition-all hover:border-primary/20">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Сотрудников</p>
              <p className="text-2xl font-black text-text-dark">{employees.length}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 transition-all hover:border-primary/20">
            <div className="size-12 rounded-full bg-primary/5 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">meeting_room</span>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Посетителей</p>
              <p className="text-2xl font-black text-text-dark">{visitors.length}</p>
            </div>
          </Card>
        </div>
      </div>

      {syncModalOpen && (
        <Modal
          isOpen={syncModalOpen}
          title="Синхронизация с устройствами"
          onClose={closeSyncModal}
          actions={
            syncResult !== 'loading' ? (
              <Button size="sm" onClick={closeSyncModal}>
                Закрыть
              </Button>
            ) : undefined
          }
        >
          <div className="space-y-4">
            {syncResult === 'loading' && (
              <div className="-mx-6 -mt-6 mb-4 h-1.5 bg-slate-100 overflow-hidden rounded-t-xl">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            )}
            {syncResult === 'loading' && (
              <p className="text-sm text-text-muted">Загрузка изменений на устройства...</p>
            )}
            {syncResult === 'success' && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                Синхронизация успешна
              </div>
            )}
            {syncResult === 'error' && syncError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive whitespace-pre-wrap">
                {syncError}
              </div>
            )}
          </div>
        </Modal>
      )}

      {importModalOpen && (
        <Modal
          isOpen={importModalOpen}
          title="Импорт с устройств"
          onClose={closeImportModal}
          actions={
            <>
              <Button size="sm" variant="outline" onClick={closeImportModal}>
                {importResult ? 'Закрыть' : 'Отмена'}
              </Button>
              {!importResult && (
                <Button
                  size="sm"
                  onClick={runImport}
                  disabled={importLoading || importSelectedDeviceIds.length === 0}
                >
                  {importLoading ? 'Импорт...' : `Импортировать (${importSelectedDeviceIds.length})`}
                </Button>
              )}
            </>
          }
        >
          <div className="space-y-4">
            {!importResult ? (
              <>
                <p className="text-sm text-text-muted">
                  Выберите устройства, с которых импортировать пользователей (сотрудников и посетителей).
                </p>
                {devices.length === 0 ? (
                  <p className="text-sm text-text-muted">Устройства не найдены.</p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={selectAllImportDevices}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Выбрать все
                    </button>
                    <div className="max-h-64 overflow-y-auto space-y-2 border border-border-base rounded-lg p-2">
                      {devices.map((d) => (
                        <label
                          key={d.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={importSelectedDeviceIds.includes(d.id)}
                            onChange={() => toggleImportDevice(d.id)}
                            className="rounded border-border-base text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-text-dark">{d.name}</span>
                          <span className="text-xs text-text-muted">{d.ipAddress}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 dark:text-green-400">
                    Импортировано: {importResult.importedCount}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">
                    Пропущено (дубликаты): {importResult.skippedCount}
                  </span>
                  {importResult.errorCount > 0 && (
                    <span className="text-destructive">Ошибки: {importResult.errorCount}</span>
                  )}
                </div>
                {importResult.items.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-border-base rounded-lg p-2 text-xs space-y-1">
                    {importResult.items.map((item, i) => (
                      <div
                        key={i}
                        className={
                          item.success
                            ? 'text-text-dark'
                            : 'text-destructive'
                        }
                      >
                        {item.employeeNo} — {item.name} ({item.deviceName})
                        {item.message && ` — ${item.message}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {modalMode && (
        <Modal
          isOpen={!!modalMode}
          title={modalMode === 'create' ? (tab === 'employees' ? 'Добавить сотрудника' : 'Добавить посетителя') : 'Редактировать'}
          onClose={() => setModalMode(null)}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => setModalMode(null)}>
                Отмена
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-text-muted uppercase mb-1">Имя</p>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Имя"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase mb-1">Фамилия</p>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Фамилия"
                />
              </div>
            </div>
            {tab === 'employees' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase mb-1">Табельный номер</p>
                  <Input
                    value={formData.personnelNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, personnelNumber: e.target.value }))}
                    placeholder="Опционально"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase mb-1">Employee ID</p>
                  <Input
                    value={formData.employeeNo}
                    onChange={(e) => setFormData((p) => ({ ...p, employeeNo: e.target.value }))}
                    placeholder="Идентификатор для устройств Hikvision (до 32 символов)"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase mb-1">Пол</p>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full rounded-lg border border-border-base bg-slate-50 px-3 py-2 text-sm text-text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Не указан</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="unknown">Неизвестно</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase mb-1">Период действия (от)</p>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData((p) => ({ ...p, validFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase mb-1">Период действия (до)</p>
                  <Input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => setFormData((p) => ({ ...p, validTo: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase mb-1">Номер документа</p>
                  <Input
                    value={formData.documentNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, documentNumber: e.target.value }))}
                    placeholder="Опционально"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase mb-1">Дата визита</p>
                  <Input
                    type="date"
                    value={formData.visitDateUtc}
                    onChange={(e) => setFormData((p) => ({ ...p, visitDateUtc: e.target.value }))}
                  />
                </div>
              </>
            )}
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Уровни доступа</p>
              <div className="flex flex-wrap gap-2">
                {accessLevels.map((al) => (
                  <label
                    key={al.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-base cursor-pointer hover:bg-slate-75"
                  >
                    <input
                      type="checkbox"
                      checked={formData.accessLevelIds.includes(al.id)}
                      onChange={() => toggleAccessLevel(al.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{al.name}</span>
                  </label>
                ))}
                {accessLevels.length === 0 && (
                  <span className="text-sm text-text-muted">Нет уровней доступа</span>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
