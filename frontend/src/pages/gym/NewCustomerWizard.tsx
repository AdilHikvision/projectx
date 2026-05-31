import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '../../components/atoms'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'

type Gender = 'Male' | 'Female' | ''

interface GymDevice { id: string; name: string; ipAddress: string }
interface Tariff { id: string; name: string; price: number; currency: string; isActive: boolean }
interface Creds { cards: { id: string; cardNo: string }[]; faces: { id: string }[]; fingerprints: { id: string; fingerIndex: number }[] }

const STEPS = ['info', 'subscription', 'credentials', 'payment', 'access'] as const
const STEP_ICONS: Record<(typeof STEPS)[number], string> = {
    info: 'badge', subscription: 'card_membership', credentials: 'fingerprint', payment: 'payments', access: 'key',
}
const PAYMENT_METHODS = ['Cash', 'Card', 'Transfer'] as const
const PAYMENT_ICONS: Record<string, string> = { Cash: 'payments', Card: 'credit_card', Transfer: 'account_balance' }

const emptyInfo = { firstName: '', lastName: '', phone: '', email: '', gender: '' as Gender, birthDate: '', notes: '', isActive: true }

export function NewCustomerWizard({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
    const { t } = useTranslation()
    const { token } = useAuth()
    const [stepIdx, setStepIdx] = useState(0)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [customerId, setCustomerId] = useState<string | null>(null)

    const [info, setInfo] = useState(emptyInfo)
    const [tariffs, setTariffs] = useState<Tariff[]>([])
    const [tariffId, setTariffId] = useState('')
    const [devices, setDevices] = useState<GymDevice[]>([])
    const [capDevice, setCapDevice] = useState('')
    const [creds, setCreds] = useState<Creds>({ cards: [], faces: [], fingerprints: [] })
    const [capturing, setCapturing] = useState<string | null>(null)
    const [capMsg, setCapMsg] = useState<Record<string, string>>({})
    const [newCardNo, setNewCardNo] = useState('')
    const [faceFile, setFaceFile] = useState<File | null>(null)
    const [credBusy, setCredBusy] = useState(false)
    const [pay, setPay] = useState({ method: 'Cash', amount: '', note: '' })
    const [accessSel, setAccessSel] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!open) return
        setStepIdx(0); setBusy(false); setError(null); setCustomerId(null)
        setInfo(emptyInfo); setTariffId(''); setCreds({ cards: [], faces: [], fingerprints: [] })
        setCapturing(null); setCapMsg({}); setNewCardNo(''); setFaceFile(null)
        setPay({ method: 'Cash', amount: '', note: '' }); setAccessSel(new Set())
        if (!token) return
        void (async () => {
            try {
                const [ts, ds] = await Promise.all([
                    apiRequest<Tariff[]>('/api/gym/tariffs', { token }),
                    apiRequest<GymDevice[]>('/api/gym/devices', { token }),
                ])
                setTariffs(ts.filter((x) => x.isActive))
                setDevices(ds)
                setCapDevice(ds[0]?.id ?? '')
            } catch { /* ignore */ }
        })()
    }, [open, token])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    const step = STEPS[stepIdx]
    const setI = <K extends keyof typeof info>(k: K, v: (typeof info)[K]) => setInfo((p) => ({ ...p, [k]: v }))

    const ensureCustomer = async (): Promise<string | null> => {
        if (customerId) return customerId
        const c = await apiRequest<{ id: string }>('/api/gym/customers', {
            method: 'POST', token,
            body: JSON.stringify({
                firstName: info.firstName.trim(), lastName: info.lastName.trim() || null,
                phone: info.phone.trim() || null, email: info.email.trim() || null,
                gender: info.gender || null, birthDate: info.birthDate || null,
                notes: info.notes.trim() || null, isActive: info.isActive,
            }),
        })
        setCustomerId(c.id)
        return c.id
    }

    const loadCreds = async (id: string) => { setCreds(await apiRequest<Creds>(`/api/gym/customers/${id}/credentials`, { token })) }

    const runCapture = async (kind: 'face' | 'card' | 'fingerprint') => {
        if (!token || !capDevice) return
        const id = customerId ?? await ensureCustomer()
        if (!id) return
        setCapturing(kind); setCapMsg((m) => ({ ...m, [kind]: t('gym.wizard.credentials.capturing') }))
        try {
            const before = await apiRequest<Creds>(`/api/gym/customers/${id}/credentials`, { token })
            const beforeN = kind === 'face' ? before.faces.length : kind === 'card' ? before.cards.length : before.fingerprints.length
            await apiRequest(`/api/gym/customers/${id}/capture/${kind}`, {
                method: 'POST', token, body: JSON.stringify({ deviceId: capDevice, fingerIndex: 1 }),
            })
            let done = false
            for (let i = 0; i < 40 && !done; i++) {
                await new Promise((r) => setTimeout(r, 1500))
                const p = await apiRequest<{ status: string; message?: string }>(`/api/gym/customers/capture/${kind}/progress?deviceId=${capDevice}`, { token })
                const cur = await apiRequest<Creds>(`/api/gym/customers/${id}/credentials`, { token })
                const curN = kind === 'face' ? cur.faces.length : kind === 'card' ? cur.cards.length : cur.fingerprints.length
                if (curN > beforeN) { setCreds(cur); setCapMsg((m) => ({ ...m, [kind]: t('gym.wizard.credentials.captured') })); done = true }
                else if (/fail|error|timeout/i.test(p.status)) { setCapMsg((m) => ({ ...m, [kind]: p.message || t('gym.wizard.credentials.failed') })); done = true }
            }
            if (!done) setCapMsg((m) => ({ ...m, [kind]: t('gym.wizard.credentials.failed') }))
        } catch (e) {
            setCapMsg((m) => ({ ...m, [kind]: e instanceof Error ? e.message : 'Failed' }))
        } finally {
            setCapturing(null)
            try { await loadCreds(id) } catch { /* ignore */ }
        }
    }

    const addCard = async () => {
        if (!token || !newCardNo.trim()) return
        const id = customerId ?? await ensureCustomer()
        if (!id) return
        setCredBusy(true)
        try {
            await apiRequest(`/api/gym/customers/${id}/cards`, {
                method: 'POST', token, body: JSON.stringify({ cardNo: newCardNo.trim(), deviceIds: capDevice ? [capDevice] : [] }),
            })
            setNewCardNo(''); await loadCreds(id)
        } catch (e) { setCapMsg((m) => ({ ...m, card: e instanceof Error ? e.message : 'Failed' })) }
        finally { setCredBusy(false) }
    }

    const uploadFace = async () => {
        if (!token || !faceFile) return
        const id = customerId ?? await ensureCustomer()
        if (!id) return
        setCredBusy(true)
        try {
            const fd = new FormData()
            fd.append('Image', faceFile)
            if (capDevice) fd.append('DeviceIds', capDevice)
            await apiRequest(`/api/gym/customers/${id}/faces`, { method: 'POST', token, body: fd })
            setFaceFile(null); await loadCreds(id)
        } catch (e) { setCapMsg((m) => ({ ...m, face: e instanceof Error ? e.message : 'Failed' })) }
        finally { setCredBusy(false) }
    }

    const goNext = async () => {
        if (!token) return
        setBusy(true); setError(null)
        try {
            if (step === 'info') {
                await ensureCustomer()
            } else if (step === 'subscription') {
                const id = customerId ?? await ensureCustomer()
                if (id && tariffId) {
                    await apiRequest(`/api/gym/customers/${id}/memberships`, { method: 'POST', token, body: JSON.stringify({ tariffId }) })
                    const tr = tariffs.find((x) => x.id === tariffId)
                    if (tr && !pay.amount) setPay((p) => ({ ...p, amount: String(tr.price) }))
                }
            } else if (step === 'credentials') {
                if (customerId) await loadCreds(customerId)
            } else if (step === 'payment') {
                const id = customerId ?? await ensureCustomer()
                if (id && parseFloat(pay.amount) > 0) {
                    await apiRequest(`/api/gym/customers/${id}/payments`, {
                        method: 'POST', token,
                        body: JSON.stringify({ amount: parseFloat(pay.amount) || 0, method: pay.method, note: pay.note.trim() || null }),
                    })
                }
            } else if (step === 'access') {
                const id = customerId ?? await ensureCustomer()
                if (id && accessSel.size > 0) {
                    await apiRequest(`/api/gym/customers/${id}/access`, { method: 'POST', token, body: JSON.stringify({ deviceIds: Array.from(accessSel) }) })
                }
                onDone()
                return
            }
            setStepIdx((i) => Math.min(i + 1, STEPS.length - 1))
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed')
        } finally { setBusy(false) }
    }

    const toggleAccess = (id: string) => setAccessSel((prev) => {
        const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next
    })

    if (!open) return null
    const isLast = step === 'access'
    const canNext = step !== 'info' || info.firstName.trim().length > 0
    const optional = step !== 'info'
    const credTotal = creds.cards.length + creds.faces.length + creds.fingerprints.length

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background-dark/50 backdrop-blur-sm" aria-hidden />
            <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl">
                {/* Header + stepper */}
                <div className="bg-linear-to-br from-primary/10 to-primary/5 px-7 pt-6 pb-5">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-black tracking-tight text-text-dark">{t('gym.wizard.title')}</h2>
                        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-black/5 hover:text-text-dark">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="flex items-center">
                        {STEPS.map((s, i) => {
                            const state = i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'idle'
                            return (
                                <Fragment key={s}>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition-all ${
                                            state === 'active' ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                                                : state === 'done' ? 'bg-primary/20 text-primary'
                                                    : 'bg-slate-100 text-text-light'}`}>
                                            {state === 'done'
                                                ? <span className="material-symbols-outlined text-[20px]">check</span>
                                                : <span className="material-symbols-outlined text-[20px]">{STEP_ICONS[s]}</span>}
                                        </div>
                                        <span className={`hidden text-[10px] font-bold uppercase tracking-wider sm:block ${state === 'idle' ? 'text-text-light' : 'text-text-dark'}`}>
                                            {t(`gym.wizard.steps.${s}`)}
                                        </span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className={`mx-1 h-0.5 flex-1 rounded-full ${i < stepIdx ? 'bg-primary/40' : 'bg-slate-200'}`} />
                                    )}
                                </Fragment>
                            )
                        })}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-7 py-6">
                    {step === 'info' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <BigField label={t('gym.customers.fields.firstName')} required><Input value={info.firstName} onChange={(e) => setI('firstName', e.target.value)} /></BigField>
                                <BigField label={t('gym.customers.fields.lastName')}><Input value={info.lastName} onChange={(e) => setI('lastName', e.target.value)} /></BigField>
                                <BigField label={t('gym.customers.fields.phone')}><Input icon="call" value={info.phone} onChange={(e) => setI('phone', e.target.value)} /></BigField>
                                <BigField label={t('gym.customers.fields.email')}><Input icon="mail" type="email" value={info.email} onChange={(e) => setI('email', e.target.value)} /></BigField>
                                <BigField label={t('gym.customers.fields.gender')}>
                                    <select value={info.gender} onChange={(e) => setI('gender', e.target.value as Gender)} className="h-10 w-full rounded-xl border border-border-base bg-slate-75 px-3 text-sm text-text-base outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20">
                                        <option value="">{t('gym.customers.genders.unset')}</option>
                                        <option value="Male">{t('gym.customers.genders.Male')}</option>
                                        <option value="Female">{t('gym.customers.genders.Female')}</option>
                                    </select>
                                </BigField>
                                <BigField label={t('gym.customers.fields.birthDate')}><Input type="date" value={info.birthDate} onChange={(e) => setI('birthDate', e.target.value)} /></BigField>
                            </div>
                            <BigField label={t('gym.customers.fields.notes')}><Input value={info.notes} onChange={(e) => setI('notes', e.target.value)} /></BigField>
                        </div>
                    )}

                    {step === 'subscription' && (
                        <div className="space-y-3">
                            {tariffs.length === 0 ? <EmptyHint icon="card_membership" text={t('gym.wizard.subscription.none')} /> : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {tariffs.map((tr) => {
                                        const sel = tariffId === tr.id
                                        return (
                                            <button key={tr.id} type="button" onClick={() => setTariffId(sel ? '' : tr.id)}
                                                className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-5 text-left transition-all ${sel ? 'border-primary bg-primary/5 shadow-md' : 'border-border-base hover:border-primary/40 hover:bg-slate-50'}`}>
                                                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${sel ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted'}`}>
                                                    <span className="material-symbols-outlined">card_membership</span>
                                                </span>
                                                <span className="text-base font-bold text-text-dark">{tr.name}</span>
                                                <span className="text-xl font-black text-primary">{tr.price} <span className="text-xs font-bold text-text-light">{tr.currency}</span></span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                            <p className="text-xs text-text-light">{t('gym.wizard.subscription.skipNote')}</p>
                        </div>
                    )}

                    {step === 'credentials' && (
                        <div className="space-y-5">
                            {devices.length === 0 ? <EmptyHint icon="sensors_off" text={t('gym.wizard.credentials.noDevices')} /> : (
                                <BigField label={t('gym.wizard.credentials.device')}>
                                    <select value={capDevice} onChange={(e) => setCapDevice(e.target.value)} className="h-10 w-full rounded-xl border border-border-base bg-slate-75 px-3 text-sm text-text-base outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20">
                                        {devices.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.ipAddress})</option>)}
                                    </select>
                                </BigField>
                            )}
                            <div className="grid grid-cols-3 gap-3">
                                {(['face', 'card', 'fingerprint'] as const).map((kind) => (
                                    <button key={kind} type="button" disabled={!!capturing || devices.length === 0} onClick={() => runCapture(kind)}
                                        className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border-base p-4 text-center transition-all hover:border-primary/40 hover:bg-slate-50 disabled:opacity-50">
                                        <span className="material-symbols-outlined text-3xl text-primary">
                                            {kind === 'face' ? 'face' : kind === 'card' ? 'badge' : 'fingerprint'}
                                        </span>
                                        <span className="text-xs font-bold text-text-dark">{t(`gym.wizard.credentials.${kind}`)}</span>
                                        {capturing === kind && <span className="material-symbols-outlined animate-spin text-base text-primary">progress_activity</span>}
                                        {capMsg[kind] && <span className="text-[10px] leading-tight text-text-muted">{capMsg[kind]}</span>}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                                <BigField label={t('gym.creds.cardNo')}>
                                    <div className="flex gap-2">
                                        <Input value={newCardNo} onChange={(e) => setNewCardNo(e.target.value)} containerClassName="flex-1" />
                                        <Button isLoading={credBusy} disabled={!newCardNo.trim()} onClick={addCard}>{t('common.add')}</Button>
                                    </div>
                                </BigField>
                                <BigField label={t('gym.creds.facePhoto')}>
                                    <div className="flex items-center gap-2">
                                        <input type="file" accept="image/*" onChange={(e) => setFaceFile(e.target.files?.[0] ?? null)}
                                            className="flex-1 text-xs text-text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-bold" />
                                        <Button isLoading={credBusy} disabled={!faceFile} onClick={uploadFace}>{t('gym.creds.uploadFace')}</Button>
                                    </div>
                                </BigField>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <CredChip icon="face" label={`${t('gym.creds.faces')} ${creds.faces.length}`} on={creds.faces.length > 0} />
                                <CredChip icon="badge" label={`${t('gym.creds.cards')} ${creds.cards.length}`} on={creds.cards.length > 0} />
                                <CredChip icon="fingerprint" label={`${t('gym.creds.fingerprints')} ${creds.fingerprints.length}`} on={creds.fingerprints.length > 0} />
                            </div>
                            {credTotal === 0 && <p className="text-xs text-text-light">{t('gym.wizard.credentials.skipNote')}</p>}
                        </div>
                    )}

                    {step === 'payment' && (
                        <div className="space-y-5">
                            <BigField label={t('gym.wizard.payment.method')}>
                                <div className="grid grid-cols-3 gap-3">
                                    {PAYMENT_METHODS.map((m) => {
                                        const sel = pay.method === m
                                        return (
                                            <button key={m} type="button" onClick={() => setPay((p) => ({ ...p, method: m }))}
                                                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${sel ? 'border-primary bg-primary/5 shadow-md' : 'border-border-base hover:border-primary/40 hover:bg-slate-50'}`}>
                                                <span className={`material-symbols-outlined text-2xl ${sel ? 'text-primary' : 'text-text-muted'}`}>{PAYMENT_ICONS[m]}</span>
                                                <span className="text-xs font-bold text-text-dark">{t(`gym.wizard.payment.methods.${m}`)}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </BigField>
                            <BigField label={t('gym.wizard.payment.amount')}>
                                <input type="number" min={0} step="0.01" value={pay.amount} onChange={(e) => setPay((p) => ({ ...p, amount: e.target.value }))}
                                    className="h-14 w-full rounded-2xl border border-border-base bg-slate-75 px-4 text-2xl font-black text-text-dark outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20" />
                            </BigField>
                            <BigField label={t('gym.wizard.payment.note')}><Input value={pay.note} onChange={(e) => setPay((p) => ({ ...p, note: e.target.value }))} /></BigField>
                            <p className="text-xs text-text-light">{t('gym.wizard.payment.skipNote')}</p>
                        </div>
                    )}

                    {step === 'access' && (
                        <div className="space-y-3">
                            {devices.length === 0 ? <EmptyHint icon="sensors_off" text={t('gym.wizard.accessStep.noDevices')} /> : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {devices.map((d) => {
                                        const sel = accessSel.has(d.id)
                                        return (
                                            <button key={d.id} type="button" onClick={() => toggleAccess(d.id)}
                                                className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${sel ? 'border-primary bg-primary/5 shadow-md' : 'border-border-base hover:border-primary/40 hover:bg-slate-50'}`}>
                                                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${sel ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted'}`}>
                                                    <span className="material-symbols-outlined">{sel ? 'key' : 'lock'}</span>
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-bold text-text-dark">{d.name}</span>
                                                    <span className="block text-xs text-text-light">{d.ipAddress}</span>
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                            <p className="text-xs text-text-light">{t('gym.wizard.accessStep.skipNote')}</p>
                        </div>
                    )}

                    {error && <p className="mt-4 rounded-xl bg-error-bg px-3 py-2 text-xs font-medium text-error-text">{error}</p>}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 border-t border-border-light px-7 py-4">
                    {stepIdx > 0
                        ? <Button variant="outline" icon="arrow_back" onClick={() => setStepIdx((i) => Math.max(0, i - 1))} disabled={busy}>{t('gym.wizard.back')}</Button>
                        : <Button variant="outline" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>}
                    <div className="flex-1" />
                    {optional && !isLast && <Button variant="ghost" onClick={() => setStepIdx((i) => i + 1)} disabled={busy}>{t('gym.wizard.skip')}</Button>}
                    <Button icon={isLast ? 'check' : 'arrow_forward'} onClick={goNext} isLoading={busy} disabled={!canNext}>
                        {isLast ? t('gym.wizard.finish') : t('gym.wizard.next')}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function BigField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[11px] font-black uppercase tracking-widest text-text-light">
                {label}{required && <span className="text-error-text"> *</span>}
            </label>
            {children}
        </div>
    )
}

function EmptyHint({ icon, text }: { icon: string; text: string }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-base py-10 text-center text-text-light">
            <span className="material-symbols-outlined text-4xl">{icon}</span>
            <p className="text-sm">{text}</p>
        </div>
    )
}

function CredChip({ icon, label, on }: { icon: string; label: string; on: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${on ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-text-light'}`}>
            <span className="material-symbols-outlined text-[16px]">{icon}</span>
            {label}
        </span>
    )
}
