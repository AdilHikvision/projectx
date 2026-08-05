import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../auth/AuthContext';
import { useModule } from '../../../context/ModuleContext';
import type { ModuleKey } from '../../../config/modules';

interface BottomNavItem {
    to: string;
    icon: string;
    labelKey: string;
    anyOf?: string[];
    /** Restrict item to these modules. Omit = visible in every module. */
    modules?: ModuleKey[];
    /** Точное совпадение пути (для «/», иначе он подсвечен всегда). */
    end?: boolean;
    /** Вкладка страницы настроек: пункт ведёт на /settings?tab=… и подсвечивается только на ней. */
    tab?: string;
}

const NAV_ITEMS: BottomNavItem[] = [
    { to: '/', icon: 'grid_view', labelKey: 'nav.dashboard', end: true },
    // Отдельной страницы устройств нет — они живут вкладкой в настройках.
    { to: '/settings?tab=devices', icon: 'router', labelKey: 'nav.devices', anyOf: ['Devices.View'], modules: ['workforce'], tab: 'devices' },
    { to: '/access-levels', icon: 'key', labelKey: 'nav.access', anyOf: ['AccessLevels.View'], modules: ['workforce'] },
    { to: '/people', icon: 'group', labelKey: 'nav.people', anyOf: ['Employees.View', 'Visitors.View'], modules: ['workforce'] },
    { to: '/settings', icon: 'settings', labelKey: 'nav.settings', anyOf: ['Settings.Manage', 'Companies.Manage', 'Users.Manage', 'Roles.Manage', 'Audit.View'] },
];

/** Пункты «Устройства» и «Настройки» ведут на один путь, поэтому активный
 *  считаем сами: у первого — по вкладке, у второго — по её отсутствию. */
function isItemActive(item: BottomNavItem, pathname: string, search: string): boolean {
    const [path] = item.to.split('?');
    const matchesPath = item.end ? pathname === path : pathname === path || pathname.startsWith(path + '/');
    if (!matchesPath) return false;
    if (path !== '/settings') return true;
    const currentTab = new URLSearchParams(search).get('tab');
    const tabItems = NAV_ITEMS.filter((i) => i.to.startsWith('/settings') && i.tab).map((i) => i.tab);
    return item.tab ? currentTab === item.tab : !tabItems.includes(currentTab ?? undefined);
}

export function BottomBar() {
    const { hasAnyPermission } = useAuth();
    const { activeModule } = useModule();
    const { t } = useTranslation();
    const { pathname, search } = useLocation();
    const items = NAV_ITEMS.filter(i =>
        (!i.modules || i.modules.includes(activeModule)) &&
        (!i.anyOf || i.anyOf.length === 0 || hasAnyPermission(i.anyOf)),
    );

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-t border-border-light flex items-center justify-around px-2 z-50">
            {items.map((item) => {
                const isActive = isItemActive(item, pathname, search);
                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`
                            flex flex-col items-center justify-center gap-1 flex-1 h-full
                            ${isActive ? 'text-primary' : 'text-text-light'}
                            transition-colors duration-200
                        `}
                    >
                        <span className={`material-symbols-outlined text-xl transition-transform duration-200 ${isActive ? 'icon-fill' : ''}`}>
                            {item.icon}
                        </span>
                        <span className="text-[9px] font-extrabold tracking-[0.14em] uppercase">
                            {t(item.labelKey)}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
