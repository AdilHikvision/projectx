import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../../components/templates'
import { Button, Input } from '../../components/atoms'
import { PageHeader, Modal } from '../../components/organisms'
import { ConfirmDialog } from '../../components/molecules'
import { apiRequest, getApiBaseUrl } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'

/* ═══ Aktiv Parking — нативные страницы (жильцы, транспорт, пропуска, отчёты, главная).
   Работают только с бэкендом ProjectX (/api/parking/...), внешний сервер не нужен. ═══ */

interface Vehicle { id: string; plate: string; brand: string | null; color: string | null; notes: string | null; isActive: boolean; ownerName: string | null; ownerPhone: string | null; permitStatus: string; country?: string | null; company?: string | null; vehicleType?: string | null; photoUrl?: string | null }
interface VehicleHistoryRow { enteredUtc: string; exitedUtc: string | null; durationMinutes: number | null; cost: number | null; paymentMethod: string | null; cameraName: string | null }
interface Permit { id: string; vehicleId: string; plate: string; vehicleBrand: string | null; ownerName: string | null; zoneId: string | null; zoneName: string | null; validFrom: string; validTo: string | null; isActive: boolean; notes: string | null; status: string }
interface ZoneRef { id: string; name: string }

function fmtDT(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}

const STATUS_CHIP: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  scheduled: 'bg-blue-50 text-blue-700',
  suspended: 'bg-amber-50 text-amber-700',
  expired: 'bg-red-50 text-red-700',
  none: 'bg-slate-100 text-slate-500',
}

