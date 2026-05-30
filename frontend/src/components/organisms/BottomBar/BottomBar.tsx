import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../auth/AuthContext';

interface BottomNavItem {
    to: string;
    icon: string;
    labelKey: string;
    anyOf?: string[];
}

const NAV_ITEMS: BottomNavItem[] = [
    { to: '/', icon: 'grid_view', labelKey: 'nav.dashboard' },
    { to: '/devices', icon: 'router', labelKey: 'nav.devices', anyOf: ['Devices.View'] },
    { to: '/access-levels', icon: 'key', labelKey: 'nav.access', anyOf: ['AccessLevels.View'] },
    { to: '/people', icon: 'group', labelKey: 'nav.people', anyOf: ['Employees.View', 'Visitors.View'] },
    { to: '/settings', icon: 'settings', labelKey: 'nav.settings', anyOf: ['Settings.Manage', 'Companies.Manage', 'Users.Manage', 'Roles.Manage', 'Audit.View'] },
];

export function BottomBar() {
    const { hasAnyPermission } = useAuth();
    const { t } = useTranslation();
    const items = NAV_ITEMS.filter(i => !i.anyOf || i.anyOf.length === 0 || hasAnyPermission(i.anyOf));

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border-light flex items-center justify-around px-2 z-50">
            {items.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `
                        flex flex-col items-center justify-center gap-1 flex-1 h-full
                        ${isActive ? 'text-primary' : 'text-text-light'}
                        transition-colors duration-200
                    `}
                >
                    <span className={`material-symbols-outlined text-xl transition-transform duration-200`}>
                        {item.icon}
                    </span>
                    <span className="text-[9px] font-black tracking-widest uppercase">
                        {t(item.labelKey)}
                    </span>
                </NavLink>
            ))}
        </nav>
    );
}
