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

interface AccessLevelFormData {
  name: string
  description: string
}

const emptyForm: AccessLevelFormData = {
  name: '',
  description: '',
}

export function AccessLevelsPage() {
  const { token } = useAuth()
  const { startLoading, stopLoading, isLoading } = useLoading()
  const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete' | 'doors' | null>(null)
  const [editingItem, setEditingItem] = useState<AccessLevel | null>(null)
  const [deletingItem, setDeletingItem] = useState<AccessLevel | null>(null)
  const [doorsItem, setDoorsItem] = useState<AccessLevel | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [addDoorDeviceId, setAddDoorDeviceId] = useState('')
  const [addDoorIndex, setAddDoorIndex] = useState(0)
  const [formData, setFormData] = useState<AccessLevelFormData>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        const list = await apiRequest<Device[]>('/api/devices', { token })
        setDevices(list)
      } catch {
        setDevices([])
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

        {/* Main List */}
        <Card noPadding className="overflow-hidden">
          <div className="p-6 border-b border-border-base flex items-center justify-between">
            <h4 className="text-sm font-black text-text-dark uppercase tracking-widest">Access Levels</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-75 border-b border-border-base">
                  <th className="px-8 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Name</th>
                  <th className="px-8 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Description</th>
                  <th className="px-8 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Doors</th>
                  <th className="px-8 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredLevels.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-text-muted italic text-sm">
                      {accessLevels.length === 0 && !isLoading
                        ? 'No access levels. Click Create New Policy to add one.'
                        : 'No access levels match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredLevels.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-75 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <Avatar icon="shield_lock" variant="default" size="md" className="group-hover:bg-primary/20 transition-colors" />
                          <span className="text-sm font-bold text-text-dark">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-text-muted">{item.description || '—'}</td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap items-center gap-1">
                          {(item.doors ?? []).length === 0 ? (
                            <span className="text-text-light italic text-xs">—</span>
                          ) : (
                            (item.doors ?? []).map((d) => (
                              <Badge key={`${d.deviceId}-${d.doorIndex}`} variant="secondary" className="text-[10px]">
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
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            icon="edit"
                            className="text-text-muted hover:text-primary"
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-4 border-t border-border-base bg-slate-75 flex items-center justify-between">
            <p className="text-xs font-black text-text-muted uppercase tracking-widest">
              {filteredLevels.length} of {accessLevels.length} policies
            </p>
          </div>
        </Card>
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
                <div className="flex-1 min-w-[160px]">
                  <select
                    value={addDoorDeviceId}
                    onChange={(e) => setAddDoorDeviceId(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-75 border border-border-base rounded-md text-xs text-text-base focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none"
                  >
                    <option value="">Select device</option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min={0}
                    value={addDoorIndex}
                    onChange={(e) => setAddDoorIndex(parseInt(e.target.value, 10) || 0)}
                    placeholder="#"
                  />
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
              <p className="text-[10px] text-text-light">Door index is 0-based (0 = first door, 1 = second, etc.)</p>
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
