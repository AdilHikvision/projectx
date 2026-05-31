import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../../components/templates'
import { Button, Input } from '../../components/atoms'
import { PageHeader, Modal } from '../../components/organisms'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'

// ─── Types ──────────────────────────────────────────────────────────────────────

type AccountType = 'Cash' | 'Bank'
type Direction = 'Income' | 'Expense'

interface Account {
    id: string
    name: string
    type: AccountType
    currency: string
    openingBalance: number
    balance: number
    bankName: string | null
    accountNumber: string | null
    isActive: boolean
}

interface Category {
    id: string
    name: string
    direction: Direction
    color: string
    isActive: boolean
}

interface Txn {
    id: string
    accountId: string
    accountName: string | null
    direction: Direction
    amount: number
    currency: string
    categoryId: string | null
    categoryName: string | null
    occurredOn: string
    description: string | null
    counterpartyName: string | null
    method: string | null
    isTransfer: boolean
    balanceAfter: number
    createdUtc: string
}

interface CatBreakdown { categoryId: string | null; name: string; color: string; amount: number }
interface Summary {
    from: string; to: string
    income: number; expense: number; profit: number
    incomeByCategory: CatBreakdown[]
    expenseByCategory: CatBreakdown[]
    accounts: Account[]
    totalCashBalance: number; totalBankBalance: number; totalBalance: number
}
interface ReportPeriod { period: string; income: number; expense: number; profit: number }
interface Report {
    from: string; to: string; groupBy: string
    periods: ReportPeriod[]
    totals: { income: number; expense: number; profit: number }
}

type Tab = 'profit' | 'income' | 'expense' | 'cash' | 'bank' | 'reports' | 'analytics'

const TABS: { key: Tab; icon: string }[] = [
    { key: 'income', icon: 'trending_up' },
    { key: 'expense', icon: 'trending_down' },
    { key: 'profit', icon: 'savings' },
    { key: 'cash', icon: 'point_of_sale' },
    { key: 'bank', icon: 'account_balance' },
    { key: 'reports', icon: 'calendar_month' },
    { key: 'analytics', icon: 'analytics' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const TODAY = iso(new Date())
const MONTH_START = (() => { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth(), 1)) })()
const money = (n: number, c = 'AZN') => `${(Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`
const fmtDate = (s: string | null) => (s ? s.slice(0, 10) : '—')

// ─── Page ─────────────────────────────────────────────────────────────────────

