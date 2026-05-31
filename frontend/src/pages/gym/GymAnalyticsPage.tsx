import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../../components/templates'
import { Input } from '../../components/atoms'
import { PageHeader } from '../../components/organisms'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'

interface Overview {
    from: string; to: string
    customers: { total: number; active: number; inactive: number; new: number }
    memberships: { active: number; frozen: number; expiringSoon: number; byTariff: { name: string; count: number }[] }
    revenue: { total: number; paymentsCount: number; byMethod: { method: string; amount: number; count: number }[] }
    giftCertificates: { issued: number; redeemed: number }
    visits: { lifetimeTotal: number }
}
interface RevenueTrend {
    groupBy: string
    periods: { period: string; revenue: number; count: number }[]
    total: number
}
type GroupBy = 'day' | 'month' | 'year'

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const TODAY = iso(new Date())
const MONTH_START = (() => { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth(), 1)) })()
const money = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AZN`

export function GymAnalyticsPage() {
    const { t } = useTranslation()
    const { token } = useAuth()
    const [from, setFrom] = useState(MONTH_START)
    const [to, setTo] = useState(TODAY)
    const [groupBy, setGroupBy] = useState<GroupBy>('month')
    const [overview, setOverview] = useState<Overview | null>(null)
    const [trend, setTrend] = useState<RevenueTrend | null>(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const [ov, tr] = await Promise.all([
                apiRequest<Overview>(`/api/gym/analytics/overview?from=${from}&to=${to}`, { token }),
                apiRequest<RevenueTrend>(`/api/gym/analytics/revenue?from=${from}&to=${to}&groupBy=${groupBy}`, { token }),
            ])
            setOverview(ov); setTrend(tr)
        } finally { setLoading(false) }
    }, [token, from, to, groupBy])
    useEffect(() => { void load() }, [load])

    const maxRev = Math.max(1, ...(trend?.periods.map((p) => p.revenue) ?? [1]))
    const maxTariff = Math.max(1, ...(overview?.memberships.byTariff.map((x) => x.count) ?? [1]))
    const maxMethod = Math.max(1, ...(overview?.revenue.byMethod.map((x) => x.amount) ?? [1]))

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
                <div className="p-6 md:p-10 space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <PageHeader
                            className="p-0 border-none shadow-none bg-transparent"
                            title={t('gym.analytics.title')}
                            description={t('gym.analytics.subtitle')}
                        />
                        <div className="flex flex-wrap items-end gap-3">
                            <Field label={t('gym.analytics.from')}><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
                            <Field label={t('gym.analytics.to')}><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>
                    ) : !overview ? (
                        <p className="text-text-light">{t('gym.analytics.noData')}</p>
                    ) : (
                        <>
                            {/* KPI cards */}
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                <Kpi icon="payments" accent="from-emerald-500 to-teal-600" label={t('gym.analytics.kpi.revenue')}
                                    value={money(overview.revenue.total)} sub={t('gym.analytics.kpi.payments', { count: overview.revenue.paymentsCount })} />
                                <Kpi icon="person_add" accent="from-violet-500 to-indigo-600" label={t('gym.analytics.kpi.newCustomers')}
                                    value={String(overview.customers.new)} sub={`${overview.customers.total} · ${t('gym.analytics.kpi.activeCustomers', { count: overview.customers.active })}`} />
                                <Kpi icon="card_membership" accent="from-sky-500 to-blue-600" label={t('gym.analytics.kpi.activeMemberships')}
                                    value={String(overview.memberships.active)} sub={`${t('gym.analytics.kpi.frozen')}: ${overview.memberships.frozen}`} />
                                <Kpi icon="hourglass_bottom" accent="from-amber-500 to-orange-600" label={t('gym.analytics.kpi.expiringSoon')}
                                    value={String(overview.memberships.expiringSoon)} />
                                <Kpi icon="groups" accent="from-fuchsia-500 to-pink-600" label={t('gym.analytics.kpi.totalCustomers')}
                                    value={String(overview.customers.total)} sub={t('gym.analytics.kpi.activeCustomers', { count: overview.customers.active })} />
                                <Kpi icon="redeem" accent="from-rose-500 to-red-600" label={t('gym.analytics.kpi.giftRedeemed')}
                                    value={String(overview.giftCertificates.redeemed)} sub={t('gym.analytics.kpi.giftIssued', { count: overview.giftCertificates.issued })} />
                                <Kpi icon="login" accent="from-cyan-500 to-sky-600" label={t('gym.analytics.kpi.lifetimeVisits')}
                                    value={String(overview.visits.lifetimeTotal)} />
                            </div>

                            {/* Revenue trend */}
                            <div className="rounded-3xl bg-surface p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-text-light">{t('gym.analytics.revenueTrend')}</h3>
                                    <div className="flex gap-1">
                                        {(['day', 'month', 'year'] as const).map((g) => (
                                            <button key={g} onClick={() => setGroupBy(g)}
                                                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${groupBy === g ? 'bg-primary text-white' : 'bg-slate-75 text-text-muted hover:bg-slate-100'}`}>
                                                {t(`gym.analytics.groupBy.${g}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {!trend || trend.periods.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-text-light">{t('gym.analytics.noData')}</p>
                                ) : (
                                    <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: 160 }}>
                                        {trend.periods.map((p) => (
                                            <div key={p.period} className="flex min-w-[44px] flex-1 flex-col items-center gap-1">
                                                <span className="text-[10px] font-bold text-text-muted">{money(p.revenue).replace(' AZN', '')}</span>
                                                <div className="flex w-full items-end" style={{ height: 120 }}>
                                                    <div className="w-full rounded-t-lg bg-linear-to-t from-primary/70 to-primary" style={{ height: `${Math.max(4, (p.revenue / maxRev) * 120)}px` }} />
                                                </div>
                                                <span className="whitespace-nowrap text-[10px] text-text-light">{p.period}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Breakdowns */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <Breakdown title={t('gym.analytics.byTariff')}
                                    rows={overview.memberships.byTariff.map((x) => ({ label: x.name, value: x.count, display: String(x.count), ratio: x.count / maxTariff, color: 'bg-sky-500' }))} />
                                <Breakdown title={t('gym.analytics.byMethod')}
                                    rows={overview.revenue.byMethod.map((x) => ({ label: t(`gym.analytics.methods.${x.method}`, x.method), value: x.amount, display: money(x.amount), ratio: x.amount / maxMethod, color: 'bg-emerald-500' }))} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-light">{label}</label>
            {children}
        </div>
    )
}

function Kpi({ icon, accent, label, value, sub }: { icon: string; accent: string; label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-3xl bg-surface p-5 shadow-sm">
            <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${accent} text-white`}>
                <span className="material-symbols-outlined">{icon}</span>
            </span>
            <p className="text-2xl font-black tracking-tight text-text-dark">{value}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-light">{label}</p>
            {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
        </div>
    )
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; value: number; display: string; ratio: number; color: string }[] }) {
    const { t } = useTranslation()
    return (
        <div className="rounded-3xl bg-surface p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-text-light">{title}</h3>
            {rows.length === 0 ? (
                <p className="py-4 text-sm text-text-light">{t('gym.analytics.noData')}</p>
            ) : (
                <div className="space-y-3">
                    {rows.map((r, i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="truncate font-bold text-text-dark">{r.label}</span>
                                <span className="shrink-0 font-mono text-text-muted">{r.display}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className={`h-full rounded-full ${r.color}`} style={{ width: `${Math.max(3, r.ratio * 100)}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
