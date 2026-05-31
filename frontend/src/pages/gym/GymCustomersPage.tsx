import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../../components/templates'
import { Button, Input } from '../../components/atoms'
import { PageHeader, Modal } from '../../components/organisms'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'

type Gender = 'Male' | 'Female' | ''

interface Customer {
    id: string
    firstName: string
    lastName: string | null
    phone: string | null
    email: string | null
    gender: Gender | null
    birthDate: string | null
    notes: string | null
    isActive: boolean
}

interface FormState {
    firstName: string
    lastName: string
    phone: string
    email: string
    gender: Gender
    birthDate: string
    notes: string
    isActive: boolean
}

type MembershipStatus = 'Active' | 'Frozen' | 'Expired' | 'Cancelled'

interface Membership {
    id: string
    tariffId: string | null
    tariffName: string
    price: number
    currency: string
    startDate: string
    endDate: string
    visitLimit: number | null
    visitsUsed: number
    freezeAllowed: boolean
    freezeMaxDays: number
    frozenDaysUsed: number
    freezeRemaining: number
    frozenUntil: string | null
    transferAllowed: boolean
    autoRenew: boolean
    status: MembershipStatus
}

interface MiniTariff {
    id: string
    name: string
    price: number
    currency: string
    isActive: boolean
}

interface GymDevice {
    id: string
    name: string
    ipAddress: string
    deviceType: string
}

const STATUS_STYLE: Record<MembershipStatus, string> = {
    Active: 'bg-green-50 text-green-600',
    Frozen: 'bg-sky-50 text-sky-600',
    Expired: 'bg-amber-50 text-amber-700',
    Cancelled: 'bg-slate-100 text-text-light',
}

const emptyForm: FormState = {
    firstName: '', lastName: '', phone: '', email: '', gender: '', birthDate: '', notes: '', isActive: true,
}

