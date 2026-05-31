import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../components/templates'
import { useModule } from '../context/ModuleContext'
import { MODULES, type ModuleKey } from '../config/modules'

interface DashboardCard {
    titleKey: string
    descriptionKey: string
    icon: string
    path: string
    color: string
}

// Common cards shown on every module's dashboard.
const COMMON_CARDS: DashboardCard[] = [
    {
        titleKey: 'dashboard.cards.devicesTitle',
        descriptionKey: 'dashboard.cards.devicesDescription',
        icon: 'sensors',
        path: '/settings?tab=devices',
        color: 'bg-purple-500',
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

// Workforce-specific cards (shown before the common cards in that module).
const WORKFORCE_CARDS: DashboardCard[] = [
    {
        titleKey: 'dashboard.cards.peopleTitle',
        descriptionKey: 'dashboard.cards.peopleDescription',
        icon: 'group',
        path: '/people',
        color: 'bg-blue-500',
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
]

// ─── Shared module hero banner (accent colour / icon / name vary per module) ───
function ModuleHero({ moduleKey }: { moduleKey: ModuleKey }) {
    const { t } = useTranslation()
    const m = MODULES[moduleKey]

    return (
        <div className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${m.gradient} p-8 text-white shadow-lg`}>
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-20 left-24 h-48 w-48 rounded-full bg-black/10" />
            <div className="relative z-10 flex items-center gap-5">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <span className="material-symbols-outlined text-4xl">{m.icon}</span>
                </span>
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">{t('modules.label')}</p>
                    <h2 className="text-3xl font-black tracking-tight">{t(m.nameKey)}</h2>
                </div>
            </div>
        </div>
    )
}

// ─── Shared card grid ───
function CardGrid({ cards }: { cards: DashboardCard[] }) {
    const navigate = useNavigate()
    const { t } = useTranslation()

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card) => (
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
    )
}

// ─── Workforce Management dashboard (full feature set + common cards) ───
function WorkforceDashboard() {
    return (
        <div className="p-8">
            <ModuleHero moduleKey="workforce" />
            <div className="mt-6">
                <CardGrid cards={[...WORKFORCE_CARDS, ...COMMON_CARDS]} />
            </div>
        </div>
    )
}

// ─── Per-module dashboard for modules that are still being built ───
function ModulePlaceholderDashboard({ moduleKey }: { moduleKey: ModuleKey }) {
    const { t } = useTranslation()
    const m = MODULES[moduleKey]

    return (
        <div className="p-8">
            <ModuleHero moduleKey={moduleKey} />

            {/* Common cards — available in every module */}
            <div className="mt-6">
                <CardGrid cards={COMMON_CARDS} />
            </div>

            {/* Under-construction panel */}
            <div className="mt-6 rounded-3xl border border-dashed border-border-base bg-surface p-12 text-center shadow-sm">
                <span className="material-symbols-outlined mb-3 text-5xl text-text-light">construction</span>
                <h3 className="text-xl font-black tracking-tight text-text-dark">{t('dashboard.modulePreparing')}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium text-text-muted leading-relaxed">
                    {t('dashboard.modulePreparingBody', { module: t(m.nameKey) })}
                </p>
            </div>
        </div>
    )
}

export function DashboardPage() {
    const { activeModule } = useModule()

    return (
        <AppLayout>
            {activeModule === 'workforce'
                ? <WorkforceDashboard />
                : <ModulePlaceholderDashboard moduleKey={activeModule} />}
        </AppLayout>
    )
}
