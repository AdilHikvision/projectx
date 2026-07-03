import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();

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
                className="rounded-full ring-2 ring-transparent hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
                <Avatar
                    initials={initials}
                    size={size}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 p-1.5 w-48 bg-white rounded-2xl shadow-float border border-border-light animate-pop z-50">
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-error-text hover:bg-error-bg transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        {t('common.logout')}
                    </button>
                </div>
            )}
        </div>
    );
}
