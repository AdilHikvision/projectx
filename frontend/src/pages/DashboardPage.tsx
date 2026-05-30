import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../components/templates'

interface DashboardCard {
    titleKey: string
    descriptionKey: string
    icon: string
    path: string
    color: string
}

const DASHBOARD_CARDS: DashboardCard[] = [
    {
        titleKey: 'dashboard.cards.peopleTitle',
        descriptionKey: 'dashboard.cards.peopleDescription',
        icon: 'group',
        path: '/people',
        color: 'bg-blue-500',
    },
    {
        titleKey: 'dashboard.cards.devicesTitle',
        descriptionKey: 'dashboard.cards.devicesDescription',
        icon: 'sensors',
        path: '/settings?tab=devices',
        color: 'bg-purple-500',
    },
    {
        titleKey: 'dashboard.cards.monitoringTitle',
        descriptionKey: 'dashboard.cards.monitoringDescription',
        icon: 'monitor_heart',
        path: '/monitoring',
        color: 'bg-red-500',
    },
    {
        titleKey: 'dashboard.cards.accessLevelsTitle',
        descriptionKey: 'dashboard.cards.accessLevelsDescription',
        icon: 'admin_panel_settings',
        path: '/access-levels',
        color: 'bg-emerald-500',
    },
    {
        titleKey: 'dashboard.cards.workHoursTitle',
        descriptionKey: 'dashboard.cards.workHoursDescription',
        icon: 'schedule',
        path: '/work-hours',
        color: 'bg-amber-500',
    },
    {
        titleKey: 'dashboard.cards.payrollTitle',
        descriptionKey: 'dashboard.cards.payrollDescription',
        icon: 'payments',
        path: '/payroll',
        color: 'bg-indigo-500',
    },
    {
        titleKey: 'dashboard.cards.settingsTitle',
        descriptionKey: 'dashboard.cards.settingsDescription',
        icon: 'settings',
        path: '/settings',
        color: 'bg-slate-500',
    },
    {
        titleKey: 'dashboard.cards.statusTitle',
        descriptionKey: 'dashboard.cards.statusDescription',
        icon: 'monitoring',
        path: '/status',
        color: 'bg-cyan-500',
    },
]

export function DashboardPage() {
    const navigate = useNavigate()
    const { t } = useTranslation()

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
                                    {t(card.titleKey)}
                                </h3>

                                <p className="text-sm font-medium text-text-muted leading-relaxed">
                                    {t(card.descriptionKey)}
                                </p>

                                <div className="mt-6 flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-text-light group-hover:text-primary transition-all">
                                    {t('common.openModule')}
                                    <span className="material-symbols-outlined text-xs ml-1 group-hover:ml-3 transition-all">arrow_forward</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </AppLayout>
    )
}
