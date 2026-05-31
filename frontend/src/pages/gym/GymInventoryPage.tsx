import { useEffect, useMemo, useState } from 'react'
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
    barcode: string | null
    category: string | null
    unit: string
    salePrice: number
    cost: number
    currency: string
    stockQuantity: number
    minStock: number
    supplierId: string | null
    supplierName: string | null
    isLow: boolean
    isActive: boolean
}

interface Supplier {
    id: string
    name: string
    contactName: string | null
    phone: string | null
    email: string | null
    address: string | null
    notes: string | null
    isActive: boolean
}

type MovementType = 'Receipt' | 'WriteOff' | 'Stocktake' | 'Purchase' | 'Sale'

interface Movement {
    id: string
    productId: string
    productName: string | null
    type: MovementType
    quantity: number
    unitCost: number
    balanceAfter: number
    reason: string | null
    reference: string | null
    userEmail: string | null
    createdUtc: string
}

type PurchaseStatus = 'Draft' | 'Ordered' | 'Received' | 'Cancelled'

interface PurchaseItem {
    id: string
    productId: string
    productName: string
    quantity: number
    unitCost: number
}

interface Purchase {
    id: string
    number: string
    supplierId: string | null
    supplierName: string
    status: PurchaseStatus
    expectedDate: string | null
    receivedUtc: string | null
    currency: string
    total: number
    notes: string | null
    createdUtc: string
    itemCount: number
    items: PurchaseItem[] | null
}

type StocktakeStatus = 'Draft' | 'Completed' | 'Cancelled'

interface StocktakeItem {
    id: string
    productId: string
    productName: string
    expectedQuantity: number
    countedQuantity: number
    difference: number
}

interface Stocktake {
    id: string
    number: string
    status: StocktakeStatus
    completedUtc: string | null
    notes: string | null
    createdUtc: string
    itemCount: number
    items: StocktakeItem[] | null
}

type Tab = 'stock' | 'receipts' | 'writeoffs' | 'stocktakes' | 'lowStock' | 'suppliers' | 'purchases'

const TABS: { key: Tab; icon: string }[] = [
    { key: 'stock', icon: 'inventory_2' },
    { key: 'receipts', icon: 'input' },
    { key: 'writeoffs', icon: 'output' },
    { key: 'stocktakes', icon: 'fact_check' },
    { key: 'lowStock', icon: 'warning' },
    { key: 'suppliers', icon: 'local_shipping' },
    { key: 'purchases', icon: 'shopping_cart' },
]

const STATUS_STYLE: Record<string, string> = {
    Draft: 'bg-slate-100 text-text-light',
    Ordered: 'bg-amber-50 text-amber-700',
    Received: 'bg-green-50 text-green-600',
    Completed: 'bg-green-50 text-green-600',
    Cancelled: 'bg-rose-50 text-rose-600',
}

const fmt = (n: number) => {
    const r = Math.round(n * 1000) / 1000
    return Number.isInteger(r) ? r.toString() : r.toString()
}
const money = (n: number, c = 'AZN') => `${(Math.round(n * 100) / 100).toFixed(2)} ${c}`
const fmtDate = (s: string | null) => (s ? s.slice(0, 10) : '—')

// ─── Page ─────────────────────────────────────────────────────────────────────

export function GymInventoryPage() {
    const { t } = useTranslation()
    const { token } = useAuth()
    const [tab, setTab] = useState<Tab>('stock')

    // Shared data
    const [products, setProducts] = useState<Product[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])

    const loadProducts = async () => {
        if (!token) return
        setProducts(await apiRequest<Product[]>('/api/gym/products', { token }))
    }
    const loadSuppliers = async () => {
        if (!token) return
        setSuppliers(await apiRequest<Supplier[]>('/api/gym/suppliers', { token }))
    }
    useEffect(() => {
        void loadProducts()
        void loadSuppliers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
                <div className="p-6 md:p-10 space-y-6">
                    <PageHeader
                        className="p-0 border-none shadow-none bg-transparent"
                        title={t('gym.inventory.title')}
                        description={t('gym.inventory.subtitle')}
                    />

                    {/* Tab bar */}
                    <div className="flex flex-wrap gap-1.5">
                        {TABS.map((tb) => (
                            <button
                                key={tb.key}
                                onClick={() => setTab(tb.key)}
                                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                                    tab === tb.key
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-surface text-text-muted hover:bg-primary/5 hover:text-primary'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{tb.icon}</span>
                                {t(`gym.inventory.tabs.${tb.key}`)}
                            </button>
                        ))}
                    </div>

                    {tab === 'stock' && (
                        <StockTab products={products} suppliers={suppliers} token={token} reload={loadProducts} />
                    )}
                    {tab === 'receipts' && (
                        <MovementTab kind="Receipt" products={products} suppliers={suppliers} token={token} onChanged={loadProducts} />
                    )}
                    {tab === 'writeoffs' && (
                        <MovementTab kind="WriteOff" products={products} suppliers={suppliers} token={token} onChanged={loadProducts} />
                    )}
                    {tab === 'lowStock' && <LowStockTab token={token} onJump={() => setTab('purchases')} />}
                    {tab === 'suppliers' && <SuppliersTab suppliers={suppliers} token={token} reload={loadSuppliers} />}
                    {tab === 'purchases' && (
                        <PurchasesTab products={products} suppliers={suppliers} token={token} onReceived={loadProducts} />
                    )}
                    {tab === 'stocktakes' && (
                        <StocktakesTab products={products} token={token} onCompleted={loadProducts} />
                    )}
                </div>
            </div>
        </AppLayout>
    )
}

// ─── Stock balances tab ─────────────────────────────────────────────────────────

const emptyProductForm = {
    name: '', sku: '', barcode: '', category: '', unit: 'pcs',
    salePrice: '', cost: '', currency: 'AZN', minStock: '', openingStock: '', supplierId: '', isActive: true,
}
type ProductForm = typeof emptyProductForm

