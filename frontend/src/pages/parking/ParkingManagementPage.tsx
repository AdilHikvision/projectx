import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../../components/templates'
import { Button, Input } from '../../components/atoms'
import { PageHeader, Modal } from '../../components/organisms'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'

// ─── Domain types (mirror backend DTOs) ─────────────────────────────────────────
type SpaceType = 'Regular' | 'Vip' | 'Disabled' | 'Electric' | 'Motorcycle'

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

const SPACE_TYPES: SpaceType[] = ['Regular', 'Vip', 'Disabled', 'Electric', 'Motorcycle']

const TYPE_STYLE: Record<SpaceType, { icon: string; chip: string; dot: string }> = {
    Regular: { icon: 'local_parking', chip: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
    Vip: { icon: 'star', chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    Disabled: { icon: 'accessible', chip: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400' },
    Electric: { icon: 'ev_station', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
    Motorcycle: { icon: 'two_wheeler', chip: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-400' },
}

export function ParkingManagementPage() {
    const { t } = useTranslation()
    const { token } = useAuth()

    const [view, setView] = useState<'manage' | 'scheme'>('manage')
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
    useEffect(() => {
        if (!selectedZoneId) { setFloors([]); setSelectedFloorId(null); return }
        void loadFloors(selectedZoneId)
    }, [selectedZoneId, token])
    useEffect(() => {
        if (!selectedFloorId) { setRows([]); setSpacesByRow({}); return }
        void loadRows(selectedFloorId)
    }, [selectedFloorId, token])
    useEffect(() => {
        if (view === 'scheme' && selectedZoneId) void loadScheme(selectedZoneId)
    }, [view, selectedZoneId, token])

    // ─── Modal state ───
    const [zoneModal, setZoneModal] = useState<{ mode: 'create' | 'edit'; data: Zone | null } | null>(null)
    const [floorModal, setFloorModal] = useState<{ mode: 'create' | 'edit'; data: Floor | null } | null>(null)
    const [rowModal, setRowModal] = useState<{ mode: 'create' | 'edit'; data: Row | null } | null>(null)
    const [spaceModal, setSpaceModal] = useState<{ mode: 'create' | 'edit'; rowId: string; data: Space | null } | null>(null)
    const [bulkRowId, setBulkRowId] = useState<string | null>(null)
    const [confirm, setConfirm] = useState<{ label: string; onConfirm: () => Promise<void> } | null>(null)

    const refreshAfterChange = async () => {
        await loadZones()
        if (selectedZoneId) await loadFloors(selectedZoneId)
        if (selectedFloorId) await loadRows(selectedFloorId)
        if (view === 'scheme' && selectedZoneId) await loadScheme(selectedZoneId)
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
            <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
                <div className="p-6 md:p-10 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <PageHeader
                            className="p-0 border-none shadow-none bg-transparent"
                            title={t('parking.nav.management')}
                            description={t('parking.subtitle')}
                        />
                        {view === 'manage' && (
                            <Button icon="add" onClick={() => setZoneModal({ mode: 'create', data: null })}>
                                {t('parking.zones.new')}
                            </Button>
                        )}
                    </div>

                    {/* View tabs */}
                    <div className="flex gap-1 border-b border-border-base">
                        {(['manage', 'scheme'] as const).map((tab) => (
                            <button key={tab} type="button" onClick={() => setView(tab)}
                                className={`-mb-px border-b-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${view === tab ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-muted'}`}>
                                {t(`parking.tabs.${tab}`)}
                            </button>
                        ))}
                    </div>

                    {loadingZones ? (
                        <Spinner />
                    ) : zones.length === 0 ? (
                        <EmptyState icon="local_parking" text={t('parking.zones.empty')}
                            action={<Button icon="add" variant="outline" onClick={() => setZoneModal({ mode: 'create', data: null })}>{t('parking.zones.new')}</Button>} />
                    ) : view === 'scheme' ? (
                        <SchemeView
                            zones={zones}
                            selectedZoneId={selectedZoneId}
                            onSelectZone={setSelectedZoneId}
                            scheme={scheme}
                            loading={loadingScheme}
                        />
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
                                        title={f.name} subtitle={`${t('parking.floors.level')} ${f.level} · ${t('parking.zones.spaceCount', { count: f.spaceCount })}`}
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
                                                        <IconButton icon="add" title={t('parking.spaces.new')} onClick={() => setSpaceModal({ mode: 'create', rowId: row.id, data: null })} />
                                                        <IconButton icon="grid_on" title={t('parking.spaces.bulk')} onClick={() => setBulkRowId(row.id)} />
                                                        <IconButton icon="edit" title={t('common.edit')} onClick={() => setRowModal({ mode: 'edit', data: row })} />
                                                        <IconButton icon="delete" title={t('common.delete')} danger onClick={() => del(row.name, `/api/parking/rows/${row.id}`)} />
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {(spacesByRow[row.id] ?? []).map((s) => (
                                                        <button key={s.id} type="button" title={t(`parking.types.${s.type}`)}
                                                            onClick={() => setSpaceModal({ mode: 'edit', rowId: row.id, data: s })}
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

                    <TypeLegend />
                </div>
            </div>

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
                        <div key={f.id} className="rounded-3xl border border-border-base bg-surface p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-text-light">layers</span>
                                <h3 className="text-base font-black text-text-dark">{f.name}</h3>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-text-light">{t('parking.floors.level')} {f.level}</span>
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
    const [form, setForm] = useState({ name: d?.name ?? '', code: d?.code ?? '', description: d?.description ?? '', isActive: d?.isActive ?? true, sortOrder: d?.sortOrder ?? 0 })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const save = async () => {
        if (!token || !form.name.trim()) return
        setSaving(true); setError(null)
        try {
            const body = JSON.stringify({ name: form.name.trim(), code: form.code.trim() || null, description: form.description.trim() || null, isActive: form.isActive, sortOrder: form.sortOrder })
            if (modal.mode === 'create') await apiRequest('/api/parking/zones', { method: 'POST', token, body })
            else if (d) await apiRequest(`/api/parking/zones/${d.id}`, { method: 'PUT', token, body })
            onSaved()
        } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
        finally { setSaving(false) }
    }

    return (
        <Modal isOpen onClose={onClose} title={modal.mode === 'create' ? t('parking.zones.new') : t('parking.zones.edit')}>
            <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><Field label={t('parking.zones.fields.name')}><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></Field></div>
                    <Field label={t('parking.zones.fields.code')}><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} maxLength={32} /></Field>
                </div>
                <Field label={t('parking.zones.fields.description')}><Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></Field>
                <Field label={t('parking.sortOrder')}><Input type="number" value={String(form.sortOrder)} onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) || 0 }))} /></Field>
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
    const [form, setForm] = useState({ name: d?.name ?? '', level: d?.level ?? 0, isActive: d?.isActive ?? true, sortOrder: d?.sortOrder ?? 0 })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const save = async () => {
        if (!token || !form.name.trim()) return
        setSaving(true); setError(null)
        try {
            const body = JSON.stringify({ name: form.name.trim(), level: form.level, isActive: form.isActive, sortOrder: form.sortOrder })
            if (modal.mode === 'create') await apiRequest(`/api/parking/zones/${zoneId}/floors`, { method: 'POST', token, body })
            else if (d) await apiRequest(`/api/parking/floors/${d.id}`, { method: 'PUT', token, body })
            onSaved()
        } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
        finally { setSaving(false) }
    }

    return (
        <Modal isOpen onClose={onClose} title={modal.mode === 'create' ? t('parking.floors.new') : t('parking.floors.edit')}>
            <div className="space-y-4 pt-2">
                <Field label={t('parking.floors.fields.name')}><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label={t('parking.floors.fields.level')}><Input type="number" value={String(form.level)} onChange={(e) => setForm((p) => ({ ...p, level: parseInt(e.target.value, 10) || 0 }))} /></Field>
                    <Field label={t('parking.sortOrder')}><Input type="number" value={String(form.sortOrder)} onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) || 0 }))} /></Field>
                </div>
                <Check label={t('parking.floors.fields.active')} checked={form.isActive} onChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
                {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                <ModalActions saving={saving} disabled={!form.name.trim()} mode={modal.mode} onCancel={onClose} onSave={save} />
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
                <Field label={t('parking.rows.fields.name')}><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></Field>
                <Field label={t('parking.sortOrder')}><Input type="number" value={String(form.sortOrder)} onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) || 0 }))} /></Field>
                {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                <ModalActions saving={saving} disabled={!form.name.trim()} mode={modal.mode} onCancel={onClose} onSave={save} />
            </div>
        </Modal>
    )
}

function SpaceModal({ modal, token, onClose, onSaved }: {
    modal: { mode: 'create' | 'edit'; rowId: string; data: Space | null }; token: string | null; onClose: () => void; onSaved: () => void
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
            if (modal.mode === 'create') await apiRequest(`/api/parking/rows/${modal.rowId}/spaces`, { method: 'POST', token, body })
            else if (d) await apiRequest(`/api/parking/spaces/${d.id}`, { method: 'PUT', token, body })
            onSaved()
        } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
        finally { setSaving(false) }
    }

    return (
        <Modal isOpen onClose={onClose} title={modal.mode === 'create' ? t('parking.spaces.new') : t('parking.spaces.edit')}>
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
                <ModalActions saving={saving} disabled={!form.code.trim()} mode={modal.mode} onCancel={onClose} onSave={save} />
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
        <div className="rounded-3xl border border-border-base bg-surface p-4 shadow-sm">
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
