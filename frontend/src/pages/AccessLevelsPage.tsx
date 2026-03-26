import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/templates'
import { Badge, Button, Input } from '../components/atoms'
import { PageHeader, Modal } from '../components/organisms'
import { useLoading } from '../context/LoadingContext'
import { apiRequest } from '../lib/api'

interface AccessLevelDoor {
  deviceId: string
  deviceName: string
  doorIndex: number
  /** true — elevator controller (doorIndex = floor, 0-based → ISAPI doorID = +1) */
  isElevator?: boolean
}

interface AccessLevel {
  id: string
  name: string
  description?: string | null
  createdUtc: string
  updatedUtc?: string | null
  doors?: AccessLevelDoor[]
}

interface Device {
  id: string
  name: string
  deviceIdentifier: string
  deviceType?: string
}

interface DeviceDoor {
  deviceId: string
  deviceName: string
  doorIndex: number
  doorName?: string | null
  status?: string | null
  isElevator?: boolean
}

interface AccessLevelFormData {
  name: string
  description: string
}

const emptyForm: AccessLevelFormData = {
  name: '',
  description: '',
}

function floorOrDoorLabel(doorIndex: number, doorName: string | null | undefined, isElevator?: boolean) {
  const n = doorName?.trim()
  if (n) return n
  const no = doorIndex + 1
  return isElevator ? `Floor ${no}` : `Door ${no}`
}

const ACCESS_TABS = [
  { value: 'access-level', label: 'Access Level' },
  { value: 'doors', label: 'Doors' },
  { value: 'floors', label: 'Floors' },
] as const