export function GymFinancePage() {
    const { t } = useTranslation()
    const { token } = useAuth()
    const [tab, setTab] = useState<Tab>('profit')

    const [accounts, setAccounts] = useState<Account[]>([])
    const [categories, setCategories] = useState<Category[]>([])

    const loadAccounts = useCallback(async () => {
        if (!token) return
        setAccounts(await apiRequest<Account[]>('/api/gym/finance/accounts', { token }))
    }, [token])
    const loadCategories = useCallback(async () => {
        if (!token) return
        setCategories(await apiRequest<Category[]>('/api/gym/finance/categories', { token }))
    }, [token])
    useEffect(() => { void loadAccounts(); void loadCategories() }, [loadAccounts, loadCategories])

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
                <div className="p-6 md:p-10 space-y-6">
                    <PageHeader
                        className="p-0 border-none shadow-none bg-transparent"
                        title={t('gym.finance.title')}
                        description={t('gym.finance.subtitle')}
                    />

                    <div className="flex flex-wrap gap-1.5">
                        {TABS.map((tb) => (
                            <button key={tb.key} onClick={() => setTab(tb.key)}
                                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                                    tab === tb.key ? 'bg-primary text-white shadow-sm' : 'bg-surface text-text-muted hover:bg-primary/5 hover:text-primary'
                                }`}>
                                <span className="material-symbols-outlined text-[18px]">{tb.icon}</span>
                                {t(`gym.finance.tabs.${tb.key}`)}
                            </button>
                        ))}
                    </div>

                    {tab === 'income' && <TxnTab direction="Income" accounts={accounts} categories={categories} token={token} onChanged={loadAccounts} reloadCategories={loadCategories} />}
                    {tab === 'expense' && <TxnTab direction="Expense" accounts={accounts} categories={categories} token={token} onChanged={loadAccounts} reloadCategories={loadCategories} />}
                    {tab === 'profit' && <ProfitTab token={token} />}
                    {tab === 'cash' && <AccountsTab type="Cash" accounts={accounts} token={token} reload={loadAccounts} />}
                    {tab === 'bank' && <AccountsTab type="Bank" accounts={accounts} token={token} reload={loadAccounts} />}
                    {tab === 'reports' && <ReportsTab token={token} />}
                    {tab === 'analytics' && <AnalyticsTab token={token} />}
                </div>
            </div>
        </AppLayout>
    )
}

// ─── Income / Expense tab ────────────────────────────────────────────────────────

function TxnTab({ direction, accounts, categories, token, onChanged, reloadCategories }: {
    direction: Direction; accounts: Account[]; categories: Category[]; token: string | null
    onChanged: () => Promise<void>; reloadCategories: () => Promise<void>
}) {
    const { t } = useTranslation()
    const base = direction === 'Income' ? 'income' : 'expense'
    const [items, setItems] = useState<Txn[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [catModal, setCatModal] = useState(false)
    const [editing, setEditing] = useState<Txn | null>(null)
    const cats = useMemo(() => categories.filter((c) => c.direction === direction), [categories, direction])

    const load = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try { setItems(await apiRequest<Txn[]>(`/api/gym/finance/transactions?direction=${direction}`, { token })) }
        finally { setLoading(false) }
    }, [token, direction])
    useEffect(() => { void load() }, [load])

    const [accountId, setAccountId] = useState('')
    const [amount, setAmount] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [occurredOn, setOccurredOn] = useState(TODAY)
    const [description, setDescription] = useState('')
    const [counterparty, setCounterparty] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const openCreate = () => {
        setEditing(null); setAccountId(accounts.find((a) => a.isActive)?.id ?? ''); setAmount(''); setCategoryId('')
        setOccurredOn(TODAY); setDescription(''); setCounterparty(''); setError(null); setOpen(true)
    }
    const openEdit = (txn: Txn) => {
        setEditing(txn); setAccountId(txn.accountId); setAmount(String(txn.amount)); setCategoryId(txn.categoryId ?? '')
        setOccurredOn(txn.occurredOn.slice(0, 10)); setDescription(txn.description ?? ''); setCounterparty(txn.counterpartyName ?? '')
        setError(null); setOpen(true)
    }

    const submit = async () => {
        if (!token) return
        const a = Number(amount)
        if (!accountId) { setError(t('gym.finance.fields.account')); return }
        if (!Number.isFinite(a) || a <= 0) { setError(t('gym.finance.fields.amount')); return }
        setBusy(true); setError(null)
        try {
            const body = JSON.stringify({
                direction, accountId, amount: a, categoryId: categoryId || null,
                occurredOn: occurredOn || null, description: description.trim() || null,
                counterpartyName: counterparty.trim() || null, method: null,
            })
            if (editing) await apiRequest(`/api/gym/finance/transactions/${editing.id}`, { method: 'PUT', token, body })
            else await apiRequest('/api/gym/finance/transactions', { method: 'POST', token, body })
            setOpen(false); await Promise.all([load(), onChanged()])
        } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }
    const remove = async (txn: Txn) => {
        if (!token || !confirm(t('gym.finance.deleteConfirm'))) return
        await apiRequest(`/api/gym/finance/transactions/${txn.id}`, { method: 'DELETE', token })
        await Promise.all([load(), onChanged()])
    }

    const tone = direction === 'Income' ? 'text-emerald-600' : 'text-rose-600'

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black text-text-dark">{t(`gym.finance.${base}.title`)}</h3>
                    <p className="text-sm text-text-muted">{t(`gym.finance.${base}.subtitle`)}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" icon="sell" onClick={() => setCatModal(true)}>{t('gym.finance.categories.manage')}</Button>
                    <Button icon="add" onClick={openCreate} disabled={accounts.length === 0}>{t(`gym.finance.${base}.new`)}</Button>
                </div>
            </div>

            <Card>
                {loading ? <Spinner /> : items.length === 0 ? (
                    <Empty icon={direction === 'Income' ? 'trending_up' : 'trending_down'} text={t(`gym.finance.${base}.empty`)} />
                ) : (
                    <Table head={[
                        t('gym.finance.common.date'), t('gym.finance.common.category'), t('gym.finance.common.account'),
                        t('gym.finance.common.counterparty'), t('gym.finance.common.amount'), '',
                    ]}>
                        {items.map((tx) => (
                            <tr key={tx.id} className="border-b border-border-light last:border-none hover:bg-background-light">
                                <td className="px-5 py-3 text-text-muted">{fmtDate(tx.occurredOn)}</td>
                                <td className="px-5 py-3 font-bold text-text-dark">{tx.categoryName || '—'}{tx.description ? <span className="block text-xs font-normal text-text-light">{tx.description}</span> : null}</td>
                                <td className="px-5 py-3 text-text-muted">{tx.accountName || '—'}</td>
                                <td className="px-5 py-3 text-text-muted">{tx.counterpartyName || '—'}</td>
                                <td className={`px-5 py-3 font-mono font-bold ${tone}`}>{direction === 'Income' ? '+' : '−'}{money(tx.amount, tx.currency)}</td>
                                <td className="px-5 py-3 text-right whitespace-nowrap">
                                    <RowBtn color="text-primary" onClick={() => openEdit(tx)} label={t('common.edit')} />
                                    <RowBtn color="text-error-text" onClick={() => remove(tx)} label={t('common.delete')} last />
                                </td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>

            <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? t(`gym.finance.${base}.edit`) : t(`gym.finance.${base}.new`)}>
                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('gym.finance.fields.amount')}><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
                        <Field label={t('gym.finance.fields.date')}><Input type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} /></Field>
                    </div>
                    <Field label={t('gym.finance.fields.account')}>
                        <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                            <option value="">{t('gym.finance.fields.selectAccount')}</option>
                            {accounts.filter((a) => a.isActive || a.id === accountId).map((a) => <option key={a.id} value={a.id}>{a.name} ({money(a.balance, a.currency)})</option>)}
                        </Select>
                    </Field>
                    <Field label={t('gym.finance.fields.category')}>
                        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                            <option value="">{t('gym.finance.common.uncategorized')}</option>
                            {cats.filter((c) => c.isActive || c.id === categoryId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </Field>
                    <Field label={t('gym.finance.fields.counterparty')}><Input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} /></Field>
                    <Field label={t('gym.finance.fields.description')}><Input value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
                    {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                    <div className="flex gap-3 pt-1">
                        <Button variant="outline" fullWidth onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                        <Button fullWidth isLoading={busy} onClick={submit}>{editing ? t('common.save') : t('common.create')}</Button>
                    </div>
                </div>
            </Modal>

            {catModal && <CategoriesModal direction={direction} categories={cats} token={token} onClose={() => setCatModal(false)} onChanged={reloadCategories} />}
        </>
    )
}

function CategoriesModal({ direction, categories, token, onClose, onChanged }: {
    direction: Direction; categories: Category[]; token: string | null; onClose: () => void; onChanged: () => Promise<void>
}) {
    const { t } = useTranslation()
    const [name, setName] = useState('')
    const [color, setColor] = useState('#6366f1')
    const [busy, setBusy] = useState(false)

    const add = async () => {
        if (!token || !name.trim()) return
        setBusy(true)
        try {
            await apiRequest('/api/gym/finance/categories', {
                method: 'POST', token, body: JSON.stringify({ name: name.trim(), direction, color, isActive: true }),
            })
            setName(''); setColor('#6366f1'); await onChanged()
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }
    const remove = async (id: string) => {
        if (!token) return
        await apiRequest(`/api/gym/finance/categories/${id}`, { method: 'DELETE', token })
        await onChanged()
    }

    return (
        <Modal isOpen onClose={onClose} title={t('gym.finance.categories.title')}>
            <div className="space-y-4 pt-2">
                <div className="flex items-end gap-2">
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                        className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border-base bg-transparent" />
                    <div className="flex-1"><Input placeholder={t('gym.finance.categories.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} /></div>
                    <Button isLoading={busy} disabled={!name.trim()} onClick={add}>{t('common.add')}</Button>
                </div>
                <div className="max-h-72 space-y-1.5 overflow-y-auto">
                    {categories.length === 0 ? (
                        <p className="py-6 text-center text-sm text-text-light">{t('gym.finance.categories.empty')}</p>
                    ) : categories.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 rounded-lg border border-border-light px-3 py-1.5">
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                            <span className="flex-1 truncate text-sm font-bold text-text-dark">{c.name}</span>
                            <button onClick={() => remove(c.id)} aria-label="delete" className="text-text-light hover:text-error-text">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    ))}
                </div>
                <Button variant="outline" fullWidth onClick={onClose}>{t('common.close')}</Button>
            </div>
        </Modal>
    )
}

// ─── Profit (overview) tab ───────────────────────────────────────────────────────

function ProfitTab({ token }: { token: string | null }) {
    const { t } = useTranslation()
    const [from, setFrom] = useState(MONTH_START)
    const [to, setTo] = useState(TODAY)
    const [data, setData] = useState<Summary | null>(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try { setData(await apiRequest<Summary>(`/api/gym/finance/summary?from=${from}&to=${to}`, { token })) }
        finally { setLoading(false) }
    }, [token, from, to])
    useEffect(() => { void load() }, [load])

    return (
        <>
            <RangeBar from={from} to={to} setFrom={setFrom} setTo={setTo} />
            {loading || !data ? <Spinner /> : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Kpi label={t('gym.finance.kpi.income')} value={money(data.income)} tone="text-emerald-600" icon="trending_up" />
                        <Kpi label={t('gym.finance.kpi.expense')} value={money(data.expense)} tone="text-rose-600" icon="trending_down" />
                        <Kpi label={t('gym.finance.kpi.profit')} value={money(data.profit)} tone={data.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'} icon="savings" />
                        <Kpi label={t('gym.finance.kpi.balance')} value={money(data.totalBalance)} tone="text-text-dark" icon="account_balance_wallet" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <BreakdownCard title={t('gym.finance.kpi.incomeByCategory')} items={data.incomeByCategory} total={data.income} empty={t('gym.finance.common.noData')} />
                        <BreakdownCard title={t('gym.finance.kpi.expenseByCategory')} items={data.expenseByCategory} total={data.expense} empty={t('gym.finance.common.noData')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Kpi label={t('gym.finance.kpi.cashBalance')} value={money(data.totalCashBalance)} tone="text-text-dark" icon="point_of_sale" />
                        <Kpi label={t('gym.finance.kpi.bankBalance')} value={money(data.totalBankBalance)} tone="text-text-dark" icon="account_balance" />
                    </div>
                </>
            )}
        </>
    )
}

// ─── Accounts tab (cash / bank) ──────────────────────────────────────────────────

function AccountsTab({ type, accounts, token, reload }: {
    type: AccountType; accounts: Account[]; token: string | null; reload: () => Promise<void>
}) {
    const { t } = useTranslation()
    const list = useMemo(() => accounts.filter((a) => a.type === type), [accounts, type])
    const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
    const [editing, setEditing] = useState<Account | null>(null)
    const [name, setName] = useState('')
    const [currency, setCurrency] = useState('AZN')
    const [openingBalance, setOpeningBalance] = useState('')
    const [bankName, setBankName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [transfer, setTransfer] = useState(false)

    const openCreate = () => { setEditing(null); setName(''); setCurrency('AZN'); setOpeningBalance(''); setBankName(''); setAccountNumber(''); setIsActive(true); setError(null); setModal('create') }
    const openEdit = (a: Account) => {
        setEditing(a); setName(a.name); setCurrency(a.currency); setOpeningBalance(String(a.openingBalance))
        setBankName(a.bankName ?? ''); setAccountNumber(a.accountNumber ?? ''); setIsActive(a.isActive); setError(null); setModal('edit')
    }
    const save = async () => {
        if (!token || !name.trim()) return
        setSaving(true); setError(null)
        try {
            const body = JSON.stringify({
                name: name.trim(), type, currency: currency.trim() || 'AZN', openingBalance: Number(openingBalance) || 0,
                bankName: bankName.trim() || null, accountNumber: accountNumber.trim() || null, isActive,
            })
            if (modal === 'create') await apiRequest('/api/gym/finance/accounts', { method: 'POST', token, body })
            else if (editing) await apiRequest(`/api/gym/finance/accounts/${editing.id}`, { method: 'PUT', token, body })
            setModal(null); setEditing(null); await reload()
        } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
        finally { setSaving(false) }
    }
    const remove = async () => {
        if (!token || !editing) return
        setSaving(true); setError(null)
        try { await apiRequest(`/api/gym/finance/accounts/${editing.id}`, { method: 'DELETE', token }); setModal(null); setEditing(null); await reload() }
        catch (e) { setError(e instanceof Error ? e.message : 'Delete failed') }
        finally { setSaving(false) }
    }

    const base = type === 'Cash' ? 'cash' : 'bank'
    const total = list.reduce((s, a) => s + a.balance, 0)

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black text-text-dark">{t(`gym.finance.${base}.title`)}</h3>
                    <p className="text-sm text-text-muted">{t(`gym.finance.${base}.subtitle`)}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" icon="swap_horiz" onClick={() => setTransfer(true)} disabled={accounts.length < 2}>{t('gym.finance.transfer.action')}</Button>
                    <Button icon="add" onClick={openCreate}>{t(`gym.finance.${base}.new`)}</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.length === 0 ? (
                    <div className="sm:col-span-2 lg:col-span-3"><Card><Empty icon={type === 'Cash' ? 'point_of_sale' : 'account_balance'} text={t(`gym.finance.${base}.empty`)} /></Card></div>
                ) : list.map((a) => (
                    <div key={a.id} className="bg-surface rounded-2xl shadow-sm p-5 space-y-3">
                        <div className="flex items-start justify-between">
                            <div className="min-w-0">
                                <p className="font-black text-text-dark truncate">{a.name}</p>
                                {type === 'Bank' && <p className="text-xs text-text-light truncate">{[a.bankName, a.accountNumber].filter(Boolean).join(' · ') || '—'}</p>}
                                {!a.isActive && <Pill className="mt-1 bg-slate-100 text-text-light">{t('gym.finance.inactive')}</Pill>}
                            </div>
                            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${type === 'Cash' ? 'bg-amber-500/10 text-amber-600' : 'bg-sky-500/10 text-sky-600'}`}>
                                <span className="material-symbols-outlined text-[20px]">{type === 'Cash' ? 'point_of_sale' : 'account_balance'}</span>
                            </span>
                        </div>
                        <p className={`text-2xl font-black ${a.balance >= 0 ? 'text-text-dark' : 'text-rose-600'}`}>{money(a.balance, a.currency)}</p>
                        <div className="flex justify-end gap-3 border-t border-border-light pt-2">
                            <RowBtn color="text-primary" onClick={() => openEdit(a)} label={t('common.edit')} />
                            <RowBtn color="text-error-text" onClick={() => { setEditing(a); setModal('delete') }} label={t('common.delete')} last />
                        </div>
                    </div>
                ))}
            </div>
            {list.length > 0 && <p className="text-right text-sm font-bold text-text-dark">{t('gym.finance.common.total')}: {money(total)}</p>}

            <Modal isOpen={modal === 'create' || modal === 'edit'} onClose={() => { setModal(null); setEditing(null) }} title={modal === 'create' ? t(`gym.finance.${base}.new`) : t(`gym.finance.${base}.edit`)}>
                <div className="space-y-4 pt-2">
                    <Field label={t('gym.finance.fields.name')}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
                    {type === 'Bank' && (
                        <div className="grid grid-cols-2 gap-3">
                            <Field label={t('gym.finance.fields.bankName')}><Input value={bankName} onChange={(e) => setBankName(e.target.value)} /></Field>
                            <Field label={t('gym.finance.fields.accountNumber')}><Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /></Field>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('gym.finance.fields.openingBalance')}><Input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} /></Field>
                        <Field label={t('gym.finance.fields.currency')}><Input value={currency} onChange={(e) => setCurrency(e.target.value)} /></Field>
                    </div>
                    <Check label={t('gym.finance.fields.active')} checked={isActive} onChange={setIsActive} />
                    {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                    <div className="flex gap-3 pt-1">
                        <Button variant="outline" fullWidth onClick={() => { setModal(null); setEditing(null) }}>{t('common.cancel')}</Button>
                        <Button fullWidth isLoading={saving} disabled={!name.trim()} onClick={save}>{modal === 'create' ? t('common.create') : t('common.save')}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={modal === 'delete'} onClose={() => { setModal(null); setEditing(null) }} title={t(`gym.finance.${base}.deleteTitle`)}>
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-text-dark">{t('gym.finance.deletePrefix')} <strong>{editing?.name}</strong>?</p>
                    {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                    <div className="flex gap-3">
                        <Button variant="outline" fullWidth onClick={() => { setModal(null); setEditing(null) }}>{t('common.cancel')}</Button>
                        <Button variant="danger" fullWidth isLoading={saving} onClick={remove}>{t('common.delete')}</Button>
                    </div>
                </div>
            </Modal>

            {transfer && <TransferModal accounts={accounts} token={token} onClose={() => setTransfer(false)} onDone={async () => { setTransfer(false); await reload() }} />}
        </>
    )
}

