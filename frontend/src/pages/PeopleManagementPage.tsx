import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/templates'
import { Badge, Button, Input } from '../components/atoms'
import { PageHeader, Modal } from '../components/organisms'
import { useLoading } from '../context/LoadingContext'
import { apiRequest } from '../lib/api'

interface EmployeeResponse {
  id: string
  firstName: string
  lastName: string
  employeeNo?: string | null
  gender?: string | null
  validFromUtc?: string | null
  validToUtc?: string | null
  isActive: boolean
  onlyVerify?: boolean
  accessLevelNames: string[]
  cardsCount: number
  facesCount: number
  fingerprintsCount: number
}

interface VisitorResponse {
  id: string
  firstName: string
  lastName: string
  documentNumber?: string | null
  validFromUtc?: string | null
  validToUtc?: string | null
  isActive: boolean
  accessLevelNames: string[]
  cardsCount: number
  facesCount: number
  fingerprintsCount: number
}

interface AccessLevel {
  id: string
  name: string
  description?: string | null
}

interface DepartmentTreeItem {
  id: string
  name: string
  parentId?: string | null
  companyId?: string | null
}

interface Company {
  id: string
  name: string
  description?: string | null
}

type TabType = 'employees' | 'visitors'

export function PeopleManagementPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuth()
  const { startLoading, stopLoading } = useLoading()
  const [tab, setTab] = useState<TabType>('employees')
  const [statusFilterEmployees, setStatusFilterEmployees] = useState({ active: true, dismissed: false })
  const [statusFilterVisitors, setStatusFilterVisitors] = useState({ active: true, blocked: false })
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [visitors, setVisitors] = useState<VisitorResponse[]>([])
  const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([])
  const [departments, setDepartments] = useState<DepartmentTreeItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: '2037-12-31',
    documentNumber: '',
    visitDateUtc: new Date().toISOString().slice(0, 10),
    onlyVerify: false,
    accessLevelIds: [] as string[],
    departmentId: null as string | null,
    companyId: null as string | null,
  })
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyMode, setCompanyMode] = useState<'None' | 'Single' | 'Multiple'>('None')
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      const list = await apiRequest<EmployeeResponse[]>(`/api/employees?${params}`, { token })
      setEmployees(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load employees')
    }
  }, [token, searchQuery])

  const loadVisitors = useCallback(async () => {
    if (!token) return
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      const list = await apiRequest<VisitorResponse[]>(`/api/visitors?${params}`, { token })
      setVisitors(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load visitors')
    }
  }, [token, searchQuery])

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

  useEffect(() => {
    loadAccessLevels()
    loadCompanies()
    loadCompanyMode()
  }, [loadAccessLevels, loadCompanies, loadCompanyMode])

  useEffect(() => {
    loadDepartments(formData.companyId)
  }, [loadDepartments, formData.companyId])

  useEffect(() => {
    if (!token) return
    startLoading()
    // Always load both on initial or tab change to keep stats accurate
    Promise.all([
      loadEmployees(),
      loadVisitors()
    ]).finally(stopLoading)
  }, [token, loadEmployees, loadVisitors, startLoading, stopLoading])

  useEffect(() => {
    const state = location.state as { syncError?: string }
    if (state?.syncError) {
      setError(state.syncError)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  const activeCount = useMemo(() => {
    return employees.filter((e) => e.isActive).length + visitors.filter((v) => v.isActive).length
  }, [employees, visitors])

  async function openCreateModal() {
    setModalMode('create')
    setError(null)

    // Load companies and mode if not loaded
    let currentCompanies = companies;
    if (currentCompanies.length === 0) {
      currentCompanies = await loadCompanies();
    }
    let currentMode = companyMode;
    if (currentMode === 'None') {
      currentMode = await loadCompanyMode() as any;
    }

    const defaultCompanyId = currentMode === 'Single' ? currentCompanies[0]?.id || null : null

    try {
      if (tab === 'employees') {
        setFormData({
          firstName: '',
          lastName: '',
          gender: '',
          validFrom: new Date().toISOString().slice(0, 10),
          validTo: '2037-12-31',
          documentNumber: '',
          visitDateUtc: new Date().toISOString().slice(0, 10),
          onlyVerify: false,
          accessLevelIds: [],
          departmentId: null,
          companyId: defaultCompanyId,
        })
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          gender: '',
          validFrom: new Date().toISOString().slice(0, 10),
          validTo: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          documentNumber: '',
          visitDateUtc: '',
          onlyVerify: false,
          accessLevelIds: [],
          departmentId: null,
          companyId: defaultCompanyId,
        })
      }
    } catch (e) {
      setFormData({
        firstName: '',
        lastName: '',
        gender: '',
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: '2037-12-31',
        documentNumber: '',
        visitDateUtc: new Date().toISOString().slice(0, 10),
        onlyVerify: false,
        accessLevelIds: [],
        departmentId: null,
        companyId: defaultCompanyId,
      })
      setError(e instanceof Error ? e.message : 'Failed to load next ID')
    }
  }

  function showSyncWarnings(res: { syncWarnings?: string[] | null }) {
    const w = res?.syncWarnings
    if (Array.isArray(w) && w.length > 0) {
      setError('Ошибки синхронизации с устройствами:\n' + w.join('\n'))
    }
  }

  async function handleSubmit() {
    if (!token) return
    setIsSubmitting(true)
    setError(null)
    try {
      if (tab === 'employees') {
        const res = await apiRequest<{ syncWarnings?: string[] }>('/api/employees', {
          method: 'POST',
          token,
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            gender: formData.gender.trim() || null,
            validFromUtc: formData.validFrom ? formData.validFrom + 'T00:00:00Z' : null,
            validToUtc: formData.validTo ? formData.validTo + 'T23:59:59Z' : null,
            onlyVerify: formData.onlyVerify,
            accessLevelIds: formData.accessLevelIds,
            departmentId: formData.departmentId || null,
            companyId: formData.companyId || null,
          }),
        })
        showSyncWarnings(res)
        await loadEmployees()
      } else {
        const res = await apiRequest<{ syncWarnings?: string[] }>('/api/visitors', {
          method: 'POST',
          token,
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            documentNumber: null,
            validFromUtc: formData.validFrom ? formData.validFrom + 'T00:00:00Z' : null,
            validToUtc: formData.validTo ? formData.validTo + 'T23:59:59Z' : null,
            accessLevelIds: formData.accessLevelIds,
            departmentId: formData.departmentId || null,
            companyId: formData.companyId || null,
          }),
        })
        showSyncWarnings(res)
        await loadVisitors()
      }
      setModalMode(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setIsSubmitting(false)
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
      setError(e instanceof Error ? e.message : 'Failed to load devices')
    }
  }

  const closeImportModal = () => {
    setImportModalOpen(false)
    setImportResult(null)
    setImportSelectedDeviceIds([])
    setDevices([])
  }

  const toggleImportDevice = (id: string) => {
    setImportSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAllImportDevices = () => {
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
      await Promise.all([loadEmployees(), loadVisitors()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImportLoading(false)
    }
  }

  const list = useMemo(() => {
    const raw = tab === 'employees'
      ? employees.map(e => ({ ...e, type: 'employee' as const }))
      : visitors.map(v => ({ ...v, type: 'visitor' as const }))
    if (tab === 'employees') {
      return raw.filter((item) => {
        if (item.isActive && statusFilterEmployees.active) return true
        if (!item.isActive && statusFilterEmployees.dismissed) return true
        return false
      })
    }
    return raw.filter((item) => {
      if (item.isActive && statusFilterVisitors.active) return true
      if (!item.isActive && statusFilterVisitors.blocked) return true
      return false
    })
  }, [tab, employees, visitors, statusFilterEmployees, statusFilterVisitors])

  return (
    <AppLayout onAction={openCreateModal}>
      <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
        <div className="p-6 md:p-8 space-y-6">
          <PageHeader
            className="hidden md:flex"
            title="People Management"
            description="Manage your workforce, visitors, and their security credentials."
            actions={
              <div className="flex gap-2">
                <Button variant="outline" icon="upload" size="md" onClick={openImportModal} className="shadow-sm">
                  Import
                </Button>
                <Button icon="person_add" size="md" onClick={openCreateModal} className="shadow-md">
                  Add People
                </Button>
              </div>
            }
          />

          {error && (
            <div className="p-4 bg-error-bg text-error-text rounded-xl text-xs font-bold shadow-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
              {error}
            </div>
          )}

          {/* Top Stats Tier */}
          <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
            <div className="bg-surface p-4 rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
              <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Active</p>
              <p className="text-2xl font-black text-primary leading-none">{activeCount}</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
              <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Employees</p>
              <p className="text-2xl font-black text-primary leading-none">{employees.length}</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
              <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Visitors</p>
              <p className="text-2xl font-black text-primary leading-none">{visitors.length}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder={`Search ${tab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon="search"
                className="bg-white shadow-sm"
              />
            </div>
            <div className="flex md:hidden gap-2">
              <Button fullWidth variant="outline" icon="upload" size="sm" onClick={openImportModal} className="shadow-sm">Import</Button>
            </div>
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[10px] font-black text-text-light uppercase tracking-widest">Статус:</span>
            {tab === 'employees' ? (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilterEmployees.active}
                    onChange={(e) => setStatusFilterEmployees((p) => ({ ...p, active: e.target.checked }))}
                    className="rounded border-border-light text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-bold text-text-dark">Активен</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilterEmployees.dismissed}
                    onChange={(e) => setStatusFilterEmployees((p) => ({ ...p, dismissed: e.target.checked }))}
                    className="rounded border-border-light text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-bold text-text-dark">Уволен</span>
                </label>
              </>
            ) : (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilterVisitors.active}
                    onChange={(e) => setStatusFilterVisitors((p) => ({ ...p, active: e.target.checked }))}
                    className="rounded border-border-light text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-bold text-text-dark">Активный</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilterVisitors.blocked}
                    onChange={(e) => setStatusFilterVisitors((p) => ({ ...p, blocked: e.target.checked }))}
                    className="rounded border-border-light text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-bold text-text-dark">Заблокированный</span>
                </label>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto no-scrollbar gap-8 border-b border-border-light">
            <button
              onClick={() => setTab('employees')}
              className={`pb-2.5 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${tab === 'employees' ? 'border-primary text-primary' : 'border-transparent text-text-light'
                }`}
            >
              Employees
            </button>
            <button
              onClick={() => setTab('visitors')}
              className={`pb-2.5 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${tab === 'visitors' ? 'border-primary text-primary' : 'border-transparent text-text-light'
                }`}
            >
              Visitors
            </button>
          </div>

          {/* List Layout */}
          <div className="space-y-3">
            {list.length === 0 ? (
              <div className="py-20 text-center bg-surface rounded-2xl shadow-md">
                <span className="material-symbols-outlined text-text-light text-5xl mb-3">person_search</span>
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No people found</p>
              </div>
            ) : (
              list.map((item) => {
                const initials = (item.firstName?.[0] || '') + (item.lastName?.[0] || '')
                const subtitle = item.type === 'employee'
                  ? `${item.cardsCount} Cards • ${item.facesCount} Faces`
                  : `Valid: ${item.validFromUtc?.slice(0, 10) || 'N/A'} - ${item.validToUtc?.slice(0, 10) || 'N/A'} • ${item.cardsCount} Cards`

                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/people/${item.type}/${item.id}`)}
                    className="flex items-center justify-between p-4 bg-surface rounded-2xl shadow-md hover:shadow-xl active:scale-[0.99] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-2xl text-primary font-black text-sm uppercase">
                        {initials || '?'}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-text-dark leading-tight">{item.firstName} {item.lastName}</h4>
                        <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mt-1">
                          {subtitle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.isActive ? 'success' : 'neutral'}>
                        {item.type === 'employee' ? (item.isActive ? 'Активен' : 'Уволен') : (item.isActive ? 'Активен' : 'Заблокирован')}
                      </Badge>
                      <span className="material-symbols-outlined text-text-light group-hover:text-text-muted transition-colors">chevron_right</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={importModalOpen}
        title="Import from Devices"
        onClose={closeImportModal}
      >
        <div className="space-y-4">
          {!importResult ? (
            <>
              <p className="text-sm text-text-muted">Select devices to import users from.</p>
              <div className="max-h-64 overflow-y-auto space-y-2 border border-border-light rounded-xl p-2">
                {devices.map((d) => (
                  <label key={d.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent transition-all">
                    <input
                      type="checkbox"
                      checked={importSelectedDeviceIds.includes(d.id)}
                      onChange={() => toggleImportDevice(d.id)}
                      className="rounded border-border-light text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-sm font-bold text-text-dark">{d.name}</p>
                      <p className="text-xs text-text-light">{d.ipAddress}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={selectAllImportDevices} className="text-xs font-bold text-primary hover:underline">Select All</button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={closeImportModal}>Cancel</Button>
                  <Button onClick={runImport} disabled={importLoading || importSelectedDeviceIds.length === 0} isLoading={importLoading}>Import</Button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-black text-text-light uppercase">Imported</p>
                  <p className="text-xl font-black text-success-text">{importResult.importedCount}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-black text-text-light uppercase">Skipped</p>
                  <p className="text-xl font-black text-text-muted">{importResult.skippedCount}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-black text-text-light uppercase">Errors</p>
                  <p className="text-xl font-black text-error-text">{importResult.errorCount}</p>
                </div>
              </div>
              <Button fullWidth variant="outline" onClick={closeImportModal}>Close</Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!modalMode}
        title={tab === 'employees' ? 'Добавить сотрудника' : 'Добавить посетителя'}
        onClose={() => setModalMode(null)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">First Name</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="Required"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Last Name</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Required"
              />
            </div>
          </div>

          {tab === 'employees' ? (
            <>
              <div>
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-divider-light bg-surface text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                >
                  <option value="">Unknown / Other</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Valid From</label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData((p) => ({ ...p, validFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Valid To</label>
                  <Input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => setFormData((p) => ({ ...p, validTo: e.target.value }))}
                  />
                </div>
              </div>
              <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.onlyVerify}
                  onChange={(e) => setFormData((p) => ({ ...p, onlyVerify: e.target.checked }))}
                  className="w-5 h-5 mt-0.5 rounded border-border-light text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-xs font-black text-text-dark uppercase tracking-widest block">Только учёт рабочего времени</span>
                  <p className="text-[10px] text-text-light mt-1 leading-relaxed">При включении у работника будет учитываться рабочее время, но дверь открываться не будет.</p>
                </div>
              </label>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Valid From</label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData((p) => ({ ...p, validFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Valid To</label>
                  <Input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => setFormData((p) => ({ ...p, validTo: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          {companyMode !== 'None' && (
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2">Компания</label>
              {companyMode === 'Multiple' ? (
                <select
                  value={formData.companyId ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, companyId: e.target.value || null, departmentId: null }))}
                  className="w-full h-10 px-3 rounded-xl border border-divider-light bg-white text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/10 outline-none"
                >
                  <option value="">— Не выбрана —</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-divider-light text-sm font-bold text-text-dark">
                  {companies.find(c => c.id === formData.companyId)?.name || 'Основная компания'}
                </div>
              )}
            </div>
          )}

          {departments.length > 0 && (
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2">Отдел</label>
              <select
                value={formData.departmentId ?? ''}
                onChange={(e) => setFormData((p) => ({ ...p, departmentId: e.target.value || null }))}
                className="w-full h-10 px-3 rounded-xl border border-divider-light bg-white text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/10 outline-none"
              >
                <option value="">— Не назначен —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {accessLevels.length > 0 && (
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-2">Access Levels</label>
              <div className="max-h-32 overflow-y-auto space-y-2 border border-border-light rounded-xl p-2">
                {accessLevels.map((level) => (
                  <label key={level.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.accessLevelIds.includes(level.id)}
                      onChange={() => toggleAccessLevel(level.id)}
                      className="rounded border-border-light text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-bold text-text-dark">{level.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <Button fullWidth onClick={handleSubmit} isLoading={isSubmitting} disabled={!formData.firstName || isSubmitting}>Save</Button>
            <Button fullWidth variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
