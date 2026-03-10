import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/AppLayout'
import { Card, Badge, Button, Avatar, PageHeader, Input, Modal } from '../components/ui'
import { useLoading } from '../context/LoadingContext'
import { apiRequest } from '../lib/api'

interface AccessLevelDoor {
  deviceId: string
  deviceName: string
  doorIndex: number
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
}

interface DeviceDoor {
  deviceId: string
  deviceName: string
  doorIndex: number
  doorName?: string | null
  status?: string | null
}

interface AccessLevelFormData {
  name: string
  description: string
}

const emptyForm: AccessLevelFormData = {
  name: '',
  description: '',
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
    if (tabFilter === 'doors' && token) {
      loadDoors()
    }
  }, [tabFilter, token, loadDoors])

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
      setAccessLevels((prev) =>
        prev.map((x) =>
          x.id === doorsItem.id
            ? {
                ...x,
                doors: [...(x.doors ?? []), { deviceId: addDoorDeviceId, deviceName: device?.name ?? '', doorIndex: addDoorIndex }],
              }
            : x
        )
      )
      setDoorsItem((prev) =>
        prev
          ? {
              ...prev,
              doors: [...(prev.doors ?? []), { deviceId: addDoorDeviceId, deviceName: device?.name ?? '', doorIndex: addDoorIndex }],
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
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
        <PageHeader
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

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <Input
              placeholder="Search by name or description..."
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
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-light overflow-x-auto no-scrollbar gap-8">
          {ACCESS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTabFilter(t.value)}
              className={`pb-2.5 text-xs font-bold whitespace-nowrap uppercase tracking-widest border-b-2 transition-colors ${
                tabFilter === t.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-dark'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tabFilter === 'access-level' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
              <Card className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-5xl">policy</span>
                </div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Total Policies</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-text-dark">{accessLevels.length}</span>
                  <Badge variant="primary">Active</Badge>
                </div>
              </Card>
            </div>

            {/* Main List */}
            <Card noPadding className="overflow-hidden">
          <div className="hidden md:grid grid-cols-4 px-8 py-4 bg-slate-75 border-b border-border-base text-xs font-black text-text-muted tracking-widest uppercase">
            <div className="col-span-2">Policy</div>
            <div>Doors</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="divide-y divide-border-light">
            {filteredLevels.length === 0 ? (
              <div className="p-12 text-center text-text-muted italic text-sm">
                {accessLevels.length === 0 && !isLoading
                  ? 'No access levels. Click Create New Policy to add one.'
                  : 'No access levels match your search.'}
              </div>
            ) : (
              filteredLevels.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col md:grid grid-cols-4 items-center px-6 py-5 md:px-8 hover:bg-slate-75/50 transition-colors relative group"
                >
                  <div className="col-span-2 flex items-center gap-4">
                    <Avatar
                      icon="shield_lock"
                      variant="primary"
                      size="lg"
                      className="rounded-xl! shadow-sm"
                    />
                    <div>
                      <p className="text-base font-black text-text-dark group-hover:text-primary transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs font-bold text-text-muted mt-0.5 tracking-tight">
                        {item.description || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:block">
                    <div className="flex flex-wrap items-center gap-1 flex-1">
                      {(item.doors ?? []).length === 0 ? (
                        <span className="text-text-light italic text-xs">—</span>
                      ) : (
                        (item.doors ?? []).map((d) => (
                          <Badge key={`${d.deviceId}-${d.doorIndex}`} variant="neutral" className="text-[10px]">
                            {d.deviceName}:#{d.doorIndex}
                          </Badge>
                        ))
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        icon="door_front"
                        className="text-text-muted hover:text-primary"
                        onClick={() => openDoorsModal(item)}
                        title="Manage doors"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 md:mt-0 w-full">
                    <Button
                      variant="ghost"
                      size="icon"
                      icon="edit"
                      className="text-text-muted hover:text-text-dark"
                      onClick={() => openEditModal(item)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      icon="delete"
                      className="text-text-muted hover:text-error-text hover:bg-error-bg"
                      onClick={() => openDeleteModal(item)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-8 py-4 border-t border-border-base bg-slate-75 flex items-center justify-between">
            <p className="text-xs font-black text-text-muted uppercase tracking-widest">
              {filteredLevels.length} of {accessLevels.length} policies
            </p>
          </div>
        </Card>
          </>
        )}

        {tabFilter === 'doors' && (
          <Card noPadding className="overflow-hidden">
            {doorsLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-4">
                <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Loading doors...</p>
              </div>
            ) : doorsError ? (
              <div className="p-8">
                <div className="p-4 bg-error-bg text-error-text rounded-xl text-sm font-bold border border-error-text/10">
                  {doorsError}
                </div>
                <Button variant="outline" size="sm" className="mt-4" onClick={loadDoors}>
                  Retry
                </Button>
              </div>
            ) : doorsList.length === 0 ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-text-light mb-4 block">door_front</span>
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">No doors found</p>
                <p className="text-text-muted text-sm">Add devices first, then doors will appear here.</p>
              </div>
            ) : (
              <>
                <div className="hidden md:grid grid-cols-8 px-8 py-4 bg-slate-75 border-b border-border-base text-xs font-black text-text-muted tracking-widest uppercase">
                  <div className="col-span-3">Device</div>
                  <div className="col-span-2">Door</div>
                  <div className="col-span-3">Access Levels</div>
                </div>
                <div className="divide-y divide-border-light">
                  {Object.entries(
                    doorsList.reduce<Record<string, DeviceDoor[]>>((acc, d) => {
                      const key = d.deviceId
                      if (!acc[key]) acc[key] = []
                      acc[key].push(d)
                      return acc
                    }, {})
                  ).map(([, doors]) => {
                    const deviceName = doors[0]?.deviceName ?? ''
                    return doors.map((door) => {
                      const assignedLevels = accessLevels.filter(
                        (al) => (al.doors ?? []).some((ad) => ad.deviceId === door.deviceId && ad.doorIndex === door.doorIndex)
                      )
                      return (
                        <div
                          key={`${door.deviceId}-${door.doorIndex}`}
                          className="flex flex-col md:grid grid-cols-8 items-center px-6 py-4 md:px-8 hover:bg-slate-75/50 transition-colors gap-2"
                        >
                          <div className="col-span-3 flex items-center gap-3">
                            <span className="material-symbols-outlined text-2xl text-text-muted">door_front</span>
                            <div>
                              <p className="text-sm font-bold text-text-dark">{deviceName}</p>
                              <p className="text-[10px] text-text-light">{door.deviceId}</p>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Badge variant="neutral" className="text-xs">
                              {door.doorName ?? `Door #${door.doorIndex}`}
                            </Badge>
                            {door.status && (
                              <span
                                className={`ml-2 text-[10px] ${door.status.toLowerCase().startsWith('offline') ? 'text-error-text font-bold' : 'text-text-muted'}`}
                              >
                                {door.status}
                              </span>
                            )}
                          </div>
                          <div className="col-span-3 flex flex-wrap gap-1 w-full md:justify-start">
                            {assignedLevels.length === 0 ? (
                              <span className="text-text-light italic text-xs">—</span>
                            ) : (
                              assignedLevels.map((al) => (
                                <Badge key={al.id} variant="primary" className="text-[10px]">
                                  {al.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    })
                  })}
                </div>
                <div className="px-8 py-4 border-t border-border-base bg-slate-75 flex items-center justify-between">
                  <p className="text-xs font-black text-text-muted uppercase tracking-widest">
                    {doorsList.length} door(s) from {new Set(doorsList.map((d) => d.deviceId)).size} device(s)
                  </p>
                  <Button variant="ghost" size="sm" icon="refresh" onClick={loadDoors}>
                    Refresh
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        {tabFilter === 'floors' && (
          <Card className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-text-light mb-4 block">layers</span>
            <p className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Floors</p>
            <p className="text-text-muted text-sm">Manage floors and building structure.</p>
          </Card>
        )}
      </div>

      {/* Create/Edit Modal */}
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
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={!canCreateOrUpdate || isSubmitting} isLoading={isSubmitting}>
              {modalMode === 'create' ? 'Create Policy' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={closeModals}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={modalMode === 'delete'} onClose={closeModals} title="Delete Policy">
        {deletingItem && (
          <div className="space-y-4">
            <p className="text-sm text-text-dark">
              Are you sure you want to delete <strong>{deletingItem.name}</strong>? This will also remove all
              employee and visitor assignments to this access level. This action cannot be undone.
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

      {/* Manage Doors Modal */}
      <Modal isOpen={modalMode === 'doors'} onClose={closeModals} title={doorsItem ? `Doors: ${doorsItem.name}` : 'Manage Doors'}>
        {doorsItem && (
          <div className="space-y-4">
            <p className="text-xs text-text-muted">Assign device doors to this access level. Employees and visitors with this level will have access to these doors.</p>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-muted">Assigned doors</label>
              {(doorsItem.doors ?? []).length === 0 ? (
                <p className="text-sm text-text-light italic py-2">No doors assigned yet.</p>
              ) : (
                <ul className="space-y-1">
                  {(doorsItem.doors ?? []).map((d) => (
                    <li key={`${d.deviceId}-${d.doorIndex}`} className="flex items-center justify-between py-2 px-3 bg-slate-75 rounded-md">
                      <span className="text-sm font-medium text-text-dark">
                        {d.deviceName} — Door #{d.doorIndex}
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
              <label className="block text-xs font-bold text-text-muted">Add door</label>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
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
                    className="w-full h-9 px-3 bg-slate-75 border border-border-base rounded-md text-xs text-text-base focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none"
                  >
                    <option value="">Select door</option>
                    {doorsList
                      .filter(
                        (d) =>
                          !(d.status?.toLowerCase().startsWith('offline')) &&
                          !(doorsItem?.doors ?? []).some((ad) => ad.deviceId === d.deviceId && ad.doorIndex === d.doorIndex)
                      )
                      .map((d) => (
                        <option key={`${d.deviceId}-${d.doorIndex}`} value={`${d.deviceId}:${d.doorIndex}`}>
                          {d.deviceName} — {d.doorName ?? `Door #${d.doorIndex}`}
                        </option>
                      ))}
                  </select>
                </div>
                <Button
                  onClick={handleAddDoor}
                  disabled={!addDoorDeviceId || isSubmitting}
                  isLoading={isSubmitting}
                  icon="add"
                >
                  Add
                </Button>
              </div>
              <p className="text-[10px] text-text-light">
                {doorsList.length === 0 ? 'Load doors first.' : 'Select a door from the list to assign to this access level.'}
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={closeModals}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
