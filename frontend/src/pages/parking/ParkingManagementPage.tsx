import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../../components/templates'
import { Button, Input } from '../../components/atoms'
import { PageHeader, Modal } from '../../components/organisms'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'
import { useModule } from '../../context/ModuleContext'

// ─── Domain types (mirror backend DTOs) ─────────────────────────────────────────
type SpaceType = 'Regular' | 'Vip' | 'Disabled'

interface Zone {
    id: string
    name: string
    code: string | null
    description: string | null
    isActive: boolean
    sortOrder: number
    floorCount: number
    spaceCount: number
}
interface Floor {
    id: string
    zoneId: string
    name: string
    level: number
    isActive: boolean
    sortOrder: number
    rowCount: number
    spaceCount: number
}
interface Row {
    id: string
    floorId: string
    name: string
    sortOrder: number
    spaceCount: number
}
interface Space {
    id: string
    rowId: string
    code: string
    type: SpaceType
    isActive: boolean
    sortOrder: number
    notes: string | null
}
interface Scheme {
    id: string
    name: string
    code: string | null
    isActive: boolean
    floors: {
        id: string
        name: string
        level: number
        isActive: boolean
        rows: { id: string; name: string; spaces: Space[] }[]
    }[]
}

/** Владелец мест: N мест и любое число закреплённых номеров. */
interface Holder {
    id: string
    name: string
    phone: string | null
    unit: string | null
    spacesLimit: number
    isActive: boolean
    notes: string | null
    plates: string[]
    /** Сколько машин владельца стоит внутри прямо сейчас. */
    occupied: number
}

const emptyHolder = { name: '', phone: '', unit: '', spacesLimit: '1', isActive: true, notes: '' }

const SPACE_TYPES: SpaceType[] = ['Regular', 'Vip', 'Disabled']

// ─── AktivParking scoped restyle (page-only, prefixed .pk-*) ────────────────────
const PK_RESTYLE = `
.pk-page{--ap-acc:#6C5CE7;--ap-acc-d:#5a4bd4;--ap-acc-soft:#EEECFB;--ap-acc-softer:#F3F1FC;--ap-bg:#F6F6FB;--ap-panel:#fff;--ap-line:#ECECF3;--ap-ink:#252641;--ap-ink2:#4A4B6B;--ap-muted:#8B8CA7;--ap-shadow:0 1px 2px rgba(37,38,65,.04),0 8px 24px rgba(37,38,65,.05);background:var(--ap-bg)}
.pk-page .rounded-3xl{border-radius:16px!important}
.pk-page .rounded-2xl{border-radius:12px!important}
.pk-page .rounded-xl{border-radius:12px!important}
.pk-page .shadow-md,.pk-page .shadow-sm,.pk-page .shadow{box-shadow:var(--ap-shadow)!important}
.pk-page h2,.pk-page h3{letter-spacing:-.3px}
.pk-page table thead th{font-size:12px;letter-spacing:.4px;color:var(--ap-muted)!important}
.pk-page table tbody tr:hover{background:var(--ap-acc-softer)!important}
.pk-page input:focus,.pk-page select:focus,.pk-page textarea:focus{border-color:var(--ap-acc)!important;box-shadow:0 0 0 3px var(--ap-acc-soft)!important}
.pk-page .shadow-primary{box-shadow:0 6px 16px rgba(108,92,231,.28)!important}
/* AktivParking panel: soft shadow + hairline top accent feel */
.pk-page .ap-panel{box-shadow:var(--ap-shadow)!important;border-color:var(--ap-line)!important}
.pk-page .ap-panel:hover{box-shadow:0 2px 6px rgba(37,38,65,.05),0 12px 30px rgba(37,38,65,.07)!important}
`


