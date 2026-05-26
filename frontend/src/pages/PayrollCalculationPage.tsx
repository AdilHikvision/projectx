import { useCallback, useEffect, useState } from 'react'
import { AppLayout } from '../components/templates'
import { PageHeader } from '../components/organisms'
import { apiRequest } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

function fmt(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtH(n: number) { return n.toFixed(1) }

type Tab = 'periods' | 'setup' | 'components'
type PeriodStatus = 'Draft' | 'Calculated' | 'Approved' | 'Paid'
type EntryStatus = 'Pending' | 'Approved' | 'Rejected'
type ComponentType = 'Allowance' | 'Bonus' | 'Deduction'
type SalaryType = 'Monthly' | 'Hourly' | 'Daily'

interface Period {
    id: string; year: number; month: number; status: PeriodStatus
    calculatedAt: string | null; approvedAt: string | null; notes: string | null
    employeeCount: number; totalGross: number; totalNet: number; totalTax: number
}

interface AppliedComponent { item1: string; item2: string; item3: number }

interface PayrollEntry {
    id: string; employeeId: string; employeeName: string
    employeeNo: string | null; department: string | null
    workedDays: number; workedHours: number; overtimeHours: number; absentDays: number
    basePay: number; overtimePay: number; allowancesTotal: number; bonusesTotal: number
    grossPay: number; deductionsTotal: number; taxRate: number; taxAmount: number; netPay: number
    status: EntryStatus; notes: string | null; componentsJson: string | null
}

interface PeriodDetail { period: Period; entries: PayrollEntry[] }

interface PayrollComponent {
    id: string; name: string; componentType: ComponentType
    isFixed: boolean; amount: number; percentage: number
    isDefault: boolean; isActive: boolean; description: string | null
}

interface EmpSalaryConfig {
    id: string; salaryType: SalaryType; baseAmount: number; currency: string
    overtimeMultiplier: number; effectiveFrom: string
    components: { componentId: string; name: string; componentType: string; isFixed: boolean; amount: number; percentage: number }[]
}

interface EmpRow {
    id: string; firstName: string; lastName: string; employeeNo: string | null
    department: string | null; salaryConfig: EmpSalaryConfig | null
}

const STATUS_COLORS: Record<PeriodStatus, string> = {
    Draft: 'bg-slate-100 text-slate-600',
    Calculated: 'bg-amber-100 text-amber-700',
    Approved: 'bg-emerald-100 text-emerald-700',
    Paid: 'bg-blue-100 text-blue-700',
}
const ENTRY_COLORS: Record<EntryStatus, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    Approved: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-red-100 text-red-600',
}
const COMP_COLORS: Record<ComponentType, string> = {
    Allowance: 'bg-emerald-100 text-emerald-700',
    Bonus: 'bg-blue-100 text-blue-700',
    Deduction: 'bg-red-100 text-red-600',
}

