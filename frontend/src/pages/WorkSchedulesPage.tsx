import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AppLayout } from '../components/templates'
import { Button, Input } from '../components/atoms'
import { PageHeader, Modal } from '../components/organisms'
import { useLoading } from '../context/LoadingContext'
import { apiRequest } from '../lib/api'

interface WorkSchedule {
  id: string
  name: string
  type: string
  shiftStart: string | null
  shiftEnd: string | null
  requiredHoursPerDay: number
  createdUtc: string
}

interface FormData {
  name: string
  type: string
  shiftStart: string
  shiftEnd: string
  requiredHoursPerDay: string
}

const emptyForm: FormData = {
  name: '',
  type: 'Standard',
  shiftStart: '09:00',
  shiftEnd: '18:00',
  requiredHoursPerDay: '8',
}

const SCHEDULE_TYPES = ['Standard', 'Shift', 'Flexible'] as const

const TYPE_LABELS: Record<string, string> = {
  Standard: 'Стандартный',
  Shift: 'Сменный',
  Flexible: 'Гибкий',
}

function formatTime(val: string | null) {
  if (!val) return '—'
  const parts = val.split(':')
  return `${parts[0]}:${parts[1]}`
}

export function WorkSchedulesPage() {
  const { token } = useAuth()
  const { startLoading, stopLoading } = useLoading()
  const [schedules, setSchedules] = useState<WorkSchedule[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [editingItem, setEditingItem] = useState<WorkSchedule | null>(null)
  const [deletingItem, setDeletingItem] = useState<WorkSchedule | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    if (!token) return
    setError(null)
    startLoading()
    try {
      const list = await apiRequest<WorkSchedule[]>('/api/work-schedules', { token })
      setSchedules(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить графики')
    } finally {
      stopLoading()
    }
  }, [token, startLoading, stopLoading])

  useEffect(() => {
    loadData()
  }, [loadData])

  function openCreate() {
    setFormData(emptyForm)
    setEditingItem(null)
    setModalMode('create')
  }

  function openEdit(item: WorkSchedule) {
    setEditingItem(item)
    setFormData({
      name: item.name,
      type: item.type,
      shiftStart: item.shiftStart ? item.shiftStart.substring(0, 5) : '09:00',
      shiftEnd: item.shiftEnd ? item.shiftEnd.substring(0, 5) : '18:00',
      requiredHoursPerDay: String(item.requiredHoursPerDay),
    })
    setModalMode('edit')
  }

  function openDelete(item: WorkSchedule) {
    setDeletingItem(item)
    setModalMode('delete')
  }

  function closeModal() {
    setModalMode(null)
    setEditingItem(null)
    setDeletingItem(null)
    setError(null)
  }

  async function handleSubmit() {
    if (!token || !formData.name.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      const body = {
        name: formData.name.trim(),
        type: formData.type,
        shiftStart: formData.type !== 'Flexible' ? formData.shiftStart + ':00' : null,
        shiftEnd: formData.type !== 'Flexible' ? formData.shiftEnd + ':00' : null,
        requiredHoursPerDay: parseFloat(formData.requiredHoursPerDay) || 8,
      }

      if (modalMode === 'edit' && editingItem) {
        await apiRequest(`/api/work-schedules/${editingItem.id}`, { method: 'PUT', token, body })
      } else {
        await apiRequest('/api/work-schedules', { method: 'POST', token, body })
      }

      closeModal()
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!token || !deletingItem) return
    setIsSubmitting(true)
    setError(null)
    try {
      await apiRequest(`/api/work-schedules/${deletingItem.id}`, { method: 'DELETE', token })
      closeModal()
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title="Графики работы" subtitle="Управление расписаниями сотрудников">
          <Button onClick={openCreate} variant="primary" icon="add">
            Создать график
          </Button>
        </PageHeader>

        {error && !modalMode ? <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{error}</div> : null}

        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-alt">
                <th className="text-left px-5 py-3 font-medium text-text-light">Название</th>
                <th className="text-left px-5 py-3 font-medium text-text-light">Тип</th>
                <th className="text-left px-5 py-3 font-medium text-text-light">Начало</th>
                <th className="text-left px-5 py-3 font-medium text-text-light">Конец</th>
                <th className="text-left px-5 py-3 font-medium text-text-light">Норма (ч/день)</th>
                <th className="text-right px-5 py-3 font-medium text-text-light">Действия</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-light">
                    Графики не найдены. Создайте первый график.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors">
                    <td className="px-5 py-3 font-medium">{s.name}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {TYPE_LABELS[s.type] ?? s.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-light">{formatTime(s.shiftStart)}</td>
                    <td className="px-5 py-3 text-text-light">{formatTime(s.shiftEnd)}</td>
                    <td className="px-5 py-3 text-text-light">{s.requiredHoursPerDay}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="sm" icon="edit" onClick={() => openEdit(s)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" icon="delete" onClick={() => openDelete(s)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={closeModal}
        title={modalMode === 'edit' ? 'Редактировать график' : 'Новый график работы'}
      >
        <div className="space-y-4">
          {error ? <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div> : null}

          <Input
            label="Название"
            placeholder="Например: Стандартный 9-18"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-text-light mb-1.5">Тип графика</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={formData.type}
              onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
            >
              {SCHEDULE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {formData.type !== 'Flexible' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-light mb-1.5">Начало смены</label>
                <input
                  type="time"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={formData.shiftStart}
                  onChange={(e) => setFormData((p) => ({ ...p, shiftStart: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light mb-1.5">Конец смены</label>
                <input
                  type="time"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={formData.shiftEnd}
                  onChange={(e) => setFormData((p) => ({ ...p, shiftEnd: e.target.value }))}
                />
              </div>
            </div>
          ) : null}

          <Input
            label="Норма часов в день"
            type="number"
            placeholder="8"
            value={formData.requiredHoursPerDay}
            onChange={(e) => setFormData((p) => ({ ...p, requiredHoursPerDay: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? 'Сохранение...' : modalMode === 'edit' ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={modalMode === 'delete'} onClose={closeModal} title="Удалить график?">
        <div className="space-y-4">
          {error ? <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div> : null}
          <p className="text-sm text-text-light">
            Вы уверены, что хотите удалить график <strong>«{deletingItem?.name}»</strong>? Сотрудники, привязанные к этому графику, потеряют привязку.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              Отмена
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
