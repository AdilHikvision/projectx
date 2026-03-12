import { AppLayout } from '../components/templates'
import { Button } from '../components/atoms'

const payrollRows = [
    { name: 'Johnathan Doe', role: 'Senior Engineer', hours: '168h', rate: '$85.00', gross: '$14,280.00', tax: '$3,141.60', net: '$11,138.40', status: 'Approved' },
    { name: 'Sarah Jenkins', role: 'UI Designer', hours: '160h', rate: '$65.00', gross: '$10,400.00', tax: '$2,288.00', net: '$8,112.00', status: 'Pending' },
    { name: 'Michael Chen', role: 'DevOps Lead', hours: '172h', rate: '$90.00', gross: '$15,480.00', tax: '$3,405.60', net: '$12,074.40', status: 'Approved' },
    { name: 'Emily Rodriguez', role: 'Product Manager', hours: '160h', rate: '$75.00', gross: '$12,000.00', tax: '$2,640.00', net: '$9,360.00', status: 'Approved' },
]

import { PageHeader } from '../components/organisms'

export function PayrollCalculationPage() {
    return (
        <AppLayout onAction={() => { }}>
            <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
                <div className="p-6 md:p-10 space-y-10">

                    {/* Executive Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
                        <PageHeader
                            className="p-0 border-none shadow-none bg-transparent"
                            title="Capital Management"
                            description="Financial auditing, tax provision analysis, and disbursement protocols."
                        />
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" icon="history" className="rounded-2xl font-black uppercase tracking-widest bg-surface/50 border-divider-light">
                                ARCHIVE
                            </Button>
                            <Button size="sm" icon="account_balance" className="rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                DISBURSE
                            </Button>
                        </div>
                    </div>

                    {/* Financial Summary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'GROSS PAYROLL', value: '$52,160.00', trend: '+12.5%', icon: 'payments', color: 'emerald' },
                            { label: 'NET DISBURSEMENT', value: '$40,684.80', progress: 78, icon: 'account_balance_wallet', color: 'primary' },
                            { label: 'TAX PROVISION', value: '$11,475.20', trend: '22% AVG', icon: 'account_tree', color: 'amber' },
                            { label: 'ACTIVE CYCLE', value: '124 STAFF', sub: 'OCTOBER 2023', icon: 'diversity_3', color: 'indigo' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-surface rounded-3xl shadow-md p-6 space-y-4 group hover:shadow-xl transition-all duration-300 border-none">
                                <div className="flex items-center justify-between">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-${stat.color === 'primary' ? 'primary' : stat.color + '-500'} shadow-lg shadow-${stat.color}-500/20`}>
                                        <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-text-light uppercase tracking-widest">{stat.trend || stat.sub}</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-text-light uppercase tracking-[0.2em]">{stat.label}</p>
                                    <p className="text-2xl font-black text-text-dark tracking-tight">{stat.value}</p>
                                </div>
                                {stat.progress && (
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden border-none">
                                        <div className="h-full bg-primary" style={{ width: `${stat.progress}%` }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Ledger Entries */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-lg">receipt_long</span>
                                </div>
                                <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest leading-none">Financial Ledger</h3>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary">Full Audit Log</Button>
                        </div>

                        <div className="space-y-4">
                            {payrollRows.map((row, idx) => (
                                <div key={idx} className="bg-surface rounded-3xl shadow-md p-6 hover:shadow-xl transition-all group relative overflow-hidden border-none">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${row.status === 'Approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                                    <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                                        {/* Profile Information */}
                                        <div className="flex items-center gap-4 min-w-[240px]">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-divider-light flex items-center justify-center shadow-inner group-hover:bg-primary/5 transition-colors">
                                                <span className="text-sm font-black text-primary">{row.name.substring(0, 2).toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-text-dark text-sm group-hover:text-primary transition-colors">{row.name}</p>
                                                <p className="text-[9px] font-black text-text-light uppercase tracking-[0.2em]">{row.role}</p>
                                            </div>
                                        </div>

                                        {/* Financial Stream */}
                                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-text-light uppercase tracking-widest">Temporal Unit</p>
                                                <p className="text-xs font-bold text-text-dark">{row.hours}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-text-light uppercase tracking-widest">Rate Basis</p>
                                                <p className="text-xs font-bold text-text-dark">{row.rate} <span className="text-[9px] text-text-light">/HR</span></p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-text-light uppercase tracking-widest">Gross Equity</p>
                                                <p className="text-xs font-black text-text-dark">{row.gross}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-text-light uppercase tracking-widest italic text-rose-500">Tax Withheld</p>
                                                <p className="text-xs font-bold text-rose-500">{row.tax}</p>
                                            </div>
                                        </div>

                                        {/* Final Net & Status */}
                                        <div className="flex items-center justify-between lg:justify-end gap-10 pt-4 lg:pt-0 border-t lg:border-none border-divider-light">
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-primary uppercase tracking-widest">Net Payout</p>
                                                <p className="text-lg font-black text-text-dark tracking-tighter">{row.net}</p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${row.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                                }`}>
                                                {row.status === 'Approved' ? 'CERTIFIED' : 'PENDING'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Final Disbursement Control */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden group border-none">
                        <div className="absolute top-0 right-0 w-[50%] h-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-start gap-8">
                                <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm transition-transform duration-700">
                                    <span className="material-symbols-outlined text-4xl animate-pulse">lock_person</span>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-text-dark text-2xl font-black italic tracking-tight uppercase">Final Batch Authorization</p>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-text-light text-[10px] font-black uppercase tracking-widest">Batch Index: #PY-2023-10-A</p>
                                        <p className="text-text-muted text-sm max-w-lg leading-relaxed font-bold uppercase tracking-widest text-[10px]">
                                            Secure cryptographic signature required to authorize fund disbursement for 124 personnel nodes.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Button size="lg" className="font-black uppercase tracking-widest h-14 px-12 rounded-2xl bg-emerald-600 border-none shadow-lg shadow-emerald-500/20 hover:-translate-y-1 transition-all active:scale-[0.98]">
                                Authorize Payout
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    )
}
