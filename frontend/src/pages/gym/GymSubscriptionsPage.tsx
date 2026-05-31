import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../../components/templates'
import { Button, Input } from '../../components/atoms'
import { PageHeader, Modal } from '../../components/organisms'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'

type TariffKind = 'Membership' | 'GiftCertificate'
type DurationType = 'Day' | 'Week' | 'Month' | 'Year'

interface Tariff {
    id: string
    name: string
    description: string | null
    kind: TariffKind
    price: number
    currency: string
    durationType: DurationType
    visitLimit: number | null
    hasTimeRestriction: boolean
    accessFrom: string | null
    accessTo: string | null
    daysOfWeekMask: number
    autoRenew: boolean
    freezeAllowed: boolean
    freezeMaxDays: number
    transferAllowed: boolean
    isActive: boolean
    sortOrder: number
}

const DURATIONS: DurationType[] = ['Day', 'Week', 'Month', 'Year']
const KINDS: TariffKind[] = ['Membership', 'GiftCertificate']
// bit index per weekday (bit 0 = Sunday … bit 6 = Saturday), rendered Mon→Sun
const DAY_DEFS: { key: string; bit: number }[] = [
    { key: 'mon', bit: 1 }, { key: 'tue', bit: 2 }, { key: 'wed', bit: 3 },
    { key: 'thu', bit: 4 }, { key: 'fri', bit: 5 }, { key: 'sat', bit: 6 }, { key: 'sun', bit: 0 },
]
const ALL_DAYS = 127

const hasDay = (mask: number, bit: number) => (mask & (1 << bit)) !== 0

interface FormState {
    name: string
    description: string
    kind: TariffKind
    price: string
    currency: string
    durationType: DurationType
    limitVisits: boolean
    visitLimit: string
    hasTimeRestriction: boolean
    accessFrom: string
    accessTo: string
    daysOfWeekMask: number
    autoRenew: boolean
    freezeAllowed: boolean
    freezeMaxDays: string
    transferAllowed: boolean
    isActive: boolean
}

const emptyForm: FormState = {
    name: '', description: '', kind: 'Membership', price: '', currency: 'AZN',
    durationType: 'Month', limitVisits: false, visitLimit: '10',
    hasTimeRestriction: false, accessFrom: '06:00', accessTo: '12:00', daysOfWeekMask: ALL_DAYS,
    autoRenew: false, freezeAllowed: false, freezeMaxDays: '30', transferAllowed: false, isActive: true,
}