function TransferModal({ accounts, token, onClose, onDone }: {
    accounts: Account[]; token: string | null; onClose: () => void; onDone: () => Promise<void>
}) {
    const { t } = useTranslation()
    const active = accounts.filter((a) => a.isActive)
    const [fromId, setFromId] = useState(active[0]?.id ?? '')
    const [toId, setToId] = useState(active[1]?.id ?? '')
    const [amount, setAmount] = useState('')
    const [occurredOn, setOccurredOn] = useState(TODAY)
    const [description, setDescription] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const submit = async () => {
        if (!token) return
        const a = Number(amount)
        if (!fromId || !toId || fromId === toId) { setError(t('gym.finance.transfer.sameAccount')); return }
        if (!Number.isFinite(a) || a <= 0) { setError(t('gym.finance.fields.amount')); return }
        setBusy(true); setError(null)
        try {
            await apiRequest('/api/gym/finance/transfers', {
                method: 'POST', token,
                body: JSON.stringify({ fromAccountId: fromId, toAccountId: toId, amount: a, occurredOn: occurredOn || null, description: description.trim() || null }),
            })
            await onDone()
        } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }

    return (
        <Modal isOpen onClose={onClose} title={t('gym.finance.transfer.title')}>
            <div className="space-y-4 pt-2">
                <Field label={t('gym.finance.transfer.from')}>
                    <Select value={fromId} onChange={(e) => setFromId(e.target.value)}>
                        {active.map((a) => <option key={a.id} value={a.id}>{a.name} ({money(a.balance, a.currency)})</option>)}
                    </Select>
                </Field>
                <Field label={t('gym.finance.transfer.to')}>
                    <Select value={toId} onChange={(e) => setToId(e.target.value)}>
                        {active.map((a) => <option key={a.id} value={a.id}>{a.name} ({money(a.balance, a.currency)})</option>)}
                    </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label={t('gym.finance.fields.amount')}><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
                    <Field label={t('gym.finance.fields.date')}><Input type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} /></Field>
                </div>
                <Field label={t('gym.finance.fields.description')}><Input value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
                {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                <div className="flex gap-3 pt-1">
                    <Button variant="outline" fullWidth onClick={onClose}>{t('common.cancel')}</Button>
                    <Button fullWidth isLoading={busy} onClick={submit}>{t('gym.finance.transfer.action')}</Button>
                </div>
            </div>
        </Modal>
    )
}