const fullName = (c: Customer) => [c.firstName, c.lastName].filter(Boolean).join(' ')
const initials = (c: Customer) => [c.firstName?.[0], c.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'

export function GymCustomersPage() {
    const { t } = useTranslation()
    const { token } = useAuth()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
    const [editing, setEditing] = useState<Customer | null>(null)
    const [form, setForm] = useState<FormState>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Memberships sub-modal
    const [membershipsFor, setMembershipsFor] = useState<Customer | null>(null)
    const [memberships, setMemberships] = useState<Membership[]>([])
    const [tariffs, setTariffs] = useState<MiniTariff[]>([])
    const [mLoading, setMLoading] = useState(false)
    const [issueTariffId, setIssueTariffId] = useState('')
    const [issueStart, setIssueStart] = useState('')
    const [issuing, setIssuing] = useState(false)
    // Transfer sub-modal
    const [transferFor, setTransferFor] = useState<Membership | null>(null)
    const [transferTarget, setTransferTarget] = useState('')
    const [transferring, setTransferring] = useState(false)
    // Device access modal
    const [accessFor, setAccessFor] = useState<Customer | null>(null)
    const [devices, setDevices] = useState<GymDevice[]>([])
    const [accessSel, setAccessSel] = useState<Set<string>>(new Set())
    const [accessBusy, setAccessBusy] = useState(false)
    const [accessResults, setAccessResults] = useState<Record<string, 'granted' | 'revoked' | 'failed'>>({})

    const load = async () => {
        if (!token) return
        setLoading(true)
        try { setCustomers(await apiRequest<Customer[]>('/api/gym/customers', { token })) }
        finally { setLoading(false) }
    }
    useEffect(() => { void load() }, [token])

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase()
        if (!s) return customers
        return customers.filter((c) =>
            fullName(c).toLowerCase().includes(s) ||
            (c.phone ?? '').toLowerCase().includes(s) ||
            (c.email ?? '').toLowerCase().includes(s))
    }, [customers, search])

    const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }))

    const openCreate = () => { setEditing(null); setForm(emptyForm); setError(null); setModal('create') }
    const openEdit = (c: Customer) => {
        setEditing(c)
        setForm({
            firstName: c.firstName, lastName: c.lastName ?? '', phone: c.phone ?? '', email: c.email ?? '',
            gender: (c.gender ?? '') as Gender, birthDate: c.birthDate ?? '', notes: c.notes ?? '', isActive: c.isActive,
        })
        setError(null); setModal('edit')
    }

    const save = async () => {
        if (!token || !form.firstName.trim()) return
        setSaving(true); setError(null)
        try {
            const body = JSON.stringify({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim() || null,
                phone: form.phone.trim() || null,
                email: form.email.trim() || null,
                gender: form.gender || null,
                birthDate: form.birthDate || null,
                notes: form.notes.trim() || null,
                isActive: form.isActive,
            })
            if (modal === 'create') await apiRequest('/api/gym/customers', { method: 'POST', token, body })
            else if (editing) await apiRequest(`/api/gym/customers/${editing.id}`, { method: 'PUT', token, body })
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
            await apiRequest(`/api/gym/customers/${editing.id}`, { method: 'DELETE', token })
            setModal(null); setEditing(null)
            await load()
        } finally { setSaving(false) }
    }

    const openMemberships = async (c: Customer) => {
        if (!token) return
        setMembershipsFor(c); setMemberships([]); setIssueTariffId(''); setIssueStart(''); setMLoading(true)
        try {
            const [ms, ts] = await Promise.all([
                apiRequest<Membership[]>(`/api/gym/customers/${c.id}/memberships`, { token }),
                apiRequest<MiniTariff[]>('/api/gym/tariffs', { token }),
            ])
            setMemberships(ms)
            setTariffs(ts.filter((x) => x.isActive))
        } finally { setMLoading(false) }
    }

    const reloadMemberships = async (customerId: string) => {
        if (!token) return
        setMemberships(await apiRequest<Membership[]>(`/api/gym/customers/${customerId}/memberships`, { token }))
    }

    const issueMembership = async () => {
        if (!token || !membershipsFor || !issueTariffId) return
        setIssuing(true)
        try {
            await apiRequest(`/api/gym/customers/${membershipsFor.id}/memberships`, {
                method: 'POST', token,
                body: JSON.stringify({ tariffId: issueTariffId, startDate: issueStart || null }),
            })
            setIssueTariffId(''); setIssueStart('')
            await reloadMemberships(membershipsFor.id)
        } finally { setIssuing(false) }
    }

    const cancelMembership = async (id: string) => {
        if (!token || !membershipsFor) return
        if (!confirm(t('gym.memberships.cancelConfirm'))) return
        await apiRequest(`/api/gym/memberships/${id}/cancel`, { method: 'POST', token })
        await reloadMemberships(membershipsFor.id)
    }

    const membershipAction = async (id: string, action: 'unfreeze' | 'renew') => {
        if (!token || !membershipsFor) return
        try {
            await apiRequest(`/api/gym/memberships/${id}/${action}`, { method: 'POST', token })
            await reloadMemberships(membershipsFor.id)
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
    }

    const freezeMembership = async (m: Membership) => {
        if (!token || !membershipsFor) return
        const input = prompt(t('gym.memberships.freezePrompt', { max: m.freezeRemaining }))
        if (input == null) return
        const days = parseInt(input, 10)
        if (!Number.isFinite(days) || days < 1) return
        try {
            await apiRequest(`/api/gym/memberships/${m.id}/freeze`, { method: 'POST', token, body: JSON.stringify({ days }) })
            await reloadMemberships(membershipsFor.id)
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
    }

    const doTransfer = async () => {
        if (!token || !membershipsFor || !transferFor || !transferTarget) return
        setTransferring(true)
        try {
            await apiRequest(`/api/gym/memberships/${transferFor.id}/transfer`, {
                method: 'POST', token, body: JSON.stringify({ customerId: transferTarget }),
            })
            setTransferFor(null); setTransferTarget('')
            await reloadMemberships(membershipsFor.id)
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
        finally { setTransferring(false) }
    }

    const openAccess = async (c: Customer) => {
        if (!token) return
        setAccessFor(c); setAccessSel(new Set()); setAccessResults({})
        try { setDevices(await apiRequest<GymDevice[]>('/api/gym/devices', { token })) }
        catch { setDevices([]) }
    }

    const toggleAccessDevice = (id: string) => setAccessSel((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id); else next.add(id)
        return next
    })

    const runAccess = async (mode: 'access' | 'access/revoke') => {
        if (!token || !accessFor || accessSel.size === 0) return
        setAccessBusy(true)
        try {
            const res = await apiRequest<{ deviceId: string; success: boolean }[]>(
                `/api/gym/customers/${accessFor.id}/${mode}`,
                { method: 'POST', token, body: JSON.stringify({ deviceIds: Array.from(accessSel) }) },
            )
            const label = mode === 'access' ? 'granted' : 'revoked'
            setAccessResults((prev) => {
                const next = { ...prev }
                for (const r of res) next[r.deviceId] = r.success ? (label as 'granted' | 'revoked') : 'failed'
                return next
            })
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
        finally { setAccessBusy(false) }
    }

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
                <div className="p-6 md:p-10 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <PageHeader
                            className="p-0 border-none shadow-none bg-transparent"
                            title={t('gym.customers.title')}
                            description={t('gym.customers.subtitle')}
                        />
                        <Button icon="person_add" onClick={openCreate}>{t('gym.customers.new')}</Button>
                    </div>

                    <div className="max-w-md">
                        <Input icon="search" placeholder={t('gym.customers.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>

                    <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-border-light">
                            <p className="text-xs font-black uppercase tracking-widest text-text-light">{t('gym.customers.count', { count: filtered.length })}</p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-text-light">
                                <span className="material-symbols-outlined text-4xl">group_off</span>
                                <p className="text-sm">{customers.length === 0 ? t('gym.customers.empty') : t('gym.customers.notFound')}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-text-light border-b border-border-light">
                                            <th className="px-5 py-3 text-left">{t('gym.customers.columns.name')}</th>
                                            <th className="px-5 py-3 text-left">{t('gym.customers.columns.contact')}</th>
                                            <th className="px-5 py-3 text-left">{t('gym.customers.columns.gender')}</th>
                                            <th className="px-5 py-3 text-left">{t('gym.customers.columns.status')}</th>
                                            <th className="px-5 py-3 text-right">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((c) => (
                                            <tr key={c.id} className="border-b border-border-light last:border-none hover:bg-background-light transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">{initials(c)}</span>
                                                        <span className="font-bold text-text-dark">{fullName(c)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-text-muted">
                                                    {c.phone || c.email
                                                        ? <div className="flex flex-col leading-tight">
                                                            {c.phone && <span>{c.phone}</span>}
                                                            {c.email && <span className="text-xs text-text-light">{c.email}</span>}
                                                          </div>
                                                        : <span className="text-text-light">{t('gym.customers.noContact')}</span>}
                                                </td>
                                                <td className="px-5 py-3 text-text-muted">{c.gender ? t(`gym.customers.genders.${c.gender}`) : '—'}</td>
                                                <td className="px-5 py-3">
                                                    {c.isActive
                                                        ? <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-green-600">{t('common.active')}</span>
                                                        : <span className="rounded-full bg-background-light px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-text-light">{t('gym.customers.inactive')}</span>}
                                                </td>
                                                <td className="px-5 py-3 text-right whitespace-nowrap">
                                                    <button onClick={() => openAccess(c)} className="mr-3 text-[10px] font-black uppercase tracking-widest text-sky-600 hover:underline">{t('gym.access.manage')}</button>
                                                    <button onClick={() => openMemberships(c)} className="mr-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline">{t('gym.memberships.manage')}</button>
                                                    <button onClick={() => openEdit(c)} className="mr-3 text-[10px] font-black uppercase tracking-widest text-primary hover:underline">{t('common.edit')}</button>
                                                    <button onClick={() => { setEditing(c); setModal('delete') }} className="text-[10px] font-black uppercase tracking-widest text-error-text hover:underline">{t('common.delete')}</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Create / Edit modal ─── */}
            <Modal isOpen={modal === 'create' || modal === 'edit'} onClose={() => { setModal(null); setEditing(null) }} title={modal === 'create' ? t('gym.customers.new') : t('gym.customers.edit')}>
                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('gym.customers.fields.firstName')}>
                            <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
                        </Field>
                        <Field label={t('gym.customers.fields.lastName')}>
                            <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('gym.customers.fields.phone')}>
                            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                        </Field>
                        <Field label={t('gym.customers.fields.email')}>
                            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('gym.customers.fields.gender')}>
                            <select value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)}
                                className="h-9 w-full rounded-md border border-border-base bg-slate-75 px-3 text-xs text-text-base outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20">
                                <option value="">{t('gym.customers.genders.unset')}</option>
                                <option value="Male">{t('gym.customers.genders.Male')}</option>
                                <option value="Female">{t('gym.customers.genders.Female')}</option>
                            </select>
                        </Field>
                        <Field label={t('gym.customers.fields.birthDate')}>
                            <Input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
                        </Field>
                    </div>
                    <Field label={t('gym.customers.fields.notes')}>
                        <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
                    </Field>
                    <Check label={t('gym.customers.fields.active')} checked={form.isActive} onChange={(v) => set('isActive', v)} />

                    {error && <p className="text-xs font-medium text-error-text">{error}</p>}

                    <div className="flex gap-3 pt-1">
                        <Button variant="outline" fullWidth onClick={() => { setModal(null); setEditing(null) }}>{t('common.cancel')}</Button>
                        <Button fullWidth isLoading={saving} onClick={save} disabled={!form.firstName.trim()}>{modal === 'create' ? t('common.create') : t('common.save')}</Button>
                    </div>
                </div>
            </Modal>

            {/* ─── Delete modal ─── */}
            <Modal isOpen={modal === 'delete'} onClose={() => { setModal(null); setEditing(null) }} title={t('gym.customers.deleteTitle')}>
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-text-dark">{t('gym.customers.deletePrefix')} <strong>{editing ? fullName(editing) : ''}</strong>?</p>
                    <div className="flex gap-3">
                        <Button variant="outline" fullWidth onClick={() => { setModal(null); setEditing(null) }}>{t('common.cancel')}</Button>
                        <Button variant="danger" fullWidth isLoading={saving} onClick={remove}>{t('common.delete')}</Button>
                    </div>
                </div>
            </Modal>

            {/* ─── Memberships modal ─── */}
            <Modal isOpen={!!membershipsFor} onClose={() => setMembershipsFor(null)} title={membershipsFor ? t('gym.memberships.for', { name: fullName(membershipsFor) }) : ''}>
                <div className="space-y-5 pt-2">
                    {/* Issue form */}
                    <div className="rounded-xl border border-border-light p-3 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-light">{t('gym.memberships.issueTitle')}</p>
                        {tariffs.length === 0 ? (
                            <p className="text-xs text-text-muted">{t('gym.memberships.noTariffs')}</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label={t('gym.memberships.selectTariff')}>
                                        <select value={issueTariffId} onChange={(e) => setIssueTariffId(e.target.value)}
                                            className="h-9 w-full rounded-md border border-border-base bg-slate-75 px-3 text-xs text-text-base outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20">
                                            <option value="">{t('gym.memberships.selectTariffPlaceholder')}</option>
                                            {tariffs.map((x) => <option key={x.id} value={x.id}>{x.name} — {x.price} {x.currency}</option>)}
                                        </select>
                                    </Field>
                                    <Field label={t('gym.memberships.startDate')}>
                                        <Input type="date" value={issueStart} onChange={(e) => setIssueStart(e.target.value)} />
                                    </Field>
                                </div>
                                <Button icon="add" isLoading={issuing} disabled={!issueTariffId} onClick={issueMembership}>{t('gym.memberships.issue')}</Button>
                            </>
                        )}
                    </div>

                    {/* Memberships list */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-light">{t('gym.memberships.title')}</p>
                        {mLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
                            </div>
                        ) : memberships.length === 0 ? (
                            <p className="py-4 text-center text-sm text-text-light">{t('gym.memberships.none')}</p>
                        ) : (
                            memberships.map((m) => (
                                <div key={m.id} className="rounded-xl border border-border-light p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate font-bold text-text-dark">{m.tariffName}</p>
                                            <p className="mt-0.5 text-xs text-text-muted">{t('gym.memberships.period')}: {m.startDate} → {m.endDate}</p>
                                            <p className="text-xs text-text-muted">
                                                {t('gym.memberships.visits')}: {m.visitLimit == null ? t('gym.memberships.visitsUnlimited') : t('gym.memberships.visitsUsed', { used: m.visitsUsed, limit: m.visitLimit })}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${STATUS_STYLE[m.status]}`}>
                                                {t(`gym.memberships.statuses.${m.status}`)}
                                            </span>
                                            <p className="mt-1 text-xs font-bold text-text-dark">{m.price} {m.currency}</p>
                                        </div>
                                    </div>
                                    {m.status === 'Frozen' && m.frozenUntil && (
                                        <p className="mt-1 text-xs text-sky-600">{t('gym.memberships.frozenUntil', { date: m.frozenUntil })}</p>
                                    )}
                                    {(() => {
                                        const actions: React.ReactNode[] = []
                                        if (m.status === 'Active' && m.freezeAllowed && m.freezeRemaining > 0)
                                            actions.push(<ActionBtn key="f" color="text-sky-600" onClick={() => freezeMembership(m)} label={t('gym.memberships.freeze')} />)
                                        if (m.status === 'Frozen')
                                            actions.push(<ActionBtn key="u" color="text-sky-600" onClick={() => membershipAction(m.id, 'unfreeze')} label={t('gym.memberships.unfreeze')} />)
                                        if ((m.status === 'Active' || m.status === 'Frozen') && m.transferAllowed)
                                            actions.push(<ActionBtn key="t" color="text-indigo-600" onClick={() => { setTransferFor(m); setTransferTarget('') }} label={t('gym.memberships.transfer')} />)
                                        if ((m.status === 'Active' || m.status === 'Expired') && m.tariffId)
                                            actions.push(<ActionBtn key="r" color="text-emerald-600" onClick={() => membershipAction(m.id, 'renew')} label={t('gym.memberships.renew')} />)
                                        if (m.status === 'Active' || m.status === 'Frozen')
                                            actions.push(<ActionBtn key="c" color="text-error-text" onClick={() => cancelMembership(m.id)} label={t('gym.memberships.cancel')} />)
                                        return actions.length > 0 ? <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border-light pt-2">{actions}</div> : null
                                    })()}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Modal>

            {/* ─── Transfer sub-modal ─── */}
            <Modal isOpen={!!transferFor} onClose={() => setTransferFor(null)} title={t('gym.memberships.transferTitle')}>
                <div className="space-y-4 pt-2">
                    {(() => {
                        const others = customers.filter((c) => c.id !== membershipsFor?.id)
                        return others.length === 0 ? (
                            <p className="text-sm text-text-muted">{t('gym.memberships.noOtherCustomers')}</p>
                        ) : (
                            <>
                                <Field label={t('gym.memberships.transferTo')}>
                                    <select value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)}
                                        className="h-9 w-full rounded-md border border-border-base bg-slate-75 px-3 text-xs text-text-base outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20">
                                        <option value="">{t('gym.memberships.selectTariffPlaceholder')}</option>
                                        {others.map((c) => <option key={c.id} value={c.id}>{fullName(c)}{c.phone ? ` · ${c.phone}` : ''}</option>)}
                                    </select>
                                </Field>
                                <div className="flex gap-3 pt-1">
                                    <Button variant="outline" fullWidth onClick={() => setTransferFor(null)}>{t('common.cancel')}</Button>
                                    <Button fullWidth isLoading={transferring} disabled={!transferTarget} onClick={doTransfer}>{t('gym.memberships.transfer')}</Button>
                                </div>
                            </>
                        )
                    })()}
                </div>
            </Modal>

            {/* ─── Device access modal ─── */}
            <Modal isOpen={!!accessFor} onClose={() => setAccessFor(null)} title={accessFor ? t('gym.access.title', { name: fullName(accessFor) }) : ''}>
                <div className="space-y-4 pt-2">
                    <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800">{t('gym.access.hint')}</p>
                    {devices.length === 0 ? (
                        <p className="text-sm text-text-muted">{t('gym.access.noDevices')}</p>
                    ) : (
                        <>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-light">{t('gym.access.selectDevices')}</p>
                            <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                {devices.map((d) => {
                                    const r = accessResults[d.id]
                                    return (
                                        <label key={d.id} className="flex items-center gap-2.5 rounded-xl border border-border-light px-3 py-2 cursor-pointer hover:bg-slate-50">
                                            <input type="checkbox" checked={accessSel.has(d.id)} onChange={() => toggleAccessDevice(d.id)}
                                                className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary/30" />
                                            <span className="flex-1 min-w-0">
                                                <span className="block truncate text-sm font-bold text-text-dark">{d.name}</span>
                                                <span className="block text-xs text-text-light">{d.ipAddress}</span>
                                            </span>
                                            {r && (
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${r === 'failed' ? 'text-error-text' : 'text-green-600'}`}>
                                                    {t(`gym.access.${r}`)}
                                                </span>
                                            )}
                                        </label>
                                    )
                                })}
                            </div>
                            <div className="flex gap-3 pt-1">
                                <Button variant="outline" fullWidth icon="link_off" isLoading={accessBusy} disabled={accessSel.size === 0} onClick={() => runAccess('access/revoke')}>{t('gym.access.revoke')}</Button>
                                <Button fullWidth icon="key" isLoading={accessBusy} disabled={accessSel.size === 0} onClick={() => runAccess('access')}>{t('gym.access.grant')}</Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </AppLayout>
    )
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className={`text-[10px] font-black uppercase tracking-widest hover:underline ${color}`}>{label}</button>
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