export function PayrollCalculationPage() {
    const { token } = useAuth()
    const [tab, setTab] = useState<Tab>('periods')
    const [error, setError] = useState<string | null>(null)

    // ── Periods ──────────────────────────────────────────────────────────────
    const [periods, setPeriods] = useState<Period[]>([])
    const [periodLoading, setPeriodLoading] = useState(false)
    const [detail, setDetail] = useState<PeriodDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState<string | null>(null) // holds period id being loaded
    const [newPeriodOpen, setNewPeriodOpen] = useState(false)
    const [newYear, setNewYear] = useState(new Date().getFullYear())
    const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1)
    const [calcTaxRate, setCalcTaxRate] = useState('14')
    const [calcOpen, setCalcOpen] = useState(false)
    const [calcPeriodId, setCalcPeriodId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [payslip, setPayslip] = useState<PayrollEntry | null>(null)

    // ── Components ────────────────────────────────────────────────────────────
    const [components, setComponents] = useState<PayrollComponent[]>([])
    const [compLoading, setCompLoading] = useState(false)
    const [compForm, setCompForm] = useState<Partial<PayrollComponent> & { open: boolean; editId: string | null }>({
        open: false, editId: null, name: '', componentType: 'Allowance', isFixed: true,
        amount: 0, percentage: 0, isDefault: false, isActive: true, description: ''
    })

    // ── Salary Setup ─────────────────────────────────────────────────────────
    const [employees, setEmployees] = useState<EmpRow[]>([])
    const [empLoading, setEmpLoading] = useState(false)
    const [salaryForm, setSalaryForm] = useState<{
        open: boolean; emp: EmpRow | null
        salaryType: SalaryType; baseAmount: string; currency: string
        overtimeMultiplier: string; effectiveFrom: string; componentIds: Set<string>
    }>({
        open: false, emp: null, salaryType: 'Monthly', baseAmount: '',
        currency: 'AZN', overtimeMultiplier: '1.5',
        effectiveFrom: new Date().toISOString().slice(0, 10), componentIds: new Set()
    })

    const loadPeriods = useCallback(async () => {
        if (!token) return
        setPeriodLoading(true)
        try {
            const data = await apiRequest<Period[]>('/api/payroll/periods', { token })
            setPeriods(data)
        } catch { /* silent */ }
        setPeriodLoading(false)
    }, [token])

    const loadComponents = useCallback(async () => {
        if (!token) return
        setCompLoading(true)
        try {
            const data = await apiRequest<PayrollComponent[]>('/api/payroll/components', { token })
            setComponents(data)
        } catch { /* silent */ }
        setCompLoading(false)
    }, [token])

    const loadEmployees = useCallback(async () => {
        if (!token) return
        setEmpLoading(true)
        try {
            const data = await apiRequest<EmpRow[]>('/api/payroll/employees', { token })
            setEmployees(data)
        } catch { /* silent */ }
        setEmpLoading(false)
    }, [token])

    useEffect(() => { loadPeriods() }, [loadPeriods])
    useEffect(() => { if (tab === 'components') loadComponents() }, [tab, loadComponents])
    useEffect(() => { if (tab === 'setup') { loadEmployees(); loadComponents() } }, [tab, loadEmployees, loadComponents])

    async function toggleDetail(p: Period) {
        if (detail?.period.id === p.id) { setDetail(null); return }
        setDetailLoading(p.id)
        try {
            const data = await apiRequest<PeriodDetail>(`/api/payroll/periods/${p.id}/entries`, { token: token! })
            setDetail(data)
        } catch { /* silent */ }
        setDetailLoading(null)
    }

    async function refreshDetail(periodId: string) {
        try {
            const data = await apiRequest<PeriodDetail>(`/api/payroll/periods/${periodId}/entries`, { token: token! })
            setDetail(data)
        } catch { /* silent */ }
    }

    async function createPeriod() {
        setSaving(true)
        try {
            await apiRequest('/api/payroll/periods', {
                token: token!, method: 'POST',
                body: JSON.stringify({ year: newYear, month: newMonth })
            })
            setNewPeriodOpen(false)
            loadPeriods()
        } catch (e: any) { setError(e?.message ?? 'Failed to create period') }
        setSaving(false)
    }

    async function calculate() {
        if (!calcPeriodId) return
        setSaving(true)
        try {
            await apiRequest(`/api/payroll/periods/${calcPeriodId}/calculate`, {
                token: token!, method: 'POST',
                body: JSON.stringify({ taxRate: parseFloat(calcTaxRate) || 14 })
            })
            setCalcOpen(false)
            loadPeriods()
            if (detail?.period.id === calcPeriodId) await refreshDetail(calcPeriodId)
        } catch (e: any) { setError(e?.message ?? 'Calculation failed') }
        setSaving(false)
    }

    async function approvePeriod(id: string) {
        if (!confirm('Approve all entries in this period?')) return
        try {
            await apiRequest(`/api/payroll/periods/${id}/approve`, { token: token!, method: 'POST' })
            loadPeriods()
            if (detail?.period.id === id) await refreshDetail(id)
        } catch (e: any) { setError(e?.message ?? 'Approval failed') }
    }

    async function markAsPaid(id: string) {
        if (!confirm('Mark this period as paid? This cannot be undone.')) return
        try {
            await apiRequest(`/api/payroll/periods/${id}/mark-paid`, { token: token!, method: 'POST' })
            loadPeriods()
            if (detail?.period.id === id) await refreshDetail(id)
        } catch (e: any) { setError(e?.message ?? 'Failed') }
    }

    async function approveEntry(periodId: string, entryId: string) {
        try {
            await apiRequest(`/api/payroll/periods/${periodId}/entries/${entryId}/approve`, { token: token!, method: 'PUT' })
            await refreshDetail(periodId)
            loadPeriods()
        } catch { /* silent */ }
    }

    async function rejectEntry(periodId: string, entryId: string) {
        try {
            await apiRequest(`/api/payroll/periods/${periodId}/entries/${entryId}/reject`, { token: token!, method: 'PUT' })
            await refreshDetail(periodId)
            loadPeriods()
        } catch { /* silent */ }
    }

    // ── Components CRUD ───────────────────────────────────────────────────────
    function openCompCreate() {
        setCompForm({ open: true, editId: null, name: '', componentType: 'Allowance', isFixed: true, amount: 0, percentage: 0, isDefault: false, isActive: true, description: '' })
    }
    function openCompEdit(c: PayrollComponent) {
        setCompForm({ open: true, editId: c.id, name: c.name, componentType: c.componentType, isFixed: c.isFixed, amount: c.amount, percentage: c.percentage, isDefault: c.isDefault, isActive: c.isActive, description: c.description ?? '' })
    }
    async function saveComp() {
        setSaving(true)
        try {
            const body = JSON.stringify({
                name: compForm.name, componentType: compForm.componentType, isFixed: compForm.isFixed,
                amount: compForm.amount, percentage: compForm.percentage, isDefault: compForm.isDefault,
                isActive: compForm.isActive, description: compForm.description
            })
            const url = compForm.editId ? `/api/payroll/components/${compForm.editId}` : '/api/payroll/components'
            await apiRequest(url, { token: token!, method: compForm.editId ? 'PUT' : 'POST', body })
            setCompForm(f => ({ ...f, open: false }))
            loadComponents()
        } catch (e: any) { setError(e?.message ?? 'Save failed') }
        setSaving(false)
    }
    async function deleteComp(id: string) {
        if (!confirm('Delete this component?')) return
        try {
            await apiRequest(`/api/payroll/components/${id}`, { token: token!, method: 'DELETE' })
            loadComponents()
        } catch { /* silent */ }
    }

    // ── Salary Setup ──────────────────────────────────────────────────────────
    function openSalaryEdit(emp: EmpRow) {
        const cfg = emp.salaryConfig
        setSalaryForm({
            open: true, emp,
            salaryType: cfg?.salaryType ?? 'Monthly',
            baseAmount: cfg?.baseAmount?.toString() ?? '',
            currency: cfg?.currency ?? 'AZN',
            overtimeMultiplier: cfg?.overtimeMultiplier?.toString() ?? '1.5',
            effectiveFrom: cfg?.effectiveFrom ?? new Date().toISOString().slice(0, 10),
            componentIds: new Set(cfg?.components.map(c => c.componentId) ?? [])
        })
    }
    async function saveSalary() {
        if (!salaryForm.emp) return
        setSaving(true)
        try {
            await apiRequest(`/api/payroll/employees/${salaryForm.emp.id}/salary`, {
                token: token!, method: 'PUT',
                body: JSON.stringify({
                    salaryType: salaryForm.salaryType,
                    baseAmount: parseFloat(salaryForm.baseAmount) || 0,
                    currency: salaryForm.currency,
                    overtimeMultiplier: parseFloat(salaryForm.overtimeMultiplier) || 1.5,
                    effectiveFrom: salaryForm.effectiveFrom,
                    componentIds: [...salaryForm.componentIds]
                })
            })
            setSalaryForm(f => ({ ...f, open: false }))
            loadEmployees()
        } catch (e: any) { setError(e?.message ?? 'Save failed') }
        setSaving(false)
    }

    const totalGross = periods.reduce((s, p) => s + p.totalGross, 0)
    const totalNet = periods.reduce((s, p) => s + p.totalNet, 0)
    const configuredCount = employees.filter(e => e.salaryConfig).length

    function parseComponents(json: string | null): AppliedComponent[] {
        if (!json) return []
        try { return JSON.parse(json) } catch { return [] }
    }

    return (
        <AppLayout onAction={() => { }}>
            <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
                <div className="p-6 md:p-10 space-y-8">

                    {/* Error banner */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 flex items-center justify-between text-sm font-bold">
                            {error}
                            <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <PageHeader className="p-0 border-none shadow-none bg-transparent"
                            title="Payroll" description="Salary calculation, pay components and period management." />
                        {tab === 'periods' && (
                            <button onClick={() => setNewPeriodOpen(true)}
                                className="px-5 py-2.5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-md hover:opacity-90 transition">
                                + New Period
                            </button>
                        )}
                        {tab === 'components' && (
                            <button onClick={openCompCreate}
                                className="px-5 py-2.5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-md hover:opacity-90 transition">
                                + Add Component
                            </button>
                        )}
                    </div>

                    {/* Summary Cards */}
                    {tab === 'periods' && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Periods', value: periods.length.toString(), icon: 'calendar_month', sub: 'all time' },
                                { label: 'Total Gross', value: fmt(totalGross), icon: 'payments', sub: 'all periods' },
                                { label: 'Total Net', value: fmt(totalNet), icon: 'account_balance_wallet', sub: 'after tax & deductions' },
                                { label: 'Approved', value: periods.filter(p => p.status === 'Approved' || p.status === 'Paid').length.toString(), icon: 'verified', sub: 'periods' },
                            ].map((s, i) => (
                                <div key={i} className="bg-surface rounded-3xl shadow-sm p-5 space-y-3 border border-divider-light">
                                    <div className="flex items-center justify-between">
                                        <span className="material-symbols-outlined text-primary text-xl">{s.icon}</span>
                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{s.sub}</span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-text-light uppercase tracking-widest mb-1">{s.label}</p>
                                        <p className="text-xl font-black text-text-dark">{s.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
                        {(['periods', 'setup', 'components'] as Tab[]).map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${tab === t ? 'bg-white shadow text-primary' : 'text-text-muted hover:text-text-dark'}`}>
                                {t === 'periods' ? 'Periods' : t === 'setup' ? 'Salary Setup' : 'Components'}
                            </button>
                        ))}
                    </div>

                    {/* ── Periods Tab ───────────────────────────────────────────────────── */}
                    {tab === 'periods' && (
                        <div className="space-y-3">
                            {periodLoading && <p className="text-text-muted text-sm">Loading...</p>}
                            {periods.length === 0 && !periodLoading && (
                                <div className="bg-surface rounded-3xl p-12 text-center border border-dashed border-divider-light">
                                    <span className="material-symbols-outlined text-4xl text-text-muted mb-3 block">payments</span>
                                    <p className="text-text-muted text-sm font-bold">No payroll periods yet.</p>
                                    <p className="text-text-muted text-xs mt-1">Create a new period to start calculating salaries.</p>
                                </div>
                            )}
                            {periods.map(p => (
                                <div key={p.id} className="bg-surface rounded-3xl shadow-sm border border-divider-light overflow-hidden">
                                    <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                                        {/* Period badge */}
                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[10px] font-black text-primary">{MONTHS[p.month - 1].slice(0, 3).toUpperCase()}</span>
                                                <span className="text-sm font-black text-primary">{p.year}</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-text-dark text-sm">{MONTHS[p.month - 1]} {p.year}</p>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${STATUS_COLORS[p.status]}`}>{p.status.toUpperCase()}</span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Employees</p>
                                                <p className="text-sm font-bold text-text-dark">{p.employeeCount}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Gross</p>
                                                <p className="text-sm font-bold text-text-dark">{fmt(p.totalGross)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Tax</p>
                                                <p className="text-sm font-bold text-red-500">{fmt(p.totalTax)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Net</p>
                                                <p className="text-sm font-black text-emerald-600">{fmt(p.totalNet)}</p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                            {p.status === 'Draft' && (
                                                <button onClick={() => { setCalcPeriodId(p.id); setCalcOpen(true) }}
                                                    className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition">
                                                    Calculate
                                                </button>
                                            )}
                                            {p.status === 'Calculated' && (
                                                <>
                                                    <button onClick={() => { setCalcPeriodId(p.id); setCalcOpen(true) }}
                                                        className="px-3 py-1.5 border border-amber-400 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-50 transition">
                                                        Recalc
                                                    </button>
                                                    <button onClick={() => approvePeriod(p.id)}
                                                        className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition">
                                                        Approve
                                                    </button>
                                                </>
                                            )}
                                            {p.status === 'Approved' && (
                                                <button onClick={() => markAsPaid(p.id)}
                                                    className="px-3 py-1.5 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition">
                                                    Mark Paid
                                                </button>
                                            )}
                                            <button
                                                onClick={() => toggleDetail(p)}
                                                className={`px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 ${detail?.period.id === p.id ? 'border-primary text-primary bg-primary/5' : 'border-divider-light text-text-muted hover:bg-slate-50'}`}>
                                                {detailLoading === p.id ? '...' : detail?.period.id === p.id ? '▲ Close' : '▼ View'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Inline detail table */}
                                    {detail?.period.id === p.id && (
                                        <div className="border-t border-divider-light">
                                            {/* Summary row */}
                                            {detail.entries.length > 0 && (
                                                <div className="px-5 py-3 bg-slate-50 border-b border-divider-light grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    {[
                                                        { label: 'Total Gross', value: fmt(detail.entries.reduce((s, e) => s + e.grossPay, 0)), color: 'text-text-dark' },
                                                        { label: 'Allowances', value: fmt(detail.entries.reduce((s, e) => s + e.allowancesTotal + e.bonusesTotal, 0)), color: 'text-emerald-600' },
                                                        { label: 'Tax + Deductions', value: fmt(detail.entries.reduce((s, e) => s + e.taxAmount + e.deductionsTotal, 0)), color: 'text-red-500' },
                                                        { label: 'Total Net', value: fmt(detail.entries.reduce((s, e) => s + e.netPay, 0)), color: 'text-emerald-700 font-black' },
                                                    ].map(s => (
                                                        <div key={s.label}>
                                                            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">{s.label}</p>
                                                            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-slate-50/70">
                                                            {['Employee', 'Dept', 'Days', 'Hours', 'OT h', 'Base', 'Allow+Bonus', 'Gross', 'Deduct', 'Tax', 'Net', 'Status', ''].map(h => (
                                                                <th key={h} className="px-3 py-2.5 text-left text-[9px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detail.entries.map(e => (
                                                            <tr key={e.id}
                                                                onClick={() => setPayslip(e)}
                                                                className="border-t border-divider-light hover:bg-primary/5 cursor-pointer group">
                                                                <td className="px-3 py-2.5 font-bold text-text-dark whitespace-nowrap group-hover:text-primary transition-colors">{e.employeeName}</td>
                                                                <td className="px-3 py-2.5 text-text-muted whitespace-nowrap">{e.department ?? '—'}</td>
                                                                <td className="px-3 py-2.5 text-text-dark">{e.workedDays}<span className="text-text-muted text-[9px]">/{e.workedDays + e.absentDays}</span></td>
                                                                <td className="px-3 py-2.5 text-text-dark">{fmtH(e.workedHours)}h</td>
                                                                <td className="px-3 py-2.5 text-amber-600 font-bold">{fmtH(e.overtimeHours)}h</td>
                                                                <td className="px-3 py-2.5 text-text-dark">{fmt(e.basePay)}</td>
                                                                <td className="px-3 py-2.5 text-emerald-600 font-bold">{fmt(e.allowancesTotal + e.bonusesTotal)}</td>
                                                                <td className="px-3 py-2.5 font-bold text-text-dark">{fmt(e.grossPay)}</td>
                                                                <td className="px-3 py-2.5 text-red-400">{fmt(e.deductionsTotal)}</td>
                                                                <td className="px-3 py-2.5 text-red-500">{fmt(e.taxAmount)}<span className="text-[9px] text-text-muted ml-0.5">{e.taxRate}%</span></td>
                                                                <td className="px-3 py-2.5 font-black text-emerald-600 whitespace-nowrap">{fmt(e.netPay)}</td>
                                                                <td className="px-3 py-2.5">
                                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${ENTRY_COLORS[e.status]}`}>{e.status}</span>
                                                                </td>
                                                                <td className="px-3 py-2.5" onClick={ev => ev.stopPropagation()}>
                                                                    {e.status === 'Pending' && (
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => approveEntry(p.id, e.id)}
                                                                                className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 text-xs font-black flex items-center justify-center">✓</button>
                                                                            <button onClick={() => rejectEntry(p.id, e.id)}
                                                                                className="w-6 h-6 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 text-xs font-black flex items-center justify-center">✕</button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {detail.entries.length === 0 && (
                                                    <p className="p-6 text-text-muted text-sm text-center">No entries. Run calculation first.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Setup Tab ─────────────────────────────────────────────────────── */}
                    {tab === 'setup' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[11px] text-text-muted font-bold">
                                <span className="material-symbols-outlined text-base text-primary">info</span>
                                {configuredCount} of {employees.length} employees have salary configured.
                            </div>
                            {empLoading && <p className="text-text-muted text-sm">Loading...</p>}
                            <div className="bg-surface rounded-3xl shadow-sm border border-divider-light overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-divider-light">
                                            {['Employee', 'Department', 'Salary Type', 'Base Amount', 'Currency', 'OT ×', 'Components', 'Effective From', ''].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-text-muted uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map(emp => {
                                            const cfg = emp.salaryConfig
                                            return (
                                                <tr key={emp.id} className="border-t border-divider-light hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-bold text-text-dark">{emp.firstName} {emp.lastName}</td>
                                                    <td className="px-4 py-3 text-text-muted">{emp.department ?? '—'}</td>
                                                    <td className="px-4 py-3">
                                                        {cfg ? <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-lg">{cfg.salaryType}</span>
                                                            : <span className="text-red-400 text-[9px] font-black">Not set</span>}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-text-dark">{cfg ? fmt(cfg.baseAmount) : '—'}</td>
                                                    <td className="px-4 py-3 text-text-muted">{cfg?.currency ?? '—'}</td>
                                                    <td className="px-4 py-3 text-text-muted">{cfg ? `×${cfg.overtimeMultiplier}` : '—'}</td>
                                                    <td className="px-4 py-3">
                                                        {cfg ? (
                                                            <div className="flex gap-1 flex-wrap">
                                                                {cfg.components.slice(0, 3).map(c => (
                                                                    <span key={c.componentId} className={`text-[8px] font-black px-1.5 py-0.5 rounded ${COMP_COLORS[c.componentType as ComponentType] ?? ''}`}>
                                                                        {c.name}
                                                                    </span>
                                                                ))}
                                                                {cfg.components.length > 3 && <span className="text-[8px] text-text-muted font-bold">+{cfg.components.length - 3}</span>}
                                                                {cfg.components.length === 0 && <span className="text-[9px] text-text-muted">none</span>}
                                                            </div>
                                                        ) : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-text-muted">{cfg?.effectiveFrom?.slice(0, 10) ?? '—'}</td>
                                                    <td className="px-4 py-3">
                                                        <button onClick={() => openSalaryEdit(emp)}
                                                            className={`text-[10px] font-black hover:underline ${cfg ? 'text-primary' : 'text-amber-600'}`}>
                                                            {cfg ? 'Edit' : 'Set Up'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                                {employees.length === 0 && !empLoading && (
                                    <p className="p-8 text-center text-text-muted text-sm">No active employees found.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Components Tab ────────────────────────────────────────────────── */}
                    {tab === 'components' && (
                        <div className="space-y-4">
                            {compLoading && <p className="text-text-muted text-sm">Loading...</p>}
                            <div className="bg-surface rounded-3xl shadow-sm border border-divider-light overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-divider-light">
                                            {['Name', 'Type', 'Calculation', 'Value', 'Applies To', 'Active', 'Description', ''].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-text-muted uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {components.map(c => (
                                            <tr key={c.id} className="border-t border-divider-light hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-bold text-text-dark">{c.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${COMP_COLORS[c.componentType]}`}>{c.componentType}</span>
                                                </td>
                                                <td className="px-4 py-3 text-text-muted">{c.isFixed ? 'Fixed' : '% of base'}</td>
                                                <td className="px-4 py-3 font-bold text-text-dark">{c.isFixed ? fmt(c.amount) : `${c.percentage}%`}</td>
                                                <td className="px-4 py-3">
                                                    {c.isDefault
                                                        ? <span className="text-[9px] font-black text-emerald-600">All employees</span>
                                                        : <span className="text-[9px] text-text-muted">Individual</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[9px] font-black ${c.isActive ? 'text-emerald-600' : 'text-text-muted'}`}>
                                                        {c.isActive ? '● Active' : '○ Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-text-muted max-w-[180px] truncate">{c.description || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-3">
                                                        <button onClick={() => openCompEdit(c)} className="text-[10px] font-black text-primary hover:underline">Edit</button>
                                                        <button onClick={() => deleteComp(c.id)} className="text-[10px] font-black text-red-500 hover:underline">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {components.length === 0 && !compLoading && (
                                    <p className="p-8 text-center text-text-muted text-sm">No components yet. Add allowances, bonuses and deductions.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── New Period Modal ───────────────────────────────────────────────────── */}
            {newPeriodOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5">
                        <h2 className="text-base font-black text-text-dark">New Payroll Period</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Year</label>
                                <input type="number" value={newYear} onChange={e => setNewYear(+e.target.value)} min={2020} max={2100}
                                    className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Month</label>
                                <select value={newMonth} onChange={e => setNewMonth(+e.target.value)}
                                    className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setNewPeriodOpen(false)} className="flex-1 py-2.5 border border-divider-light rounded-xl text-[11px] font-black uppercase tracking-wider text-text-muted hover:bg-slate-50">Cancel</button>
                            <button onClick={createPeriod} disabled={saving}
                                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:opacity-90 disabled:opacity-50">
                                {saving ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Calculate Modal ────────────────────────────────────────────────────── */}
            {calcOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5">
                        <h2 className="text-base font-black text-text-dark">Run Payroll Calculation</h2>
                        <p className="text-xs text-text-muted leading-relaxed">
                            Calculates salaries for all configured employees based on attendance logs.
                            Previously calculated entries will be recalculated.
                        </p>
                        <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Income Tax Rate (%)</label>
                            <input type="number" value={calcTaxRate} onChange={e => setCalcTaxRate(e.target.value)} min={0} max={100} step={0.5}
                                className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setCalcOpen(false)} className="flex-1 py-2.5 border border-divider-light rounded-xl text-[11px] font-black uppercase tracking-wider text-text-muted hover:bg-slate-50">Cancel</button>
                            <button onClick={calculate} disabled={saving}
                                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:opacity-90 disabled:opacity-50">
                                {saving ? 'Calculating...' : 'Calculate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Component Form Modal ───────────────────────────────────────────────── */}
            {compForm.open && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-base font-black text-text-dark">{compForm.editId ? 'Edit' : 'New'} Pay Component</h2>
                        <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Name</label>
                            <input value={compForm.name ?? ''} onChange={e => setCompForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Type</label>
                                <select value={compForm.componentType} onChange={e => setCompForm(f => ({ ...f, componentType: e.target.value as ComponentType }))}
                                    className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                                    <option>Allowance</option><option>Bonus</option><option>Deduction</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Calculation</label>
                                <select value={compForm.isFixed ? 'fixed' : 'percent'} onChange={e => setCompForm(f => ({ ...f, isFixed: e.target.value === 'fixed' }))}
                                    className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                                    <option value="fixed">Fixed Amount</option>
                                    <option value="percent">% of Base Salary</option>
                                </select>
                            </div>
                        </div>
                        {compForm.isFixed ? (
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Fixed Amount</label>
                                <input type="number" value={compForm.amount ?? 0} onChange={e => setCompForm(f => ({ ...f, amount: +e.target.value }))} min={0}
                                    className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                        ) : (
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Percentage of Base (%)</label>
                                <input type="number" value={compForm.percentage ?? 0} onChange={e => setCompForm(f => ({ ...f, percentage: +e.target.value }))} min={0} max={100} step={0.5}
                                    className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Description (optional)</label>
                            <input value={compForm.description ?? ''} onChange={e => setCompForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={compForm.isDefault ?? false} onChange={e => setCompForm(f => ({ ...f, isDefault: e.target.checked }))} className="rounded" />
                                <span className="text-xs font-bold text-text-dark">Apply to all employees</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={compForm.isActive ?? true} onChange={e => setCompForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                                <span className="text-xs font-bold text-text-dark">Active</span>
                            </label>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setCompForm(f => ({ ...f, open: false }))} className="flex-1 py-2.5 border border-divider-light rounded-xl text-[11px] font-black uppercase tracking-wider text-text-muted hover:bg-slate-50">Cancel</button>
                            <button onClick={saveComp} disabled={saving}
                                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:opacity-90 disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Salary Config Modal ───────────────────────────────────────────────── */}
            {salaryForm.open && salaryForm.emp && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-base font-black text-text-dark">
                            Salary — {salaryForm.emp.firstName} {salaryForm.emp.lastName}
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Salary Type</label>
                                <select value={salaryForm.salaryType} onChange={e => setSalaryForm(f => ({ ...f, salaryType: e.target.value as SalaryType }))}
                                    className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                                    <option>Monthly</option><option>Hourly</option><option>Daily</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
                                    {salaryForm.salaryType === 'Monthly' ? 'Monthly Salary' : salaryForm.salaryType === 'Hourly' ? 'Hourly Rate' : 'Daily Rate'}
                                </label>
                                <input type="number" value={salaryForm.baseAmount} onChange={e => setSalaryForm(f => ({ ...f, baseAmount: e.target.value }))} min={0}
                                    className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Currency</label>
                                <input value={salaryForm.currency} onChange={e => setSalaryForm(f => ({ ...f, currency: e.target.value }))}
                                    className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Overtime Multiplier</label>
                                <input type="number" value={salaryForm.overtimeMultiplier} onChange={e => setSalaryForm(f => ({ ...f, overtimeMultiplier: e.target.value }))} min={1} step={0.25}
                                    className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Effective From</label>
                                <input type="date" value={salaryForm.effectiveFrom} onChange={e => setSalaryForm(f => ({ ...f, effectiveFrom: e.target.value }))}
                                    className="w-full border border-divider-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                        </div>

                        {components.filter(c => c.isActive).length > 0 && (
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Pay Components</p>
                                <div className="space-y-1 max-h-52 overflow-y-auto border border-divider-light rounded-2xl p-3">
                                    {components.filter(c => c.isActive).map(c => (
                                        <label key={c.id} className={`flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-xl transition ${salaryForm.componentIds.has(c.id) ? 'bg-primary/5' : 'hover:bg-slate-50'}`}>
                                            <input type="checkbox"
                                                checked={salaryForm.componentIds.has(c.id)}
                                                onChange={ev => setSalaryForm(f => {
                                                    const s = new Set(f.componentIds)
                                                    ev.target.checked ? s.add(c.id) : s.delete(c.id)
                                                    return { ...f, componentIds: s }
                                                })}
                                                className="rounded" />
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${COMP_COLORS[c.componentType]}`}>{c.componentType[0]}</span>
                                            <span className="text-xs font-bold text-text-dark flex-1">{c.name}</span>
                                            {c.isDefault && <span className="text-[8px] font-black text-text-muted">DEFAULT</span>}
                                            <span className="text-xs text-text-muted">{c.isFixed ? fmt(c.amount) : `${c.percentage}%`}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setSalaryForm(f => ({ ...f, open: false }))} className="flex-1 py-2.5 border border-divider-light rounded-xl text-[11px] font-black uppercase tracking-wider text-text-muted hover:bg-slate-50">Cancel</button>
                            <button onClick={saveSalary} disabled={saving}
                                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:opacity-90 disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Payslip Modal ─────────────────────────────────────────────────────── */}
            {payslip && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPayslip(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-base font-black text-text-dark">{payslip.employeeName}</h2>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{payslip.department ?? ''} {payslip.employeeNo ? `· #${payslip.employeeNo}` : ''}</p>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${ENTRY_COLORS[payslip.status]}`}>{payslip.status}</span>
                        </div>

                        {/* Attendance */}
                        <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
                            {[
                                { label: 'Worked Days', value: payslip.workedDays },
                                { label: 'Worked Hours', value: `${fmtH(payslip.workedHours)}h` },
                                { label: 'Overtime', value: `${fmtH(payslip.overtimeHours)}h` },
                            ].map(s => (
                                <div key={s.label}>
                                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">{s.label}</p>
                                    <p className="text-base font-black text-text-dark">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Earnings breakdown */}
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Earnings</p>
                            {[
                                { label: 'Base Pay', value: payslip.basePay, color: 'text-text-dark' },
                                { label: 'Overtime Pay', value: payslip.overtimePay, color: 'text-amber-600' },
                                { label: 'Allowances', value: payslip.allowancesTotal, color: 'text-emerald-600' },
                                { label: 'Bonuses', value: payslip.bonusesTotal, color: 'text-blue-600' },
                            ].map(r => r.value !== 0 && (
                                <div key={r.label} className="flex justify-between text-xs">
                                    <span className="text-text-muted font-bold">{r.label}</span>
                                    <span className={`font-bold ${r.color}`}>{fmt(r.value)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-sm font-black border-t border-divider-light pt-2">
                                <span className="text-text-dark">Gross Pay</span>
                                <span className="text-text-dark">{fmt(payslip.grossPay)}</span>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Deductions</p>
                            {payslip.deductionsTotal > 0 && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-text-muted font-bold">Other Deductions</span>
                                    <span className="font-bold text-red-400">−{fmt(payslip.deductionsTotal)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs">
                                <span className="text-text-muted font-bold">Income Tax ({payslip.taxRate}%)</span>
                                <span className="font-bold text-red-500">−{fmt(payslip.taxAmount)}</span>
                            </div>
                        </div>

                        {/* Applied components */}
                        {parseComponents(payslip.componentsJson).length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Applied Components</p>
                                {parseComponents(payslip.componentsJson).map((c, i) => (
                                    <div key={i} className="flex justify-between text-xs items-center">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${COMP_COLORS[c.item2 as ComponentType] ?? 'bg-slate-100 text-slate-600'}`}>{c.item2[0]}</span>
                                            <span className="text-text-muted font-bold">{c.item1}</span>
                                        </div>
                                        <span className={`font-bold ${c.item2 === 'Deduction' ? 'text-red-400' : 'text-emerald-600'}`}>
                                            {c.item2 === 'Deduction' ? '−' : '+'}{fmt(c.item3)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Net */}
                        <div className="bg-emerald-50 rounded-2xl p-4 flex justify-between items-center">
                            <span className="text-sm font-black text-emerald-800">Net Pay</span>
                            <span className="text-2xl font-black text-emerald-700">{fmt(payslip.netPay)}</span>
                        </div>

                        <button onClick={() => setPayslip(null)}
                            className="w-full py-2.5 border border-divider-light rounded-xl text-[11px] font-black uppercase tracking-wider text-text-muted hover:bg-slate-50">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}
