import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/templates'

interface DashboardCard {
    title: string
    description: string
    icon: string
    path: string
    color: string
}

const DASHBOARD_CARDS: DashboardCard[] = [
    {
        title: 'People',
        description: 'Manage employees, visitors and credentials',
        icon: 'group',
        path: '/people',
        color: 'bg-blue-500',
    },
    {
        title: 'Devices',
        description: 'Monitor and configure access control hardware',
        icon: 'sensors',
        path: '/settings?tab=devices',
        color: 'bg-purple-500',
    },
    {
        title: 'Monitoring',
        description: 'Real-time event logs and door control',
        icon: 'monitor_heart',
        path: '/monitoring',
        color: 'bg-red-500',
    },
    {
        title: 'Access Levels',
        description: 'Define who can access which rooms and when',
        icon: 'admin_panel_settings',
        path: '/access-levels',
        color: 'bg-emerald-500',
    },
    {
        title: 'Work Hours',
        description: 'Attendance reports and time tracking',
        icon: 'schedule',
        path: '/work-hours',
        color: 'bg-amber-500',
    },
    {
        title: 'Payroll',
        description: 'Calculate salaries based on attendance',
        icon: 'payments',
        path: '/payroll',
        color: 'bg-indigo-500',
    },
    {
        title: 'Settings',
        description: 'System configuration and preferences',
        icon: 'settings',
        path: '/settings',
        color: 'bg-slate-500',
    },
    {
        title: 'System Status',
        description: 'Database, services and server health',
        icon: 'monitoring',
        path: '/status',
        color: 'bg-cyan-500',
    },
]

export function DashboardPage() {
    const navigate = useNavigate()

    return (
        <AppLayout>
            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {DASHBOARD_CARDS.map((card) => (
                        <div
                            key={card.path}
                            onClick={() => navigate(card.path)}
                            className="group bg-surface p-6 rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all cursor-pointer border-none relative overflow-hidden"
                        >
                            {/* Decorative Gradient Background */}
                            <div className={`absolute top-0 right-0 w-32 h-32 ${card.color} opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`} />

                            <div className="relative z-10">
                                <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/10`}>
                                    <span className="material-symbols-outlined text-3xl !fill-1">{card.icon}</span>
                                </div>

                                <h3 className="text-xl font-black text-text-dark mb-2 tracking-tight group-hover:text-primary transition-colors">
                                    {card.title}
                                </h3>

                                <p className="text-sm font-medium text-text-muted leading-relaxed">
                                    {card.description}
                                </p>

                                <div className="mt-6 flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-text-light group-hover:text-primary transition-all">
                                    Open Module
                                    <span className="material-symbols-outlined text-xs ml-1 group-hover:ml-3 transition-all">arrow_forward</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* System Overview Section */}
                <div className="mt-12">
                    <h2 className="text-xs font-black text-text-muted uppercase tracking-[0.3em] mb-6 px-1">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 p-5 bg-surface rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-xl">add_moderator</span>
                            </div>
                            <div>
                                <p className="text-sm font-black text-text-dark leading-none">Emergency Lockdown</p>
                                <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mt-1">Immediately lock all access points</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-5 bg-surface rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
                            <div className="w-10 h-10 bg-success-text/10 rounded-xl flex items-center justify-center text-success-text group-hover:bg-success-text group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-xl">no_accounts</span>
                            </div>
                            <div>
                                <p className="text-sm font-black text-text-dark leading-none">Evacuation Report</p>
                                <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mt-1">Export list of people in building</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
