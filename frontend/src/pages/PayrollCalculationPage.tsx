import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppLayout } from '../components/templates'
import { Badge, Button, Input } from '../components/atoms'
import { PageHeader, Modal } from '../components/organisms'
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

interface OvertimeTier { afterHours: number; multiplier: number }
interface LatenessTier { afterMinutes: number; deductionMultiplier: number }

interface EmpSalaryConfig {
    id: string; salaryType: SalaryType; baseAmount: number; currency: string
    overtimeMultiplier: number; overtimeEnabled: boolean; payByWorkedHours: boolean
    overtimeTiersJson: string | null; latenessDeductionEnabled: boolean; latenessTiersJson: string | null
    effectiveFrom: string
    components: { componentId: string; name: string; componentType: string; isFixed: boolean; amount: number; percentage: number }[]
}

interface EmpRow {
    id: string; firstName: string; lastName: string; employeeNo: string | null
    department: string | null; salaryConfig: EmpSalaryConfig | null
}

function periodStatusVariant(status: PeriodStatus): 'neutral' | 'warning' | 'success' | 'primary' {
    switch (status) {
        case 'Draft': return 'neutral'
        case 'Calculated': return 'warning'
        case 'Approved': return 'success'
        case 'Paid': return 'primary'
    }
}

function entryStatusVariant(status: EntryStatus): 'warning' | 'success' | 'error' {
    switch (status) {
        case 'Pending': return 'warning'
        case 'Approved': return 'success'
        case 'Rejected': return 'error'
    }
}

function compTypeVariant(type: ComponentType): 'success' | 'primary' | 'error' {
    switch (type) {
        case 'Allowance': return 'success'
        case 'Bonus': return 'primary'
        case 'Deduction': return 'error'
    }
}

