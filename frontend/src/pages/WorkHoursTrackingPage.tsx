import { AppLayout } from '../components/AppLayout'

const shifts = [
    { id: '#88219', name: 'Johnathan Doe', date: 'Oct 23, 2023', checkIn: '08:57 AM', checkOut: '06:05 PM', total: '9h 08m', status: 'Verified', location: 'Main Entrance' },
    { id: '#88324', name: 'Jane Smith', date: 'Oct 23, 2023', checkIn: '09:11 AM', checkOut: '06:02 PM', total: '8h 51m', status: 'Verified', location: 'Office B' },
    { id: '#88412', name: 'Robert Brown', date: 'Oct 23, 2023', checkIn: '10:01 AM', checkOut: '07:40 PM', total: '9h 39m', status: 'Late Exit', location: 'Lab A' },
    { id: '#88501', name: 'Michael Wilson', date: 'Oct 23, 2023', checkIn: '07:44 AM', checkOut: '04:10 PM', total: '8h 26m', status: 'Verified', location: 'Gate 1' },
]

export function WorkHoursTrackingPage() {
    return (
        <AppLayout>
            <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">

                {/* Action Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Attendance Records</h2>
                        <p className="text-sm text-slate-500">Real-time tracking of employee presence and total work hours.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            October 2023
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-black rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">timer</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Total Fleet Hours</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">1,240.5</span>
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded tracking-tighter">+12%</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">group</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">On Premise Now</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">42</span>
                            <span className="text-xs font-bold text-primary">/ 128 Total</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">event_busy</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Overtime Hours</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">45.2</span>
                            <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded tracking-tighter">-5%</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">history</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Avg Daily Shift</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">8.4h</span>
                            <span className="text-xs font-bold text-slate-400 italic">Target 8h</span>
                        </div>
                    </div>
                </div>

                {/* Detailed Logs List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/20 dark:bg-slate-800/20">
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Attendance Timeline</h4>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800">
                                <span className="material-symbols-outlined text-sm">filter_list</span>
                                Filter
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Employee Identity</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Date</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Clock In</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Clock Out</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Net Duration</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Access Point</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {shifts.map((log, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                                                    {log.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{log.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ref ID: {log.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">{log.date}</td>
                                        <td className="px-8 py-6 text-center text-[13px] font-black text-slate-900 dark:text-slate-100">{log.checkIn}</td>
                                        <td className="px-8 py-6 text-center text-[13px] font-medium text-slate-500">{log.checkOut}</td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{log.total}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-tighter ${log.status === 'Verified' ? 'text-emerald-500' : 'text-amber-500'
                                                    }`}>{log.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right text-xs font-bold text-slate-500 uppercase tracking-widest italic">{log.location}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Legend / Info Banner */}
                <div className="bg-slate-900 dark:bg-black p-6 rounded-2xl flex items-center justify-between border border-white/5 shadow-2xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="size-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
                            <span className="material-symbols-outlined">analytics</span>
                        </div>
                        <div>
                            <p className="text-white font-black tracking-tight text-lg mb-0.5 italic">Predictive Overtime Analytics</p>
                            <p className="text-slate-500 text-xs">AI engine predicts a 15% increase in operational hours for the next 72-hour window based on active schedules.</p>
                        </div>
                    </div>
                    <button className="relative z-10 px-6 py-2.5 bg-primary text-white text-xs font-black rounded-lg hover:opacity-90 transition-all uppercase tracking-widest shadow-lg shadow-primary/20">
                        Optimize Shifts
                    </button>
                </div>

            </div>
        </AppLayout>
    )
}
