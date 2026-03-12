import { NavLink } from 'react-router-dom';

interface NavItemProps {
    to: string;
    icon: string;
    label: string;
    end?: boolean;
}

export function NavItem({
    to,
    icon,
    label,
    end = false,
}: NavItemProps) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-slate-75'
                }`
            }
        >
            <span className="material-symbols-outlined shrink-0 text-xl">{icon}</span>
            {label}
        </NavLink>
    );
}