function StockTab({ products, suppliers, token, reload }: {
    products: Product[]; suppliers: Supplier[]; token: string | null; reload: () => Promise<void>
}) {
    const { t } = useTranslation()
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
    const [editing, setEditing] = useState<Product | null>(null)
    const [form, setForm] = useState<ProductForm>(emptyProductForm)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // quick stock + history modals
    const [quick, setQuick] = useState<{ product: Product; mode: 'Receipt' | 'WriteOff' } | null>(null)
    const [historyFor, setHistoryFor] = useState<Product | null>(null)

    const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) => setForm((p) => ({ ...p, [k]: v }))

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase()
        if (!s) return products
        return products.filter((p) =>
            p.name.toLowerCase().includes(s) ||
            (p.sku ?? '').toLowerCase().includes(s) ||
            (p.barcode ?? '').toLowerCase().includes(s) ||
            (p.category ?? '').toLowerCase().includes(s))
    }, [products, search])

    const openCreate = () => { setForm(emptyProductForm); setEditing(null); setError(null); setModal('create') }
    const openEdit = (p: Product) => {
        setEditing(p)
        setForm({
            name: p.name, sku: p.sku ?? '', barcode: p.barcode ?? '', category: p.category ?? '', unit: p.unit,
            salePrice: String(p.salePrice), cost: String(p.cost), currency: p.currency,
            minStock: String(p.minStock), openingStock: '', supplierId: p.supplierId ?? '', isActive: p.isActive,
        })
        setError(null); setModal('edit')
    }

    const save = async () => {
        if (!token || !form.name.trim()) return
        setSaving(true); setError(null)
        try {
            const body = JSON.stringify({
                name: form.name.trim(),
                sku: form.sku.trim() || null,
                barcode: form.barcode.trim() || null,
                category: form.category.trim() || null,
                unit: form.unit.trim() || 'pcs',
                salePrice: Number(form.salePrice) || 0,
                cost: Number(form.cost) || 0,
                currency: form.currency.trim() || 'AZN',
                minStock: Number(form.minStock) || 0,
                openingStock: modal === 'create' ? Number(form.openingStock) || 0 : null,
                supplierId: form.supplierId || null,
                isActive: form.isActive,
            })
            if (modal === 'create') await apiRequest('/api/gym/products', { method: 'POST', token, body })
            else if (editing) await apiRequest(`/api/gym/products/${editing.id}`, { method: 'PUT', token, body })
            setModal(null); setEditing(null)
            await reload()
        } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
        finally { setSaving(false) }
    }

    const remove = async () => {
        if (!token || !editing) return
        setSaving(true); setError(null)
        try {
            await apiRequest(`/api/gym/products/${editing.id}`, { method: 'DELETE', token })
            setModal(null); setEditing(null)
            await reload()
        } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed') }
        finally { setSaving(false) }
    }

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="max-w-md flex-1">
                    <Input icon="search" placeholder={t('gym.inventory.products.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Button icon="add" onClick={openCreate}>{t('gym.inventory.products.new')}</Button>
            </div>

            <Card>
                <CardCount label={t('gym.inventory.products.count', { count: filtered.length })} />
                {filtered.length === 0 ? (
                    <Empty icon="inventory_2" text={products.length === 0 ? t('gym.inventory.products.empty') : t('gym.inventory.common.noResults')} />
                ) : (
                    <Table head={[
                        t('gym.inventory.products.columns.name'),
                        t('gym.inventory.products.columns.sku'),
                        t('gym.inventory.products.columns.category'),
                        t('gym.inventory.products.columns.stock'),
                        t('gym.inventory.products.columns.min'),
                        t('gym.inventory.products.columns.price'),
                        t('gym.inventory.products.columns.supplier'),
                        '',
                    ]}>
                        {filtered.map((p) => (
                            <tr key={p.id} className="border-b border-border-light last:border-none hover:bg-background-light">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-text-dark">{p.name}</span>
                                        {!p.isActive && <Pill className="bg-slate-100 text-text-light">{t('gym.inventory.products.inactive')}</Pill>}
                                    </div>
                                </td>
                                <td className="px-5 py-3 font-mono text-xs text-text-muted">{p.sku || '—'}</td>
                                <td className="px-5 py-3 text-text-muted">{p.category || '—'}</td>
                                <td className="px-5 py-3">
                                    <span className={`font-mono font-bold ${p.isLow ? 'text-rose-600' : 'text-text-dark'}`}>{fmt(p.stockQuantity)}</span>
                                    <span className="ml-1 text-xs text-text-light">{p.unit}</span>
                                    {p.isLow && <Pill className="ml-2 bg-rose-50 text-rose-600">{t('gym.inventory.products.lowBadge')}</Pill>}
                                </td>
                                <td className="px-5 py-3 font-mono text-text-muted">{fmt(p.minStock)}</td>
                                <td className="px-5 py-3 text-text-dark">{money(p.salePrice, p.currency)}</td>
                                <td className="px-5 py-3 text-text-muted">{p.supplierName || '—'}</td>
                                <td className="px-5 py-3 text-right whitespace-nowrap">
                                    <RowBtn color="text-emerald-600" onClick={() => setQuick({ product: p, mode: 'Receipt' })} label={t('gym.inventory.products.receipt')} />
                                    <RowBtn color="text-amber-700" onClick={() => setQuick({ product: p, mode: 'WriteOff' })} label={t('gym.inventory.products.writeoff')} />
                                    <RowBtn color="text-sky-600" onClick={() => setHistoryFor(p)} label={t('gym.inventory.products.movements')} />
                                    <RowBtn color="text-primary" onClick={() => openEdit(p)} label={t('common.edit')} />
                                    <RowBtn color="text-error-text" onClick={() => { setEditing(p); setModal('delete') }} label={t('common.delete')} last />
                                </td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>

            {/* Create / edit modal */}
            <Modal isOpen={modal === 'create' || modal === 'edit'} onClose={() => { setModal(null); setEditing(null) }}
                title={modal === 'create' ? t('gym.inventory.products.new') : t('gym.inventory.products.edit')}>
                <div className="space-y-4 pt-2">
                    <Field label={t('gym.inventory.products.fields.name')}>
                        <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('gym.inventory.products.fields.sku')}>
                            <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} />
                        </Field>
                        <Field label={t('gym.inventory.products.fields.barcode')}>
                            <Input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('gym.inventory.products.fields.category')}>
                            <Input value={form.category} onChange={(e) => set('category', e.target.value)} />
                        </Field>
                        <Field label={t('gym.inventory.products.fields.unit')}>
                            <Input value={form.unit} onChange={(e) => set('unit', e.target.value)} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <Field label={t('gym.inventory.products.fields.salePrice')}>
                            <Input type="number" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} />
                        </Field>
                        <Field label={t('gym.inventory.products.fields.cost')}>
                            <Input type="number" value={form.cost} onChange={(e) => set('cost', e.target.value)} />
                        </Field>
                        <Field label={t('gym.inventory.products.fields.currency')}>
                            <Input value={form.currency} onChange={(e) => set('currency', e.target.value)} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('gym.inventory.products.fields.minStock')}>
                            <Input type="number" value={form.minStock} onChange={(e) => set('minStock', e.target.value)} />
                        </Field>
                        {modal === 'create' && (
                            <Field label={t('gym.inventory.products.fields.openingStock')}>
                                <Input type="number" value={form.openingStock} onChange={(e) => set('openingStock', e.target.value)} />
                            </Field>
                        )}
                    </div>
                    <Field label={t('gym.inventory.products.fields.supplier')}>
                        <Select value={form.supplierId} onChange={(e) => set('supplierId', e.target.value)}>
                            <option value="">{t('gym.inventory.common.none')}</option>
                            {suppliers.filter((s) => s.isActive || s.id === form.supplierId).map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </Select>
                    </Field>
                    <Check label={t('gym.inventory.products.fields.active')} checked={form.isActive} onChange={(v) => set('isActive', v)} />
                    {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                    <div className="flex gap-3 pt-1">
                        <Button variant="outline" fullWidth onClick={() => { setModal(null); setEditing(null) }}>{t('common.cancel')}</Button>
                        <Button fullWidth isLoading={saving} disabled={!form.name.trim()} onClick={save}>{modal === 'create' ? t('common.create') : t('common.save')}</Button>
                    </div>
                </div>
            </Modal>

            {/* Delete modal */}
            <Modal isOpen={modal === 'delete'} onClose={() => { setModal(null); setEditing(null) }} title={t('gym.inventory.products.deleteTitle')}>
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-text-dark">{t('gym.inventory.products.deletePrefix')} <strong>{editing?.name}</strong>?</p>
                    {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                    <div className="flex gap-3">
                        <Button variant="outline" fullWidth onClick={() => { setModal(null); setEditing(null) }}>{t('common.cancel')}</Button>
                        <Button variant="danger" fullWidth isLoading={saving} onClick={remove}>{t('common.delete')}</Button>
                    </div>
                </div>
            </Modal>

            {/* Quick receipt / write-off */}
            {quick && (
                <QuickStockModal
                    product={quick.product}
                    mode={quick.mode}
                    suppliers={suppliers}
                    token={token}
                    onClose={() => setQuick(null)}
                    onDone={async () => { setQuick(null); await reload() }}
                />
            )}

            {/* History */}
            {historyFor && (
                <HistoryModal product={historyFor} token={token} onClose={() => setHistoryFor(null)} />
            )}
        </>
    )
}

function QuickStockModal({ product, mode, suppliers, token, onClose, onDone }: {
    product: Product; mode: 'Receipt' | 'WriteOff'; suppliers: Supplier[]; token: string | null
    onClose: () => void; onDone: () => Promise<void>
}) {
    const { t } = useTranslation()
    const [qty, setQty] = useState('')
    const [unitCost, setUnitCost] = useState(String(product.cost))
    const [supplierId, setSupplierId] = useState(product.supplierId ?? '')
    const [reason, setReason] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const submit = async () => {
        if (!token) return
        const q = Number(qty)
        if (!Number.isFinite(q) || q <= 0) { setError(t('gym.inventory.common.quantity')); return }
        setBusy(true); setError(null)
        try {
            if (mode === 'Receipt') {
                await apiRequest('/api/gym/stock-movements/receipt', {
                    method: 'POST', token,
                    body: JSON.stringify({ productId: product.id, quantity: q, unitCost: Number(unitCost) || 0, supplierId: supplierId || null, note: null }),
                })
            } else {
                await apiRequest('/api/gym/stock-movements/writeoff', {
                    method: 'POST', token,
                    body: JSON.stringify({ productId: product.id, quantity: q, reason: reason.trim() || null }),
                })
            }
            await onDone()
        } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }

    return (
        <Modal isOpen onClose={onClose}
            title={`${mode === 'Receipt' ? t('gym.inventory.products.receipt') : t('gym.inventory.products.writeoff')} — ${product.name}`}>
            <div className="space-y-4 pt-2">
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-text-muted">
                    {t('gym.inventory.movements.balanceAfter')}: <strong>{fmt(product.stockQuantity)} {product.unit}</strong>
                </p>
                <Field label={t('gym.inventory.common.quantity')}>
                    <Input type="number" autoFocus value={qty} onChange={(e) => setQty(e.target.value)} />
                </Field>
                {mode === 'Receipt' ? (
                    <>
                        <Field label={t('gym.inventory.common.unitCost')}>
                            <Input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
                        </Field>
                        <Field label={t('gym.inventory.common.supplier')}>
                            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                                <option value="">{t('gym.inventory.common.none')}</option>
                                {suppliers.filter((s) => s.isActive || s.id === supplierId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </Field>
                    </>
                ) : (
                    <Field label={t('gym.inventory.common.reason')}>
                        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('gym.inventory.writeoffs.reasonPlaceholder')} />
                    </Field>
                )}
                {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                <div className="flex gap-3 pt-1">
                    <Button variant="outline" fullWidth onClick={onClose}>{t('common.cancel')}</Button>
                    <Button fullWidth isLoading={busy} onClick={submit}>{mode === 'Receipt' ? t('gym.inventory.receipts.submit') : t('gym.inventory.writeoffs.submit')}</Button>
                </div>
            </div>
        </Modal>
    )
}

function HistoryModal({ product, token, onClose }: { product: Product; token: string | null; onClose: () => void }) {
    const { t } = useTranslation()
    const [items, setItems] = useState<Movement[]>([])
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        if (!token) return
        setLoading(true)
        apiRequest<Movement[]>(`/api/gym/stock-movements?productId=${product.id}`, { token })
            .then(setItems).finally(() => setLoading(false))
    }, [product.id, token])

    return (
        <Modal isOpen onClose={onClose} title={t('gym.inventory.movements.for', { name: product.name })}>
            <div className="pt-2">
                {loading ? <Spinner /> : items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-text-light">{t('gym.inventory.movements.empty')}</p>
                ) : (
                    <div className="max-h-96 space-y-1.5 overflow-y-auto">
                        {items.map((m) => (
                            <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-light px-3 py-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-text-dark">{t(`gym.inventory.movements.types.${m.type}`)}</p>
                                    <p className="text-xs text-text-light">{fmtDate(m.createdUtc)}{m.reference ? ` · ${m.reference}` : ''}{m.reason ? ` · ${m.reason}` : ''}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className={`font-mono font-bold ${m.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{m.quantity >= 0 ? '+' : ''}{fmt(m.quantity)}</p>
                                    <p className="text-xs text-text-light">{t('gym.inventory.movements.balanceAfter')}: {fmt(m.balanceAfter)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <Button variant="outline" fullWidth className="mt-4" onClick={onClose}>{t('common.close')}</Button>
            </div>
        </Modal>
    )
}

// ─── Receipts / Write-offs tab (movement ledger + create) ───────────────────────

function MovementTab({ kind, products, suppliers, token, onChanged }: {
    kind: 'Receipt' | 'WriteOff'; products: Product[]; suppliers: Supplier[]; token: string | null; onChanged: () => Promise<void>
}) {
    const { t } = useTranslation()
    const [items, setItems] = useState<Movement[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const base = kind === 'Receipt' ? 'receipts' : 'writeoffs'

    const load = async () => {
        if (!token) return
        setLoading(true)
        try { setItems(await apiRequest<Movement[]>(`/api/gym/stock-movements?type=${kind}`, { token })) }
        finally { setLoading(false) }
    }
    useEffect(() => { void load() }, [token, kind])

    const [productId, setProductId] = useState('')
    const [qty, setQty] = useState('')
    const [unitCost, setUnitCost] = useState('')
    const [supplierId, setSupplierId] = useState('')
    const [reason, setReason] = useState('')
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const openCreate = () => { setProductId(''); setQty(''); setUnitCost(''); setSupplierId(''); setReason(''); setNote(''); setError(null); setOpen(true) }

    const submit = async () => {
        if (!token) return
        const q = Number(qty)
        if (!productId) { setError(t('gym.inventory.common.selectProduct')); return }
        if (!Number.isFinite(q) || q <= 0) { setError(t('gym.inventory.common.quantity')); return }
        setBusy(true); setError(null)
        try {
            if (kind === 'Receipt') {
                await apiRequest('/api/gym/stock-movements/receipt', {
                    method: 'POST', token,
                    body: JSON.stringify({ productId, quantity: q, unitCost: unitCost === '' ? null : Number(unitCost), supplierId: supplierId || null, note: note.trim() || null }),
                })
            } else {
                await apiRequest('/api/gym/stock-movements/writeoff', {
                    method: 'POST', token,
                    body: JSON.stringify({ productId, quantity: q, reason: reason.trim() || null }),
                })
            }
            setOpen(false)
            await Promise.all([load(), onChanged()])
        } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black text-text-dark">{t(`gym.inventory.${base}.title`)}</h3>
                    <p className="text-sm text-text-muted">{t(`gym.inventory.${base}.subtitle`)}</p>
                </div>
                <Button icon="add" onClick={openCreate} disabled={products.length === 0}>{t(`gym.inventory.${base}.new`)}</Button>
            </div>

            <Card>
                {loading ? <Spinner /> : items.length === 0 ? (
                    <Empty icon={kind === 'Receipt' ? 'input' : 'output'} text={t(`gym.inventory.${base}.empty`)} />
                ) : (
                    <Table head={[
                        t('gym.inventory.common.date'),
                        t('gym.inventory.common.product'),
                        t('gym.inventory.common.quantity'),
                        kind === 'Receipt' ? t('gym.inventory.common.unitCost') : t('gym.inventory.common.reason'),
                        t('gym.inventory.movements.balanceAfter'),
                    ]}>
                        {items.map((m) => (
                            <tr key={m.id} className="border-b border-border-light last:border-none hover:bg-background-light">
                                <td className="px-5 py-3 text-text-muted">{fmtDate(m.createdUtc)}</td>
                                <td className="px-5 py-3 font-bold text-text-dark">{m.productName || '—'}</td>
                                <td className={`px-5 py-3 font-mono font-bold ${m.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{m.quantity >= 0 ? '+' : ''}{fmt(m.quantity)}</td>
                                <td className="px-5 py-3 text-text-muted">{kind === 'Receipt' ? money(m.unitCost) : (m.reason || '—')}</td>
                                <td className="px-5 py-3 font-mono text-text-dark">{fmt(m.balanceAfter)}</td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>

            <Modal isOpen={open} onClose={() => setOpen(false)} title={t(`gym.inventory.${base}.new`)}>
                <div className="space-y-4 pt-2">
                    <Field label={t('gym.inventory.common.product')}>
                        <Select value={productId} onChange={(e) => {
                            setProductId(e.target.value)
                            const p = products.find((x) => x.id === e.target.value)
                            if (p && kind === 'Receipt') { setUnitCost(String(p.cost)); setSupplierId(p.supplierId ?? '') }
                        }}>
                            <option value="">{t('gym.inventory.common.selectProduct')}</option>
                            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({fmt(p.stockQuantity)} {p.unit})</option>)}
                        </Select>
                    </Field>
                    <Field label={t('gym.inventory.common.quantity')}>
                        <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
                    </Field>
                    {kind === 'Receipt' ? (
                        <>
                            <Field label={t('gym.inventory.common.unitCost')}>
                                <Input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
                            </Field>
                            <Field label={t('gym.inventory.common.supplier')}>
                                <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                                    <option value="">{t('gym.inventory.common.none')}</option>
                                    {suppliers.filter((s) => s.isActive || s.id === supplierId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Select>
                            </Field>
                            <Field label={t('gym.inventory.common.note')}>
                                <Input value={note} onChange={(e) => setNote(e.target.value)} />
                            </Field>
                        </>
                    ) : (
                        <Field label={t('gym.inventory.common.reason')}>
                            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('gym.inventory.writeoffs.reasonPlaceholder')} />
                        </Field>
                    )}
                    {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                    <div className="flex gap-3 pt-1">
                        <Button variant="outline" fullWidth onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                        <Button fullWidth isLoading={busy} onClick={submit}>{kind === 'Receipt' ? t('gym.inventory.receipts.submit') : t('gym.inventory.writeoffs.submit')}</Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

// ─── Low stock tab ──────────────────────────────────────────────────────────────

function LowStockTab({ token, onJump }: { token: string | null; onJump: () => void }) {
    const { t } = useTranslation()
    const [items, setItems] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        if (!token) return
        setLoading(true)
        apiRequest<Product[]>('/api/gym/products?lowStock=true', { token }).then(setItems).finally(() => setLoading(false))
    }, [token])

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black text-text-dark">{t('gym.inventory.lowStock.title')}</h3>
                    <p className="text-sm text-text-muted">{t('gym.inventory.lowStock.subtitle')}</p>
                </div>
                <Button variant="outline" icon="shopping_cart" onClick={onJump}>{t('gym.inventory.tabs.purchases')}</Button>
            </div>
            <Card>
                {loading ? <Spinner /> : items.length === 0 ? (
                    <Empty icon="check_circle" text={t('gym.inventory.lowStock.empty')} />
                ) : (
                    <Table head={[
                        t('gym.inventory.products.columns.name'),
                        t('gym.inventory.products.columns.stock'),
                        t('gym.inventory.products.columns.min'),
                        t('gym.inventory.lowStock.needed'),
                        t('gym.inventory.products.columns.supplier'),
                    ]}>
                        {items.map((p) => (
                            <tr key={p.id} className="border-b border-border-light last:border-none hover:bg-background-light">
                                <td className="px-5 py-3 font-bold text-text-dark">{p.name}</td>
                                <td className="px-5 py-3 font-mono font-bold text-rose-600">{fmt(p.stockQuantity)} <span className="text-xs font-normal text-text-light">{p.unit}</span></td>
                                <td className="px-5 py-3 font-mono text-text-muted">{fmt(p.minStock)}</td>
                                <td className="px-5 py-3 font-mono font-bold text-amber-700">{fmt(Math.max(0, p.minStock - p.stockQuantity))}</td>
                                <td className="px-5 py-3 text-text-muted">{p.supplierName || '—'}</td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>
        </>
    )
}

// ─── Suppliers tab ──────────────────────────────────────────────────────────────

const emptySupplierForm = { name: '', contactName: '', phone: '', email: '', address: '', notes: '', isActive: true }
type SupplierForm = typeof emptySupplierForm

function SuppliersTab({ suppliers, token, reload }: { suppliers: Supplier[]; token: string | null; reload: () => Promise<void> }) {
    const { t } = useTranslation()
    const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
    const [editing, setEditing] = useState<Supplier | null>(null)
    const [form, setForm] = useState<SupplierForm>(emptySupplierForm)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const set = <K extends keyof SupplierForm>(k: K, v: SupplierForm[K]) => setForm((p) => ({ ...p, [k]: v }))

    const openCreate = () => { setForm(emptySupplierForm); setEditing(null); setError(null); setModal('create') }
    const openEdit = (s: Supplier) => {
        setEditing(s)
        setForm({ name: s.name, contactName: s.contactName ?? '', phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '', notes: s.notes ?? '', isActive: s.isActive })
        setError(null); setModal('edit')
    }
    const save = async () => {
        if (!token || !form.name.trim()) return
        setSaving(true); setError(null)
        try {
            const body = JSON.stringify({
                name: form.name.trim(), contactName: form.contactName.trim() || null, phone: form.phone.trim() || null,
                email: form.email.trim() || null, address: form.address.trim() || null, notes: form.notes.trim() || null, isActive: form.isActive,
            })
            if (modal === 'create') await apiRequest('/api/gym/suppliers', { method: 'POST', token, body })
            else if (editing) await apiRequest(`/api/gym/suppliers/${editing.id}`, { method: 'PUT', token, body })
            setModal(null); setEditing(null); await reload()
        } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
        finally { setSaving(false) }
    }
    const remove = async () => {
        if (!token || !editing) return
        setSaving(true)
        try { await apiRequest(`/api/gym/suppliers/${editing.id}`, { method: 'DELETE', token }); setModal(null); setEditing(null); await reload() }
        finally { setSaving(false) }
    }

    return (
        <>
            <div className="flex items-center justify-end">
                <Button icon="add" onClick={openCreate}>{t('gym.inventory.suppliers.new')}</Button>
            </div>
            <Card>
                {suppliers.length === 0 ? (
                    <Empty icon="local_shipping" text={t('gym.inventory.suppliers.empty')} />
                ) : (
                    <Table head={[
                        t('gym.inventory.suppliers.columns.name'),
                        t('gym.inventory.suppliers.columns.contact'),
                        t('gym.inventory.suppliers.columns.phone'),
                        t('gym.inventory.suppliers.columns.email'),
                        '',
                    ]}>
                        {suppliers.map((s) => (
                            <tr key={s.id} className="border-b border-border-light last:border-none hover:bg-background-light">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-text-dark">{s.name}</span>
                                        {!s.isActive && <Pill className="bg-slate-100 text-text-light">{t('gym.inventory.suppliers.inactive')}</Pill>}
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-text-muted">{s.contactName || '—'}</td>
                                <td className="px-5 py-3 text-text-muted">{s.phone || '—'}</td>
                                <td className="px-5 py-3 text-text-muted">{s.email || '—'}</td>
                                <td className="px-5 py-3 text-right whitespace-nowrap">
                                    <RowBtn color="text-primary" onClick={() => openEdit(s)} label={t('common.edit')} />
                                    <RowBtn color="text-error-text" onClick={() => { setEditing(s); setModal('delete') }} label={t('common.delete')} last />
                                </td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>

            <Modal isOpen={modal === 'create' || modal === 'edit'} onClose={() => { setModal(null); setEditing(null) }}
                title={modal === 'create' ? t('gym.inventory.suppliers.new') : t('gym.inventory.suppliers.edit')}>
                <div className="space-y-4 pt-2">
                    <Field label={t('gym.inventory.suppliers.fields.name')}><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('gym.inventory.suppliers.fields.contactName')}><Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} /></Field>
                        <Field label={t('gym.inventory.suppliers.fields.phone')}><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
                    </div>
                    <Field label={t('gym.inventory.suppliers.fields.email')}><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
                    <Field label={t('gym.inventory.suppliers.fields.address')}><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
                    <Field label={t('gym.inventory.suppliers.fields.notes')}><Input value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
                    <Check label={t('gym.inventory.suppliers.fields.active')} checked={form.isActive} onChange={(v) => set('isActive', v)} />
                    {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                    <div className="flex gap-3 pt-1">
                        <Button variant="outline" fullWidth onClick={() => { setModal(null); setEditing(null) }}>{t('common.cancel')}</Button>
                        <Button fullWidth isLoading={saving} disabled={!form.name.trim()} onClick={save}>{modal === 'create' ? t('common.create') : t('common.save')}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={modal === 'delete'} onClose={() => { setModal(null); setEditing(null) }} title={t('gym.inventory.suppliers.deleteTitle')}>
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-text-dark">{t('gym.inventory.suppliers.deletePrefix')} <strong>{editing?.name}</strong>?</p>
                    <div className="flex gap-3">
                        <Button variant="outline" fullWidth onClick={() => { setModal(null); setEditing(null) }}>{t('common.cancel')}</Button>
                        <Button variant="danger" fullWidth isLoading={saving} onClick={remove}>{t('common.delete')}</Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

// ─── Purchases tab ──────────────────────────────────────────────────────────────

interface DraftItem { productId: string; quantity: string; unitCost: string }

function PurchasesTab({ products, suppliers, token, onReceived }: {
    products: Product[]; suppliers: Supplier[]; token: string | null; onReceived: () => Promise<void>
}) {
    const { t } = useTranslation()
    const [list, setList] = useState<Purchase[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [viewing, setViewing] = useState<Purchase | null>(null)
    const [busy, setBusy] = useState(false)

    const load = async () => {
        if (!token) return
        setLoading(true)
        try { setList(await apiRequest<Purchase[]>('/api/gym/purchase-orders', { token })) }
        finally { setLoading(false) }
    }
    useEffect(() => { void load() }, [token])

    // create form
    const [supplierId, setSupplierId] = useState('')
    const [expectedDate, setExpectedDate] = useState('')
    const [notes, setNotes] = useState('')
    const [draftItems, setDraftItems] = useState<DraftItem[]>([{ productId: '', quantity: '', unitCost: '' }])
    const [error, setError] = useState<string | null>(null)

    const openCreate = () => {
        setSupplierId(''); setExpectedDate(''); setNotes('')
        setDraftItems([{ productId: '', quantity: '', unitCost: '' }]); setError(null); setCreating(true)
    }
    const setItem = (i: number, patch: Partial<DraftItem>) => setDraftItems((prev) => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it))
    const total = useMemo(() => draftItems.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0), 0), [draftItems])

    const createOrder = async () => {
        if (!token) return
        const items = draftItems
            .filter((it) => it.productId && Number(it.quantity) > 0)
            .map((it) => ({ productId: it.productId, quantity: Number(it.quantity), unitCost: Number(it.unitCost) || 0 }))
        if (items.length === 0) { setError(t('gym.inventory.purchases.noItems')); return }
        setBusy(true); setError(null)
        try {
            await apiRequest('/api/gym/purchase-orders', {
                method: 'POST', token,
                body: JSON.stringify({ supplierId: supplierId || null, expectedDate: expectedDate || null, notes: notes.trim() || null, items }),
            })
            setCreating(false); await load()
        } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }

    const openView = async (p: Purchase) => {
        if (!token) return
        try { setViewing(await apiRequest<Purchase>(`/api/gym/purchase-orders/${p.id}`, { token })) }
        catch { setViewing(p) }
    }
    const action = async (id: string, act: 'receive' | 'cancel') => {
        if (!token) return
        if (act === 'receive' && !confirm(t('gym.inventory.purchases.receiveConfirm'))) return
        if (act === 'cancel' && !confirm(t('gym.inventory.purchases.cancelConfirm'))) return
        setBusy(true)
        try {
            await apiRequest(`/api/gym/purchase-orders/${id}/${act}`, { method: 'POST', token })
            setViewing(null); await Promise.all([load(), onReceived()])
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }
    const removeOrder = async (id: string) => {
        if (!token || !confirm(t('gym.inventory.purchases.deleteConfirm'))) return
        setBusy(true)
        try { await apiRequest(`/api/gym/purchase-orders/${id}`, { method: 'DELETE', token }); setViewing(null); await load() }
        catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }

    return (
        <>
            <div className="flex items-center justify-end">
                <Button icon="add" onClick={openCreate} disabled={products.length === 0}>{t('gym.inventory.purchases.new')}</Button>
            </div>
            <Card>
                {loading ? <Spinner /> : list.length === 0 ? (
                    <Empty icon="shopping_cart" text={t('gym.inventory.purchases.empty')} />
                ) : (
                    <Table head={[
                        t('gym.inventory.purchases.columns.number'),
                        t('gym.inventory.purchases.columns.supplier'),
                        t('gym.inventory.purchases.columns.items'),
                        t('gym.inventory.purchases.columns.total'),
                        t('gym.inventory.purchases.columns.status'),
                        t('gym.inventory.purchases.columns.date'),
                        '',
                    ]}>
                        {list.map((p) => (
                            <tr key={p.id} className="border-b border-border-light last:border-none hover:bg-background-light cursor-pointer" onClick={() => openView(p)}>
                                <td className="px-5 py-3 font-mono font-bold text-text-dark">{p.number}</td>
                                <td className="px-5 py-3 text-text-muted">{p.supplierName || '—'}</td>
                                <td className="px-5 py-3 text-text-muted">{p.itemCount}</td>
                                <td className="px-5 py-3 font-bold text-text-dark">{money(p.total, p.currency)}</td>
                                <td className="px-5 py-3"><Pill className={STATUS_STYLE[p.status]}>{t(`gym.inventory.purchases.statuses.${p.status}`)}</Pill></td>
                                <td className="px-5 py-3 text-text-muted">{fmtDate(p.createdUtc)}</td>
                                <td className="px-5 py-3 text-right"><span className="material-symbols-outlined text-text-light">chevron_right</span></td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>

            {/* Create modal */}
            <Modal isOpen={creating} onClose={() => setCreating(false)} title={t('gym.inventory.purchases.new')}>
                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('gym.inventory.purchases.supplier')}>
                            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                                <option value="">{t('gym.inventory.common.none')}</option>
                                {suppliers.filter((s) => s.isActive || s.id === supplierId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </Field>
                        <Field label={t('gym.inventory.purchases.expectedDate')}>
                            <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                        </Field>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-light">{t('gym.inventory.purchases.items')}</p>
                        {draftItems.map((it, i) => (
                            <div key={i} className="flex items-end gap-2">
                                <div className="flex-1">
                                    <Select value={it.productId} onChange={(e) => {
                                        const prod = products.find((x) => x.id === e.target.value)
                                        setItem(i, { productId: e.target.value, unitCost: prod && !it.unitCost ? String(prod.cost) : it.unitCost })
                                    }}>
                                        <option value="">{t('gym.inventory.common.selectProduct')}</option>
                                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </Select>
                                </div>
                                <div className="w-20"><Input type="number" placeholder={t('gym.inventory.common.quantity')} value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} /></div>
                                <div className="w-24"><Input type="number" placeholder={t('gym.inventory.common.unitCost')} value={it.unitCost} onChange={(e) => setItem(i, { unitCost: e.target.value })} /></div>
                                <button onClick={() => setDraftItems((prev) => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)}
                                    className="mb-1 text-text-light hover:text-error-text" aria-label="remove">
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                        ))}
                        <button onClick={() => setDraftItems((prev) => [...prev, { productId: '', quantity: '', unitCost: '' }])}
                            className="text-xs font-bold text-primary hover:underline">+ {t('gym.inventory.purchases.addItem')}</button>
                    </div>

                    <Field label={t('gym.inventory.common.note')}><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
                    <p className="text-right text-sm font-bold text-text-dark">{t('gym.inventory.common.total')}: {money(total)}</p>
                    {error && <p className="text-xs font-medium text-error-text">{error}</p>}
                    <div className="flex gap-3 pt-1">
                        <Button variant="outline" fullWidth onClick={() => setCreating(false)}>{t('common.cancel')}</Button>
                        <Button fullWidth isLoading={busy} onClick={createOrder}>{t('gym.inventory.purchases.create')}</Button>
                    </div>
                </div>
            </Modal>

            {/* View modal */}
            <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={viewing ? t('gym.inventory.purchases.view', { number: viewing.number }) : ''}>
                {viewing && (
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <Pill className={STATUS_STYLE[viewing.status]}>{t(`gym.inventory.purchases.statuses.${viewing.status}`)}</Pill>
                            <span className="text-sm text-text-muted">{viewing.supplierName || '—'}</span>
                        </div>
                        <div className="space-y-1.5">
                            {(viewing.items ?? []).map((it) => (
                                <div key={it.id} className="flex items-center justify-between rounded-xl border border-border-light px-3 py-2 text-sm">
                                    <span className="font-bold text-text-dark">{it.productName}</span>
                                    <span className="text-text-muted">{fmt(it.quantity)} × {money(it.unitCost, viewing.currency)} = <strong className="text-text-dark">{money(it.quantity * it.unitCost, viewing.currency)}</strong></span>
                                </div>
                            ))}
                        </div>
                        <p className="text-right text-sm font-bold text-text-dark">{t('gym.inventory.common.total')}: {money(viewing.total, viewing.currency)}</p>
                        {viewing.notes && <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-text-muted">{viewing.notes}</p>}
                        <div className="flex flex-wrap gap-2 border-t border-border-light pt-3">
                            {viewing.status !== 'Received' && viewing.status !== 'Cancelled' && (
                                <Button icon="inventory" isLoading={busy} onClick={() => action(viewing.id, 'receive')}>{t('gym.inventory.purchases.receive')}</Button>
                            )}
                            {viewing.status !== 'Received' && viewing.status !== 'Cancelled' && (
                                <Button variant="outline" isLoading={busy} onClick={() => action(viewing.id, 'cancel')}>{t('gym.inventory.purchases.cancel')}</Button>
                            )}
                            {viewing.status !== 'Received' && (
                                <Button variant="danger" isLoading={busy} onClick={() => removeOrder(viewing.id)}>{t('common.delete')}</Button>
                            )}
                            <Button variant="outline" className="ml-auto" onClick={() => setViewing(null)}>{t('common.close')}</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    )
}

// ─── Stocktakes tab ─────────────────────────────────────────────────────────────

function StocktakesTab({ products, token, onCompleted }: { products: Product[]; token: string | null; onCompleted: () => Promise<void> }) {
    const { t } = useTranslation()
    const [list, setList] = useState<Stocktake[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [viewing, setViewing] = useState<Stocktake | null>(null)
    const [counts, setCounts] = useState<Record<string, string>>({})
    const [busy, setBusy] = useState(false)

    const load = async () => {
        if (!token) return
        setLoading(true)
        try { setList(await apiRequest<Stocktake[]>('/api/gym/stocktakes', { token })) }
        finally { setLoading(false) }
    }
    useEffect(() => { void load() }, [token])

    const [notes, setNotes] = useState('')
    const [seedAll, setSeedAll] = useState(true)
    const openCreate = () => { setNotes(''); setSeedAll(true); setCreating(true) }
    const createStocktake = async () => {
        if (!token) return
        setBusy(true)
        try {
            const created = await apiRequest<Stocktake>('/api/gym/stocktakes', {
                method: 'POST', token, body: JSON.stringify({ notes: notes.trim() || null, seedAllProducts: seedAll }),
            })
            setCreating(false); await load(); openView(created)
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }

    const openView = async (s: Stocktake) => {
        if (!token) return
        try {
            const full = await apiRequest<Stocktake>(`/api/gym/stocktakes/${s.id}`, { token })
            setViewing(full)
            setCounts(Object.fromEntries((full.items ?? []).map((it) => [it.id, String(it.countedQuantity)])))
        } catch { setViewing(s) }
    }

    const saveCounts = async () => {
        if (!token || !viewing) return
        setBusy(true)
        try {
            const updated = await apiRequest<Stocktake>(`/api/gym/stocktakes/${viewing.id}/counts`, {
                method: 'PUT', token,
                body: JSON.stringify({ items: Object.entries(counts).map(([itemId, v]) => ({ itemId, countedQuantity: Number(v) || 0 })) }),
            })
            setViewing(updated)
            setCounts(Object.fromEntries((updated.items ?? []).map((it) => [it.id, String(it.countedQuantity)])))
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }

    const action = async (act: 'complete' | 'cancel') => {
        if (!token || !viewing) return
        if (act === 'complete') {
            if (!confirm(t('gym.inventory.stocktakes.completeConfirm'))) return
            await saveCounts()
        }
        if (act === 'cancel' && !confirm(t('gym.inventory.stocktakes.cancelConfirm'))) return
        setBusy(true)
        try {
            await apiRequest(`/api/gym/stocktakes/${viewing.id}/${act}`, { method: 'POST', token })
            setViewing(null); await Promise.all([load(), onCompleted()])
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }
    const removeStocktake = async (id: string) => {
        if (!token || !confirm(t('gym.inventory.stocktakes.deleteConfirm'))) return
        setBusy(true)
        try { await apiRequest(`/api/gym/stocktakes/${id}`, { method: 'DELETE', token }); setViewing(null); await load() }
        catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
        finally { setBusy(false) }
    }

    const editable = viewing?.status === 'Draft'

    return (
        <>
            <div className="flex items-center justify-end">
                <Button icon="add" onClick={openCreate} disabled={products.length === 0}>{t('gym.inventory.stocktakes.new')}</Button>
            </div>
            <Card>
                {loading ? <Spinner /> : list.length === 0 ? (
                    <Empty icon="fact_check" text={t('gym.inventory.stocktakes.empty')} />
                ) : (
                    <Table head={[
                        t('gym.inventory.stocktakes.columns.number'),
                        t('gym.inventory.stocktakes.columns.items'),
                        t('gym.inventory.stocktakes.columns.status'),
                        t('gym.inventory.stocktakes.columns.date'),
                        '',
                    ]}>
                        {list.map((s) => (
                            <tr key={s.id} className="border-b border-border-light last:border-none hover:bg-background-light cursor-pointer" onClick={() => openView(s)}>
                                <td className="px-5 py-3 font-mono font-bold text-text-dark">{s.number}</td>
                                <td className="px-5 py-3 text-text-muted">{s.itemCount}</td>
                                <td className="px-5 py-3"><Pill className={STATUS_STYLE[s.status]}>{t(`gym.inventory.stocktakes.statuses.${s.status}`)}</Pill></td>
                                <td className="px-5 py-3 text-text-muted">{fmtDate(s.createdUtc)}</td>
                                <td className="px-5 py-3 text-right"><span className="material-symbols-outlined text-text-light">chevron_right</span></td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>

            {/* Create modal */}
            <Modal isOpen={creating} onClose={() => setCreating(false)} title={t('gym.inventory.stocktakes.new')}>
                <div className="space-y-4 pt-2">
                    <Field label={t('gym.inventory.common.note')}><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
                    <Check label={t('gym.inventory.stocktakes.seedAll')} checked={seedAll} onChange={setSeedAll} />
                    <div className="flex gap-3 pt-1">
                        <Button variant="outline" fullWidth onClick={() => setCreating(false)}>{t('common.cancel')}</Button>
                        <Button fullWidth isLoading={busy} onClick={createStocktake}>{t('gym.inventory.stocktakes.create')}</Button>
                    </div>
                </div>
            </Modal>

            {/* View / count modal */}
            <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={viewing ? t('gym.inventory.stocktakes.view', { number: viewing.number }) : ''}>
                {viewing && (
                    <div className="space-y-4 pt-2">
                        <Pill className={STATUS_STYLE[viewing.status]}>{t(`gym.inventory.stocktakes.statuses.${viewing.status}`)}</Pill>
                        <div className="max-h-80 space-y-1.5 overflow-y-auto">
                            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-1 text-[10px] font-black uppercase tracking-widest text-text-light">
                                <span>{t('gym.inventory.common.product')}</span>
                                <span className="w-16 text-right">{t('gym.inventory.stocktakes.expected')}</span>
                                <span className="w-20 text-right">{t('gym.inventory.stocktakes.counted')}</span>
                                <span className="w-14 text-right">{t('gym.inventory.stocktakes.difference')}</span>
                            </div>
                            {(viewing.items ?? []).map((it) => {
                                const counted = editable ? (Number(counts[it.id]) || 0) : it.countedQuantity
                                const diff = counted - it.expectedQuantity
                                return (
                                    <div key={it.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-lg border border-border-light px-2 py-1.5">
                                        <span className="truncate text-sm font-bold text-text-dark">{it.productName}</span>
                                        <span className="w-16 text-right font-mono text-text-muted">{fmt(it.expectedQuantity)}</span>
                                        <span className="w-20">
                                            {editable ? (
                                                <input type="number" value={counts[it.id] ?? ''} onChange={(e) => setCounts((p) => ({ ...p, [it.id]: e.target.value }))}
                                                    className="h-8 w-full rounded-md border border-border-base bg-slate-75 px-2 text-right text-xs text-text-base outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20" />
                                            ) : <span className="block text-right font-mono text-text-dark">{fmt(it.countedQuantity)}</span>}
                                        </span>
                                        <span className={`w-14 text-right font-mono font-bold ${diff === 0 ? 'text-text-light' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{diff > 0 ? '+' : ''}{fmt(diff)}</span>
                                    </div>
                                )
                            })}
                            {(viewing.items ?? []).length === 0 && <p className="py-4 text-center text-sm text-text-light">{t('gym.inventory.common.none')}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2 border-t border-border-light pt-3">
                            {editable && <Button variant="outline" icon="save" isLoading={busy} onClick={saveCounts}>{t('gym.inventory.stocktakes.saveCounts')}</Button>}
                            {editable && <Button icon="check" isLoading={busy} onClick={() => action('complete')}>{t('gym.inventory.stocktakes.complete')}</Button>}
                            {editable && <Button variant="danger" isLoading={busy} onClick={() => removeStocktake(viewing.id)}>{t('common.delete')}</Button>}
                            <Button variant="outline" className="ml-auto" onClick={() => setViewing(null)}>{t('common.close')}</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    )
}

// ─── Shared UI bits ─────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
    return <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">{children}</div>
}
function CardCount({ label }: { label: string }) {
    return <div className="px-5 py-3 border-b border-border-light"><p className="text-xs font-black uppercase tracking-widest text-text-light">{label}</p></div>
}
function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-text-light border-b border-border-light">
                        {head.map((h, i) => (
                            <th key={i} className={`px-5 py-3 ${i === head.length - 1 && h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
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
    return (
        <div className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
        </div>
    )
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
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary/30" />
            <span className="text-sm font-bold text-text-dark">{label}</span>
        </label>
    )
}
