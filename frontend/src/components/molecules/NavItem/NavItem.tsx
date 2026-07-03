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
                `group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-linear-to-r from-primary/12 to-primary/4 text-primary'
                    : 'text-text-muted hover:bg-slate-75 hover:text-text-dark'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <span
                        className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary transition-all duration-200 ${isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'}`}
                        aria-hidden="true"
                    />
                    <span className={`material-symbols-outlined shrink-0 text-xl transition-transform duration-200 group-hover:scale-110 ${isActive ? 'icon-fill' : ''}`}>
                        {icon}
                    </span>
                    {label}
                </>
            )}
        </NavLink>
    );
}
