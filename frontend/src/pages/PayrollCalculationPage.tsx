import { AppLayout } from '../components/AppLayout'
import { Card, Badge, Button } from '../components/ui'

const payrollRows = [
    { name: 'Johnathan Doe', role: 'Senior Engineer', hours: '168h', rate: '$85.00', gross: '$14,280.00', tax: '$3,141.60', net: '$11,138.40', status: 'Approved' },
    { name: 'Sarah Jenkins', role: 'UI Designer', hours: '160h', rate: '$65.00', gross: '$10,400.00', tax: '$2,288.00', net: '$8,112.00', status: 'Pending' },
    { name: 'Michael Chen', role: 'DevOps Lead', hours: '172h', rate: '$90.00', gross: '$15,480.00', tax: '$3,405.60', net: '$12,074.40', status: 'Approved' },
    { name: 'Emily Rodriguez', role: 'Product Manager', hours: '160h', rate: '$75.00', gross: '$12,000.00', tax: '$2,640.00', net: '$9,360.00', status: 'Approved' },
]

export function PayrollCalculationPage() {
    return (
        <AppLayout>
            <div className="p-8 space-y-8 flex-1 overflow-y-auto">

                {/* Summary Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-lg bg-success-bg text-success-text flex items-center justify-center">
                                <span className="material-symbols-outlined">payments</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Gross</p>
                                <p className="text-xl font-black text-text-dark mt-0.5">$52,160.00</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-success-text">+12.5%</span>
                            <span className="text-[11px] text-text-muted">from last month</span>
                        </div>
                    </Card>

                    <Card className="flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Net</p>
                                <p className="text-xl font-black text-text-dark mt-0.5">$40,684.80</p>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-75 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-3/4"></div>
                        </div>
                    </Card>

                    <Card className="flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-lg bg-warning-bg text-warning-text flex items-center justify-center">
                                <span className="material-symbols-outlined">description</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Tax Provision</p>
                                <p className="text-xl font-black text-text-dark mt-0.5">$11,475.20</p>
                            </div>
                        </div>
                        <p className="text-[11px] text-text-muted font-medium">Auto-calculated (22% Avg)</p>
                    </Card>

                    <Card className="flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined">group</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Active Cycle</p>
                                <p className="text-xl font-black text-text-dark mt-0.5">124 Staff</p>
                            </div>
                        </div>
                        <Badge variant="primary">October 2023</Badge>
                    </Card>
                </div>

                {/* Detailed Table */}
                <Card noPadding className="overflow-hidden">
                    <div className="p-6 border-b border-border-base flex items-center justify-between bg-slate-75/30">
                        <h4 className="text-lg font-bold text-text-dark tracking-tight">Financial Breakdown</h4>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" icon="filter_list">
                                Filters
                            </Button>
                            <Button size="sm">
                                Process All
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-75 border-b border-border-base">
                                    <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest">Employee</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest text-center">Hours</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest text-center">Hourly Rate</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest text-right">Gross Amount</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest text-right">Tax Withheld</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest text-right">Net Salary</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {payrollRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-75 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-text-dark group-hover:text-primary transition-colors">{row.name}</span>
                                                <span className="text-[11px] text-text-muted font-medium">{row.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-text-base">{row.hours}</td>
                                        <td className="px-6 py-4 text-center text-sm font-bold text-text-dark">{row.rate}</td>
                                        <td className="px-6 py-4 text-right text-sm font-semibold text-text-dark">{row.gross}</td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-error-text">{row.tax}</td>
                                        <td className="px-6 py-4 text-right text-[15px] font-black text-text-dark">{row.net}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Badge variant={row.status === 'Approved' ? 'success' : 'warning'}>
                                                {row.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-slate-75 border-t border-border-base flex justify-center">
                        <Button variant="ghost" className="text-[11px] font-bold uppercase tracking-widest">
                            View Detailed Ledger
                        </Button>
                    </div>
                </Card>

                {/* Action Footnote */}
                <div className="bg-background-dark rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-white/5">
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-warning-text animate-pulse text-3xl">info</span>
                        <div>
                            <p className="text-white text-sm font-bold tracking-tight">Confirm Payroll Batch #PY-2023-10</p>
                            <p className="text-slate-400 text-xs">Final verification required before fund disbursement.</p>
                        </div>
                    </div>
                    <Button variant="outline" className="px-8 py-3 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition-all border-none">
                        Final Approval
                    </Button>
                </div>

            </div>
        </AppLayout>
    )
}