const PAYROLL_TABS: { value: Tab; label: string }[] = [
    { value: 'periods', label: 'Periods' },
    { value: 'setup', label: 'Salary Setup' },
    { value: 'components', label: 'Components' },
]

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
        overtimeMultiplier: string; overtimeEnabled: boolean; payByWorkedHours: boolean
        overtimeTiers: OvertimeTier[]; latenessDeductionEnabled: boolean; latenessTiers: LatenessTier[]
        effectiveFrom: string; componentIds: Set<string>
    }>({
        open: false, emp: null, salaryType: 'Monthly', baseAmount: '',
        currency: 'AZN', overtimeMultiplier: '1.5', overtimeEnabled: true, payByWorkedHours: false,
        overtimeTiers: [], latenessDeductionEnabled: false, latenessTiers: [],
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
    function parseTiers<T>(json: string | null | undefined): T[] {
        if (!json) return []
        try { return JSON.parse(json) } catch { return [] }
    }

    function openSalaryEdit(emp: EmpRow) {
        const cfg = emp.salaryConfig
        setSalaryForm({
            open: true, emp,
            salaryType: cfg?.salaryType ?? 'Monthly',
            baseAmount: cfg?.baseAmount?.toString() ?? '',
            currency: cfg?.currency ?? 'AZN',
            overtimeMultiplier: cfg?.overtimeMultiplier?.toString() ?? '1.5',
            overtimeEnabled: cfg?.overtimeEnabled ?? true,
            payByWorkedHours: cfg?.payByWorkedHours ?? false,
            overtimeTiers: parseTiers<OvertimeTier>(cfg?.overtimeTiersJson),
            latenessDeductionEnabled: cfg?.latenessDeductionEnabled ?? false,
            latenessTiers: parseTiers<LatenessTier>(cfg?.latenessTiersJson),
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
                    overtimeEnabled: salaryForm.overtimeEnabled,
                    payByWorkedHours: salaryForm.payByWorkedHours,
                    overtimeTiers: salaryForm.overtimeTiers.length > 0 ? salaryForm.overtimeTiers : null,
                    latenessDeductionEnabled: salaryForm.latenessDeductionEnabled,
                    latenessTiers: salaryForm.latenessTiers.length > 0 ? salaryForm.latenessTiers : null,
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
                <div className="p-6 md:p-8 space-y-6">

                    {/* Header */}
                    <PageHeader
                        className="hidden md:flex"
                        title="Payroll"
                        description="Salary calculation, pay components and period management."
                        actions={
                            tab === 'periods' ? (
                                <Button icon="add" size="md" onClick={() => setNewPeriodOpen(true)}>
                                    New Period
                                </Button>
                            ) : tab === 'components' ? (
                                <Button icon="add" size="md" onClick={openCompCreate}>
                                    Add Component
                                </Button>
                            ) : undefined
                        }
                    />

                    {/* Error banner */}
                    {error && (
                        <div className="p-4 bg-error-bg text-error-text rounded-xl text-xs font-bold border border-error-text/10 flex items-center justify-between">
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="ml-4 text-error-text/70 hover:text-error-text">
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>
                    )}

                    {/* Summary stat cards — periods tab only */}
                    {tab === 'periods' && (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-2">
                            <div className="bg-surface p-4 rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
                                <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Total Periods</p>
                                <p className="text-2xl font-black text-primary leading-none">{periods.length}</p>
                            </div>
                            <div className="bg-surface p-4 rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
                                <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Total Gross</p>
                                <p className="text-2xl font-black text-primary leading-none">{fmt(totalGross)}</p>
                            </div>
                            <div className="bg-surface p-4 rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
                                <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Total Net</p>
                                <p className="text-2xl font-black text-primary leading-none">{fmt(totalNet)}</p>
                            </div>
                            <div className="bg-surface p-4 rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
                                <p className="text-[10px] font-black text-text-light uppercase tracking-widest mb-1">Approved</p>
                                <p className="text-2xl font-black text-primary leading-none">
                                    {periods.filter(p => p.status === 'Approved' || p.status === 'Paid').length}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tab bar */}
                    <div className="flex overflow-x-auto no-scrollbar gap-8 mt-6">
                        {PAYROLL_TABS.map(t => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setTab(t.value)}
                                className={`pb-2.5 text-xs font-black whitespace-nowrap uppercase tracking-widest border-b-2 transition-colors ${tab === t.value
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-light hover:text-text-muted'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Periods Tab ───────────────────────────────────────────────────── */}
                    {tab === 'periods' && (
                        <div className="space-y-3">
                            {periodLoading && (
                                <div className="flex items-center justify-center py-16">
                                    <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                                </div>
                            )}
                            {periods.length === 0 && !periodLoading && (
                                <div className="p-12 text-center bg-surface rounded-2xl shadow-md border-none">
                                    <span className="material-symbols-outlined text-4xl text-text-muted mb-3 block">payments</span>
                                    <p className="text-sm font-bold text-text-muted">No payroll periods yet.</p>
                                    <p className="text-xs text-text-light mt-1">Create a new period to start calculating salaries.</p>
                                </div>
                            )}
                            {periods.map(p => (
                                <div key={p.id} className="bg-surface rounded-2xl shadow-md overflow-hidden border-none">
                                    <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                                        {/* Period badge */}
                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[10px] font-black text-primary">{MONTHS[p.month - 1].slice(0, 3).toUpperCase()}</span>
                                                <span className="text-sm font-black text-primary">{p.year}</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-text-dark text-sm">{MONTHS[p.month - 1]} {p.year}</p>
                                                <Badge variant={periodStatusVariant(p.status)} className="mt-1">{p.status}</Badge>
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
                                                <p className="text-sm font-bold text-error-text">{fmt(p.totalTax)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Net</p>
                                                <p className="text-sm font-black text-success-text">{fmt(p.totalNet)}</p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                            {p.status === 'Draft' && (
                                                <Button
                                                    size="md"
                                                    onClick={() => { setCalcPeriodId(p.id); setCalcOpen(true) }}
                                                    className="bg-warning-bg text-warning-text hover:bg-warning-text hover:text-white shadow-none"
                                                >
                                                    Calculate
                                                </Button>
                                            )}
                                            {p.status === 'Calculated' && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="md"
                                                        onClick={() => { setCalcPeriodId(p.id); setCalcOpen(true) }}
                                                    >
                                                        Recalc
                                                    </Button>
                                                    <Button
                                                        size="md"
                                                        onClick={() => approvePeriod(p.id)}
                                                        className="bg-success-bg text-success-text hover:bg-success-text hover:text-white shadow-none"
                                                    >
                                                        Approve
                                                    </Button>
                                                </>
                                            )}
                                            {p.status === 'Approved' && (
                                                <Button
                                                    size="md"
                                                    onClick={() => markAsPaid(p.id)}
                                                    className="bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-none"
                                                >
                                                    Mark Paid
                                                </Button>
                                            )}
                                            <Button
                                                variant={detail?.period.id === p.id ? 'secondary' : 'outline'}
                                                size="md"
                                                icon={detail?.period.id === p.id ? 'expand_less' : 'expand_more'}
                                                onClick={() => toggleDetail(p)}
                                            >
                                                {detailLoading === p.id ? '...' : detail?.period.id === p.id ? 'Close' : 'View'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Inline detail table */}
                                    {detail?.period.id === p.id && (
                                        <div className="border-t border-divider-light">
                                            {/* Summary row */}
                                            {detail.entries.length > 0 && (
                                                <div className="px-5 py-3 bg-slate-50/70 border-b border-divider-light grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    {[
                                                        { label: 'Total Gross', value: fmt(detail.entries.reduce((s, e) => s + e.grossPay, 0)), color: 'text-text-dark' },
                                                        { label: 'Allowances', value: fmt(detail.entries.reduce((s, e) => s + e.allowancesTotal + e.bonusesTotal, 0)), color: 'text-success-text' },
                                                        { label: 'Tax + Deductions', value: fmt(detail.entries.reduce((s, e) => s + e.taxAmount + e.deductionsTotal, 0)), color: 'text-error-text' },
                                                        { label: 'Total Net', value: fmt(detail.entries.reduce((s, e) => s + e.netPay, 0)), color: 'text-success-text font-black' },
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
                                                                className="border-t border-divider-light hover:bg-primary/5 cursor-pointer transition-colors group">
                                                                <td className="px-3 py-2.5 font-bold text-text-dark whitespace-nowrap group-hover:text-primary transition-colors">{e.employeeName}</td>
                                                                <td className="px-3 py-2.5 text-text-muted whitespace-nowrap">{e.department ?? '—'}</td>
                                                                <td className="px-3 py-2.5 text-text-dark">{e.workedDays}<span className="text-text-muted text-[9px]">/{e.workedDays + e.absentDays}</span></td>
                                                                <td className="px-3 py-2.5 text-text-dark">{fmtH(e.workedHours)}h</td>
                                                                <td className="px-3 py-2.5 text-warning-text font-bold">{fmtH(e.overtimeHours)}h</td>
                                                                <td className="px-3 py-2.5 text-text-dark">{fmt(e.basePay)}</td>
                                                                <td className="px-3 py-2.5 text-success-text font-bold">{fmt(e.allowancesTotal + e.bonusesTotal)}</td>
                                                                <td className="px-3 py-2.5 font-bold text-text-dark">{fmt(e.grossPay)}</td>
                                                                <td className="px-3 py-2.5 text-error-text">{fmt(e.deductionsTotal)}</td>
                                                                <td className="px-3 py-2.5 text-error-text">{fmt(e.taxAmount)}<span className="text-[9px] text-text-muted ml-0.5">{e.taxRate}%</span></td>
                                                                <td className="px-3 py-2.5 font-black text-success-text whitespace-nowrap">{fmt(e.netPay)}</td>
                                                                <td className="px-3 py-2.5">
                                                                    <Badge variant={entryStatusVariant(e.status)}>{e.status}</Badge>
                                                                </td>
                                                                <td className="px-3 py-2.5" onClick={ev => ev.stopPropagation()}>
                                                                    {e.status === 'Pending' && (
                                                                        <div className="flex gap-1.5">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                icon="check"
                                                                                className="text-success-text hover:bg-success-bg"
                                                                                onClick={() => approveEntry(p.id, e.id)}
                                                                            />
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                icon="close"
                                                                                className="text-error-text hover:bg-error-bg"
                                                                                onClick={() => rejectEntry(p.id, e.id)}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {detail.entries.length === 0 && (
                                                    <p className="p-6 text-text-muted text-sm text-center italic">No entries. Run calculation first.</p>
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
                            {empLoading && (
                                <div className="flex items-center justify-center py-16">
                                    <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                                </div>
                            )}
                            <div className="bg-surface rounded-2xl shadow-md overflow-hidden border-none">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50/70">
                                            {['Employee', 'Department', 'Salary Type', 'Base Amount', 'Currency', 'OT ×', 'Components', 'Effective From', ''].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-text-muted uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map(emp => {
                                            const cfg = emp.salaryConfig
                                            return (
                                                <tr key={emp.id} className="border-t border-divider-light hover:bg-primary/5 cursor-pointer transition-colors">
                                                    <td className="px-4 py-3 font-bold text-text-dark">{emp.firstName} {emp.lastName}</td>
                                                    <td className="px-4 py-3 text-text-muted">{emp.department ?? '—'}</td>
                                                    <td className="px-4 py-3">
                                                        {cfg
                                                            ? <Badge variant="primary">{cfg.salaryType}</Badge>
                                                            : <Badge variant="error">Not set</Badge>}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-text-dark">{cfg ? fmt(cfg.baseAmount) : '—'}</td>
                                                    <td className="px-4 py-3 text-text-muted">{cfg?.currency ?? '—'}</td>
                                                    <td className="px-4 py-3 text-text-muted">{cfg ? `×${cfg.overtimeMultiplier}` : '—'}</td>
                                                    <td className="px-4 py-3">
                                                        {cfg ? (
                                                            <div className="flex gap-1 flex-wrap">
                                                                {cfg.components.slice(0, 3).map(c => (
                                                                    <Badge key={c.componentId} variant={compTypeVariant(c.componentType as ComponentType)}>
                                                                        {c.name}
                                                                    </Badge>
                                                                ))}
                                                                {cfg.components.length > 3 && (
                                                                    <span className="text-[8px] text-text-muted font-bold">+{cfg.components.length - 3}</span>
                                                                )}
                                                                {cfg.components.length === 0 && (
                                                                    <span className="text-[9px] text-text-muted">none</span>
                                                                )}
                                                            </div>
                                                        ) : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-text-muted">{cfg?.effectiveFrom?.slice(0, 10) ?? '—'}</td>
                                                    <td className="px-4 py-3">
                                                        <Button
                                                            variant={cfg ? 'secondary' : 'outline'}
                                                            size="sm"
                                                            onClick={() => openSalaryEdit(emp)}
                                                        >
                                                            {cfg ? 'Edit' : 'Set Up'}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                                {employees.length === 0 && !empLoading && (
                                    <p className="p-8 text-center text-text-muted text-sm italic">No active employees found.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Components Tab ────────────────────────────────────────────────── */}
                    {tab === 'components' && (
                        <div className="space-y-4">
                            {compLoading && (
                                <div className="flex items-center justify-center py-16">
                                    <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                                </div>
                            )}
                            <div className="bg-surface rounded-2xl shadow-md overflow-hidden border-none">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50/70">
                                            {['Name', 'Type', 'Calculation', 'Value', 'Applies To', 'Active', 'Description', ''].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-text-muted uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {components.map(c => (
                                            <tr key={c.id} className="border-t border-divider-light hover:bg-primary/5 transition-colors">
                                                <td className="px-4 py-3 font-bold text-text-dark">{c.name}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={compTypeVariant(c.componentType)}>{c.componentType}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-text-muted">{c.isFixed ? 'Fixed' : '% of base'}</td>
                                                <td className="px-4 py-3 font-bold text-text-dark">{c.isFixed ? fmt(c.amount) : `${c.percentage}%`}</td>
                                                <td className="px-4 py-3">
                                                    {c.isDefault
                                                        ? <span className="text-[9px] font-black text-success-text">All employees</span>
                                                        : <span className="text-[9px] text-text-muted">Individual</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={c.isActive ? 'success' : 'neutral'}>
                                                        {c.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-text-muted max-w-[180px] truncate">{c.description || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => openCompEdit(c)}>Edit</Button>
                                                        <Button variant="ghost" size="sm" className="text-error-text hover:bg-error-bg" onClick={() => deleteComp(c.id)}>Delete</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {components.length === 0 && !compLoading && (
                                    <p className="p-8 text-center text-text-muted text-sm italic">No components yet. Add allowances, bonuses and deductions.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── New Period Modal ───────────────────────────────────────────────────── */}
            <Modal
                isOpen={newPeriodOpen}
                onClose={() => setNewPeriodOpen(false)}
                title="New Payroll Period"
            >
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Year</label>
                            <input
                                type="number"
                                value={newYear}
                                onChange={e => setNewYear(+e.target.value)}
                                min={2020}
                                max={2100}
                                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Month</label>
                            <select
                                value={newMonth}
                                onChange={e => setNewMonth(+e.target.value)}
                                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" fullWidth onClick={() => setNewPeriodOpen(false)}>Cancel</Button>
                        <Button fullWidth isLoading={saving} onClick={createPeriod}>
                            Create
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── Calculate Modal ────────────────────────────────────────────────────── */}
            <Modal
                isOpen={calcOpen}
                onClose={() => setCalcOpen(false)}
                title="Run Payroll Calculation"
            >
                <div className="space-y-5">
                    <p className="text-xs text-text-muted leading-relaxed">
                        Calculates salaries for all configured employees based on attendance logs.
                        Previously calculated entries will be recalculated.
                    </p>
                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Income Tax Rate (%)</label>
                        <Input
                            type="number"
                            value={calcTaxRate}
                            onChange={e => setCalcTaxRate(e.target.value)}
                            min={0}
                            max={100}
                            step={0.5}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" fullWidth onClick={() => setCalcOpen(false)}>Cancel</Button>
                        <Button
                            fullWidth
                            isLoading={saving}
                            onClick={calculate}
                            className="bg-warning-bg text-warning-text hover:bg-warning-text hover:text-white shadow-none"
                        >
                            Calculate
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── Component Form Modal ───────────────────────────────────────────────── */}
            <Modal
                isOpen={compForm.open}
                onClose={() => setCompForm(f => ({ ...f, open: false }))}
                title={`${compForm.editId ? 'Edit' : 'New'} Pay Component`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Name</label>
                        <Input
                            value={compForm.name ?? ''}
                            onChange={e => setCompForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. Transport Allowance"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Type</label>
                            <select
                                value={compForm.componentType}
                                onChange={e => setCompForm(f => ({ ...f, componentType: e.target.value as ComponentType }))}
                                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option>Allowance</option>
                                <option>Bonus</option>
                                <option>Deduction</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Calculation</label>
                            <select
                                value={compForm.isFixed ? 'fixed' : 'percent'}
                                onChange={e => setCompForm(f => ({ ...f, isFixed: e.target.value === 'fixed' }))}
                                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option value="fixed">Fixed Amount</option>
                                <option value="percent">% of Base Salary</option>
                            </select>
                        </div>
                    </div>
                    {compForm.isFixed ? (
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Fixed Amount</label>
                            <Input
                                type="number"
                                value={compForm.amount ?? 0}
                                onChange={e => setCompForm(f => ({ ...f, amount: +e.target.value }))}
                                min={0}
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Percentage of Base (%)</label>
                            <Input
                                type="number"
                                value={compForm.percentage ?? 0}
                                onChange={e => setCompForm(f => ({ ...f, percentage: +e.target.value }))}
                                min={0}
                                max={100}
                                step={0.5}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Description (optional)</label>
                        <Input
                            value={compForm.description ?? ''}
                            onChange={e => setCompForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Brief description"
                        />
                    </div>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={compForm.isDefault ?? false}
                                onChange={e => setCompForm(f => ({ ...f, isDefault: e.target.checked }))}
                                className="rounded w-4 h-4 accent-primary"
                            />
                            <span className="text-xs font-bold text-text-dark">Apply to all employees</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={compForm.isActive ?? true}
                                onChange={e => setCompForm(f => ({ ...f, isActive: e.target.checked }))}
                                className="rounded w-4 h-4 accent-primary"
                            />
                            <span className="text-xs font-bold text-text-dark">Active</span>
                        </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" fullWidth onClick={() => setCompForm(f => ({ ...f, open: false }))}>Cancel</Button>
                        <Button fullWidth isLoading={saving} onClick={saveComp}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── Salary Config Modal ───────────────────────────────────────────────── */}
            <Modal
                isOpen={salaryForm.open && !!salaryForm.emp}
                onClose={() => setSalaryForm(f => ({ ...f, open: false }))}
                title={salaryForm.emp ? `Salary — ${salaryForm.emp.firstName} ${salaryForm.emp.lastName}` : 'Salary Setup'}
            >
                <div className="space-y-4">
                    {/* Base salary */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Salary Type</label>
                            <select
                                value={salaryForm.salaryType}
                                onChange={e => setSalaryForm(f => ({ ...f, salaryType: e.target.value as SalaryType }))}
                                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option>Monthly</option>
                                <option>Hourly</option>
                                <option>Daily</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">
                                {salaryForm.salaryType === 'Monthly' ? 'Monthly Salary' : salaryForm.salaryType === 'Hourly' ? 'Hourly Rate' : 'Daily Rate'}
                            </label>
                            <Input
                                type="number"
                                value={salaryForm.baseAmount}
                                onChange={e => setSalaryForm(f => ({ ...f, baseAmount: e.target.value }))}
                                min={0}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Currency</label>
                            <Input
                                value={salaryForm.currency}
                                onChange={e => setSalaryForm(f => ({ ...f, currency: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={salaryForm.payByWorkedHours}
                                    onChange={e => setSalaryForm(f => ({ ...f, payByWorkedHours: e.target.checked }))}
                                    className="rounded w-4 h-4 accent-primary"
                                />
                                <div>
                                    <span className="text-xs font-bold text-text-dark block">Pay by worked hours</span>
                                    <span className="text-[9px] text-text-muted">Monthly base ÷ worked hours</span>
                                </div>
                            </label>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Effective From</label>
                            <input
                                type="date"
                                value={salaryForm.effectiveFrom}
                                onChange={e => setSalaryForm(f => ({ ...f, effectiveFrom: e.target.value }))}
                                className="w-full rounded-xl bg-background-light border-none px-3 py-2.5 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>

                    {/* Overtime section */}
                    <div className="border border-divider-light rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Overtime</p>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={salaryForm.overtimeEnabled}
                                    onChange={e => setSalaryForm(f => ({ ...f, overtimeEnabled: e.target.checked }))}
                                    className="rounded w-4 h-4 accent-primary"
                                />
                                <span className="text-xs font-bold text-text-dark">{salaryForm.overtimeEnabled ? 'Enabled' : 'Disabled'}</span>
                            </label>
                        </div>
                        {salaryForm.overtimeEnabled && (<>
                            {salaryForm.overtimeTiers.length === 0 && (
                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Single Multiplier</label>
                                    <Input
                                        type="number"
                                        value={salaryForm.overtimeMultiplier}
                                        onChange={e => setSalaryForm(f => ({ ...f, overtimeMultiplier: e.target.value }))}
                                        min={1}
                                        step={0.25}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Overtime Tiers</p>
                                {salaryForm.overtimeTiers.map((tier, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <label className="block text-[8px] text-text-muted font-bold mb-1">After OT hours</label>
                                            <input
                                                type="number"
                                                value={tier.afterHours}
                                                min={0}
                                                step={0.5}
                                                onChange={e => setSalaryForm(f => {
                                                    const t = [...f.overtimeTiers]; t[i] = { ...t[i], afterHours: parseFloat(e.target.value) || 0 }; return { ...f, overtimeTiers: t }
                                                })}
                                                className="w-full rounded-xl bg-background-light border-none px-3 py-2 text-xs font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[8px] text-text-muted font-bold mb-1">Multiplier ×</label>
                                            <input
                                                type="number"
                                                value={tier.multiplier}
                                                min={1}
                                                step={0.25}
                                                onChange={e => setSalaryForm(f => {
                                                    const t = [...f.overtimeTiers]; t[i] = { ...t[i], multiplier: parseFloat(e.target.value) || 1 }; return { ...f, overtimeTiers: t }
                                                })}
                                                className="w-full rounded-xl bg-background-light border-none px-3 py-2 text-xs font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSalaryForm(f => ({ ...f, overtimeTiers: f.overtimeTiers.filter((_, j) => j !== i) }))}
                                            className="mt-4 text-error-text hover:text-error-text/80 text-lg font-black leading-none"
                                        >
                                            <span className="material-symbols-outlined text-base">close</span>
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setSalaryForm(f => ({ ...f, overtimeTiers: [...f.overtimeTiers, { afterHours: f.overtimeTiers.length === 0 ? 0 : (f.overtimeTiers[f.overtimeTiers.length - 1].afterHours + 10), multiplier: 1.5 }] }))}
                                    className="text-[9px] font-black text-primary hover:underline uppercase tracking-wider"
                                >
                                    + Add Tier
                                </button>
                            </div>
                        </>)}
                    </div>

                    {/* Lateness deduction section */}
                    <div className="border border-divider-light rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Lateness Deduction</p>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={salaryForm.latenessDeductionEnabled}
                                    onChange={e => setSalaryForm(f => ({ ...f, latenessDeductionEnabled: e.target.checked }))}
                                    className="rounded w-4 h-4 accent-primary"
                                />
                                <span className="text-xs font-bold text-text-dark">{salaryForm.latenessDeductionEnabled ? 'Enabled' : 'Disabled'}</span>
                            </label>
                        </div>
                        {salaryForm.latenessDeductionEnabled && (
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Lateness Tiers (avg min late per day)</p>
                                {salaryForm.latenessTiers.map((tier, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <label className="block text-[8px] text-text-muted font-bold mb-1">After min late</label>
                                            <input
                                                type="number"
                                                value={tier.afterMinutes}
                                                min={0}
                                                onChange={e => setSalaryForm(f => {
                                                    const t = [...f.latenessTiers]; t[i] = { ...t[i], afterMinutes: parseInt(e.target.value) || 0 }; return { ...f, latenessTiers: t }
                                                })}
                                                className="w-full rounded-xl bg-background-light border-none px-3 py-2 text-xs font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[8px] text-text-muted font-bold mb-1">Deduction ×</label>
                                            <input
                                                type="number"
                                                value={tier.deductionMultiplier}
                                                min={0}
                                                step={0.25}
                                                onChange={e => setSalaryForm(f => {
                                                    const t = [...f.latenessTiers]; t[i] = { ...t[i], deductionMultiplier: parseFloat(e.target.value) || 1 }; return { ...f, latenessTiers: t }
                                                })}
                                                className="w-full rounded-xl bg-background-light border-none px-3 py-2 text-xs font-bold text-text-dark focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSalaryForm(f => ({ ...f, latenessTiers: f.latenessTiers.filter((_, j) => j !== i) }))}
                                            className="mt-4 text-error-text hover:text-error-text/80 text-lg font-black leading-none"
                                        >
                                            <span className="material-symbols-outlined text-base">close</span>
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setSalaryForm(f => ({ ...f, latenessTiers: [...f.latenessTiers, { afterMinutes: f.latenessTiers.length === 0 ? 5 : (f.latenessTiers[f.latenessTiers.length - 1].afterMinutes + 15), deductionMultiplier: 1 }] }))}
                                    className="text-[9px] font-black text-primary hover:underline uppercase tracking-wider"
                                >
                                    + Add Tier
                                </button>
                            </div>
                        )}
                    </div>

                    {components.filter(c => c.isActive).length > 0 && (
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Pay Components</p>
                            <div className="space-y-1 max-h-52 overflow-y-auto border border-divider-light rounded-2xl p-3">
                                {components.filter(c => c.isActive).map(c => (
                                    <label
                                        key={c.id}
                                        className={`flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-xl transition ${salaryForm.componentIds.has(c.id) ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={salaryForm.componentIds.has(c.id)}
                                            onChange={ev => setSalaryForm(f => {
                                                const s = new Set(f.componentIds)
                                                ev.target.checked ? s.add(c.id) : s.delete(c.id)
                                                return { ...f, componentIds: s }
                                            })}
                                            className="rounded w-4 h-4 accent-primary"
                                        />
                                        <Badge variant={compTypeVariant(c.componentType)}>{c.componentType[0]}</Badge>
                                        <span className="text-xs font-bold text-text-dark flex-1">{c.name}</span>
                                        {c.isDefault && <span className="text-[8px] font-black text-text-muted">DEFAULT</span>}
                                        <span className="text-xs text-text-muted">{c.isFixed ? fmt(c.amount) : `${c.percentage}%`}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" fullWidth onClick={() => setSalaryForm(f => ({ ...f, open: false }))}>Cancel</Button>
                        <Button fullWidth isLoading={saving} onClick={saveSalary}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── Payslip Modal ─────────────────────────────────────────────────────── */}
            <Modal
                isOpen={!!payslip}
                onClose={() => setPayslip(null)}
                title={payslip?.employeeName ?? 'Payslip'}
                actions={payslip ? <Badge variant={entryStatusVariant(payslip.status)}>{payslip.status}</Badge> : undefined}
            >
                {payslip && (
                    <div className="space-y-5">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            {payslip.department ?? ''}{payslip.employeeNo ? ` · #${payslip.employeeNo}` : ''}
                        </p>

                        {/* Attendance */}
                        <div className="bg-slate-50/70 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
                            {[
                                { label: 'Worked Days', value: payslip.workedDays },
                                { label: 'Worked Hours', value: `${fmtH(payslip.workedHours)}h` },
                                { label: 'Overtime', value: `${fmtH(payslip.overtimeHours)}h` },
                            ].map(s => (
                                <div key={s.label}>
                                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">{s.label}</p>
                                    <p className="text-base font-black text-text-dark">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Earnings breakdown */}
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Earnings</p>
                            {[
                                { label: 'Base Pay', value: payslip.basePay, color: 'text-text-dark' },
                                { label: 'Overtime Pay', value: payslip.overtimePay, color: 'text-warning-text' },
                                { label: 'Allowances', value: payslip.allowancesTotal, color: 'text-success-text' },
                                { label: 'Bonuses', value: payslip.bonusesTotal, color: 'text-primary' },
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
                                    <span className="font-bold text-error-text">−{fmt(payslip.deductionsTotal)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs">
                                <span className="text-text-muted font-bold">Income Tax ({payslip.taxRate}%)</span>
                                <span className="font-bold text-error-text">−{fmt(payslip.taxAmount)}</span>
                            </div>
                        </div>

                        {/* Applied components */}
                        {parseComponents(payslip.componentsJson).length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Applied Components</p>
                                {parseComponents(payslip.componentsJson).map((c, i) => (
                                    <div key={i} className="flex justify-between text-xs items-center">
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant={compTypeVariant(c.item2 as ComponentType)}>{c.item2[0]}</Badge>
                                            <span className="text-text-muted font-bold">{c.item1}</span>
                                        </div>
                                        <span className={`font-bold ${c.item2 === 'Deduction' ? 'text-error-text' : 'text-success-text'}`}>
                                            {c.item2 === 'Deduction' ? '−' : '+'}{fmt(c.item3)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Net */}
                        <div className="bg-success-bg rounded-2xl p-4 flex justify-between items-center">
                            <span className="text-sm font-black text-success-text">Net Pay</span>
                            <span className="text-2xl font-black text-success-text">{fmt(payslip.netPay)}</span>
                        </div>

                        <Button variant="outline" fullWidth onClick={() => setPayslip(null)}>Close</Button>
                    </div>
                )}
            </Modal>
        </AppLayout>
    )
}
