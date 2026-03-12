import { NavLink } from 'react-router-dom';

const navItems = [
    { to: '/', icon: 'grid_view', label: 'DASHBOARD' },
    { to: '/devices', icon: 'router', label: 'DEVICES' },
    { to: '/access-levels', icon: 'key', label: 'ACCESS' },
    { to: '/people', icon: 'group', label: 'PEOPLE' },
    { to: '/settings', icon: 'settings', label: 'SETTINGS' },
];

export function BottomBar() {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border-light flex items-center justify-around px-2 z-50">
            {navItems.map((item) => (
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
                        {item.label}
                    </span>
                </NavLink>
            ))}
        </nav>
    );
}
