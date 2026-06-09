import { useTranslation } from 'react-i18next';
import { NavItem } from '../../molecules';
import { useAuth } from '../../../auth/AuthContext';
import { useModule } from '../../../context/ModuleContext';
import { /* MODULES, */ type ModuleKey } from '../../../config/modules';

interface NavConfig {
    to: string;
    icon: string;
    labelKey: string;
    end?: boolean;
    /** Show item if user has at least one of these permissions. Omit/empty = always show (e.g. Dashboard). */
    anyOf?: string[];
    /** Restrict item to these modules. Omit = visible in every module (e.g. Dashboard, Settings). */
    modules?: ModuleKey[];
}

// Top section — feature pages. Dashboard is visible in every module; the rest are Workforce-only.
const PRIMARY_NAV: NavConfig[] = [
    { to: '/', icon: 'grid_view', labelKey: 'nav.dashboard', end: true },
    { to: '/people', icon: 'group', labelKey: 'nav.people', anyOf: ['Employees.View', 'Visitors.View'], modules: ['workforce'] },
    { to: '/monitoring', icon: 'monitor_heart', labelKey: 'nav.monitoring', anyOf: ['Devices.View'], modules: ['workforce'] },
    { to: '/access-levels', icon: 'admin_panel_settings', labelKey: 'nav.accessLevels', anyOf: ['AccessLevels.View'], modules: ['workforce'] },
    { to: '/work-hours', icon: 'schedule', labelKey: 'nav.workHours', anyOf: ['Attendance.View'], modules: ['workforce'] },
    { to: '/schedule-planner', icon: 'calendar_month', labelKey: 'nav.schedulePlanner', anyOf: ['Schedules.View'], modules: ['workforce'] },
    { to: '/approvals', icon: 'approval', labelKey: 'nav.approvals', anyOf: ['Attendance.Manage', 'Leaves.Manage'], modules: ['workforce'] },
    { to: '/geo-zones', icon: 'my_location', labelKey: 'nav.geoZones', anyOf: ['GeoZones.Manage'], modules: ['workforce'] },
    { to: '/payroll', icon: 'payments', labelKey: 'nav.payroll', anyOf: ['Payroll.View'], modules: ['workforce'] },

    // ─── Gym Management ───
    { to: '/gym/customers', icon: 'groups', labelKey: 'gym.nav.customers', modules: ['gym'] },
    { to: '/gym/subscriptions', icon: 'card_membership', labelKey: 'gym.nav.subscriptions', modules: ['gym'] },
    { to: '/gym/inventory', icon: 'inventory_2', labelKey: 'gym.nav.inventory', modules: ['gym'] },
    { to: '/gym/finance', icon: 'account_balance_wallet', labelKey: 'gym.nav.finance', modules: ['gym'] },
    { to: '/gym/analytics', icon: 'analytics', labelKey: 'gym.nav.analytics', modules: ['gym'] },
    { to: '/gym/pos', icon: 'point_of_sale', labelKey: 'gym.nav.pos', modules: ['gym'] },

    // ─── Parking Management ───
    { to: '/parking/management', icon: 'local_parking', labelKey: 'parking.nav.management', modules: ['parking'] },
];

// System section — admin / settings pages.
const SYSTEM_NAV: NavConfig[] = [
    // Settings page has multiple tabs; show it for anyone who can manage at least one settings area.
    { to: '/settings', icon: 'settings', labelKey: 'nav.settings', anyOf: ['Settings.Manage', 'Companies.Manage', 'Users.Manage', 'Roles.Manage', 'Audit.View'] },
    { to: '/status', icon: 'monitoring', labelKey: 'nav.systemStatus', anyOf: ['System.Manage'] },
];

export function Sidebar() {
    const { hasAnyPermission } = useAuth();
    const { t } = useTranslation();
    const { activeModule/*, openPicker*/ } = useModule();
    // const module = MODULES[activeModule];

    const isAllowed = (item: NavConfig): boolean => {
        if (item.modules && !item.modules.includes(activeModule)) return false;
        if (!item.anyOf || item.anyOf.length === 0) return true;
        return hasAnyPermission(item.anyOf);
    };

    const primary = PRIMARY_NAV.filter(isAllowed);
    const system = SYSTEM_NAV.filter(isAllowed);

    return (
        <aside className="hidden md:flex flex-col w-[260px] bg-surface shadow-md py-6 shrink-0 h-full border-none">
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl !fill-1">person_filled</span>
                </div>
                <div>
                    <h1 className="text-sm font-bold leading-tight text-text-dark">{t('common.appName')}</h1>
                </div>
            </div>

            {/* <button
                type="button"
                onClick={openPicker}
                title={t('modules.switch')}
                className="mx-3 mb-5 flex items-center gap-3 rounded-xl border border-border-base bg-slate-75 p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br ${module.gradient} text-white`}>
                    <img src={module.image} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-text-light">{t('modules.label')}</span>
                    <span className="block truncate text-sm font-bold text-text-dark">{t(module.nameKey)}</span>
                </span>
                <span className="material-symbols-outlined shrink-0 text-text-muted">unfold_more</span>
            </button> */}

            <nav className="flex-1 px-3 space-y-1">
                {primary.map(item => (
                    <NavItem key={item.to} to={item.to} icon={item.icon} label={t(item.labelKey)} end={item.end} />
                ))}
            </nav>

            {system.length > 0 && (
                <div className="px-6 py-4 mb-2">
                    <p className="text-[10px] font-extrabold text-text-muted tracking-widest uppercase mb-3">{t('nav.system')}</p>
                    <nav className="space-y-1">
                        {system.map(item => (
                            <NavItem key={item.to} to={item.to} icon={item.icon} label={t(item.labelKey)} />
                        ))}
                    </nav>
                </div>
            )}

            <div className="px-6 pt-1 text-[10px] font-bold uppercase tracking-widest text-text-light/60">
                v{__APP_VERSION__}
            </div>

        </aside>
    );
}
