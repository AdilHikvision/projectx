import { AppLayout } from '../components/AppLayout'
import { Card, Badge, Button, Avatar, PageHeader } from '../components/ui'

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
                {/* Unified Page Header */}
                <PageHeader
                    title="Attendance Records"
                    description="Real-time tracking of employee presence and total work hours."
                    actions={
                        <>
                            <Button variant="outline" size="sm" icon="calendar_today">
                                October 2023
                            </Button>
                            <Button size="sm" icon="download">
                                Export Report
                            </Button>
                        </>
                    }
                />

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <Card className="relative overflow-hidden group transition-all hover:border-primary/20">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">timer</span>
                        </div>
                        <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-3">Total Fleet Hours</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-text-dark">1,240.5</span>
                            <Badge variant="success" className="tracking-tighter font-black">+12%</Badge>
                        </div>
                    </Card>
                    <Card className="relative overflow-hidden group transition-all hover:border-primary/20">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">group</span>
                        </div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">On Premise Now</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-text-dark">42</span>
                            <span className="text-xs font-black text-primary">/ 128 Total</span>
                        </div>
                    </Card>
                    <Card className="relative overflow-hidden group transition-all hover:border-primary/20">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">event_busy</span>
                        </div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Overtime Hours</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-text-dark">45.2</span>
                            <Badge variant="error" className="tracking-tighter font-black">-5%</Badge>
                        </div>
                    </Card>
                    <Card className="relative overflow-hidden group transition-all hover:border-primary/20">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">history</span>
                        </div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Avg Daily Shift</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-text-dark">8.4h</span>
                            <span className="text-xs font-bold text-text-muted italic">Target 8h</span>
                        </div>
                    </Card>
                </div>

                {/* Detailed Logs List */}
                <Card noPadding className="overflow-hidden">
                    <div className="p-6 border-b border-border-base flex items-center justify-between bg-slate-75/30">
                        <h4 className="text-sm font-black text-text-dark uppercase tracking-widest">Attendance Timeline</h4>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" icon="filter_list">
                                Filter Results
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-75/50 border-b border-border-base">
                                    <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Employee Identity</th>
                                    <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest text-center">Date</th>
                                    <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest text-center">Clock In</th>
                                    <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest text-center">Clock Out</th>
                                    <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest text-center">Net Duration</th>
                                    <th className="px-8 py-5 text-xs font-black text-text-muted uppercase tracking-widest text-right">Access Point</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {shifts.map((log, idx) => (
                                    <tr key={idx} className="hover:bg-slate-75/50 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar initials={log.name.substring(0, 2).toUpperCase()} variant="primary" size="md" className="!rounded-xl shadow-sm" />
                                                <div>
                                                    <p className="text-sm font-black text-text-dark group-hover:text-primary transition-colors">{log.name}</p>
                                                    <p className="text-xs text-text-muted font-black uppercase tracking-wider">Ref ID: {log.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center text-sm font-medium text-text-base">{log.date}</td>
                                        <td className="px-8 py-6 text-center text-sm font-black text-text-dark">{log.checkIn}</td>
                                        <td className="px-8 py-6 text-center text-sm font-medium text-text-muted">{log.checkOut}</td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="text-sm font-black text-text-dark">{log.total}</span>
                                                <Badge variant={log.status === 'Verified' ? 'success' : 'warning'} className="font-black text-xs">
                                                    {log.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right text-[11px] font-black text-text-muted uppercase tracking-widest italic">{log.location}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Legend / Info Banner */}
                <div className="bg-background-dark p-8 rounded-[24px] flex flex-col md:flex-row items-center justify-between border border-white/5 shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent pointer-events-none opacity-50"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="size-16 rounded-[20px] bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-xl shadow-black/20 group-hover:scale-105 transition-transform duration-500">
                            <span className="material-symbols-outlined text-3xl">analytics</span>
                        </div>
                        <div>
                            <p className="text-white font-black tracking-tight text-xl mb-1 italic">Predictive Workforce Intelligence</p>
                            <p className="text-text-light/60 text-sm max-w-md leading-relaxed">System-wide analysis identifies a 15% increase in operational load for the upcoming window. Automated shift optimization is ready for deployment.</p>
                        </div>
                    </div>
                    <Button icon="auto_fix_high" className="relative z-10 mt-6 md:mt-0 font-black uppercase tracking-widest shadow-2xl shadow-primary/40 hover:-translate-y-1 transition-transform">
                        Optimize Fleet Shifts
                    </Button>
                </div>

            </div>
        </AppLayout>
    )
}
