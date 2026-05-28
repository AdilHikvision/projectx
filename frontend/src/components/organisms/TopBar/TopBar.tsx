import { UserDropdown, NotificationBell } from '../../molecules';
import { useAuth } from '../../../auth/AuthContext';
import { useNotifications } from '../../../hooks/useNotifications';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

interface TopBarProps {
    title: string;
    breadcrumb?: string;
    searchPlaceholder?: string;
    actionIcon?: string;
    onAction?: () => void;
}

interface NavItem {
    label: string;
    path: string;
    icon: string;
    keywords: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: 'grid_view', keywords: 'dashboard home overview stats' },
    { label: 'People', path: '/people', icon: 'group', keywords: 'people employees visitors staff hr' },
    { label: 'Monitoring', path: '/monitoring', icon: 'monitor_heart', keywords: 'monitoring live events realtime access' },
    { label: 'Access Levels', path: '/access-levels', icon: 'admin_panel_settings', keywords: 'access levels doors floors policies permissions' },
    { label: 'Work Hours', path: '/work-hours', icon: 'schedule', keywords: 'work hours attendance daily weekly monthly records schedules leaves vacations' },
    { label: 'Schedule Planner', path: '/schedule-planner', icon: 'calendar_month', keywords: 'schedule planner calendar shifts patterns' },
    { label: 'Approvals', path: '/approvals', icon: 'approval', keywords: 'approvals requests attendance corrections' },
    { label: 'Geo Zones', path: '/geo-zones', icon: 'my_location', keywords: 'geo zones location geofence radius' },
    { label: 'Payroll', path: '/payroll', icon: 'payments', keywords: 'payroll salary calculation periods overtime deductions' },
    { label: 'Settings', path: '/settings', icon: 'settings', keywords: 'settings configuration system global' },
    { label: 'System Status', path: '/status', icon: 'monitoring', keywords: 'system status devices logs health' },
]

function getInitials(email: string | null | undefined): string {
    if (!email) return '?';
    const part = email.split('@')[0];
    if (!part) return '?';
    const first = part[0]?.toUpperCase() ?? '?';
    const second = part[1]?.toUpperCase();
    return second ? `${first}${second}` : first;
}

export function TopBar({ title, breadcrumb, searchPlaceholder, actionIcon, onAction }: TopBarProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const initials = getInitials(user?.email);
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const results = query.trim()
        ? NAV_ITEMS.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.keywords.toLowerCase().includes(query.toLowerCase())
        )
        : [];

    const isOpen = results.length > 0;

    useEffect(() => {
        setQuery('');
    }, [location.pathname]);

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setQuery('');
            }
        }
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, []);

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!isOpen) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[activeIndex]) {
                navigate(results[activeIndex].path);
                setQuery('');
                inputRef.current?.blur();
            }
        } else if (e.key === 'Escape') {
            setQuery('');
            inputRef.current?.blur();
        }
    }

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <header className="sticky top-0 z-20 shrink-0 bg-white/80 backdrop-blur-md shadow-md border-none">
            {/* Desktop Top Bar */}
            <div className="hidden md:flex items-center justify-between px-8 py-3 min-h-[64px]">
                {/* Left: Breadcrumb / Title */}
                <div className="flex items-center gap-3 text-sm">
                    {breadcrumb ? (
                        <div className="flex items-center gap-2">
                            <Link to="/" className="text-text-light hover:text-primary transition-colors cursor-pointer no-underline">
                                {breadcrumb}
                            </Link>
                            <span className="material-symbols-outlined text-xs text-text-light">chevron_right</span>
                            <span className="text-text-dark font-bold">{title}</span>
                        </div>
                    ) : (
                        <span className="text-xl font-bold text-text-dark">{title}</span>
                    )}
                </div>

                {/* Right: Search, Bell, Avatar */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                    {/* Search with dropdown */}
                    <div ref={containerRef} className="relative w-full max-w-[300px]">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted pointer-events-none">search</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={searchPlaceholder || 'Search pages...'}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background-light text-text-dark placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                        </div>

                        {isOpen && (
                            <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-2xl shadow-xl border border-border z-50 overflow-hidden">
                                {results.map((item, i) => (
                                    <button
                                        key={item.path}
                                        type="button"
                                        onMouseDown={() => {
                                            navigate(item.path);
                                            setQuery('');
                                        }}
                                        onMouseEnter={() => setActiveIndex(i)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === activeIndex ? 'bg-primary/8 text-primary' : 'text-text-dark hover:bg-background-light'}`}
                                    >
                                        <span className={`material-symbols-outlined text-[18px] shrink-0 ${i === activeIndex ? 'text-primary' : 'text-text-muted'}`}>
                                            {item.icon}
                                        </span>
                                        <span className="text-sm font-semibold">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <NotificationBell
                            notifications={notifications}
                            unreadCount={unreadCount}
                            onMarkRead={markRead}
                            onMarkAllRead={markAllRead}
                        />
                        <UserDropdown initials={initials} onLogout={handleLogout} />
                    </div>
                </div>
            </div>

            {/* Mobile Top Bar */}
            <div className="md:hidden flex items-center justify-between px-6 py-4 min-h-[72px]">
                <div className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-xl text-primary-dark">
                        <span className="material-symbols-outlined text-2xl !fill-1">shield</span>
                    </div>
                </div>
                <div className="flex-1 text-center">
                    <h1 className="text-lg font-black text-text-dark tracking-tight leading-none">{title}</h1>
                </div>
                <div className="flex items-center justify-end">
                    {actionIcon || onAction ? (
                        <button
                            onClick={onAction}
                            className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-2xl">{actionIcon || 'add'}</span>
                        </button>
                    ) : (
                        <div className="w-10" />
                    )}
                </div>
            </div>
        </header>
    );
}
