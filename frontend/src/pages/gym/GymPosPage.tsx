import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../../components/templates'
import { Button, Input } from '../../components/atoms'
import { PageHeader, Modal } from '../../components/organisms'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Product {
    id: string
    name: string
    sku: string | null
    category: string | null
    unit: string
    salePrice: number
    currency: string
    stockQuantity: number
    isActive: boolean
}

interface Account { id: string; name: string; type: 'Cash' | 'Bank'; currency: string; balance: number; isActive: boolean }
interface MiniCustomer { id: string; firstName: string; lastName: string | null; phone: string | null }

type PaymentMethod = 'Cash' | 'Card' | 'Transfer'
type SaleStatus = 'Completed' | 'Refunded'

interface SaleItem { id: string; productId: string | null; productName: string; quantity: number; unitPrice: number; lineTotal: number }
interface Sale {
    id: string
    number: string
    customerId: string | null
    customerName: string | null
    subtotal: number
    discount: number
    total: number
    currency: string
    paymentMethod: PaymentMethod
    financeAccountId: string | null
    status: SaleStatus
    soldUtc: string
    refundedUtc: string | null
    note: string | null
    userEmail: string | null
    itemCount: number
    items: SaleItem[] | null
}

interface CartLine { product: Product; qty: number }

const METHODS: PaymentMethod[] = ['Cash', 'Card', 'Transfer']
const money = (n: number, c = 'AZN') => `${(Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`
const fmtDateTime = (s: string | null) => (s ? s.slice(0, 16).replace('T', ' ') : '—')
const custName = (c: MiniCustomer) => [c.firstName, c.lastName].filter(Boolean).join(' ')

// ─── Page ─────────────────────────────────────────────────────────────────────

