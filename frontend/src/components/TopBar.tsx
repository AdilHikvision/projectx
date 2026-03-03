import { Button, Input, Avatar } from './ui';

interface TopBarProps {
    title: string;
    breadcrumb?: string;
    searchPlaceholder?: string;
}

export function TopBar({ title, breadcrumb, searchPlaceholder }: TopBarProps) {
    return (
        <>
            <header className="hidden md:flex items-center justify-between px-8 py-3 bg-surface border-b border-border-light sticky top-0 z-20 shrink-0 min-h-[64px]">
                {/* Left side: Breadcrumb / Title */}
                <div className="flex items-center gap-3 text-sm">
                    {breadcrumb ? (
                        <div className="flex items-center gap-2">
                            <span className="text-text-light hover:text-text-muted transition-colors cursor-pointer">{breadcrumb}</span>
                            <span className="material-symbols-outlined text-xs text-text-light">chevron_right</span>
                            <span className="text-text-dark font-bold">{title}</span>
                        </div>
                    ) : (
                        <span className="text-xl font-bold text-text-dark">{title}</span>
                    )}
                </div>

                {/* Right-aligned group: Search, Action, Bell, Avatar */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                    <Input
                        icon="search"
                        placeholder={searchPlaceholder || 'Search...'}
                        containerClassName="w-full max-w-[300px]"
                    />

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="rounded-full bg-slate-75">
                            <span className="material-symbols-outlined text-xl">notifications</span>
                        </Button>
                        <Avatar initials="L" className="cursor-pointer hover:opacity-90 transition-opacity" />
                    </div>
                </div>
            </header>

            {/* Mobile Top Bar */}
            <header className="md:hidden flex items-center justify-between px-6 py-4 bg-surface border-b border-border-light sticky top-0 z-20 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-text-light tracking-widest uppercase">
                    <span className="material-symbols-outlined text-text-dark text-xl cursor-pointer mr-2">menu</span>
                    <span>{breadcrumb || 'NETWORK'}</span>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-text-dark">{title}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-text-light">notifications</span>
                    <Avatar size="sm" initials="L" />
                </div>
            </header>
        </>
    );
}
