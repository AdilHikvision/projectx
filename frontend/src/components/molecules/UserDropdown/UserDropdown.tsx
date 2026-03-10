import { useEffect, useRef, useState } from 'react';
import { Avatar } from '../../atoms';

interface UserDropdownProps {
    initials: string;
    onLogout: () => void;
    size?: 'sm' | 'md' | 'lg';
}

export function UserDropdown({
    initials,
    onLogout,
    size = 'md',
}: UserDropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
            >
                <Avatar
                    initials={initials}
                    size={size}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 py-2 w-48 bg-surface rounded-xl shadow-lg border border-border-base z-50">
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm font-semibold text-text-dark hover:bg-slate-75 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Log Out
                    </button>
                </div>
            )}
        </div>
    );
}
