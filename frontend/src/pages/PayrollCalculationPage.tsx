import { AppLayout } from '../components/AppLayout'

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
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                                <span className="material-symbols-outlined">payments</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Gross</p>
                                <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">$52,160.00</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-emerald-500">+12.5%</span>
                            <span className="text-[11px] text-slate-400">from last month</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Net</p>
                                <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">$40,684.80</p>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-3/4"></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                                <span className="material-symbols-outlined">description</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tax Provision</p>
                                <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">$11,475.20</p>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Auto-calculated (22% Avg)</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                <span className="material-symbols-outlined">group</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Cycle</p>
                                <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">124 Staff</p>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded">October 2023</span>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/20">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Financial Breakdown</h4>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <span className="material-symbols-outlined text-base">filter_list</span>
                                Filters
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/10">
                                Process All
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Hours</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Hourly Rate</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Gross Amount</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Tax Withheld</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Net Salary</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payrollRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{row.name}</span>
                                                <span className="text-[11px] text-slate-500 font-medium">{row.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400">{row.hours}</td>
                                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-900 dark:text-slate-100">{row.rate}</td>
                                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">{row.gross}</td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-rose-500">{row.tax}</td>
                                        <td className="px-6 py-4 text-right text-[15px] font-black text-slate-900 dark:text-slate-100">{row.net}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-center">
                        <button className="text-[11px] font-bold text-primary hover:underline uppercase tracking-widest">
                            View Detailed Ledger
                        </button>
                    </div>
                </div>

                {/* Action Footnote */}
                <div className="bg-slate-900 dark:bg-black rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-white/5">
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-amber-500 animate-pulse text-3xl">info</span>
                        <div>
                            <p className="text-white text-sm font-bold tracking-tight">Confirm Payroll Batch #PY-2023-10</p>
                            <p className="text-slate-400 text-xs">Final verification required before fund disbursement.</p>
                        </div>
                    </div>
                    <button className="px-8 py-3 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition-all active:scale-[0.98]">
                        Final Approval
                    </button>
                </div>

            </div>
        </AppLayout>
    )
}
