import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavItem } from '../../molecules';
import { Logo } from '../../atoms';
import { useAuth } from '../../../auth/AuthContext';
import { useModule } from '../../../context/ModuleContext';
import { MODULES, type ModuleKey } from '../../../config/modules';
import { apiRequest } from '../../../lib/api';

interface NavConfig {
    to: string;
    icon: string;
    labelKey?: string;
    /** Literal label — used when there is no i18n key (e.g. embedded Aktiv Parking tabs). */
    label?: string;
    end?: boolean;
    /** Show item if user has at least one of these permissions. Omit/empty = always show (e.g. Dashboard). */
    anyOf?: string[];
    /** Restrict item to these modules. Omit = visible in every module (e.g. Dashboard, Settings). */
    modules?: ModuleKey[];
    /** Показывать только когда парковка в платном режиме (parking.mode = Paid). */
    paidParkingOnly?: boolean;
}

// Top section — feature pages. Dashboard is visible in every module; the rest are Workforce-only.
const PRIMARY_NAV: NavConfig[] = [
    { to: '/dashboard', icon: 'grid_view', labelKey: 'nav.dashboard', modules: ['workforce'] },
    { to: '/', icon: 'grid_view', labelKey: 'nav.dashboard', end: true, modules: ['gym', 'parking'] },
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

    // ─── Aktiv Parking (нативные страницы ProjectX) ───
    // "Ana Səhifə" Dashboard tabında göstərilir (parking modulunda), ona görə burada ayrıca yoxdur.
    { to: '/parking/vehicles', icon: 'directions_car', labelKey: 'parking.nav.vehicles', modules: ['parking'] },
    { to: '/parking/ap-permits', icon: 'verified_user', labelKey: 'parking.nav.permits', modules: ['parking'] },
    { to: '/parking/pos', icon: 'point_of_sale', labelKey: 'parking.nav.pos', modules: ['parking'], paidParkingOnly: true },
    { to: '/parking/tariffs', icon: 'sell', labelKey: 'parking.nav.tariffs', modules: ['parking'], paidParkingOnly: true },
    { to: '/parking/history', icon: 'history', labelKey: 'parking.nav.history', modules: ['parking'] },
    { to: '/parking/ap-reports', icon: 'bar_chart', labelKey: 'parking.nav.reports', modules: ['parking'] },
];

// System section — admin / settings pages.
const SYSTEM_NAV: NavConfig[] = [
    // Settings page has multiple tabs; show it for anyone who can manage at least one settings area.
    { to: '/settings', icon: 'settings', labelKey: 'nav.settings', anyOf: ['Settings.Manage', 'Companies.Manage', 'Users.Manage', 'Roles.Manage', 'Audit.View'] },
    { to: '/status', icon: 'monitoring', labelKey: 'nav.systemStatus', anyOf: ['System.Manage'] },
];

export function Sidebar() {
    const { hasAnyPermission, token } = useAuth();
    const { t } = useTranslation();
    const { activeModule, openPicker, canSwitchModules } = useModule();
    const module = MODULES[activeModule];

    // Режим парковки: пункты POS/Тарифы видны только при платном режиме.
    const [parkingPaid, setParkingPaid] = useState(false);
    useEffect(() => {
        if (activeModule !== 'parking' || !token) return;
        let cancelled = false;
        apiRequest<{ key: string; value: string }>('/api/system-settings/parking.mode', { token })
            .then((r) => { if (!cancelled) setParkingPaid(r?.value === 'Paid'); })
            .catch(() => { if (!cancelled) setParkingPaid(false); });
        return () => { cancelled = true; };
    }, [activeModule, token]);

    const isAllowed = (item: NavConfig): boolean => {
        if (item.modules && !item.modules.includes(activeModule)) return false;
        if (item.paidParkingOnly && !parkingPaid) return false;
        if (!item.anyOf || item.anyOf.length === 0) return true;
        return hasAnyPermission(item.anyOf);
    };

    const primary = PRIMARY_NAV.filter(isAllowed);
    const system = SYSTEM_NAV.filter(isAllowed);

    return (
        <aside className="hidden md:flex flex-col w-[264px] bg-surface border-r border-border-light py-6 shrink-0 h-full">
            <div className="px-5 mb-7 flex items-center gap-3">
                {activeModule === 'parking' ? (
                    <>
                        <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-xl font-extrabold"
                            style={{ background: '#6C5CE7' }}
                        >
                            P
                        </span>
                        <div>
                            <h1 className="text-[15px] font-extrabold leading-tight tracking-tight text-text-dark">Aktiv Parking</h1>
                        </div>
                    </>
                ) : (
                    <>
                        <Logo size={40} />
                        <div>
                            <h1 className="text-[15px] font-extrabold leading-tight tracking-tight text-text-dark">{t('common.appName')}</h1>
                            <p className="text-[11px] font-medium leading-tight text-text-light mt-0.5">Davamiyyət sistemi</p>
                        </div>
                    </>
                )}
            </div>

            {/* Карточка-переключатель нужна только когда активирован не один модуль. */}
            {canSwitchModules && (
            <button
                type="button"
                onClick={openPicker}
                title={t('modules.switch')}
                className="group mx-3 mb-5 flex items-center gap-3 rounded-2xl border border-border-base bg-slate-75/60 p-2.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-card"
            >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br ${module.gradient} text-white shadow-inner-soft`}>
                    <img src={module.image} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-text-light">{t('modules.label')}</span>
                    <span className="block truncate text-sm font-bold text-text-dark">{t(module.nameKey)}</span>
                </span>
                <span className="material-symbols-outlined shrink-0 text-lg text-text-light transition-colors group-hover:text-primary">unfold_more</span>
            </button>
            )}

            <nav className="flex-1 overflow-y-auto px-3 space-y-1">
                {primary.map(item => (
                    <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label ?? (item.labelKey ? t(item.labelKey) : '')} end={item.end} />
                ))}
            </nav>

            {system.length > 0 && (
                <div className="px-3 pt-4 mt-2 mb-2 border-t border-border-light">
                    <p className="px-3 text-[9px] font-extrabold text-text-light tracking-[0.18em] uppercase mb-2">{t('nav.system')}</p>
                    <nav className="space-y-1">
                        {system.map(item => (
                            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label ?? (item.labelKey ? t(item.labelKey) : '')} />
                        ))}
                    </nav>
                </div>
            )}

            <div className="px-6 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-text-light/60">
                v{__APP_VERSION__}
            </div>

        </aside>
    );
}