// ─── Reports tab ─────────────────────────────────────────────────────────────────

function ReportsTab({ token }: { token: string | null }) {
    const { t } = useTranslation()
    const d = new Date()
    const [from, setFrom] = useState(iso(new Date(d.getFullYear(), d.getMonth() - 11, 1)))
    const [to, setTo] = useState(TODAY)
    const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('month')
    const [data, setData] = useState<Report | null>(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try { setData(await apiRequest<Report>(`/api/gym/finance/reports?from=${from}&to=${to}&groupBy=${groupBy}`, { token })) }
        finally { setLoading(false) }
    }, [token, from, to, groupBy])
    useEffect(() => { void load() }, [load])

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-end gap-3">
                <RangeBar from={from} to={to} setFrom={setFrom} setTo={setTo} inline />
                <Field label={t('gym.finance.reports.groupBy')}>
                    <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value as 'day' | 'month' | 'year')}>
                        <option value="day">{t('gym.finance.reports.day')}</option>
                        <option value="month">{t('gym.finance.reports.month')}</option>
                        <option value="year">{t('gym.finance.reports.year')}</option>
                    </Select>
                </Field>
            </div>

            <Card>
                {loading || !data ? <Spinner /> : data.periods.length === 0 ? (
                    <Empty icon="calendar_month" text={t('gym.finance.common.noData')} />
                ) : (
                    <Table head={[
                        t('gym.finance.reports.period'), t('gym.finance.kpi.income'), t('gym.finance.kpi.expense'), t('gym.finance.kpi.profit'),
                    ]}>
                        {data.periods.map((p) => (
                            <tr key={p.period} className="border-b border-border-light last:border-none hover:bg-background-light">
                                <td className="px-5 py-3 font-mono font-bold text-text-dark">{p.period}</td>
                                <td className="px-5 py-3 font-mono text-emerald-600">{money(p.income)}</td>
                                <td className="px-5 py-3 font-mono text-rose-600">{money(p.expense)}</td>
                                <td className={`px-5 py-3 font-mono font-bold ${p.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{money(p.profit)}</td>
                            </tr>
                        ))}
                        <tr className="bg-background-light font-black">
                            <td className="px-5 py-3 text-text-dark uppercase text-xs tracking-widest">{t('gym.finance.common.total')}</td>
                            <td className="px-5 py-3 font-mono text-emerald-600">{money(data.totals.income)}</td>
                            <td className="px-5 py-3 font-mono text-rose-600">{money(data.totals.expense)}</td>
                            <td className={`px-5 py-3 font-mono ${data.totals.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{money(data.totals.profit)}</td>
                        </tr>
                    </Table>
                )}
            </Card>
        </>
    )
}

// ─── Analytics tab ───────────────────────────────────────────────────────────────

function AnalyticsTab({ token }: { token: string | null }) {
    const { t } = useTranslation()
    const d = new Date()
    const from = iso(new Date(d.getFullYear(), d.getMonth() - 11, 1))
    const [report, setReport] = useState<Report | null>(null)
    const [summary, setSummary] = useState<Summary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!token) return
        setLoading(true)
        Promise.all([
            apiRequest<Report>(`/api/gym/finance/reports?from=${from}&to=${TODAY}&groupBy=month`, { token }),
            apiRequest<Summary>(`/api/gym/finance/summary?from=${from}&to=${TODAY}`, { token }),
        ]).then(([r, s]) => { setReport(r); setSummary(s) }).finally(() => setLoading(false))
    }, [token, from])

    const maxVal = useMemo(() => {
        if (!report) return 1
        return Math.max(1, ...report.periods.map((p) => Math.max(p.income, p.expense)))
    }, [report])

    if (loading || !report || !summary) return <Spinner />

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi label={t('gym.finance.analytics.income12m')} value={money(report.totals.income)} tone="text-emerald-600" icon="trending_up" />
                <Kpi label={t('gym.finance.analytics.expense12m')} value={money(report.totals.expense)} tone="text-rose-600" icon="trending_down" />
                <Kpi label={t('gym.finance.analytics.profit12m')} value={money(report.totals.profit)} tone={report.totals.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'} icon="savings" />
                <Kpi label={t('gym.finance.kpi.balance')} value={money(summary.totalBalance)} tone="text-text-dark" icon="account_balance_wallet" />
            </div>

            <div className="bg-surface rounded-2xl shadow-sm p-5">
                <p className="text-xs font-black uppercase tracking-widest text-text-light mb-4">{t('gym.finance.analytics.trend')}</p>
                {report.periods.length === 0 ? (
                    <p className="py-8 text-center text-sm text-text-light">{t('gym.finance.common.noData')}</p>
                ) : (
                    <div className="flex items-end gap-2 h-48 overflow-x-auto">
                        {report.periods.map((p) => (
                            <div key={p.period} className="flex flex-col items-center gap-1 min-w-9 flex-1">
                                <div className="flex items-end gap-0.5 h-40 w-full justify-center">
                                    <div className="w-2.5 rounded-t bg-emerald-400" style={{ height: `${Math.max(2, (p.income / maxVal) * 100)}%` }} title={`+${money(p.income)}`} />
                                    <div className="w-2.5 rounded-t bg-rose-400" style={{ height: `${Math.max(2, (p.expense / maxVal) * 100)}%` }} title={`−${money(p.expense)}`} />
                                </div>
                                <span className="text-[9px] text-text-light whitespace-nowrap">{p.period.slice(2)}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-4 mt-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-400" /> {t('gym.finance.kpi.income')}</span>
                    <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-rose-400" /> {t('gym.finance.kpi.expense')}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BreakdownCard title={t('gym.finance.kpi.incomeByCategory')} items={summary.incomeByCategory} total={summary.income} empty={t('gym.finance.common.noData')} />
                <BreakdownCard title={t('gym.finance.kpi.expenseByCategory')} items={summary.expenseByCategory} total={summary.expense} empty={t('gym.finance.common.noData')} />
            </div>
        </>
    )
}

// ─── Shared UI bits ─────────────────────────────────────────────────────────────

function RangeBar({ from, to, setFrom, setTo, inline }: {
    from: string; to: string; setFrom: (v: string) => void; setTo: (v: string) => void; inline?: boolean
}) {
    const { t } = useTranslation()
    return (
        <div className={`flex flex-wrap items-end gap-3 ${inline ? '' : 'bg-surface rounded-2xl shadow-sm p-4'}`}>
            <Field label={t('gym.finance.common.from')}><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label={t('gym.finance.common.to')}><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
    )
}

function Kpi({ label, value, tone, icon }: { label: string; value: string; tone: string; icon: string }) {
    return (
        <div className="bg-surface rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-light">{label}</p>
                <span className="material-symbols-outlined text-[20px] text-text-light">{icon}</span>
            </div>
            <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
        </div>
    )
}

function BreakdownCard({ title, items, total, empty }: { title: string; items: CatBreakdown[]; total: number; empty: string }) {
    return (
        <div className="bg-surface rounded-2xl shadow-sm p-5">
            <p className="text-xs font-black uppercase tracking-widest text-text-light mb-4">{title}</p>
            {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-light">{empty}</p>
            ) : (
                <div className="space-y-3">
                    {items.map((it, i) => {
                        const pct = total > 0 ? (it.amount / total) * 100 : 0
                        return (
                            <div key={it.categoryId ?? `none-${i}`}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="flex items-center gap-2 text-text-dark font-bold">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: it.color }} />
                                        {it.name}
                                    </span>
                                    <span className="font-mono text-text-muted">{money(it.amount)} · {pct.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-background-light overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: it.color }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function Card({ children }: { children: React.ReactNode }) {
    return <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">{children}</div>
}
function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-text-light border-b border-border-light">
                        {head.map((h, i) => <th key={i} className={`px-5 py-3 ${i === head.length - 1 && h === '' ? 'text-right' : 'text-left'}`}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    )
}
function Empty({ icon, text }: { icon: string; text: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-text-light">
            <span className="material-symbols-outlined text-4xl">{icon}</span>
            <p className="text-sm">{text}</p>
        </div>
    )
}
function Spinner() {
    return <div className="flex items-center justify-center py-16"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>
}
function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${className}`}>{children}</span>
}
function RowBtn({ label, color, onClick, last }: { label: string; color: string; onClick: () => void; last?: boolean }) {
    return <button onClick={onClick} className={`text-[10px] font-black uppercase tracking-widest hover:underline ${color} ${last ? '' : 'mr-3'}`}>{label}</button>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-light">{label}</label>
            {children}
        </div>
    )
}
function Select({ value, onChange, children }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }) {
    return (
        <select value={value} onChange={onChange}
            className="h-9 w-full rounded-md border border-border-base bg-slate-75 px-3 text-xs text-text-base outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20">
            {children}
        </select>
    )
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary/30" />
            <span className="text-sm font-bold text-text-dark">{label}</span>
        </label>
    )
}