export function AccessLevelsPage() {
  const { token } = useAuth()
  const { startLoading, stopLoading, isLoading } = useLoading()
  const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tabFilter, setTabFilter] = useState<(typeof ACCESS_TABS)[number]['value']>('access-level')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete' | 'doors' | null>(null)
  const [editingItem, setEditingItem] = useState<AccessLevel | null>(null)
  const [deletingItem, setDeletingItem] = useState<AccessLevel | null>(null)
  const [doorsItem, setDoorsItem] = useState<AccessLevel | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [addDoorDeviceId, setAddDoorDeviceId] = useState('')
  const [addDoorIndex, setAddDoorIndex] = useState(0)
  const [formData, setFormData] = useState<AccessLevelFormData>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [doorsList, setDoorsList] = useState<DeviceDoor[]>([])
  const [doorsLoading, setDoorsLoading] = useState(false)
  const [doorsError, setDoorsError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!token) return
    setError(null)
    startLoading()
    try {
      const list = await apiRequest<AccessLevel[]>('/api/access-levels', { token })
      setAccessLevels(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load access levels')
    } finally {
      stopLoading()
    }
  }, [token, startLoading, stopLoading])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadDoors = useCallback(async () => {
    if (!token) return
    setDoorsError(null)
    setDoorsLoading(true)
    try {
      const list = await apiRequest<DeviceDoor[]>('/api/devices/doors', { token })
      setDoorsList(list)
    } catch (e) {
      setDoorsError(e instanceof Error ? e.message : 'Failed to load doors')
      setDoorsList([])
    } finally {
      setDoorsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadDoors()
    }
  }, [token, loadDoors])

  const filteredLevels = useMemo(() => {
    if (!searchQuery.trim()) return accessLevels
    const q = searchQuery.toLowerCase().trim().replace(/\s+/g, ' ')
    const terms = q.split(' ').filter(Boolean)
    return accessLevels.filter((item) => {
      const name = (item.name ?? '').toLowerCase()
      const desc = (item.description ?? '').toLowerCase()
      const searchable = `${name} ${desc}`
      return terms.every((term) => searchable.includes(term))
    })
  }, [accessLevels, searchQuery])

  function openCreateModal() {
    setFormData(emptyForm)
    setModalMode('create')
  }

  function openEditModal(item: AccessLevel) {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description ?? '',
    })
    setModalMode('edit')
  }

  function openDeleteModal(item: AccessLevel) {
    setDeletingItem(item)
    setModalMode('delete')
  }

  async function openDoorsModal(item: AccessLevel) {
    setDoorsItem(item)
    setAddDoorDeviceId('')
    setAddDoorIndex(0)
    setModalMode('doors')
    if (token) {
      try {
        const [devList, doorsListRes] = await Promise.all([
          apiRequest<Device[]>('/api/devices', { token }),
          apiRequest<DeviceDoor[]>('/api/devices/doors', { token }),
        ])
        setDevices(devList)
        setDoorsList(doorsListRes)
      } catch {
        setDevices([])
        setDoorsList([])
      }
    }
  }

  function closeModals() {
    setModalMode(null)
    setEditingItem(null)
    setDeletingItem(null)
    setDoorsItem(null)
    setFormData(emptyForm)
  }

  const canCreateOrUpdate = formData.name.trim().length > 0

  async function handleCreate() {
    if (!token) return
    setIsSubmitting(true)
    setError(null)
    try {
      const created = await apiRequest<AccessLevel>('/api/access-levels', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }),
      })
      setAccessLevels((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      closeModals()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create access level')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate() {
    if (!token || !editingItem) return
    setIsSubmitting(true)
    setError(null)
    try {
      const updated = await apiRequest<AccessLevel>(`/api/access-levels/${editingItem.id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }),
      })
      setAccessLevels((prev) =>
        prev
          .map((x) => (x.id === updated.id ? updated : x))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      closeModals()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update access level')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!token || !deletingItem) return
    setIsSubmitting(true)
    setError(null)
    try {
      await apiRequest(`/api/access-levels/${deletingItem.id}`, { method: 'DELETE', token })
      setAccessLevels((prev) => prev.filter((x) => x.id !== deletingItem.id))
      closeModals()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete access level')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddDoor() {
    if (!token || !doorsItem || !addDoorDeviceId) return
    setIsSubmitting(true)
    setError(null)
    try {
      await apiRequest(`/api/access-levels/${doorsItem.id}/doors`, {
        method: 'POST',
        token,
        body: JSON.stringify({ deviceId: addDoorDeviceId, doorIndex: addDoorIndex }),
      })
      const device = devices.find((d) => d.id === addDoorDeviceId)
      const isElev = device?.deviceType === 'ElevatorController'
      setAccessLevels((prev) =>
        prev.map((x) =>
          x.id === doorsItem.id
            ? {
              ...x,
              doors: [...(x.doors ?? []), { deviceId: addDoorDeviceId, deviceName: device?.name ?? '', doorIndex: addDoorIndex, isElevator: isElev }],
            }
            : x
        )
      )
      setDoorsItem((prev) =>
        prev
          ? {
            ...prev,
            doors: [...(prev.doors ?? []), { deviceId: addDoorDeviceId, deviceName: device?.name ?? '', doorIndex: addDoorIndex, isElevator: isElev }],
          }
          : null
      )
      setAddDoorDeviceId('')
      setAddDoorIndex(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add door')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveDoor(deviceId: string, doorIndex: number) {
    if (!token || !doorsItem) return
    setIsSubmitting(true)
    setError(null)
    try {
      await apiRequest(`/api/access-levels/${doorsItem.id}/doors/${deviceId}/${doorIndex}`, { method: 'DELETE', token })
      setAccessLevels((prev) =>
        prev.map((x) =>
          x.id === doorsItem.id ? { ...x, doors: (x.doors ?? []).filter((d) => d.deviceId !== deviceId || d.doorIndex !== doorIndex) } : x
        )
      )
      setDoorsItem((prev) =>
        prev ? { ...prev, doors: (prev.doors ?? []).filter((d) => d.deviceId !== deviceId || d.doorIndex !== doorIndex) } : null
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove door')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout onAction={openCreateModal}>
      <div className="flex-1 overflow-y-auto bg-background-light">
        <div className="p-6 md:p-8 space-y-6">
          <PageHeader
            className="hidden md:flex"
            title="Access Control Policies"
            description="Manage access levels for employees and visitors."
            actions={
              <Button icon="add_moderator" size="md" onClick={openCreateModal}>
                Create New Policy
              </Button>
            }
          />

          {error && (
            <div className="p-4 bg-error-bg text-error-text rounded-xl text-xs font-bold border border-error-text/10 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {error}
            </div>
          )}

          {/* Top Stats Tier */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 mb-2">
            <div className="bg-surface p-4 rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
              <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Total Policies</p>
              <p className="text-2xl font-black text-primary leading-none">{accessLevels.length}</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
              <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">System Zones</p>
              <p className="text-2xl font-black text-primary leading-none">{doorsLoading ? '...' : doorsList.length}</p>
            </div>
          </div>

          {/* Search + Tabs Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-text-dark uppercase tracking-widest pt-4">Defined Levels</h2>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search access levels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon="search"
                  className="bg-white border-divider-light"
                />
              </div>
            </div>

            <div className="flex overflow-x-auto no-scrollbar gap-8">
              {ACCESS_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTabFilter(t.value)}
                  className={`pb-2.5 text-xs font-black whitespace-nowrap uppercase tracking-widest border-b-2 transition-colors ${tabFilter === t.value
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-light hover:text-text-muted'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {tabFilter === 'access-level' && (
            <div className="space-y-3">
              {filteredLevels.length === 0 ? (
                <div className="p-12 text-center text-text-light italic text-sm bg-surface rounded-2xl shadow-md border-none">
                  {accessLevels.length === 0 && !isLoading
                    ? 'No access levels yet.'
                    : 'No results found.'}
                </div>
              ) : (
                filteredLevels.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 bg-surface rounded-2xl shadow-md hover:shadow-xl active:scale-[0.99] transition-all cursor-pointer group border-none"
                    onClick={() => openEditModal(item)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-2xl text-primary-dark group-hover:bg-primary/20 transition-colors shrink-0">
                        <span className="material-symbols-outlined text-2xl !fill-1">
                          {item.id === 'admin' ? 'shield' : item.name.toLowerCase().includes('staff') ? 'badge' : 'key'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-base font-black text-text-dark leading-tight">{item.name}</h4>
                        <p className="text-xs font-bold text-text-light mt-1">
                          {(item.doors ?? []).length} assigned zones • Active Protocol
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-text-light group-hover:text-text-muted transition-colors">chevron_right</span>
                  </div>
                )))}
            </div>
          )}

          {tabFilter === 'doors' && (
            <div className="grid gap-3">
              {doorsLoading ? (
                <div className="p-12 text-center text-sm font-bold text-text-light uppercase tracking-widest">Loading doors...</div>
              ) : doorsError ? (
                <div className="p-4 bg-error-bg text-error-text rounded-xl text-sm font-bold shadow-sm">{doorsError}</div>
              ) : (
                doorsList.map((door) => (
                  <div key={`${door.deviceId}-${door.doorIndex}`} className="p-4 bg-surface rounded-2xl shadow-md flex justify-between items-center border-none">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-slate-75 rounded-xl text-text-muted">
                        <span className="material-symbols-outlined">door_front</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-text-dark leading-tight">{door.deviceName}</p>
                        <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mt-0.5">{floorOrDoorLabel(door.doorIndex, door.doorName, door.isElevator)}</p>
                      </div>
                    </div>
                    <Badge variant={door.status === 'Online' ? 'success' : 'neutral'}>{door.status || 'Offline'}</Badge>
                  </div>
                ))
              )}
            </div>
          )}

          {tabFilter === 'floors' && (
            <div className="grid gap-3">
              {doorsLoading ? (
                <div className="p-12 text-center text-sm font-bold text-text-light uppercase tracking-widest">Loading floors...</div>
              ) : doorsError ? (
                <div className="p-4 bg-error-bg text-error-text rounded-xl text-sm font-bold shadow-sm">{doorsError}</div>
              ) : doorsList.filter((d) => d.isElevator).length === 0 ? (
                <div className="p-12 text-center bg-surface rounded-2xl shadow-md">
                  <span className="material-symbols-outlined text-5xl text-text-light mb-4 block">layers</span>
                  <p className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">No elevator floors</p>
                  <p className="text-text-muted text-sm">Mark a device as Elevator Controller in Devices, then floors appear here from the controller.</p>
                </div>
              ) : (
                doorsList
                  .filter((d) => d.isElevator)
                  .map((door) => (
                    <div key={`${door.deviceId}-${door.doorIndex}`} className="p-4 bg-surface rounded-2xl shadow-md flex justify-between items-center border-none">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-xl text-primary">
                          <span className="material-symbols-outlined">layers</span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-text-dark leading-tight">{door.deviceName}</p>
                          <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mt-0.5">{floorOrDoorLabel(door.doorIndex, door.doorName, true)}</p>
                        </div>
                      </div>
                      <Badge variant="primary">Elevator</Badge>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={closeModals}
        title={modalMode === 'create' ? 'Create Policy' : 'Edit Policy'}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (modalMode === 'create') handleCreate()
            else handleUpdate()
          }}
        >
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Full Access"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1">Description (optional)</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of this access level"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-4">
            <Button type="submit" disabled={!canCreateOrUpdate || isSubmitting} isLoading={isSubmitting}>
              {modalMode === 'create' ? 'Create Policy' : 'Save'}
            </Button>
            {modalMode === 'edit' && editingItem && (
              <Button type="button" variant="outline" icon="door_front" onClick={() => {
                closeModals();
                openDoorsModal(editingItem);
              }}>
                Doors / floors
              </Button>
            )}
            <Button type="button" variant="outline" onClick={closeModals} disabled={isSubmitting}>
              Cancel
            </Button>
            {modalMode === 'edit' && editingItem && (
              <Button
                type="button"
                variant="ghost"
                icon="delete"
                className="ml-auto text-error-text hover:bg-error-bg"
                onClick={() => {
                  closeModals();
                  openDeleteModal(editingItem);
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalMode === 'delete'} onClose={closeModals} title="Delete Policy">
        {deletingItem && (
          <div className="space-y-4">
            <p className="text-sm text-text-dark">
              Are you sure you want to delete <strong>{deletingItem.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={handleDelete} isLoading={isSubmitting}>
                Delete
              </Button>
              <Button variant="outline" onClick={closeModals} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={modalMode === 'doors'} onClose={closeModals} title={doorsItem ? `Access: ${doorsItem.name}` : 'Manage access points'}>
        {doorsItem && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-muted">Assigned doors / floors</label>
              {(doorsItem.doors ?? []).length === 0 ? (
                <p className="text-sm text-text-light italic py-2">No doors or floors assigned yet.</p>
              ) : (
                <ul className="space-y-1">
                  {(doorsItem.doors ?? []).map((d) => (
                    <li key={`${d.deviceId}-${d.doorIndex}`} className="flex items-center justify-between py-2 px-3 bg-slate-75 rounded-md">
                      <span className="text-sm font-medium text-text-dark">
                        {d.deviceName} — {floorOrDoorLabel(d.doorIndex, null, d.isElevator)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        icon="close"
                        className="text-text-muted hover:text-error-text"
                        onClick={() => handleRemoveDoor(d.deviceId, d.doorIndex)}
                        disabled={isSubmitting}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-border-base pt-4 space-y-3">
              <label className="block text-xs font-bold text-text-muted">Add door or floor</label>
              <div className="flex gap-2">
                <select
                  value={addDoorDeviceId ? `${addDoorDeviceId}:${addDoorIndex}` : ''}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v) {
                      const [did, idx] = v.split(':')
                      setAddDoorDeviceId(did)
                      setAddDoorIndex(parseInt(idx, 10))
                    } else {
                      setAddDoorDeviceId('')
                      setAddDoorIndex(0)
                    }
                  }}
                  className="flex-1 h-9 px-3 bg-slate-75 border border-border-base rounded-md text-xs outline-none"
                >
                  <option value="">Select door / floor</option>
                  {doorsList.map((d) => (
                    <option key={`${d.deviceId}-${d.doorIndex}`} value={`${d.deviceId}:${d.doorIndex}`}>
                      {d.deviceName} — {floorOrDoorLabel(d.doorIndex, d.doorName, d.isElevator)}
                    </option>
                  ))}
                </select>
                <Button onClick={handleAddDoor} disabled={!addDoorDeviceId || isSubmitting} isLoading={isSubmitting} icon="add">
                  Add
                </Button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={closeModals}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