export function GymSubscriptionsPage() {
    const { t } = useTranslation()
    const { token } = useAuth()
    const [view, setView] = useState<'tariffs' | 'gifts'>('tariffs')
    const [tariffs, setTariffs] = useState<Tariff[]>([])
    const [loading, setLoading] = useState(false)
    const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
    const [editing, setEditing] = useState<Tariff | null>(null)
    const [form, setForm] = useState<FormState>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const load = async () => {
        if (!token) return
        setLoading(true)
        try { setTariffs(await apiRequest<Tariff[]>('/api/gym/tariffs', { token })) }
        finally { setLoading(false) }
    }
    useEffect(() => { void load() }, [token])

    const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }))
    const toggleDay = (bit: number) => setForm((p) => ({ ...p, daysOfWeekMask: p.daysOfWeekMask ^ (1 << bit) }))

    const openCreate = () => { setEditing(null); setForm(emptyForm); setError(null); setModal('create') }
    const openEdit = (x: Tariff) => {
        setEditing(x)
        setForm({
            name: x.name, description: x.description ?? '', kind: x.kind,
            price: String(x.price), currency: x.currency,
            durationType: x.durationType,
            limitVisits: x.visitLimit != null, visitLimit: String(x.visitLimit ?? 10),
            hasTimeRestriction: x.hasTimeRestriction,
            accessFrom: x.accessFrom ?? '06:00', accessTo: x.accessTo ?? '12:00',
            daysOfWeekMask: x.daysOfWeekMask,
            autoRenew: x.autoRenew, freezeAllowed: x.freezeAllowed, freezeMaxDays: String(x.freezeMaxDays),
            transferAllowed: x.transferAllowed, isActive: x.isActive,
        })
        setError(null); setModal('edit')
    }

    const save = async () => {
        if (!token || !form.name.trim()) return
        setSaving(true); setError(null)
        try {
            const body = JSON.stringify({
                name: form.name.trim(),
                description: form.description.trim() || null,
                kind: form.kind,
                price: parseFloat(form.price) || 0,
                currency: form.currency.trim() || 'AZN',
                durationType: form.durationType,
                visitLimit: form.limitVisits ? (parseInt(form.visitLimit, 10) || 1) : null,
                hasTimeRestriction: form.hasTimeRestriction,
                accessFrom: form.hasTimeRestriction ? form.accessFrom : null,
                accessTo: form.hasTimeRestriction ? form.accessTo : null,
                daysOfWeekMask: form.daysOfWeekMask,
                autoRenew: form.autoRenew,
                freezeAllowed: form.freezeAllowed,
                freezeMaxDays: form.freezeAllowed ? (parseInt(form.freezeMaxDays, 10) || 0) : 0,
                transferAllowed: form.transferAllowed,
                isActive: form.isActive,
                sortOrder: editing?.sortOrder ?? 0,
            })
            if (modal === 'create') await apiRequest('/api/gym/tariffs', { method: 'POST', token, body })
            else if (editing) await apiRequest(`/api/gym/tariffs/${editing.id}`, { method: 'PUT', token, body })
            setModal(null); setEditing(null)
            await load()
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Save failed')
        } finally { setSaving(false) }
    }

    const remove = async () => {
        if (!token || !editing) return
        setSaving(true)
        try {
            await apiRequest(`/api/gym/tariffs/${editing.id}`, { method: 'DELETE', token })
            setModal(null); setEditing(null)
            await load()
        } finally { setSaving(false) }
    }

    const durationLabel = (x: Tariff) => t(`gym.tariffs.durations.${x.durationType}`)
    const visitLabel = (x: Tariff) => x.visitLimit == null
        ? t('gym.tariffs.visitsUnlimited')
        : t('gym.tariffs.visits', { count: x.visitLimit })
    const daysLabel = (mask: number) => mask === ALL_DAYS || mask === 0
        ? t('gym.tariffs.allDays')
        : DAY_DEFS.filter((d) => hasDay(mask, d.bit)).map((d) => t(`gym.tariffs.days.${d.key}`)).join(', ')

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
                <div className="p-6 md:p-10 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <PageHeader
                            className="p-0 border-none shadow-none bg-transparent"
                            title={t('gym.nav.subscriptions')}
                            description={t('gym.tariffs.subtitle')}
                        />
                        {view === 'tariffs'
                            ? <Button icon="add" onClick={openCreate}>{t('gym.tariffs.new')}</Button>
                            : <span />}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 border-b border-border-base">
                        {(['tariffs', 'gifts'] as const).map((tab) => (
                            <button key={tab} type="button" onClick={() => setView(tab)}
                                className={`-mb-px border-b-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${view === tab ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-muted'}`}>
                                {t(`gym.tabs.${tab}`)}
                            </button>
                        ))}
                    </div>

                    {view === 'gifts' && <GiftCertificatesSection token={token} />}

                    {view === 'tariffs' && (loading ? (
                        <div className="flex items-center justify-center py-20">
                            <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                        </div>
                    ) : tariffs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border-base bg-surface py-20 text-center text-text-light">
                            <span className="material-symbols-outlined text-5xl">card_membership</span>
                            <p className="text-sm font-medium">{t('gym.tariffs.empty')}</p>
                            <Button icon="add" variant="outline" onClick={openCreate}>{t('gym.tariffs.new')}</Button>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs font-black uppercase tracking-widest text-text-light">{t('gym.tariffs.count', { count: tariffs.length })}</p>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {tariffs.map((x) => (
                                    <div key={x.id} className={`relative flex flex-col rounded-3xl border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md ${x.isActive ? 'border-border-base' : 'border-border-base opacity-70'}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${x.kind === 'GiftCertificate' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                        {t(`gym.tariffs.kinds.${x.kind}`)}
                                                    </span>
                                                    {!x.isActive && (
                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-text-light">
                                                            {t('gym.tariffs.inactive')}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="mt-2 truncate text-lg font-black tracking-tight text-text-dark">{x.name}</h3>
                                                {x.description && <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{x.description}</p>}
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-2xl font-black leading-none text-text-dark">{x.price}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-light">{x.currency}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-text-base">
                                                <span className="material-symbols-outlined text-[18px] text-text-light">event</span>
                                                {durationLabel(x)}
                                            </div>
                                            <div className="flex items-center gap-2 text-text-base">
                                                <span className="material-symbols-outlined text-[18px] text-text-light">confirmation_number</span>
                                                {visitLabel(x)}
                                            </div>
                                            {x.hasTimeRestriction && (
                                                <div className="flex items-center gap-2 text-text-base">
                                                    <span className="material-symbols-outlined text-[18px] text-text-light">schedule</span>
                                                    {x.accessFrom}–{x.accessTo} · {daysLabel(x.daysOfWeekMask)}
                                                </div>
                                            )}
                                        </div>

                                        {(x.autoRenew || x.freezeAllowed || x.transferAllowed) && (
                                            <div className="mt-4 flex flex-wrap gap-1.5">
                                                {x.autoRenew && <PolicyChip icon="autorenew" label={t('gym.tariffs.fields.autoRenew')} />}
                                                {x.freezeAllowed && <PolicyChip icon="ac_unit" label={`${t('gym.tariffs.fields.freeze')} · ${x.freezeMaxDays}d`} />}
                                                {x.transferAllowed && <PolicyChip icon="swap_horiz" label={t('gym.tariffs.fields.transfer')} />}
                                            </div>
                                        )}

                                        <div className="mt-5 flex gap-3 border-t border-border-light pt-4">
                                            <button onClick={() => openEdit(x)} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">{t('common.edit')}</button>
                                            <button onClick={() => { setEditing(x); setModal('delete') }} className="text-[10px] font-black uppercase tracking-widest text-error-text hover:underline">{t('common.delete')}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ))}
                </div>
            </div>

            {/* ─── Create / Edit modal ─── */}
            <Modal isOpen={modal === 'create' || modal === 'edit'} onClose={() => { setModal(null); setEditing(null) }} title={modal === 'create' ? t('gym.tariffs.new') : t('gym.tariffs.edit')}>
                <div className="space-y-4 pt-2">
                    {/* Kind */}
                    <div className="grid grid-cols-2 gap-2">
                        {KINDS.map((k) => (
                            <button key={k} type="button" onClick={() => set('kind', k)}
                                className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${form.kind === k ? 'border-primary bg-primary/10 text-primary' : 'border-border-base text-text-muted hover:bg-slate-75'}`}>
                                {t(`gym.tariffs.kinds.${k}`)}
                            </button>
                        ))}
                    </div>

                    <Field label={t('gym.tariffs.fields.name')}>
                        <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
                    </Field>
                    <Field label={t('gym.tariffs.fields.description')}>
                        <Input value={form.description} onChange={(e) => set('description', e.target.value)} />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('gym.tariffs.fields.price')}>
                            <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} />
                        </Field>
                        <Field label={t('gym.tariffs.fields.currency')}>
                            <Input value={form.currency} onChange={(e) => set('currency', e.target.value)} maxLength={8} />
                        </Field>
                    </div>

                    {/* Duration */}
                    <Field label={t('gym.tariffs.fields.duration')}>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {DURATIONS.map((d) => (
                                <button key={d} type="button" onClick={() => set('durationType', d)}
                                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${form.durationType === d ? 'border-primary bg-primary/10 text-primary' : 'border-border-base text-text-muted hover:bg-slate-75'}`}>
                                    {t(`gym.tariffs.durations.${d}`)}
                                </button>
                            ))}
                        </div>
                    </Field>

                    {/* Visit limit */}
                    <div className="rounded-xl border border-border-light p-3 space-y-3">
                        <Check label={t('gym.tariffs.fields.limitVisits')} checked={form.limitVisits} onChange={(v) => set('limitVisits', v)} />
                        {form.limitVisits && (
                            <Field label={t('gym.tariffs.fields.visitLimit')}>
                                <Input type="number" min={1} value={form.visitLimit} onChange={(e) => set('visitLimit', e.target.value)} />
                            </Field>
                        )}
                    </div>

                    {/* Time restriction */}
                    <div className="rounded-xl border border-border-light p-3 space-y-3">
                        <Check label={t('gym.tariffs.fields.timeRestriction')} checked={form.hasTimeRestriction} onChange={(v) => set('hasTimeRestriction', v)} />
                        {form.hasTimeRestriction && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label={t('gym.tariffs.fields.accessFrom')}>
                                        <Input type="time" value={form.accessFrom} onChange={(e) => set('accessFrom', e.target.value)} />
                                    </Field>
                                    <Field label={t('gym.tariffs.fields.accessTo')}>
                                        <Input type="time" value={form.accessTo} onChange={(e) => set('accessTo', e.target.value)} />
                                    </Field>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-text-light">{t('gym.tariffs.fields.days')}</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {DAY_DEFS.map((d) => (
                                            <button key={d.key} type="button" onClick={() => toggleDay(d.bit)}
                                                className={`h-8 w-10 rounded-lg text-[11px] font-bold transition-colors ${hasDay(form.daysOfWeekMask, d.bit) ? 'bg-primary text-white' : 'bg-slate-75 text-text-muted hover:bg-slate-100'}`}>
                                                {t(`gym.tariffs.days.${d.key}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Policies */}
                    <div className="rounded-xl border border-border-light p-3 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-light">{t('gym.tariffs.policies')}</p>
                        <Check label={t('gym.tariffs.fields.autoRenew')} checked={form.autoRenew} onChange={(v) => set('autoRenew', v)} />
                        <Check label={t('gym.tariffs.fields.freeze')} checked={form.freezeAllowed} onChange={(v) => set('freezeAllowed', v)} />
                        {form.freezeAllowed && (
                            <Field label={t('gym.tariffs.fields.freezeMaxDays')}>
                                <Input type="number" min={0} value={form.freezeMaxDays} onChange={(e) => set('freezeMaxDays', e.target.value)} />
                            </Field>
                        )}
                        <Check label={t('gym.tariffs.fields.transfer')} checked={form.transferAllowed} onChange={(v) => set('transferAllowed', v)} />
                    </div>

                    <Check label={t('gym.tariffs.fields.active')} checked={form.isActive} onChange={(v) => set('isActive', v)} />

                    {error && <p className="text-xs font-medium text-error-text">{error}</p>}

                    <div className="flex gap-3 pt-1">
                        <Button variant="outline" fullWidth onClick={() => { setModal(null); setEditing(null) }}>{t('common.cancel')}</Button>
                        <Button fullWidth isLoading={saving} onClick={save} disabled={!form.name.trim()}>{modal === 'create' ? t('common.create') : t('common.save')}</Button>
                    </div>
                </div>
            </Modal>

            {/* ─── Delete modal ─── */}
            <Modal isOpen={modal === 'delete'} onClose={() => { setModal(null); setEditing(null) }} title={t('gym.tariffs.deleteTitle')}>
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-text-dark">{t('gym.tariffs.deletePrefix')} <strong>{editing?.name}</strong>?</p>
                    <div className="flex gap-3">
                        <Button variant="outline" fullWidth onClick={() => { setModal(null); setEditing(null) }}>{t('common.cancel')}</Button>
                        <Button variant="danger" fullWidth isLoading={saving} onClick={remove}>{t('common.delete')}</Button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    )
}

