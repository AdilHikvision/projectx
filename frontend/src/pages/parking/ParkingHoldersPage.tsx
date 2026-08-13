import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../../components/templates'
import { Button, Input } from '../../components/atoms'
import { PageHeader, Modal } from '../../components/organisms'
import { ConfirmDialog } from '../../components/molecules'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'

/* ═══ Владельцы мест: за одним закреплено N мест и любое число машин.
   Пока заняты все его места, остальные его машины на въезд не пускают —
   так семья или компания с двумя местами и пятью машинами не займёт парковку.
   Машины привязываются к владельцу в белом списке. ═══ */

interface Holder {
  id: string
  name: string
  phone: string | null
  unit: string | null
  spacesLimit: number
  isActive: boolean
  notes: string | null
  /** Номера, закреплённые за владельцем (из белого списка). */
  plates: string[]
  /** Сколько его машин стоит внутри прямо сейчас. */
  occupied: number
}

const emptyForm = { name: '', phone: '', unit: '', spacesLimit: '1', isActive: true, notes: '' }

export function ParkingHoldersPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [holders, setHolders] = useState<Holder[]>([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<Holder | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      setHolders(await apiRequest<Holder[]>('/api/parking/holders', { token }))
      setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'error') }
  }, [token])
  useEffect(() => { void load() }, [load])

  const save = async () => {
    const name = form.name.trim()
    if (!token || !name) return
    setSaving(true)
    try {
      const body = JSON.stringify({
        name,
        phone: form.phone.trim() || null,
        unit: form.unit.trim() || null,
        spacesLimit: Math.max(1, parseInt(form.spacesLimit, 10) || 1),
        isActive: form.isActive,
        notes: form.notes.trim() || null,
      })
      await apiRequest(editingId ? `/api/parking/holders/${editingId}` : '/api/parking/holders', { method: editingId ? 'PUT' : 'POST', token, body })
      setModalOpen(false); setForm(emptyForm); setEditingId(null)
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'error') } finally { setSaving(false) }
  }

  const doDelete = async () => {
    if (!token || !confirmDel) return
    setSaving(true)
    try {
      await apiRequest(`/api/parking/holders/${confirmDel.id}`, { method: 'DELETE', token })
      setConfirmDel(null); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'error') } finally { setSaving(false) }
  }

  const q = search.trim().toLowerCase()
  const shown = holders.filter((h) => !q
    || h.name.toLowerCase().includes(q)
    || (h.unit ?? '').toLowerCase().includes(q)
    || (h.phone ?? '').toLowerCase().includes(q)
    || h.plates.some((p) => p.toLowerCase().includes(q)))

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader title={t('parking.holder.pageTitle')} description={t('parking.holder.hint')} />
        {error && <div className="p-4 bg-error-bg text-error-text rounded-2xl text-sm font-bold">{error}</div>}

        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Input placeholder={t('parking.holder.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button icon="add" onClick={() => { setForm(emptyForm); setEditingId(null); setModalOpen(true) }}>{t('parking.holder.add')}</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                  <th className="px-5 py-3 text-left">{t('parking.holder.name')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.holder.unit')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.holder.phone')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.holder.plates')}</th>
                  <th className="px-5 py-3 text-center">{t('parking.holder.occupiedHint')}</th>
                  <th className="px-5 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((h) => {
                  const full = h.occupied >= h.spacesLimit
                  return (
                    <tr key={h.id} className="border-b border-border last:border-none hover:bg-background-light transition-colors">
                      <td className="px-5 py-3 font-bold text-text-dark">
                        {h.name}
                        {!h.isActive && <span className="ml-2 text-[9px] font-black text-text-light uppercase">{t('common.inactive')}</span>}
                      </td>
                      <td className="px-5 py-3 text-text-light">{h.unit ?? '—'}</td>
                      <td className="px-5 py-3 text-text-light">{h.phone ?? '—'}</td>
                      <td className="px-5 py-3 font-mono text-xs text-text-light">
                        {h.plates.length > 0 ? h.plates.join(', ') : t('parking.holder.noPlates')}
                      </td>
                      {/* Полная квота — остальные машины владельца на въезд не пустят. */}
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-black ${full ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {h.occupied} / {h.spacesLimit}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                        <button type="button" className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline"
                          onClick={() => {
                            setEditingId(h.id)
                            setForm({
                              name: h.name, phone: h.phone ?? '', unit: h.unit ?? '',
                              spacesLimit: String(h.spacesLimit), isActive: h.isActive, notes: h.notes ?? '',
                            })
                            setModalOpen(true)
                          }}>
                          {t('common.edit')}
                        </button>
                        <button type="button" className="text-[10px] font-black uppercase tracking-wider text-error-text hover:underline"
                          onClick={() => setConfirmDel(h)}>
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {shown.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-text-light">{t('common.noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <Modal isOpen title={editingId ? t('parking.holder.edit') : t('parking.holder.add')} onClose={() => setModalOpen(false)}>
          <div className="space-y-3">
            <Input placeholder={t('parking.holder.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={t('parking.holder.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder={t('parking.holder.unit')} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1.5">{t('parking.holder.spacesLimit')}</label>
              <input type="number" min={1}
                className="w-full h-10 px-3 rounded-xl border border-divider-light bg-white text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/10 outline-none"
                value={form.spacesLimit} onChange={(e) => setForm({ ...form, spacesLimit: e.target.value })} />
            </div>
            <Input placeholder={t('common.optional')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <label className="flex items-center gap-2 text-sm font-bold text-text-dark cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-primary" />
              {t('parking.ap.active')}
            </label>
            <Button fullWidth isLoading={saving} disabled={!form.name.trim()} onClick={save}>{editingId ? t('common.save') : t('common.add')}</Button>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <ConfirmDialog isOpen title={t('parking.ap.deleteQuestion', { name: confirmDel.name })}
          message={t('parking.holder.deleteHint')}
          onConfirm={doDelete} onClose={() => setConfirmDel(null)} isLoading={saving} variant="danger" />
      )}
    </AppLayout>
  )
}
