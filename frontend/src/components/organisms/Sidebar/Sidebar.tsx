import { useTranslation } from 'react-i18next';
import { NavItem } from '../../molecules';
import { useAuth } from '../../../auth/AuthContext';

interface NavConfig {
    to: string;
    icon: string;
    labelKey: string;
    end?: boolean;
    /** Show item if user has at least one of these permissions. Omit/empty = always show (e.g. Dashboard). */
    anyOf?: string[];
}

// Top section — feature pages. Dashboard is always visible to any authenticated user.
const PRIMARY_NAV: NavConfig[] = [
    { to: '/', icon: 'grid_view', labelKey: 'nav.dashboard', end: true },
    { to: '/people', icon: 'group', labelKey: 'nav.people', anyOf: ['Employees.View', 'Visitors.View'] },
    { to: '/monitoring', icon: 'monitor_heart', labelKey: 'nav.monitoring', anyOf: ['Devices.View'] },
    { to: '/access-levels', icon: 'admin_panel_settings', labelKey: 'nav.accessLevels', anyOf: ['AccessLevels.View'] },
    { to: '/work-hours', icon: 'schedule', labelKey: 'nav.workHours', anyOf: ['Attendance.View'] },
    { to: '/schedule-planner', icon: 'calendar_month', labelKey: 'nav.schedulePlanner', anyOf: ['Schedules.View'] },
    { to: '/approvals', icon: 'approval', labelKey: 'nav.approvals', anyOf: ['Attendance.Manage', 'Leaves.Manage'] },
    { to: '/geo-zones', icon: 'my_location', labelKey: 'nav.geoZones', anyOf: ['GeoZones.Manage'] },
    { to: '/payroll', icon: 'payments', labelKey: 'nav.payroll', anyOf: ['Payroll.View'] },
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

    const isAllowed = (item: NavConfig): boolean => {
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
                    <p className="text-xs text-text-muted font-bold tracking-widest uppercase">{t('common.appSubtitle')}</p>
                </div>
            </div>

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

        </aside>
    );
}