// ─── Gift certificates tab ──────────────────────────────────────────────────────

type GiftStatus = 'Issued' | 'Redeemed' | 'Cancelled' | 'Expired'

interface GiftCert {
    id: string
    code: string
    tariffName: string
    price: number
    currency: string
    recipientName: string | null
    validUntil: string | null
    status: GiftStatus
}

interface MiniTariff { id: string; name: string; price: number; currency: string; isActive: boolean }
interface MiniCustomer { id: string; firstName: string; lastName: string | null }

const GIFT_STATUS_STYLE: Record<GiftStatus, string> = {
    Issued: 'bg-emerald-50 text-emerald-700',
    Redeemed: 'bg-indigo-50 text-indigo-700',
    Cancelled: 'bg-slate-100 text-text-light',
    Expired: 'bg-amber-50 text-amber-700',
}

function GiftCertificatesSection({ token }: { token: string | null }) {
    const { t } = useTranslation()
    const [certs, setCerts] = useState<GiftCert[]>([])
    const [giftTariffs, setGiftTariffs] = useState<MiniTariff[]>([])
    const [customers, setCustomers] = useState<MiniCustomer[]>([])
    const [loading, setLoading] = useState(false)

    const [issueOpen, setIssueOpen] = useState(false)
    const [issueForm, setIssueForm] = useState({ tariffId: '', validUntil: '', recipientName: '' })
    const [issuing, setIssuing] = useState(false)

    const [redeemFor, setRedeemFor] = useState<GiftCert | null>(null)
    const [redeemCustomer, setRedeemCustomer] = useState('')
    const [redeemStart, setRedeemStart] = useState('')
    const [redeeming, setRedeeming] = useState(false)

    const load = async () => {
        if (!token) return
        setLoading(true)
        try {
            const [cs, ts, cu] = await Promise.all([
                apiRequest<GiftCert[]>('/api/gym/gift-certificates', { token }),
                apiRequest<(MiniTariff & { kind: string })[]>('/api/gym/tariffs', { token }),
                apiRequest<MiniCustomer[]>('/api/gym/customers', { token }),
            ])
            setCerts(cs)
            setGiftTariffs(ts.filter((x) => x.isActive && x.kind === 'GiftCertificate'))
            setCustomers(cu)
        } finally { setLoading(false) }
    }
    useEffect(() => { void load() }, [token])

    const reload = async () => { if (token) setCerts(await apiRequest<GiftCert[]>('/api/gym/gift-certificates', { token })) }

    const issue = async () => {
        if (!token || !issueForm.tariffId) return
        setIssuing(true)
        try {
            await apiRequest('/api/gym/gift-certificates', {
                method: 'POST', token,
                body: JSON.stringify({
                    tariffId: issueForm.tariffId,
                    validUntil: issueForm.validUntil || null,
                    recipientName: issueForm.recipientName.trim() || null,
                }),
            })
            setIssueOpen(false); setIssueForm({ tariffId: '', validUntil: '', recipientName: '' })
            await reload()
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
        finally { setIssuing(false) }
    }

    const redeem = async () => {
        if (!token || !redeemFor || !redeemCustomer) return
        setRedeeming(true)
        try {
            await apiRequest(`/api/gym/gift-certificates/${redeemFor.id}/redeem`, {
                method: 'POST', token,
                body: JSON.stringify({ customerId: redeemCustomer, startDate: redeemStart || null }),
            })
            setRedeemFor(null); setRedeemCustomer(''); setRedeemStart('')
            await reload()
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
        finally { setRedeeming(false) }
    }

    const cancel = async (id: string) => {
        if (!token) return
        await apiRequest(`/api/gym/gift-certificates/${id}/cancel`, { method: 'POST', token })
        await reload()
    }
    const remove = async (id: string) => {
        if (!token) return
        await apiRequest(`/api/gym/gift-certificates/${id}`, { method: 'DELETE', token })
        await reload()
    }
    const customerName = (c: MiniCustomer) => [c.firstName, c.lastName].filter(Boolean).join(' ')

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-text-light">{t('gym.gifts.count', { count: certs.length })}</p>
                <Button icon="add" onClick={() => setIssueOpen(true)}>{t('gym.gifts.new')}</Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>
            ) : certs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border-base bg-surface py-16 text-center text-text-light">
                    <span className="material-symbols-outlined text-5xl">redeem</span>
                    <p className="text-sm">{t('gym.gifts.empty')}</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl bg-surface shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border-light text-[10px] font-black uppercase tracking-widest text-text-light">
                                <th className="px-5 py-3 text-left">{t('gym.gifts.columns.code')}</th>
                                <th className="px-5 py-3 text-left">{t('gym.gifts.columns.tariff')}</th>
                                <th className="px-5 py-3 text-left">{t('gym.gifts.columns.validUntil')}</th>
                                <th className="px-5 py-3 text-left">{t('gym.gifts.columns.status')}</th>
                                <th className="px-5 py-3 text-right">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {certs.map((g) => (
                                <tr key={g.id} className="border-b border-border-light last:border-none hover:bg-background-light">
                                    <td className="px-5 py-3">
                                        <span className="font-mono font-bold text-text-dark">{g.code}</span>
                                        {g.recipientName && <span className="block text-xs text-text-light">{g.recipientName}</span>}
                                    </td>
                                    <td className="px-5 py-3 text-text-muted">{g.tariffName} · {g.price} {g.currency}</td>
                                    <td className="px-5 py-3 text-text-muted">{g.validUntil ?? t('gym.gifts.noExpiry')}</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${GIFT_STATUS_STYLE[g.status]}`}>
                                            {t(`gym.gifts.statuses.${g.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right whitespace-nowrap">
                                        {g.status === 'Issued' && (
                                            <>
                                                <button onClick={() => { setRedeemFor(g); setRedeemCustomer(''); setRedeemStart('') }} className="mr-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline">{t('gym.gifts.redeem')}</button>
                                                <button onClick={() => cancel(g.id)} className="mr-3 text-[10px] font-black uppercase tracking-widest text-amber-700 hover:underline">{t('common.cancel')}</button>
                                            </>
                                        )}
                                        <button onClick={() => remove(g.id)} className="text-[10px] font-black uppercase tracking-widest text-error-text hover:underline">{t('common.delete')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Issue modal */}
            <Modal isOpen={issueOpen} onClose={() => setIssueOpen(false)} title={t('gym.gifts.issueTitle')}>
                <div className="space-y-4 pt-2">
                    {giftTariffs.length === 0 ? (
                        <p className="text-sm text-text-muted">{t('gym.gifts.noTariffs')}</p>
                    ) : (
                        <>
                            <Field label={t('gym.gifts.selectTariff')}>
                                <select value={issueForm.tariffId} onChange={(e) => setIssueForm((p) => ({ ...p, tariffId: e.target.value }))}
                                    className="h-9 w-full rounded-md border border-border-base bg-slate-75 px-3 text-xs text-text-base outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20">
                                    <option value="">{t('gym.gifts.selectTariffPlaceholder')}</option>
                                    {giftTariffs.map((x) => <option key={x.id} value={x.id}>{x.name} — {x.price} {x.currency}</option>)}
                                </select>
                            </Field>
                            <Field label={t('gym.gifts.recipientOptional')}>
                                <Input value={issueForm.recipientName} onChange={(e) => setIssueForm((p) => ({ ...p, recipientName: e.target.value }))} />
                            </Field>
                            <Field label={t('gym.gifts.validUntilOptional')}>
                                <Input type="date" value={issueForm.validUntil} onChange={(e) => setIssueForm((p) => ({ ...p, validUntil: e.target.value }))} />
                            </Field>
                            <div className="flex gap-3 pt-1">
                                <Button variant="outline" fullWidth onClick={() => setIssueOpen(false)}>{t('common.cancel')}</Button>
                                <Button fullWidth isLoading={issuing} disabled={!issueForm.tariffId} onClick={issue}>{t('gym.gifts.issue')}</Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Redeem modal */}
            <Modal isOpen={!!redeemFor} onClose={() => setRedeemFor(null)} title={t('gym.gifts.redeemTitle')}>
                <div className="space-y-4 pt-2">
                    {redeemFor && <p className="text-xs text-text-muted">{redeemFor.code} · {redeemFor.tariffName}</p>}
                    {customers.length === 0 ? (
                        <p className="text-sm text-text-muted">{t('gym.gifts.noCustomers')}</p>
                    ) : (
                        <>
                            <Field label={t('gym.gifts.redeemTo')}>
                                <select value={redeemCustomer} onChange={(e) => setRedeemCustomer(e.target.value)}
                                    className="h-9 w-full rounded-md border border-border-base bg-slate-75 px-3 text-xs text-text-base outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20">
                                    <option value="">{t('gym.gifts.selectTariffPlaceholder')}</option>
                                    {customers.map((c) => <option key={c.id} value={c.id}>{customerName(c)}</option>)}
                                </select>
                            </Field>
                            <Field label={t('gym.gifts.startDate')}>
                                <Input type="date" value={redeemStart} onChange={(e) => setRedeemStart(e.target.value)} />
                            </Field>
                            <div className="flex gap-3 pt-1">
                                <Button variant="outline" fullWidth onClick={() => setRedeemFor(null)}>{t('common.cancel')}</Button>
                                <Button fullWidth isLoading={redeeming} disabled={!redeemCustomer} onClick={redeem}>{t('gym.gifts.redeem')}</Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-light">{label}</label>
            {children}
        </div>
    )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary/30" />
            <span className="text-sm font-bold text-text-dark">{label}</span>
        </label>
    )
}

function PolicyChip({ icon, label }: { icon: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-75 px-2 py-1 text-[10px] font-bold text-text-muted">
            <span className="material-symbols-outlined text-[14px]">{icon}</span>
            {label}
        </span>
    )
}
