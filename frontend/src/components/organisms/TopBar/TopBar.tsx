import { Button, Input } from '../../atoms';
import { UserDropdown } from '../../molecules';
import { useAuth } from '../../../auth/AuthContext';
import { Link } from 'react-router-dom';

interface TopBarProps {
    title: string;
    breadcrumb?: string;
    searchPlaceholder?: string;
    actionIcon?: string;
    onAction?: () => void;
}

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
    const initials = getInitials(user?.email);

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <header className="sticky top-0 z-20 shrink-0 bg-white/80 backdrop-blur-md shadow-md border-none">
            {/* Desktop Top Bar (Hidden on Mobile) */}
            <div className="hidden md:flex items-center justify-between px-8 py-3 min-h-[64px]">
                {/* Left side: Breadcrumb / Title */}
                <div className="flex items-center gap-3 text-sm">
                    {breadcrumb ? (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/"
                                className="text-text-light hover:text-primary transition-colors cursor-pointer no-underline"
                            >
                                {breadcrumb}
                            </Link>
                            <span className="material-symbols-outlined text-xs text-text-light">chevron_right</span>
                            <span className="text-text-dark font-bold">{title}</span>
                        </div>
                    ) : (
                        <span className="text-xl font-bold text-text-dark">{title}</span>
                    )}
                </div>

                {/* Right-aligned group: Search, Bell, Avatar */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                    <Input
                        icon="search"
                        placeholder={searchPlaceholder || 'Search...'}
                        containerClassName="w-full max-w-[300px]"
                    />

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="rounded-full bg-slate-75 hover:bg-slate-100">
                            <span className="material-symbols-outlined text-xl">notifications</span>
                        </Button>
                        <UserDropdown initials={initials} onLogout={handleLogout} />
                    </div>
                </div>
            </div>

            {/* Mobile Top Bar (Matches Screenshot) */}
            <div className="md:hidden flex items-center justify-between px-6 py-4 min-h-[72px]">
                {/* Left: Branding Icon Box */}
                <div className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-xl text-primary-dark">
                        <span className="material-symbols-outlined text-2xl !fill-1">shield</span>
                    </div>
                </div>

                {/* Center: Bold Title */}
                <div className="flex-1 text-center">
                    <h1 className="text-lg font-black text-text-dark tracking-tight leading-none">{title}</h1>
                </div>

                {/* Right: Purple Action Button Circle */}
                <div className="flex items-center justify-end">
                    {actionIcon || onAction ? (
                        <button
                            onClick={onAction}
                            className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-2xl">{actionIcon || 'add'}</span>
                        </button>
                    ) : (
                        <div className="w-10" /> // Spacer for balanced centering
                    )}
                </div>
            </div>
        </header>
    );
}