const TYPE_STYLE: Record<SpaceType, { icon: string; chip: string; dot: string }> = {
    Regular: { icon: 'local_parking', chip: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
    Vip: { icon: 'star', chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    Disabled: { icon: 'accessible', chip: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400' },
}

export function ParkingManagementPage() {
    const { t } = useTranslation()
    const { token } = useAuth()

    // Схема всегда на виду; настройки и структура открываются шестерёнкой.
    const [manageOpen, setManageOpen] = useState(false)
    // Режим работы (платный/бесплатный) берём из общего контекста — он же питает сайдбар,
    // поэтому страница и меню всегда показывают одно и то же. Меняется в служебном окне.
    const { parkingPaid } = useModule()
    const parkingMode: 'Paid' | 'Free' = parkingPaid ? 'Paid' : 'Free'
    // Pulsuz alt-rejim: List (İcazə siyahısı) / Capacity (Tutum)
    const [freeSubMode, setFreeSubMode] = useState<'List' | 'Capacity'>('Capacity')
    const [plates, setPlates] = useState<{ id: string; plate: string; listType: string; note: string | null; category?: string | null; validTo?: string | null; timeLimitMinutes?: number | null; holderId?: string | null; holderName?: string | null }[]>([])
    // Владельцы мест: у одного N мест и любое число машин.
    const [holders, setHolders] = useState<Holder[]>([])
    const [newPlateHolder, setNewPlateHolder] = useState('')
    const [holderForm, setHolderForm] = useState(emptyHolder)
    const [editingHolderId, setEditingHolderId] = useState<string | null>(null)
    const [newPlate, setNewPlate] = useState('')
    const [newPlateList, setNewPlateList] = useState<'Allow' | 'Block'>('Allow')
    const [newPlateCategory, setNewPlateCategory] = useState('')
    const [newPlateValidTo, setNewPlateValidTo] = useState('')
    const [newPlateTimeLimit, setNewPlateTimeLimit] = useState('')
    // Платный режим: сколько минут даётся на выезд после оплаты (parking.exitGraceMinutes).
    const [exitGraceMinutes, setExitGraceMinutes] = useState('15')
    const [occupancy, setOccupancy] = useState<{ commonCapacity: number; vipCapacity: number; commonUsed: number; vipUsed: number; commonFree: number; vipFree: number } | null>(null)
    const [zones, setZones] = useState<Zone[]>([])
    const [floors, setFloors] = useState<Floor[]>([])
    const [rows, setRows] = useState<Row[]>([])
    const [spacesByRow, setSpacesByRow] = useState<Record<string, Space[]>>({})
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
    const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null)
    const [loadingZones, setLoadingZones] = useState(false)
    const [scheme, setScheme] = useState<Scheme | null>(null)
    const [loadingScheme, setLoadingScheme] = useState(false)

    const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? null
    const selectedFloor = floors.find((f) => f.id === selectedFloorId) ?? null

    // ─── Loaders ───
    const loadZones = async () => {
        if (!token) return
        setLoadingZones(true)
        try {
            const z = await apiRequest<Zone[]>('/api/parking/zones', { token })
            setZones(z)
            setSelectedZoneId((cur) => cur && z.some((x) => x.id === cur) ? cur : (z[0]?.id ?? null))
        } finally { setLoadingZones(false) }
    }
    const loadFloors = async (zoneId: string) => {
        if (!token) return
        const f = await apiRequest<Floor[]>(`/api/parking/zones/${zoneId}/floors`, { token })
        setFloors(f)
        setSelectedFloorId((cur) => cur && f.some((x) => x.id === cur) ? cur : (f[0]?.id ?? null))
    }
    const loadRows = async (floorId: string) => {
        if (!token) return
        const r = await apiRequest<Row[]>(`/api/parking/floors/${floorId}/rows`, { token })
        setRows(r)
        const entries = await Promise.all(
            r.map(async (row) => [row.id, await apiRequest<Space[]>(`/api/parking/rows/${row.id}/spaces`, { token })] as const),
        )
        setSpacesByRow(Object.fromEntries(entries))
    }
    const loadScheme = async (zoneId: string) => {
        if (!token) return
        setLoadingScheme(true)
        try { setScheme(await apiRequest<Scheme>(`/api/parking/zones/${zoneId}/scheme`, { token })) }
        finally { setLoadingScheme(false) }
    }

    useEffect(() => { void loadZones() }, [token])
    // Alt-rejim + nömrə siyahıları + tutum yüklə
    const reloadPlates = () => apiRequest<typeof plates>('/api/parking/plates', { token }).then(setPlates).catch(() => { })
    const reloadHolders = () => apiRequest<Holder[]>('/api/parking/holders', { token }).then(setHolders).catch(() => { })
    const reloadOccupancy = () => apiRequest<NonNullable<typeof occupancy>>('/api/parking/occupancy', { token }).then(setOccupancy).catch(() => { })
    useEffect(() => {
        if (!token) return
        apiRequest<{ key: string; value: string }>('/api/system-settings/parking.freeSubMode', { token })
            .then((r) => { if (r?.value === 'List' || r?.value === 'Capacity') setFreeSubMode(r.value) })
            .catch(() => { })
        apiRequest<{ key: string; value: string }>('/api/system-settings/parking.exitGraceMinutes', { token })
            .then((r) => { if (r?.value) setExitGraceMinutes(r.value) }).catch(() => { /* нет ключа — остаётся 15 */ })
        void reloadPlates()
        void reloadHolders()
        void reloadOccupancy()
    }, [token])

    const saveFreeSetting = async (key: string, value: string) => {
        try { await apiRequest('/api/system-settings', { method: 'POST', token, body: JSON.stringify({ key, value: value.trim() }) }) }
        catch { /* ignore */ }
    }
    const changeFreeSubMode = async (m: 'List' | 'Capacity') => {
        if (m === freeSubMode) return
        const prev = freeSubMode
        setFreeSubMode(m)
        try { await apiRequest('/api/system-settings', { method: 'POST', token, body: JSON.stringify({ key: 'parking.freeSubMode', value: m }) }) }
        catch { setFreeSubMode(prev) }
    }
    const addPlate = async () => {
        const p = newPlate.trim()
        if (!p) return
        try {
            await apiRequest('/api/parking/plates', {
                method: 'POST', token,
                body: JSON.stringify({
                    plate: p,
                    listType: newPlateList,
                    category: newPlateCategory || null,
                    validTo: newPlateList === 'Allow' && newPlateValidTo ? newPlateValidTo : null,
                    timeLimitMinutes: newPlateList === 'Allow' && newPlateTimeLimit ? Math.max(1, parseInt(newPlateTimeLimit, 10) || 0) : null,
                    holderId: newPlateList === 'Allow' && newPlateHolder ? newPlateHolder : null,
                }),
            })
            setNewPlate(''); setNewPlateCategory(''); setNewPlateValidTo(''); setNewPlateTimeLimit(''); setNewPlateHolder('')
            await reloadHolders()
            await reloadPlates()
        }
        catch { /* ignore */ }
    }
    const delPlate = async (id: string) => {
        try { await apiRequest(`/api/parking/plates/${id}`, { method: 'DELETE', token }); setPlates((ps) => ps.filter((x) => x.id !== id)); await reloadHolders() }
        catch { /* ignore */ }
    }

    // ─── Владельцы мест ───
    const saveHolder = async () => {
        const name = holderForm.name.trim()
        if (!name) return
        const body = JSON.stringify({
            name,
            phone: holderForm.phone.trim() || null,
            unit: holderForm.unit.trim() || null,
            spacesLimit: Math.max(1, parseInt(holderForm.spacesLimit, 10) || 1),
            isActive: holderForm.isActive,
            notes: holderForm.notes.trim() || null,
        })
        try {
            if (editingHolderId) await apiRequest(`/api/parking/holders/${editingHolderId}`, { method: 'PUT', token, body })
            else await apiRequest('/api/parking/holders', { method: 'POST', token, body })
            setHolderForm(emptyHolder); setEditingHolderId(null)
            await reloadHolders()
        } catch { /* ignore */ }
    }
    const delHolder = async (id: string) => {
        try {
            await apiRequest(`/api/parking/holders/${id}`, { method: 'DELETE', token })
            await reloadHolders(); await reloadPlates()
        } catch { /* ignore */ }
    }
    useEffect(() => {
        if (!selectedZoneId) { setFloors([]); setSelectedFloorId(null); return }
        void loadFloors(selectedZoneId)
    }, [selectedZoneId, token])
    useEffect(() => {
        if (!selectedFloorId) { setRows([]); setSpacesByRow({}); return }
        void loadRows(selectedFloorId)
    }, [selectedFloorId, token])
    useEffect(() => {
        if (selectedZoneId) void loadScheme(selectedZoneId)
    }, [selectedZoneId, token])

    // ─── Modal state ───
    const [zoneModal, setZoneModal] = useState<{ mode: 'create' | 'edit'; data: Zone | null } | null>(null)
    const [floorModal, setFloorModal] = useState<{ mode: 'create' | 'edit'; data: Floor | null } | null>(null)
    const [rowModal, setRowModal] = useState<{ mode: 'create' | 'edit'; data: Row | null } | null>(null)
    const [spaceModal, setSpaceModal] = useState<{ rowId: string; data: Space | null } | null>(null)
    const [bulkRowId, setBulkRowId] = useState<string | null>(null)
    const [confirm, setConfirm] = useState<{ label: string; onConfirm: () => Promise<void> } | null>(null)

    const refreshAfterChange = async () => {
        await loadZones()
        if (selectedZoneId) await loadFloors(selectedZoneId)
        if (selectedFloorId) await loadRows(selectedFloorId)
        if (selectedZoneId) await loadScheme(selectedZoneId)
    }

    const del = (label: string, path: string) => setConfirm({
        label,
        onConfirm: async () => {
            await apiRequest(path, { method: 'DELETE', token })
            await refreshAfterChange()
        },
    })

    return (
        <AppLayout>
            <style>{PK_RESTYLE}</style>
            <div className="pk-page flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
                <div className="p-6 md:p-10 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <PageHeader
                            className="p-0 border-none shadow-none bg-transparent"
                            title={t('parking.nav.management')}
                            description={t('parking.subtitle')}
                        />
                        {/* Настройки и структура парковки живут под шестерёнкой — на странице только схема. */}
                        <Button icon="settings" variant="outline" onClick={() => setManageOpen(true)}>
                            {t('parking.manageTitle')}
                        </Button>
                    </div>

                    {loadingZones ? (
                        <Spinner />
                    ) : zones.length === 0 ? (
                        <EmptyState icon="local_parking" text={t('parking.zones.empty')}
                            action={<Button icon="add" variant="outline" onClick={() => setZoneModal({ mode: 'create', data: null })}>{t('parking.zones.new')}</Button>} />
                    ) : (
                        <SchemeView
                            zones={zones}
                            selectedZoneId={selectedZoneId}
                            onSelectZone={setSelectedZoneId}
                            scheme={scheme}
                            loading={loadingScheme}
                        />
                    )}

                    <TypeLegend />
                </div>
            </div>

            {/* ─── Управление парковкой: настройки и структура ─── */}
            {manageOpen && (
                <Modal isOpen size="xl" title={t('parking.manageTitle')} onClose={() => setManageOpen(false)}
                    actions={<Button icon="add" size="sm" onClick={() => setZoneModal({ mode: 'create', data: null })}>{t('parking.zones.new')}</Button>}>
                    <div className="pk-page space-y-6 bg-transparent">
                    {/* Режим работы (платный/бесплатный) переключается в служебном меню
                        активации модулей — здесь только показываем текущий. */}
                    <div className="ap-panel flex items-start gap-3 rounded-2xl border border-border-base bg-surface p-5">
                        <span className="material-symbols-outlined text-2xl text-primary">{parkingMode === 'Paid' ? 'paid' : 'money_off'}</span>
                        <div>
                            <div className="text-sm font-bold text-text-dark">
                                {t('parking.modeTitle')}: {t(parkingMode === 'Paid' ? 'moduleActivation.parkingPaid' : 'moduleActivation.parkingFree')}
                            </div>
                            <div className="mt-0.5 text-xs text-text-muted">
                                {t(parkingMode === 'Paid' ? 'moduleActivation.parkingPaidHint' : 'moduleActivation.parkingFreeHint')}
                            </div>
                        </div>
                    </div>

                    {/* Giriş məntiqi: alt-rejim + tutum + nömrə siyahıları */}
                    <div className="ap-panel space-y-5 rounded-2xl border border-border-base bg-surface p-5">
                        {parkingMode === 'Free' && (
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="text-sm font-bold text-text-dark">{t('parking.cfg.freeSubMode')}</div>
                                    <div className="mt-0.5 text-xs text-text-muted">
                                        {freeSubMode === 'List'
                                            ? t('parking.cfg.subModeListHint')
                                            : t('parking.cfg.subModeCapacityHint')}
                                    </div>
                                </div>
                                <div className="inline-flex shrink-0 rounded-xl border border-border-base bg-slate-75 p-1">
                                    {(['List', 'Capacity'] as const).map((m) => (
                                        <button key={m} type="button" onClick={() => changeFreeSubMode(m)}
                                            className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${freeSubMode === m ? 'bg-primary text-white shadow-primary' : 'text-text-muted hover:text-text-dark'}`}>
                                            {t(m === 'List' ? 'parking.cfg.subModeList' : 'parking.cfg.subModeCapacity')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Общих числовых настроек у бесплатного режима нет: лимит стоянки
                            задаётся точечно у номера в белом списке (поле «Лимит, мин»). */}

                        {/* Платный режим: сколько минут даётся на выезд после оплаты. */}
                        {parkingMode === 'Paid' && (
                            <div className="rounded-xl border border-border-base p-3 sm:max-w-md">
                                <div className="text-xs text-text-muted mb-1.5">{t('parking.cfg.exitGrace')}</div>
                                <input type="number" min={0}
                                    className="w-full rounded-lg border border-border-base bg-surface px-3 py-2 text-sm text-text-dark"
                                    value={exitGraceMinutes}
                                    onChange={(e) => setExitGraceMinutes(e.target.value)}
                                    onBlur={() => void saveFreeSetting('parking.exitGraceMinutes', exitGraceMinutes || '0')} />
                                <div className="mt-1.5 text-[11px] leading-relaxed text-text-light">{t('parking.cfg.exitGraceHint')}</div>
                            </div>
                        )}

                        {occupancy && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-border-base p-3">
                                    <div className="text-xs text-text-muted">{t('parking.cfg.commonSpaces')}</div>
                                    <div className="text-lg font-extrabold text-text-dark">{occupancy.commonFree}<span className="text-sm font-medium text-text-muted"> / {occupancy.commonCapacity}</span></div>
                                </div>
                                <div className="rounded-xl border border-border-base p-3">
                                    <div className="text-xs text-text-muted">{t('parking.cfg.vipSpaces')}</div>
                                    <div className="text-lg font-extrabold text-text-dark">{occupancy.vipFree}<span className="text-sm font-medium text-text-muted"> / {occupancy.vipCapacity}</span></div>
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="mb-2 text-sm font-bold text-text-dark">{t('parking.cfg.plateLists')}</div>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <Input value={newPlate} onChange={(e) => setNewPlate(e.target.value)} placeholder="10-AA-100" />
                                <select value={newPlateList} onChange={(e) => { setNewPlateList(e.target.value as 'Allow' | 'Block'); setNewPlateCategory('') }}
                                    className="rounded-lg border border-border-base bg-surface px-3 py-2 text-sm text-text-dark">
                                    <option value="Allow">{t('parking.cfg.allowList')}</option>
                                    <option value="Block">{t('parking.cfg.blockList')}</option>
                                </select>
                                <select value={newPlateCategory} onChange={(e) => setNewPlateCategory(e.target.value)}
                                    className="rounded-lg border border-border-base bg-surface px-3 py-2 text-sm text-text-dark">
                                    {newPlateList === 'Allow' ? (
                                        <>
                                            <option value="">{t('parking.cfg.categoryAny')}</option>
                                            <option value="employee">{t('parking.cfg.category.employee')}</option>
                                            <option value="management">{t('parking.cfg.category.management')}</option>
                                            <option value="vip">{t('parking.cfg.category.vip')}</option>
                                            <option value="service">{t('parking.cfg.category.service')}</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="">{t('parking.cfg.reasonAny')}</option>
                                            <option value="unpaid">{t('parking.cfg.reason.unpaid')}</option>
                                            <option value="violator">{t('parking.cfg.reason.violator')}</option>
                                            <option value="stolen">{t('parking.cfg.reason.stolen')}</option>
                                            <option value="banned">{t('parking.cfg.reason.banned')}</option>
                                        </>
                                    )}
                                </select>
                                {newPlateList === 'Allow' && (
                                    <>
                                        <input type="date" title={t('parking.cfg.validToHint')}
                                            className="rounded-lg border border-border-base bg-surface px-3 py-2 text-sm text-text-dark"
                                            value={newPlateValidTo} onChange={(e) => setNewPlateValidTo(e.target.value)} />
                                        <input type="number" min={0} placeholder={t('parking.cfg.limitShort')} title={t('parking.cfg.limitHint')}
                                            className="w-24 rounded-lg border border-border-base bg-surface px-3 py-2 text-sm text-text-dark"
                                            value={newPlateTimeLimit} onChange={(e) => setNewPlateTimeLimit(e.target.value)} />
                                        {/* Привязка номера к владельцу: его квота мест ограничит въезд остальных машин. */}
                                        <select value={newPlateHolder} onChange={(e) => setNewPlateHolder(e.target.value)}
                                            title={t('parking.holder.assignHint')}
                                            className="rounded-lg border border-border-base bg-surface px-3 py-2 text-sm text-text-dark">
                                            <option value="">{t('parking.holder.none')}</option>
                                            {holders.filter((h) => h.isActive).map((h) => (
                                                <option key={h.id} value={h.id}>{h.name} ({h.spacesLimit})</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                                <Button icon="add" onClick={addPlate}>{t('common.add')}</Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {(['Allow', 'Block'] as const).map((lt) => (
                                    <div key={lt} className="rounded-xl border border-border-base p-3">
                                        <div className={`mb-2 text-xs font-bold uppercase tracking-wider ${lt === 'Allow' ? 'text-success-text' : 'text-error-text'}`}>
                                            {t(lt === 'Allow' ? 'parking.cfg.allowListTitle' : 'parking.cfg.blockListTitle')}
                                        </div>
                                        <div className="space-y-1">
                                            {plates.filter((p) => p.listType === lt).length === 0 && <div className="text-xs text-text-light">{t('common.noData')}</div>}
                                            {plates.filter((p) => p.listType === lt).map((p) => (
                                                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-75 px-3 py-1.5">
                                                    <span className="font-mono text-sm font-bold text-text-dark shrink-0">{p.plate}</span>
                                                    <span className="flex-1 truncate text-right text-[10px] text-text-muted">
                                                        {p.category ? t(`parking.cfg.${lt === 'Allow' ? 'category' : 'reason'}.${p.category}`, { defaultValue: p.category }) : ''}
                                                        {p.validTo ? ` · ${p.validTo}` : ''}
                                                        {p.timeLimitMinutes ? ` · ${p.timeLimitMinutes} ${t('parking.cfg.min')}` : ''}
                                                        {p.holderName ? ` · ${p.holderName}` : ''}
                                                    </span>
                                                    <button type="button" onClick={() => delPlate(p.id)} className="material-symbols-outlined text-base text-text-light hover:text-error-text shrink-0">close</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Владельцы мест — только в режиме «по списку»: именно там работает квота. */}
                    {parkingMode === 'Free' && freeSubMode === 'List' && (
                        <div className="ap-panel space-y-4 rounded-2xl border border-border-base bg-surface p-5">
                            <div>
                                <div className="text-sm font-bold text-text-dark">{t('parking.holder.title')}</div>
                                <div className="mt-0.5 text-xs text-text-muted">{t('parking.holder.hint')}</div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Input value={holderForm.name} onChange={(e) => setHolderForm({ ...holderForm, name: e.target.value })}
                                    placeholder={t('parking.holder.name')} />
                                <Input value={holderForm.phone} onChange={(e) => setHolderForm({ ...holderForm, phone: e.target.value })}
                                    placeholder={t('parking.holder.phone')} />
                                <Input value={holderForm.unit} onChange={(e) => setHolderForm({ ...holderForm, unit: e.target.value })}
                                    placeholder={t('parking.holder.unit')} />
                                <input type="number" min={1} title={t('parking.holder.spacesLimit')}
                                    className="w-24 rounded-lg border border-border-base bg-surface px-3 py-2 text-sm text-text-dark"
                                    value={holderForm.spacesLimit}
                                    onChange={(e) => setHolderForm({ ...holderForm, spacesLimit: e.target.value })} />
                                <Button icon={editingHolderId ? 'save' : 'add'} onClick={saveHolder} disabled={!holderForm.name.trim()}>
                                    {editingHolderId ? t('common.save') : t('common.add')}
                                </Button>
                                {editingHolderId && (
                                    <Button variant="outline" onClick={() => { setHolderForm(emptyHolder); setEditingHolderId(null) }}>
                                        {t('common.cancel')}
                                    </Button>
                                )}
                            </div>

                            {holders.length === 0 ? (
                                <div className="text-xs text-text-light">{t('common.noData')}</div>
                            ) : (
                                <div className="space-y-1.5">
                                    {holders.map((h) => {
                                        const full = h.occupied >= h.spacesLimit
                                        return (
                                            <div key={h.id} className="flex items-center gap-3 rounded-lg bg-slate-75 px-3 py-2">
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-bold text-text-dark">
                                                        {h.name}
                                                        {h.unit ? <span className="ml-1 text-xs font-medium text-text-muted">· {h.unit}</span> : null}
                                                        {!h.isActive && <span className="ml-1 text-xs font-medium text-text-light">({t('common.inactive')})</span>}
                                                    </span>
                                                    <span className="block truncate text-[11px] text-text-muted">
                                                        {h.phone ? `${h.phone} · ` : ''}
                                                        {h.plates.length > 0 ? h.plates.join(', ') : t('parking.holder.noPlates')}
                                                    </span>
                                                </span>
                                                {/* Занято мест из выделенных: полная квота — остальные машины не пустят. */}
                                                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${full ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}
                                                    title={t('parking.holder.occupiedHint')}>
                                                    {h.occupied} / {h.spacesLimit}
                                                </span>
                                                <button type="button" title={t('common.edit')}
                                                    onClick={() => {
                                                        setEditingHolderId(h.id)
                                                        setHolderForm({
                                                            name: h.name, phone: h.phone ?? '', unit: h.unit ?? '',
                                                            spacesLimit: String(h.spacesLimit), isActive: h.isActive, notes: h.notes ?? '',
                                                        })
                                                    }}
                                                    className="material-symbols-outlined shrink-0 text-base text-text-light hover:text-primary">edit</button>
                                                <button type="button" title={t('common.delete')} onClick={() => delHolder(h.id)}
                                                    className="material-symbols-outlined shrink-0 text-base text-text-light hover:text-error-text">close</button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Структура: зоны → этажи → ряды → места */}
                    {loadingZones ? (
                        <Spinner />
                    ) : zones.length === 0 ? (
                        <EmptyState icon="local_parking" text={t('parking.zones.empty')}
                            action={<Button icon="add" variant="outline" onClick={() => setZoneModal({ mode: 'create', data: null })}>{t('parking.zones.new')}</Button>} />
                    ) : (
                        <div className="grid gap-5 lg:grid-cols-[260px_260px_1fr]">
                            {/* Column 1 — Zones */}
                            <Panel title={t('parking.zones.title')} count={zones.length}>
                                {zones.map((z) => (
                                    <ListRow key={z.id} active={z.id === selectedZoneId} onClick={() => setSelectedZoneId(z.id)}
                                        title={z.name} subtitle={`${z.code ? z.code + ' · ' : ''}${t('parking.zones.spaceCount', { count: z.spaceCount })}`}
                                        inactive={!z.isActive}
                                        onEdit={() => setZoneModal({ mode: 'edit', data: z })}
                                        onDelete={() => del(z.name, `/api/parking/zones/${z.id}`)} />
                                ))}
                            </Panel>

                            {/* Column 2 — Floors */}
                            <Panel
                                title={t('parking.floors.title')}
                                count={floors.length}
                                action={selectedZone && (
                                    <IconButton icon="add" title={t('parking.floors.new')} onClick={() => setFloorModal({ mode: 'create', data: null })} />
                                )}
                            >
                                {!selectedZone ? (
                                    <Hint text={t('parking.floors.selectZone')} />
                                ) : floors.length === 0 ? (
                                    <Hint text={t('parking.floors.empty')} />
                                ) : floors.map((f) => (
                                    <ListRow key={f.id} active={f.id === selectedFloorId} onClick={() => setSelectedFloorId(f.id)}
                                        title={`${t('parking.floors.level')} ${f.level}`} subtitle={t('parking.zones.spaceCount', { count: f.spaceCount })}
                                        inactive={!f.isActive}
                                        onEdit={() => setFloorModal({ mode: 'edit', data: f })}
                                        onDelete={() => del(f.name, `/api/parking/floors/${f.id}`)} />
                                ))}
                            </Panel>

                            {/* Column 3 — Rows + spaces */}
                            <Panel
                                title={t('parking.rows.title')}
                                count={rows.length}
                                action={selectedFloor && (
                                    <IconButton icon="add" title={t('parking.rows.new')} onClick={() => setRowModal({ mode: 'create', data: null })} />
                                )}
                            >
                                {!selectedFloor ? (
                                    <Hint text={t('parking.rows.selectFloor')} />
                                ) : rows.length === 0 ? (
                                    <Hint text={t('parking.rows.empty')} />
                                ) : (
                                    <div className="space-y-4">
                                        {rows.map((row) => (
                                            <div key={row.id} className="rounded-2xl border border-border-light bg-surface p-4">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="material-symbols-outlined text-[18px] text-text-light">table_rows</span>
                                                        <span className="truncate text-sm font-black text-text-dark">{row.name}</span>
                                                        <span className="text-[10px] font-bold text-text-light">· {t('parking.zones.spaceCount', { count: spacesByRow[row.id]?.length ?? 0 })}</span>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        {/* Места заводятся только пачкой: по одному добавлять неудобно и незачем. */}
                                                        <IconButton icon="grid_on" title={t('parking.spaces.bulk')} onClick={() => setBulkRowId(row.id)} />
                                                        <IconButton icon="edit" title={t('common.edit')} onClick={() => setRowModal({ mode: 'edit', data: row })} />
                                                        <IconButton icon="delete" title={t('common.delete')} danger onClick={() => del(row.name, `/api/parking/rows/${row.id}`)} />
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {(spacesByRow[row.id] ?? []).map((s) => (
                                                        <button key={s.id} type="button" title={t(`parking.types.${s.type}`)}
                                                            onClick={() => setSpaceModal({ rowId: row.id, data: s })}
                                                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-transform hover:scale-105 ${TYPE_STYLE[s.type].chip} ${s.isActive ? '' : 'opacity-50'}`}>
                                                            <span className="material-symbols-outlined text-[15px]">{TYPE_STYLE[s.type].icon}</span>
                                                            {s.code}
                                                        </button>
                                                    ))}
                                                    {(spacesByRow[row.id]?.length ?? 0) === 0 && (
                                                        <span className="text-xs text-text-light">{t('parking.spaces.empty')}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Panel>
                        </div>
                    )}
                    </div>
                </Modal>
            )}

            {/* ─── Modals ─── */}
            {zoneModal && (
                <ZoneModal modal={zoneModal} token={token} onClose={() => setZoneModal(null)} onSaved={async () => { setZoneModal(null); await refreshAfterChange() }} />
            )}
            {floorModal && selectedZoneId && (
                <FloorModal modal={floorModal} zoneId={selectedZoneId} token={token} onClose={() => setFloorModal(null)} onSaved={async () => { setFloorModal(null); await refreshAfterChange() }} />
            )}
            {rowModal && selectedFloorId && (
                <RowModal modal={rowModal} floorId={selectedFloorId} token={token} onClose={() => setRowModal(null)} onSaved={async () => { setRowModal(null); await refreshAfterChange() }} />
            )}
            {spaceModal && (
                <SpaceModal modal={spaceModal} token={token} onClose={() => setSpaceModal(null)} onSaved={async () => { setSpaceModal(null); await refreshAfterChange() }} />
            )}
            {bulkRowId && (
                <BulkSpaceModal rowId={bulkRowId} token={token} onClose={() => setBulkRowId(null)} onSaved={async () => { setBulkRowId(null); await refreshAfterChange() }} />
            )}

            <Modal isOpen={!!confirm} onClose={() => setConfirm(null)} title={t('parking.deleteTitle')}>
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-text-dark">{t('parking.deletePrefix')} <strong>{confirm?.label}</strong>? {t('parking.deleteCascade')}</p>
                    <div className="flex gap-3">
                        <Button variant="outline" fullWidth onClick={() => setConfirm(null)}>{t('common.cancel')}</Button>
                        <Button variant="danger" fullWidth onClick={async () => { const c = confirm; setConfirm(null); await c?.onConfirm() }}>{t('common.delete')}</Button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    )
}

// ─── Scheme view ────────────────────────────────────────────────────────────────
function SchemeView({ zones, selectedZoneId, onSelectZone, scheme, loading }: {
    zones: Zone[]
    selectedZoneId: string | null
    onSelectZone: (id: string) => void
    scheme: Scheme | null
    loading: boolean
}) {
    const { t } = useTranslation()
    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
                {zones.map((z) => (
                    <button key={z.id} type="button" onClick={() => onSelectZone(z.id)}
                        className={`rounded-xl border px-4 py-2 text-xs font-bold transition-colors ${z.id === selectedZoneId ? 'border-primary bg-primary/10 text-primary' : 'border-border-base text-text-muted hover:bg-slate-75'}`}>
                        {z.name}
                    </button>
                ))}
            </div>

            {loading ? (
                <Spinner />
            ) : !scheme || scheme.floors.length === 0 ? (
                <EmptyState icon="grid_view" text={t('parking.scheme.empty')} />
            ) : (
                <div className="space-y-6">
                    {scheme.floors.map((f) => (
                        <div key={f.id} className="ap-panel rounded-3xl border border-border-base bg-surface p-6 shadow-sm transition-shadow">
                            <div className="mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-text-light">layers</span>
                                <h3 className="text-base font-black text-text-dark">{t('parking.floors.level')} {f.level}</h3>
                            </div>
                            {f.rows.length === 0 ? (
                                <p className="text-xs text-text-light">{t('parking.rows.empty')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {f.rows.map((row) => (
                                        <div key={row.id} className="flex items-start gap-3">
                                            <div className="w-16 shrink-0 pt-2 text-[10px] font-black uppercase tracking-widest text-text-light">{row.name}</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {row.spaces.map((s) => (
                                                    <span key={s.id} title={`${s.code} · ${t(`parking.types.${s.type}`)}`}
                                                        className={`flex h-11 w-12 flex-col items-center justify-center rounded-lg border text-[10px] font-bold ${TYPE_STYLE[s.type].chip} ${s.isActive ? '' : 'opacity-40 line-through'}`}>
                                                        <span className="material-symbols-outlined text-[16px]">{TYPE_STYLE[s.type].icon}</span>
                                                        <span className="truncate max-w-[44px]">{s.code}</span>
                                                    </span>
                                                ))}
                                                {row.spaces.length === 0 && <span className="py-2 text-xs text-text-light">{t('parking.spaces.empty')}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Entity modals ────────────────────────────────────────────────────────────
function ZoneModal({ modal, token, onClose, onSaved }: {
    modal: { mode: 'create' | 'edit'; data: Zone | null }; token: string | null; onClose: () => void; onSaved: () => void
}) {
    const { t } = useTranslation()
    const d = modal.data
    // Код и описание зоны не спрашиваем: на практике хватает названия.
    const [form, setForm] = useState({ name: d?.name ?? '', isActive: d?.isActive ?? true, sortOrder: d?.sortOrder ?? 0 })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const save = async () => {
        if (!token || !form.name.trim()) return
        setSaving(true); setError(null)
        try {
            const body = JSON.stringify({ name: form.name.trim(), code: d?.code ?? null, description: d?.description ?? null, isActive: form.isActive, sortOrder: form.sortOrder })
            if (modal.mode === 'create') await apiRequest('/api/parking/zones', { method: 'POST', token, body })
            else if (d) await apiRequest(`/api/parking/zones/${d.id}`, { method: 'PUT', token, body })
            onSaved()
        } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
        finally { setSaving(false) }
    }

    return (
        <Modal isOpen onClose={onClose} title={modal.mode === 'create' ? t('parking.zones.new') : t('parking.zones.edit')}>
            <div className="space-y-4 pt-2">
                <Field label={t('parking.zones.fields.name')}><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></Field>
                <Check label={t('parking.zones.fields.active')} checked={form.isActive} onChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
                {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                <ModalActions saving={saving} disabled={!form.name.trim()} mode={modal.mode} onCancel={onClose} onSave={save} />
            </div>
        </Modal>
    )
}

function FloorModal({ modal, zoneId, token, onClose, onSaved }: {
    modal: { mode: 'create' | 'edit'; data: Floor | null }; zoneId: string; token: string | null; onClose: () => void; onSaved: () => void
}) {
    const { t } = useTranslation()
    const d = modal.data
    // Этаж определяется уровнем; название сервер проставит сам (номер уровня).
    const [form, setForm] = useState({ level: d?.level ?? 0, isActive: d?.isActive ?? true, sortOrder: d?.sortOrder ?? 0 })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const save = async () => {
        if (!token) return
        setSaving(true); setError(null)
        try {
            const body = JSON.stringify({ name: null, level: form.level, isActive: form.isActive, sortOrder: form.sortOrder })
            if (modal.mode === 'create') await apiRequest(`/api/parking/zones/${zoneId}/floors`, { method: 'POST', token, body })
            else if (d) await apiRequest(`/api/parking/floors/${d.id}`, { method: 'PUT', token, body })
            onSaved()
        } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
        finally { setSaving(false) }
    }

    return (
        <Modal isOpen onClose={onClose} title={modal.mode === 'create' ? t('parking.floors.new') : t('parking.floors.edit')}>
            <div className="space-y-4 pt-2">
                <Field label={t('parking.floors.fields.level')}><Input type="number" value={String(form.level)} onChange={(e) => setForm((p) => ({ ...p, level: parseInt(e.target.value, 10) || 0 }))} /></Field>
                <Check label={t('parking.floors.fields.active')} checked={form.isActive} onChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
                {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                <ModalActions saving={saving} disabled={false} mode={modal.mode} onCancel={onClose} onSave={save} />
            </div>
        </Modal>
    )
}

function RowModal({ modal, floorId, token, onClose, onSaved }: {
    modal: { mode: 'create' | 'edit'; data: Row | null }; floorId: string; token: string | null; onClose: () => void; onSaved: () => void
}) {
    const { t } = useTranslation()
    const d = modal.data
    const [form, setForm] = useState({ name: d?.name ?? '', sortOrder: d?.sortOrder ?? 0 })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const save = async () => {
        if (!token || !form.name.trim()) return
        setSaving(true); setError(null)
        try {
            const body = JSON.stringify({ name: form.name.trim(), sortOrder: form.sortOrder })
            if (modal.mode === 'create') await apiRequest(`/api/parking/floors/${floorId}/rows`, { method: 'POST', token, body })
            else if (d) await apiRequest(`/api/parking/rows/${d.id}`, { method: 'PUT', token, body })
            onSaved()
        } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
        finally { setSaving(false) }
    }

    return (
        <Modal isOpen onClose={onClose} title={modal.mode === 'create' ? t('parking.rows.new') : t('parking.rows.edit')}>
            <div className="space-y-4 pt-2">
                <Field label={t('parking.rows.fields.name')}><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></Field>                {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                <ModalActions saving={saving} disabled={!form.name.trim()} mode={modal.mode} onCancel={onClose} onSave={save} />
            </div>
        </Modal>
    )
}

// Места создаются только массово, поэтому окно осталось лишь для правки существующего.
function SpaceModal({ modal, token, onClose, onSaved }: {
    modal: { rowId: string; data: Space | null }; token: string | null; onClose: () => void; onSaved: () => void
}) {
    const { t } = useTranslation()
    const d = modal.data
    const [form, setForm] = useState({ code: d?.code ?? '', type: d?.type ?? 'Regular' as SpaceType, isActive: d?.isActive ?? true, sortOrder: d?.sortOrder ?? 0, notes: d?.notes ?? '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const save = async () => {
        if (!token || !form.code.trim()) return
        setSaving(true); setError(null)
        try {
            const body = JSON.stringify({ code: form.code.trim(), type: form.type, isActive: form.isActive, sortOrder: form.sortOrder, notes: form.notes.trim() || null })
            if (d) await apiRequest(`/api/parking/spaces/${d.id}`, { method: 'PUT', token, body })
            onSaved()
        } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
        finally { setSaving(false) }
    }

    return (
        <Modal isOpen onClose={onClose} title={t('parking.spaces.edit')}>
            <div className="space-y-4 pt-2">
                <Field label={t('parking.spaces.fields.code')}><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} maxLength={60} /></Field>
                <Field label={t('parking.spaces.fields.type')}>
                    <div className="grid grid-cols-1 gap-1.5">
                        {SPACE_TYPES.map((tp) => (
                            <button key={tp} type="button" onClick={() => setForm((p) => ({ ...p, type: tp }))}
                                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${form.type === tp ? 'border-primary bg-primary/10 text-primary' : 'border-border-base text-text-muted hover:bg-slate-75'}`}>
                                <span className={`flex h-6 w-6 items-center justify-center rounded-md border ${TYPE_STYLE[tp].chip}`}>
                                    <span className="material-symbols-outlined text-[16px]">{TYPE_STYLE[tp].icon}</span>
                                </span>
                                {t(`parking.types.${tp}`)}
                            </button>
                        ))}
                    </div>
                </Field>
                <Field label={t('parking.spaces.fields.notes')}><Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></Field>
                <Check label={t('parking.spaces.fields.active')} checked={form.isActive} onChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
                {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                <ModalActions saving={saving} disabled={!form.code.trim()} mode="edit" onCancel={onClose} onSave={save} />
            </div>
        </Modal>
    )
}

function BulkSpaceModal({ rowId, token, onClose, onSaved }: { rowId: string; token: string | null; onClose: () => void; onSaved: () => void }) {
    const { t } = useTranslation()
    const [form, setForm] = useState({ prefix: '', startNumber: 1, count: 10, pad: 2, type: 'Regular' as SpaceType })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const preview = Array.from({ length: Math.min(form.count, 3) }, (_, i) => form.prefix + String(form.startNumber + i).padStart(form.pad, '0')).join(', ')

    const save = async () => {
        if (!token) return
        setSaving(true); setError(null)
        try {
            await apiRequest(`/api/parking/rows/${rowId}/spaces/bulk`, {
                method: 'POST', token,
                body: JSON.stringify({ prefix: form.prefix.trim() || null, startNumber: form.startNumber, count: form.count, pad: form.pad, type: form.type }),
            })
            onSaved()
        } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
        finally { setSaving(false) }
    }

    return (
        <Modal isOpen onClose={onClose} title={t('parking.spaces.bulkTitle')}>
            <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                    <Field label={t('parking.spaces.bulkFields.prefix')}><Input value={form.prefix} onChange={(e) => setForm((p) => ({ ...p, prefix: e.target.value }))} placeholder="A-" /></Field>
                    <Field label={t('parking.spaces.bulkFields.count')}><Input type="number" min={1} max={500} value={String(form.count)} onChange={(e) => setForm((p) => ({ ...p, count: parseInt(e.target.value, 10) || 1 }))} /></Field>
                    <Field label={t('parking.spaces.bulkFields.startNumber')}><Input type="number" min={0} value={String(form.startNumber)} onChange={(e) => setForm((p) => ({ ...p, startNumber: parseInt(e.target.value, 10) || 0 }))} /></Field>
                    <Field label={t('parking.spaces.bulkFields.pad')}><Input type="number" min={1} max={6} value={String(form.pad)} onChange={(e) => setForm((p) => ({ ...p, pad: parseInt(e.target.value, 10) || 1 }))} /></Field>
                </div>
                <Field label={t('parking.spaces.fields.type')}>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {SPACE_TYPES.map((tp) => (
                            <button key={tp} type="button" onClick={() => setForm((p) => ({ ...p, type: tp }))}
                                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-bold transition-colors ${form.type === tp ? 'border-primary bg-primary/10 text-primary' : 'border-border-base text-text-muted hover:bg-slate-75'}`}>
                                <span className="material-symbols-outlined text-[15px]">{TYPE_STYLE[tp].icon}</span>
                                {t(`parking.types.${tp}`)}
                            </button>
                        ))}
                    </div>
                </Field>
                <p className="rounded-lg bg-slate-75 px-3 py-2 text-xs text-text-muted">{t('parking.spaces.bulkPreview')}: <span className="font-mono font-bold text-text-dark">{preview}{form.count > 3 ? ' …' : ''}</span></p>
                {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                <div className="flex gap-3 pt-1">
                    <Button variant="outline" fullWidth onClick={onClose}>{t('common.cancel')}</Button>
                    <Button fullWidth isLoading={saving} onClick={save}>{t('parking.spaces.bulkCreate')}</Button>
                </div>
            </div>
        </Modal>
    )
}

// ─── Small presentational helpers ───────────────────────────────────────────────
function Panel({ title, count, action, children }: { title: string; count: number; action?: ReactNode; children: ReactNode }) {
    return (
        <div className="ap-panel rounded-3xl border border-border-base bg-surface p-4 shadow-sm transition-shadow">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-light">{title} · {count}</p>
                {action}
            </div>
            <div className="space-y-1.5">{children}</div>
        </div>
    )
}

function ListRow({ active, onClick, title, subtitle, inactive, onEdit, onDelete }: {
    active: boolean; onClick: () => void; title: string; subtitle: string; inactive?: boolean; onEdit: () => void; onDelete: () => void
}) {
    return (
        <div className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ${active ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-slate-75'}`}>
            <button type="button" onClick={onClick} className="min-w-0 flex-1 text-left">
                <span className={`block truncate text-sm font-bold ${inactive ? 'text-text-light line-through' : 'text-text-dark'}`}>{title}</span>
                <span className="block truncate text-[11px] text-text-light">{subtitle}</span>
            </button>
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <IconButton icon="edit" onClick={onEdit} />
                <IconButton icon="delete" danger onClick={onDelete} />
            </div>
        </div>
    )
}

function IconButton({ icon, title, onClick, danger }: { icon: string; title?: string; onClick: () => void; danger?: boolean }) {
    return (
        <button type="button" title={title} onClick={onClick}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 ${danger ? 'text-error-text' : 'text-text-light hover:text-primary'}`}>
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </button>
    )
}

function ModalActions({ saving, disabled, mode, onCancel, onSave }: { saving: boolean; disabled: boolean; mode: 'create' | 'edit'; onCancel: () => void; onSave: () => void }) {
    const { t } = useTranslation()
    return (
        <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={onCancel}>{t('common.cancel')}</Button>
            <Button fullWidth isLoading={saving} disabled={disabled} onClick={onSave}>{mode === 'create' ? t('common.create') : t('common.save')}</Button>
        </div>
    )
}

function TypeLegend() {
    const { t } = useTranslation()
    return (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border-light bg-surface px-4 py-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-light">{t('parking.legend')}</span>
            {SPACE_TYPES.map((tp) => (
                <span key={tp} className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted">
                    <span className={`h-3 w-3 rounded-full ${TYPE_STYLE[tp].dot}`} />
                    {t(`parking.types.${tp}`)}
                </span>
            ))}
        </div>
    )
}

function Spinner() {
    return (
        <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
        </div>
    )
}

function EmptyState({ icon, text, action }: { icon: string; text: string; action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border-base bg-surface py-20 text-center text-text-light">
            <span className="material-symbols-outlined text-5xl">{icon}</span>
            <p className="text-sm font-medium">{text}</p>
            {action}
        </div>
    )
}

function Hint({ text }: { text: string }) {
    return <p className="px-1 py-6 text-center text-xs text-text-light">{text}</p>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-light">{label}</label>
            {children}
        </div>
    )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary/30" />
            <span className="text-sm font-bold text-text-dark">{label}</span>
        </label>
    )
}