function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_CHIP[status] ?? STATUS_CHIP.none}`}>
      {t(`parking.ap.status.${status}`, { defaultValue: status })}
    </span>
  )
}

/* ─── Главная (дашборд модуля) ─── */
interface Summary {
  vehicles: number; activePermits: number; expiringSoon: number
  openSessions: number; entriesToday: number; zones: number; spaces: number
  recentSessions: { plate: string; enteredUtc: string; exitedUtc: string | null; zoneName: string | null }[]
}

export function ParkingHomePage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    apiRequest<Summary>('/api/parking/summary', { token })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'error'))
  }, [token])

  const tiles: { key: string; value: number | undefined; icon: string; accent: string }[] = [
    { key: 'vehicles', value: data?.vehicles, icon: 'directions_car', accent: 'text-sky-600 bg-sky-50' },
    { key: 'activePermits', value: data?.activePermits, icon: 'verified_user', accent: 'text-green-600 bg-green-50' },
    { key: 'expiringSoon', value: data?.expiringSoon, icon: 'timer', accent: 'text-amber-600 bg-amber-50' },
    { key: 'openSessions', value: data?.openSessions, icon: 'garage', accent: 'text-indigo-600 bg-indigo-50' },
    { key: 'entriesToday', value: data?.entriesToday, icon: 'login', accent: 'text-teal-600 bg-teal-50' },
    { key: 'zones', value: data?.zones, icon: 'map', accent: 'text-slate-600 bg-slate-100' },
    { key: 'spaces', value: data?.spaces, icon: 'local_parking', accent: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader title={t('parking.ap.homeTitle')} description={t('parking.ap.homeDesc')} />
        {error && <div className="p-4 bg-error-bg text-error-text rounded-2xl text-sm font-bold">{error}</div>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tiles.map((tile) => (
            <div key={tile.key} className="bg-surface rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${tile.accent}`}>
                <span className="material-symbols-outlined">{tile.icon}</span>
              </span>
              <div>
                <p className="text-2xl font-black text-text-dark leading-none">{tile.value ?? '—'}</p>
                <p className="text-[10px] font-black text-text-light uppercase tracking-widest mt-1">{t(`parking.ap.tiles.${tile.key}`)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs font-black text-text-light uppercase tracking-widest">{t('parking.ap.recentSessions')}</p>
          </div>
          {!data || data.recentSessions.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-light">{t('parking.ap.noSessions')}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                  <th className="px-5 py-3 text-left">{t('parking.ap.plate')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.ap.zone')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.ap.entered')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.ap.exited')}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSessions.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-none">
                    <td className="px-5 py-3 font-mono font-bold text-text-dark">{s.plate}</td>
                    <td className="px-5 py-3 text-text-light">{s.zoneName ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-text-light">{fmtDT(s.enteredUtc)}</td>
                    <td className="px-5 py-3 font-mono text-xs">{s.exitedUtc ? fmtDT(s.exitedUtc) : <span className="text-green-700 font-bold">{t('parking.ap.inside')}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

/* ─── Транспорт (база автомобилей; владелец — текстовые поля) ─── */
const emptyVehicleForm = { plate: '', brand: '', color: '', notes: '', isActive: true, country: '', company: '', vehicleType: '', photoUrl: '', ownerName: '', ownerPhone: '' }

export function ParkingVehiclesPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehSearch, setVehSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [vehForm, setVehForm] = useState(emptyVehicleForm)
  const [confirmDel, setConfirmDel] = useState<Vehicle | null>(null)
  const [histFor, setHistFor] = useState<Vehicle | null>(null)
  const [histRows, setHistRows] = useState<VehicleHistoryRow[]>([])

  const load = useCallback(async () => {
    if (!token) return
    try {
      const v = await apiRequest<Vehicle[]>('/api/parking/vehicles', { token })
      setVehicles(v); setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'error') }
  }, [token])
  useEffect(() => { void load() }, [load])

  const vehQ = vehSearch.trim().toLowerCase()
  const shownVehicles = vehicles.filter((v) =>
    !vehQ || v.plate.toLowerCase().includes(vehQ) || (v.brand ?? '').toLowerCase().includes(vehQ) || (v.ownerName ?? '').toLowerCase().includes(vehQ))

  const saveVehicle = async () => {
    if (!token || !vehForm.plate.trim()) return
    setSaving(true)
    try {
      const body = JSON.stringify({
        plate: vehForm.plate.trim(), brand: vehForm.brand.trim() || null, color: vehForm.color.trim() || null,
        notes: vehForm.notes.trim() || null, isActive: vehForm.isActive,
        country: vehForm.country.trim() || null, company: vehForm.company.trim() || null,
        vehicleType: vehForm.vehicleType || null, photoUrl: vehForm.photoUrl.trim() || null,
        ownerName: vehForm.ownerName.trim() || null, ownerPhone: vehForm.ownerPhone.trim() || null,
      })
      await apiRequest(editingId ? `/api/parking/vehicles/${editingId}` : '/api/parking/vehicles', { method: editingId ? 'PUT' : 'POST', token, body })
      setModalOpen(false); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'error') } finally { setSaving(false) }
  }

  const doDelete = async () => {
    if (!token || !confirmDel) return
    setSaving(true)
    try {
      await apiRequest(`/api/parking/vehicles/${confirmDel.id}`, { method: 'DELETE', token })
      setConfirmDel(null); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'error') } finally { setSaving(false) }
  }

  const openHistory = async (v: Vehicle) => {
    if (!token) return
    setHistFor(v); setHistRows([])
    try {
      const rows = await apiRequest<VehicleHistoryRow[]>(`/api/parking/vehicles/${v.id}/history`, { token })
      setHistRows(rows)
    } catch { /* boş qalır */ }
  }

  const fieldCls = 'w-full h-10 px-3 rounded-xl border border-divider-light bg-white text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/10 outline-none'

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader title={t('parking.veh.pageTitle')} description={t('parking.veh.pageDesc')} />
        {error && <div className="p-4 bg-error-bg text-error-text rounded-2xl text-sm font-bold">{error}</div>}

        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Input placeholder={t('parking.ap.searchVehicle')} value={vehSearch} onChange={(e) => setVehSearch(e.target.value)} />
            <Button icon="add" onClick={() => { setVehForm(emptyVehicleForm); setEditingId(null); setModalOpen(true) }}>{t('parking.ap.addVehicle')}</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                  <th className="px-5 py-3 text-left">{t('parking.ap.plate')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.ap.brand')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.ap.owner')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.ap.permit')}</th>
                  <th className="px-5 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {shownVehicles.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-none hover:bg-background-light transition-colors">
                    <td className="px-5 py-3 font-mono font-black text-text-dark whitespace-nowrap">
                      {v.country && <span className="mr-1.5 text-[9px] font-black text-text-light border border-border rounded px-1 py-0.5 align-middle">{v.country}</span>}
                      {v.photoUrl ? <a href={v.photoUrl} target="_blank" rel="noreferrer" className="underline decoration-dotted">{v.plate}</a> : v.plate}
                      {!v.isActive && <span className="ml-2 text-[9px] font-black text-text-light uppercase">{t('parking.ap.inactive')}</span>}
                    </td>
                    <td className="px-5 py-3 text-text-light">
                      {v.brand ?? '—'}{v.color ? ` · ${v.color}` : ''}
                      {v.vehicleType && <span className="block text-[10px]">{t(`parking.veh.type.${v.vehicleType}`, { defaultValue: v.vehicleType })}</span>}
                    </td>
                    <td className="px-5 py-3 text-text-light">
                      {v.ownerName ?? '—'}{v.ownerPhone ? ` · ${v.ownerPhone}` : ''}
                      {v.company && <span className="block text-[10px]">{v.company}</span>}
                    </td>
                    <td className="px-5 py-3"><StatusChip status={v.permitStatus} /></td>
                    <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                      <button type="button" className="text-[10px] font-black uppercase tracking-wider text-text-light hover:text-primary hover:underline"
                        onClick={() => void openHistory(v)}>
                        {t('parking.veh.history')}
                      </button>
                      <button type="button" className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline"
                        onClick={() => { setVehForm({ plate: v.plate, brand: v.brand ?? '', color: v.color ?? '', notes: v.notes ?? '', isActive: v.isActive, country: v.country ?? '', company: v.company ?? '', vehicleType: v.vehicleType ?? '', photoUrl: v.photoUrl ?? '', ownerName: v.ownerName ?? '', ownerPhone: v.ownerPhone ?? '' }); setEditingId(v.id); setModalOpen(true) }}>
                        {t('common.edit')}
                      </button>
                      <button type="button" className="text-[10px] font-black uppercase tracking-wider text-error-text hover:underline"
                        onClick={() => setConfirmDel(v)}>
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
                {shownVehicles.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-text-light">{t('parking.ap.noVehicles')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <Modal isOpen title={editingId ? t('parking.ap.editVehicle') : t('parking.ap.addVehicle')} onClose={() => setModalOpen(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_90px] gap-3">
              <Input placeholder={t('parking.ap.plate')} value={vehForm.plate} onChange={(e) => setVehForm({ ...vehForm, plate: e.target.value.toUpperCase() })} autoFocus />
              <Input placeholder={t('parking.veh.country')} value={vehForm.country} onChange={(e) => setVehForm({ ...vehForm, country: e.target.value.toUpperCase() })} maxLength={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={t('parking.ap.brand')} value={vehForm.brand} onChange={(e) => setVehForm({ ...vehForm, brand: e.target.value })} />
              <Input placeholder={t('parking.ap.color')} value={vehForm.color} onChange={(e) => setVehForm({ ...vehForm, color: e.target.value })} />
            </div>
            <select className={fieldCls} value={vehForm.vehicleType} onChange={(e) => setVehForm({ ...vehForm, vehicleType: e.target.value })}>
              <option value="">{t('parking.veh.typeLabel')}</option>
              {['car', 'truck', 'bus', 'motorcycle', 'other'].map((k) => <option key={k} value={k}>{t(`parking.veh.type.${k}`)}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={t('parking.ap.owner')} value={vehForm.ownerName} onChange={(e) => setVehForm({ ...vehForm, ownerName: e.target.value })} />
              <Input placeholder={t('parking.veh.ownerPhone')} value={vehForm.ownerPhone} onChange={(e) => setVehForm({ ...vehForm, ownerPhone: e.target.value })} />
            </div>
            <Input placeholder={t('parking.veh.company')} value={vehForm.company} onChange={(e) => setVehForm({ ...vehForm, company: e.target.value })} />
            <Input placeholder={t('parking.veh.photoUrl')} value={vehForm.photoUrl} onChange={(e) => setVehForm({ ...vehForm, photoUrl: e.target.value })} />
            <label className="flex items-center gap-2 text-sm font-bold text-text-dark cursor-pointer">
              <input type="checkbox" checked={vehForm.isActive} onChange={(e) => setVehForm({ ...vehForm, isActive: e.target.checked })} className="w-4 h-4 accent-primary" />
              {t('parking.ap.active')}
            </label>
            <Button fullWidth isLoading={saving} disabled={!vehForm.plate.trim()} onClick={saveVehicle}>{editingId ? t('common.save') : t('common.add')}</Button>
          </div>
        </Modal>
      )}

      {/* История посещений автомобиля */}
      {histFor && (
        <Modal isOpen title={t('parking.veh.historyTitle', { plate: histFor.plate })} onClose={() => setHistFor(null)}>
          <div className="max-h-96 overflow-y-auto">
            {histRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-light">{t('parking.ap.noSessions')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                    <th className="px-3 py-2 text-left">{t('parking.ap.entered')}</th>
                    <th className="px-3 py-2 text-left">{t('parking.ap.exited')}</th>
                    <th className="px-3 py-2 text-right">{t('parking.ap.duration')}</th>
                    <th className="px-3 py-2 text-right">{t('parking.hist.cost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {histRows.map((h, i) => (
                    <tr key={i} className="border-b border-border last:border-none">
                      <td className="px-3 py-2 font-mono text-xs">{fmtDT(h.enteredUtc)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{h.exitedUtc ? fmtDT(h.exitedUtc) : t('parking.ap.inside')}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{h.durationMinutes != null ? `${h.durationMinutes}m` : '—'}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{h.cost != null ? h.cost.toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}

      {confirmDel && (
        <ConfirmDialog isOpen title={t('parking.ap.deleteQuestion', { name: confirmDel.plate })} message={t('companyTab.actionCannotBeUndone')}
          onConfirm={doDelete} onClose={() => setConfirmDel(null)} isLoading={saving} variant="danger" />
      )}
    </AppLayout>
  )
}

/* ─── Пропуска ─── */
const emptyPermitForm = { vehicleId: '', zoneId: '', validFrom: new Date().toISOString().slice(0, 10), validTo: '', isActive: true, notes: '' }

export function ParkingPermitsPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [permits, setPermits] = useState<Permit[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [zones, setZones] = useState<ZoneRef[]>([])
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'scheduled' | 'suspended' | 'expired'>('all')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyPermitForm)
  const [confirmDel, setConfirmDel] = useState<Permit | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const [p, v, z] = await Promise.all([
        apiRequest<Permit[]>('/api/parking/permits', { token }),
        apiRequest<Vehicle[]>('/api/parking/vehicles', { token }),
        apiRequest<{ id: string; name: string }[]>('/api/parking/zones', { token }),
      ])
      setPermits(p); setVehicles(v); setZones(z); setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'error') }
  }, [token])
  useEffect(() => { void load() }, [load])

  const shown = permits.filter((p) => statusTab === 'all' || p.status === statusTab)
  const count = (s: string) => permits.filter((p) => p.status === s).length
  const fieldCls = 'w-full h-10 px-3 rounded-xl border border-divider-light bg-white text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/10 outline-none'

  const save = async () => {
    if (!token || !form.vehicleId || !form.validFrom) return
    setSaving(true)
    try {
      const body = JSON.stringify({ vehicleId: form.vehicleId, zoneId: form.zoneId || null, validFrom: form.validFrom, validTo: form.validTo || null, isActive: form.isActive, notes: form.notes.trim() || null })
      await apiRequest(editingId ? `/api/parking/permits/${editingId}` : '/api/parking/permits', { method: editingId ? 'PUT' : 'POST', token, body })
      setModalOpen(false); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'error') } finally { setSaving(false) }
  }

  const doDelete = async () => {
    if (!token || !confirmDel) return
    setSaving(true)
    try {
      await apiRequest(`/api/parking/permits/${confirmDel.id}`, { method: 'DELETE', token })
      setConfirmDel(null); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'error') } finally { setSaving(false) }
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader title={t('parking.ap.permitsTitle')} description={t('parking.ap.permitsDesc')} />
        {error && <div className="p-4 bg-error-bg text-error-text rounded-2xl text-sm font-bold">{error}</div>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-surface rounded-2xl shadow-sm p-1">
            {(['all', 'active', 'scheduled', 'suspended', 'expired'] as const).map((s) => (
              <button key={s} type="button" onClick={() => setStatusTab(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${statusTab === s ? 'bg-primary text-white shadow-sm' : 'text-text-light hover:text-text-dark'}`}>
                {s === 'all' ? t('common.all') : t(`parking.ap.status.${s}`)}
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none ${statusTab === s ? 'bg-white/20' : 'bg-background-light text-text-muted'}`}>
                  {s === 'all' ? permits.length : count(s)}
                </span>
              </button>
            ))}
          </div>
          <Button icon="add" onClick={() => { setForm(emptyPermitForm); setEditingId(null); setModalOpen(true) }}>{t('parking.ap.addPermit')}</Button>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                  <th className="px-5 py-3 text-left">{t('parking.ap.plate')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.ap.owner')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.ap.zone')}</th>
                  <th className="px-5 py-3 text-left">{t('common.from')}</th>
                  <th className="px-5 py-3 text-left">{t('common.to')}</th>
                  <th className="px-5 py-3 text-left">{t('common.status')}</th>
                  <th className="px-5 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-none hover:bg-background-light transition-colors">
                    <td className="px-5 py-3 font-mono font-black text-text-dark">{p.plate}<span className="ml-2 text-[11px] font-normal text-text-light">{p.vehicleBrand ?? ''}</span></td>
                    <td className="px-5 py-3 text-text-light">{p.ownerName ?? '—'}</td>
                    <td className="px-5 py-3 text-text-light">{p.zoneName ?? t('parking.ap.allZones')}</td>
                    <td className="px-5 py-3 font-mono text-xs text-text-light">{p.validFrom}</td>
                    <td className="px-5 py-3 font-mono text-xs text-text-light">{p.validTo ?? t('parking.ap.unlimited')}</td>
                    <td className="px-5 py-3"><StatusChip status={p.status} /></td>
                    <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                      <button type="button" className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline"
                        onClick={() => { setForm({ vehicleId: p.vehicleId, zoneId: p.zoneId ?? '', validFrom: p.validFrom, validTo: p.validTo ?? '', isActive: p.isActive, notes: p.notes ?? '' }); setEditingId(p.id); setModalOpen(true) }}>
                        {t('common.edit')}
                      </button>
                      <button type="button" className="text-[10px] font-black uppercase tracking-wider text-error-text hover:underline"
                        onClick={() => setConfirmDel(p)}>
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-text-light">{t('parking.ap.noPermits')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <Modal isOpen title={editingId ? t('parking.ap.editPermit') : t('parking.ap.addPermit')} onClose={() => setModalOpen(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1.5">{t('parking.ap.vehicle')}</label>
              <select className={fieldCls} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">—</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}{v.ownerName ? ` — ${v.ownerName}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1.5">{t('parking.ap.zone')}</label>
              <select className={fieldCls} value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })}>
                <option value="">{t('parking.ap.allZones')}</option>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1.5">{t('common.from')}</label>
                <input type="date" className={fieldCls} value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest mb-1.5">{t('common.to')}</label>
                <input type="date" className={fieldCls} value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
              </div>
            </div>
            <Input placeholder={t('common.optional')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <label className="flex items-center gap-2 text-sm font-bold text-text-dark cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-primary" />
              {t('parking.ap.permitActive')}
            </label>
            <Button fullWidth isLoading={saving} disabled={!form.vehicleId || !form.validFrom} onClick={save}>{editingId ? t('common.save') : t('common.add')}</Button>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <ConfirmDialog isOpen title={t('parking.ap.deleteQuestion', { name: confirmDel.plate })} message={t('companyTab.actionCannotBeUndone')}
          onConfirm={doDelete} onClose={() => setConfirmDel(null)} isLoading={saving} variant="danger" />
      )}
    </AppLayout>
  )
}

