import { AppLayout } from '../components/templates'
import { Button } from '../components/atoms'
import { PageHeader } from '../components/organisms'

const shifts = [
    { id: '#88219', name: 'Johnathan Doe', date: 'Oct 23, 2023', checkIn: '08:57 AM', checkOut: '06:05 PM', total: '9h 08m', status: 'Verified', location: 'Main Entrance' },
    { id: '#88324', name: 'Jane Smith', date: 'Oct 23, 2023', checkIn: '09:11 AM', checkOut: '06:02 PM', total: '8h 51m', status: 'Verified', location: 'Office B' },
    { id: '#88412', name: 'Robert Brown', date: 'Oct 23, 2023', checkIn: '10:01 AM', checkOut: '07:40 PM', total: '9h 39m', status: 'Late Exit', location: 'Lab A' },
    { id: '#88501', name: 'Michael Wilson', date: 'Oct 23, 2023', checkIn: '07:44 AM', checkOut: '04:10 PM', total: '8h 26m', status: 'Verified', location: 'Gate 1' },
]

export function WorkHoursTrackingPage() {
    return (
        <AppLayout onAction={() => { }}>
            <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
                <div className="p-6 md:p-10 space-y-10">

                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
                        <PageHeader
                            className="p-0 border-none shadow-none bg-transparent"
                            title="Time Intelligence"
                            description="Live synchronization of workforce presence and operational thresholds."
                        />
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" icon="calendar_today" className="rounded-2xl font-black uppercase tracking-widest bg-surface/50">
                                OCT 23
                            </Button>
                            <Button size="sm" icon="download" className="rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                EXPORT
                            </Button>
                        </div>
                    </div>

                    {/* Performance Metrics - Horizontal Scroll on Mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Fleet Airtime', value: '1,240.5h', trend: '+12%', icon: 'timer', color: 'primary' },
                            { label: 'Active Presence', value: '42', sub: '/ 128 Total', icon: 'person_check', color: 'emerald' },
                            { label: 'Operational Leak', value: '45.2', trend: '-5.1%', icon: 'emergency_home', color: 'rose' },
                            { label: 'Shift Velocity', value: '8.4h', sub: 'Target 8.0h', icon: 'speed', color: 'indigo' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-surface rounded-3xl shadow-md p-6 space-y-4 group hover:shadow-xl transition-all duration-300 border-none">
                                <div className="flex items-center justify-between">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xl bg-${stat.color === 'primary' ? 'primary' : stat.color + '-500'}`}>
                                        <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                                    </div>
                                    {stat.trend && (
                                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                            {stat.trend}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-text-light uppercase tracking-[0.2em]">{stat.label}</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <p className="text-2xl font-black text-text-dark">{stat.value}</p>
                                        {stat.sub && <p className="text-[10px] font-black text-text-light uppercase tracking-widest">{stat.sub}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Timeline Feed */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-lg">history</span>
                                </div>
                                <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest leading-none">Operational Timeline</h3>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary">View Full History</Button>
                        </div>

                        {/* List - Desktop Grid / Mobile Cards */}
                        <div className="space-y-4">
                            {shifts.map((log, idx) => (
                                <div key={idx} className="bg-surface rounded-3xl shadow-md p-5 hover:shadow-xl transition-all group overflow-hidden relative border-none">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${log.status === 'Verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        {/* Identity Hub */}
                                        <div className="flex items-center gap-4 min-w-[240px]">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center relative shadow-inner overflow-hidden border border-divider-light">
                                                <span className="text-lg font-black text-text-light">{log.name.substring(0, 2)}</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-text-dark text-sm group-hover:text-primary transition-colors">{log.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] font-black text-text-light uppercase tracking-widest">GATEWAY:</span>
                                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{log.location}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Metrics Strip */}
                                        <div className="flex flex-1 items-center justify-between md:justify-end gap-12">
                                            <div className="space-y-1 text-center md:text-left">
                                                <p className="text-[9px] font-black text-text-light uppercase tracking-widest">Temporal Log</p>
                                                <p className="text-xs font-bold text-text-dark">{log.date}</p>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="text-center">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                        <p className="text-xs font-black text-text-dark">{log.checkIn}</p>
                                                    </div>
                                                    <p className="text-[9px] font-black text-text-light uppercase tracking-widest">Clock In</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                        <p className="text-xs font-black text-text-dark">{log.checkOut}</p>
                                                    </div>
                                                    <p className="text-[9px] font-black text-text-light uppercase tracking-widest">Clock Out</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase ${log.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                                    {log.status === 'Verified' ? 'CLEARED' : 'LATE_LOG'}
                                                </div>
                                                <p className="text-sm font-black text-text-dark tracking-tighter">{log.total}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Predictive Intelligence Node */}
                    <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-xl overflow-hidden relative group border-none">
                        <div className="absolute top-0 right-0 w-[40%] h-full bg-primary/5 blur-[80px] pointer-events-none" />
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-30" />

                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="flex items-start gap-8">
                                <div className="w-20 h-20 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform duration-700">
                                    <span className="material-symbols-outlined text-4xl">neurology</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="px-2 py-0.5 rounded-md bg-primary text-[8px] font-black uppercase tracking-widest text-white shadow-sm">AI Engine</div>
                                        <p className="text-text-dark text-2xl font-black italic tracking-tight uppercase">Fleet Load Prediction</p>
                                    </div>
                                    <p className="text-text-light text-sm max-w-xl leading-relaxed font-medium">
                                        Neural analysis suggests a <span className="text-primary font-black uppercase text-[12px]">15.4% escalation</span> in operational traffic for the next 48-hour window. Deploy proactive shift balancing to maintain efficiency.
                                    </p>
                                </div>
                            </div>
                            <Button size="lg" icon="auto_fix_high" className="font-black uppercase tracking-widest h-14 px-10 rounded-2xl shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all active:scale-[0.98]">
                                Balancing Protocol
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    )
}