export function GymPosPage() {
    const { t } = useTranslation()
    const { token } = useAuth()
    const [tab, setTab] = useState<'checkout' | 'history'>('checkout')

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
                <div className="p-6 md:p-10 space-y-6">
                    <PageHeader className="p-0 border-none shadow-none bg-transparent" title={t('gym.pos.title')} description={t('gym.pos.subtitle')} />
                    <div className="flex flex-wrap gap-1.5">
                        {(['checkout', 'history'] as const).map((k) => (
                            <button key={k} onClick={() => setTab(k)}
                                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                                    tab === k ? 'bg-primary text-white shadow-sm' : 'bg-surface text-text-muted hover:bg-primary/5 hover:text-primary'
                                }`}>
                                <span className="material-symbols-outlined text-[18px]">{k === 'checkout' ? 'point_of_sale' : 'receipt_long'}</span>
                                {t(`gym.pos.tabs.${k}`)}
                            </button>
                        ))}
                    </div>
                    {tab === 'checkout' ? <CheckoutTab token={token} /> : <HistoryTab token={token} />}
                </div>
            </div>
        </AppLayout>
    )
}

// ─── Checkout tab ───────────────────────────────────────────────────────────────

function CheckoutTab({ token }: { token: string | null }) {
    const { t } = useTranslation()
    const [products, setProducts] = useState<Product[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [customers, setCustomers] = useState<MiniCustomer[]>([])
    const [search, setSearch] = useState('')

    const [cart, setCart] = useState<CartLine[]>([])
    const [discount, setDiscount] = useState('')
    const [customerId, setCustomerId] = useState('')
    const [method, setMethod] = useState<PaymentMethod>('Cash')
    const [accountId, setAccountId] = useState('')
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState<string | null>(null)

    const loadProducts = useCallback(async () => {
        if (!token) return
        const list = await apiRequest<Product[]>('/api/gym/products', { token })
        setProducts(list.filter((p) => p.isActive))
    }, [token])
    useEffect(() => {
        if (!token) return
        void loadProducts()
        apiRequest<Account[]>('/api/gym/finance/accounts', { token }).then((a) => {
            const act = a.filter((x) => x.isActive)
            setAccounts(act)
            setAccountId((prev) => prev || act.find((x) => x.type === 'Cash')?.id || act[0]?.id || '')
        }).catch(() => setAccounts([]))
        apiRequest<MiniCustomer[]>('/api/gym/customers', { token }).then(setCustomers).catch(() => setCustomers([]))
    }, [token, loadProducts])

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase()
        if (!s) return products
        return products.filter((p) => p.name.toLowerCase().includes(s) || (p.sku ?? '').toLowerCase().includes(s) || (p.category ?? '').toLowerCase().includes(s))
    }, [products, search])

    const inCart = (id: string) => cart.find((l) => l.product.id === id)?.qty ?? 0
    const addToCart = (p: Product) => {
        setError(null); setDone(null)
        setCart((prev) => {
            const ex = prev.find((l) => l.product.id === p.id)
            const cur = ex?.qty ?? 0
            if (cur + 1 > p.stockQuantity) return prev
            if (ex) return prev.map((l) => l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l)
            return [...prev, { product: p, qty: 1 }]
        })
    }
    const setQty = (id: string, qty: number) => setCart((prev) => prev.flatMap((l) => {
        if (l.product.id !== id) return [l]
        const clamped = Math.max(0, Math.min(qty, l.product.stockQuantity))
        return clamped === 0 ? [] : [{ ...l, qty: clamped }]
    }))
    const removeLine = (id: string) => setCart((prev) => prev.filter((l) => l.product.id !== id))

    const subtotal = useMemo(() => cart.reduce((s, l) => s + l.qty * l.product.salePrice, 0), [cart])
    const disc = Math.max(0, Number(discount) || 0)
    const total = Math.max(0, subtotal - disc)
    const currency = accounts.find((a) => a.id === accountId)?.currency ?? cart[0]?.product.currency ?? 'AZN'

    const checkout = async () => {
        if (!token || cart.length === 0) return
        setBusy(true); setError(null); setDone(null)
        try {
            const sale = await apiRequest<Sale>('/api/gym/pos/sales', {
                method: 'POST', token,
                body: JSON.stringify({
                    customerId: customerId || null,
                    items: cart.map((l) => ({ productId: l.product.id, quantity: l.qty, unitPrice: l.product.salePrice })),
                    discount: disc,
                    paymentMethod: method,
                    financeAccountId: accountId || null,
                    financeCategoryId: null,
                    note: note.trim() || null,
                }),
            })
            setCart([]); setDiscount(''); setNote(''); setCustomerId('')
            setDone(sale.number)
            await loadProducts()
        } catch (e) { setError(e instanceof Error ? e.message : 'Checkout failed') }
        finally { setBusy(false) }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product picker */}
            <div className="lg:col-span-2 space-y-4">
                <Input icon="search" placeholder={t('gym.pos.searchProducts')} value={search} onChange={(e) => setSearch(e.target.value)} />
                {products.length === 0 ? (
                    <Card><Empty icon="inventory_2" text={t('gym.pos.noProducts')} /></Card>
                ) : filtered.length === 0 ? (
                    <Card><Empty icon="search_off" text={t('gym.pos.notFound')} /></Card>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filtered.map((p) => {
                            const out = p.stockQuantity <= 0
                            const taken = inCart(p.id)
                            return (
                                <button key={p.id} onClick={() => addToCart(p)} disabled={out || taken >= p.stockQuantity}
                                    className="relative flex flex-col items-start gap-1 rounded-2xl bg-surface p-4 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none">
                                    {taken > 0 && <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white">{taken}</span>}
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                                    </span>
                                    <span className="mt-1 line-clamp-2 text-sm font-bold text-text-dark">{p.name}</span>
                                    <span className="text-sm font-black text-primary">{money(p.salePrice, p.currency)}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${out ? 'text-rose-600' : 'text-text-light'}`}>
                                        {out ? t('gym.pos.outOfStock') : `${t('gym.pos.inStock')}: ${p.stockQuantity} ${p.unit}`}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Cart */}
            <div className="lg:col-span-1">
                <div className="bg-surface rounded-2xl shadow-sm p-5 space-y-4 lg:sticky lg:top-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-text-dark">{t('gym.pos.cart')}</h3>
                        {cart.length > 0 && <button onClick={() => setCart([])} className="text-[10px] font-black uppercase tracking-widest text-error-text hover:underline">{t('gym.pos.clear')}</button>}
                    </div>

                    {done && (
                        <div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{t('gym.pos.saleDone', { number: done })}</div>
                    )}

                    {cart.length === 0 ? (
                        <p className="py-8 text-center text-sm text-text-light">{t('gym.pos.cartEmpty')}</p>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {cart.map((l) => (
                                <div key={l.product.id} className="flex items-center gap-2 rounded-xl border border-border-light p-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-text-dark">{l.product.name}</p>
                                        <p className="text-xs text-text-light">{money(l.product.salePrice, l.product.currency)}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Stepper onClick={() => setQty(l.product.id, l.qty - 1)} icon="remove" />
                                        <input value={l.qty}
                                            onChange={(e) => setQty(l.product.id, parseInt(e.target.value, 10) || 0)}
                                            className="h-7 w-10 rounded-md border border-border-base bg-slate-75 text-center text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20" />
                                        <Stepper onClick={() => setQty(l.product.id, l.qty + 1)} icon="add" disabled={l.qty >= l.product.stockQuantity} />
                                    </div>
                                    <span className="w-16 shrink-0 text-right text-sm font-bold text-text-dark">{money(l.qty * l.product.salePrice, l.product.currency)}</span>
                                    <button onClick={() => removeLine(l.product.id)} className="text-text-light hover:text-error-text" aria-label="remove">
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Totals */}
                    <div className="space-y-1.5 border-t border-border-light pt-3 text-sm">
                        <Row label={t('gym.pos.subtotal')} value={money(subtotal, currency)} />
                        <div className="flex items-center justify-between">
                            <span className="text-text-muted">{t('gym.pos.discount')}</span>
                            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0"
                                className="h-8 w-24 rounded-md border border-border-base bg-slate-75 px-2 text-right text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="flex items-center justify-between pt-1 text-base font-black text-text-dark">
                            <span>{t('gym.pos.total')}</span><span className="text-primary">{money(total, currency)}</span>
                        </div>
                    </div>

                    {/* Payment options */}
                    <div className="space-y-3 border-t border-border-light pt-3">
                        <div>
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-text-light">{t('gym.pos.paymentMethod')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {METHODS.map((m) => (
                                    <button key={m} onClick={() => setMethod(m)}
                                        className={`rounded-lg px-2 py-2 text-xs font-bold transition-colors ${method === m ? 'bg-primary text-white' : 'bg-slate-75 text-text-muted hover:bg-primary/10'}`}>
                                        {t(`gym.pos.methods.${m}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Labeled label={t('gym.pos.account')}>
                            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                                <option value="">{t('gym.pos.noAccount')}</option>
                                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({money(a.balance, a.currency)})</option>)}
                            </Select>
                        </Labeled>
                        <Labeled label={t('gym.pos.customer')}>
                            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                                <option value="">{t('gym.pos.walkIn')}</option>
                                {customers.map((c) => <option key={c.id} value={c.id}>{custName(c)}{c.phone ? ` · ${c.phone}` : ''}</option>)}
                            </Select>
                        </Labeled>
                        <Labeled label={t('gym.pos.note')}>
                            <Input value={note} onChange={(e) => setNote(e.target.value)} />
                        </Labeled>
                    </div>

                    {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                    <Button fullWidth size="lg" icon="payments" isLoading={busy} disabled={cart.length === 0} onClick={checkout}>
                        {t('gym.pos.charge', { total: money(total, currency) })}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── History tab ────────────────────────────────────────────────────────────────

function HistoryTab({ token }: { token: string | null }) {
    const { t } = useTranslation()
    const [items, setItems] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const [viewing, setViewing] = useState<Sale | null>(null)
    const [busy, setBusy] = useState(false)

    const load = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try { setItems(await apiRequest<Sale[]>('/api/gym/pos/sales', { token })) }
        finally { setLoading(false) }
    }, [token])
    useEffect(() => { void load() }, [load])

    const openView = async (s: Sale) => {
        if (!token) return
        try { setViewing(await apiRequest<Sale>(`/api/gym/pos/sales/${s.id}`, { token })) }
        catch { setViewing(s) }
    }
    const refund = async (id: string) => {
        if (!token || !confirm(t('gym.pos.refundConfirm'))) return
        setBusy(true)
        try { await apiRequest(`/api/gym/pos/sales/${id}/refund`, { method: 'POST', token }); setViewing(null); await load() }
        catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }

    return (
        <>
            <Card>
                {loading ? <Spinner /> : items.length === 0 ? (
                    <Empty icon="receipt_long" text={t('gym.pos.noSales')} />
                ) : (
                    <Table head={[
                        t('gym.pos.columns.number'), t('gym.pos.columns.date'), t('gym.pos.columns.customer'),
                        t('gym.pos.columns.items'), t('gym.pos.columns.method'), t('gym.pos.columns.total'), t('gym.pos.columns.status'), '',
                    ]}>
                        {items.map((s) => (
                            <tr key={s.id} className="border-b border-border-light last:border-none hover:bg-background-light cursor-pointer" onClick={() => openView(s)}>
                                <td className="px-5 py-3 font-mono font-bold text-text-dark">{s.number}</td>
                                <td className="px-5 py-3 text-text-muted">{fmtDateTime(s.soldUtc)}</td>
                                <td className="px-5 py-3 text-text-muted">{s.customerName || t('gym.pos.walkIn')}</td>
                                <td className="px-5 py-3 text-text-muted">{s.itemCount}</td>
                                <td className="px-5 py-3 text-text-muted">{t(`gym.pos.methods.${s.paymentMethod}`)}</td>
                                <td className="px-5 py-3 font-bold text-text-dark">{money(s.total, s.currency)}</td>
                                <td className="px-5 py-3">
                                    <Pill className={s.status === 'Refunded' ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'}>{t(`gym.pos.statuses.${s.status}`)}</Pill>
                                </td>
                                <td className="px-5 py-3 text-right"><span className="material-symbols-outlined text-text-light">chevron_right</span></td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>

            <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={viewing ? t('gym.pos.receipt', { number: viewing.number }) : ''}>
                {viewing && (
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">{fmtDateTime(viewing.soldUtc)}</span>
                            <Pill className={viewing.status === 'Refunded' ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'}>{t(`gym.pos.statuses.${viewing.status}`)}</Pill>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">{t('gym.pos.customer')}</span>
                            <span className="font-bold text-text-dark">{viewing.customerName || t('gym.pos.walkIn')}</span>
                        </div>
                        <div className="space-y-1.5 border-t border-border-light pt-3">
                            {(viewing.items ?? []).map((it) => (
                                <div key={it.id} className="flex items-center justify-between text-sm">
                                    <span className="min-w-0 truncate text-text-dark">{it.productName} <span className="text-text-light">× {it.quantity}</span></span>
                                    <span className="shrink-0 font-mono text-text-muted">{money(it.lineTotal, viewing.currency)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-1 border-t border-border-light pt-3 text-sm">
                            <Row label={t('gym.pos.subtotal')} value={money(viewing.subtotal, viewing.currency)} />
                            {viewing.discount > 0 && <Row label={t('gym.pos.discount')} value={`− ${money(viewing.discount, viewing.currency)}`} />}
                            <div className="flex items-center justify-between text-base font-black text-text-dark">
                                <span>{t('gym.pos.total')}</span><span className="text-primary">{money(viewing.total, viewing.currency)}</span>
                            </div>
                            <Row label={t('gym.pos.paymentMethod')} value={t(`gym.pos.methods.${viewing.paymentMethod}`)} />
                        </div>
                        {viewing.note && <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-text-muted">{viewing.note}</p>}
                        <div className="flex gap-3 border-t border-border-light pt-3">
                            {viewing.status === 'Completed' && (
                                <Button variant="danger" icon="undo" isLoading={busy} onClick={() => refund(viewing.id)}>{t('gym.pos.refund')}</Button>
                            )}
                            <Button variant="outline" className="ml-auto" onClick={() => setViewing(null)}>{t('common.close')}</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    )
}

// ─── Shared UI bits ─────────────────────────────────────────────────────────────

function Stepper({ icon, onClick, disabled }: { icon: string; onClick: () => void; disabled?: boolean }) {
    return (
        <button onClick={onClick} disabled={disabled}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-text-muted hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:pointer-events-none">
            <span className="material-symbols-outlined text-[16px]">{icon}</span>
        </button>
    )
}
function Row({ label, value }: { label: string; value: string }) {
    return <div className="flex items-center justify-between"><span className="text-text-muted">{label}</span><span className="font-mono text-text-dark">{value}</span></div>
}
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
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