/* ─── Отчёты ─── */
interface SessionsReport {
  from: string; to: string; totalEntries: number; totalExits: number; stillInside: number; avgDurationMinutes: number
  byDay: { date: string; entries: number; exits: number }[]
  sessions: { plate: string; zoneName: string | null; enteredUtc: string; exitedUtc: string | null; durationMinutes: number | null; isPaid: boolean }[]
}

export function ParkingReportsPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10) })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [zoneId, setZoneId] = useState('')
  const [zones, setZones] = useState<ZoneRef[]>([])
  const [data, setData] = useState<SessionsReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'excel' | 'pdf' | 'email' | null>(null)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailResult, setEmailResult] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    apiRequest<{ id: string; name: string }[]>('/api/parking/zones', { token }).then(setZones).catch(() => setZones([]))
  }, [token])

  /** Файл скачиваем вручную: apiRequest умеет только JSON. */
  const download = async (kind: 'excel' | 'pdf') => {
    if (!token) return
    setBusy(kind); setError(null)
    try {
      const params = new URLSearchParams({ from, to })
      if (zoneId) params.set('zoneId', zoneId)
      const res = await fetch(`${getApiBaseUrl()}/api/parking/reports/sessions/${kind}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `parking-${from}_${to}.${kind === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error')
    } finally { setBusy(null) }
  }

  const sendEmail = async () => {
    if (!token || !emailTo.trim()) return
    setBusy('email'); setEmailResult(null)
    try {
      const r = await apiRequest<{ message: string }>('/api/parking/reports/sessions/send-email', {
        method: 'POST', token,
        // To_ — конец периода: имя To на сервере занято адресом получателя.
        body: JSON.stringify({ to: emailTo.trim(), from, to_: to, zoneId: zoneId || null }),
      })
      setEmailResult(r.message)
    } catch (e) {
      setEmailResult(e instanceof Error ? e.message : 'error')
    } finally { setBusy(null) }
  }

  useEffect(() => {
    if (!token) return
    const params = new URLSearchParams({ from, to })
    if (zoneId) params.set('zoneId', zoneId)
    apiRequest<SessionsReport>(`/api/parking/reports/sessions?${params}`, { token })
      .then((r) => { setData(r); setError(null) })
      .catch((e) => setError(e instanceof Error ? e.message : 'error'))
  }, [token, from, to, zoneId])

  const fieldCls = 'h-10 px-3 rounded-xl border border-divider-light bg-white text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/10 outline-none'
  const fmtDur = (m: number) => m >= 60 ? `${Math.floor(m / 60)}h ${Math.round(m % 60)}m` : `${Math.round(m)}m`

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader title={t('parking.ap.reportsTitle')} description={t('parking.ap.reportsDesc')} />
        {error && <div className="p-4 bg-error-bg text-error-text rounded-2xl text-sm font-bold">{error}</div>}

        <div className="bg-surface rounded-2xl shadow-sm p-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('common.from')}</label>
            <input type="date" className={fieldCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('common.to')}</label>
            <input type="date" className={fieldCls} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">{t('parking.ap.zone')}</label>
            <select className={fieldCls} value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
              <option value="">{t('parking.ap.allZones')}</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          {/* Выгрузка и отправка отчёта — как в отчётах по рабочему времени */}
          <div className="ml-auto flex items-end gap-2">
            <Button variant="outline" icon="table_view" isLoading={busy === 'excel'} onClick={() => void download('excel')}>
              {t('workHours.excel')}
            </Button>
            <Button variant="outline" icon="picture_as_pdf" isLoading={busy === 'pdf'} onClick={() => void download('pdf')}>
              PDF
            </Button>
            <Button icon="mail" onClick={() => { setEmailTo(''); setEmailResult(null); setEmailOpen(true) }}>
              {t('parking.ap.sendReport')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'totalEntries', value: data?.totalEntries },
            { key: 'totalExits', value: data?.totalExits },
            { key: 'stillInside', value: data?.stillInside },
            { key: 'avgDuration', value: data ? fmtDur(data.avgDurationMinutes) : undefined },
          ].map((tile) => (
            <div key={tile.key} className="bg-surface rounded-2xl shadow-sm p-5">
              <p className="text-2xl font-black text-text-dark leading-none">{tile.value ?? '—'}</p>
              <p className="text-[10px] font-black text-text-light uppercase tracking-widest mt-2">{t(`parking.ap.report.${tile.key}`)}</p>
            </div>
          ))}
        </div>

        {data && data.byDay.length > 0 && (
          <div className="bg-surface rounded-2xl shadow-sm p-5">
            <p className="text-xs font-black text-text-light uppercase tracking-widest mb-4">{t('parking.ap.report.byDay')}</p>
            <div className="flex items-end gap-2 h-32 overflow-x-auto">
              {data.byDay.map((d) => {
                const max = Math.max(...data.byDay.map((x) => x.entries), 1)
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1 min-w-10" title={`${d.date}: ${d.entries}`}>
                    <span className="text-[10px] font-bold text-text-dark">{d.entries}</span>
                    <div className="w-7 rounded-t-lg bg-primary/70" style={{ height: `${Math.max(6, (d.entries / max) * 90)}px` }} />
                    <span className="text-[9px] text-text-light font-mono">{d.date.slice(5)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs font-black text-text-light uppercase tracking-widest">{t('parking.ap.report.sessions')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black text-text-light uppercase tracking-widest border-b border-border">
                  <th className="px-5 py-3 text-left">{t('parking.ap.plate')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.ap.zone')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.ap.entered')}</th>
                  <th className="px-5 py-3 text-left">{t('parking.ap.exited')}</th>
                  <th className="px-5 py-3 text-right">{t('parking.ap.duration')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.sessions ?? []).map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-none hover:bg-background-light transition-colors">
                    <td className="px-5 py-3 font-mono font-black text-text-dark">{s.plate}</td>
                    <td className="px-5 py-3 text-text-light">{s.zoneName ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-text-light">{fmtDT(s.enteredUtc)}</td>
                    <td className="px-5 py-3 font-mono text-xs">{s.exitedUtc ? fmtDT(s.exitedUtc) : <span className="text-green-700 font-bold">{t('parking.ap.inside')}</span>}</td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-text-dark">{s.durationMinutes != null ? fmtDur(s.durationMinutes) : '—'}</td>
                  </tr>
                ))}
                {(!data || data.sessions.length === 0) && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-text-light">{t('parking.ap.noSessions')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {emailOpen && (
        <Modal isOpen title={t('parking.ap.sendReport')} onClose={() => setEmailOpen(false)}>
          <div className="space-y-4">
            <p className="text-xs text-text-light">{t('parking.ap.sendReportHint', { from, to })}</p>
            <Input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="name@company.com"
              icon="mail"
            />
            {emailResult && <p className="text-xs font-bold text-text-dark">{emailResult}</p>}
            <div className="flex gap-2 pt-2">
              <Button fullWidth isLoading={busy === 'email'} disabled={!emailTo.trim()} onClick={() => void sendEmail()}>
                {t('common.send')}
              </Button>
              <Button fullWidth variant="outline" onClick={() => setEmailOpen(false)}>{t('common.close')}</Button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
