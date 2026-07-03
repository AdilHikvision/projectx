import type { ReactNode } from 'react';

interface AlertMessageProps {
    variant: 'error' | 'info' | 'success' | 'warning';
    children: ReactNode;
    className?: string;
}

export function AlertMessage({
    variant,
    children,
    className = '',
}: AlertMessageProps) {
    const variants = {
        error: 'bg-error-bg text-error-text ring-error-text/15',
        info: 'bg-primary/5 text-primary ring-primary/15',
        success: 'bg-success-bg text-success-text ring-success-text/15',
        warning: 'bg-warning-bg text-warning-text ring-warning-text/15',
    };

    const icons = {
        error: 'error',
        info: 'info',
        success: 'check_circle',
        warning: 'warning',
    };

    return (
        <div className={`flex items-start gap-2.5 p-4 rounded-xl text-xs font-bold ring-1 ring-inset max-h-40 overflow-y-auto ${variants[variant]} ${className}`}>
            <span className="material-symbols-outlined icon-fill text-[18px] leading-none shrink-0" aria-hidden>
                {icons[variant]}
            </span>
            <div className="flex-1 min-w-0 whitespace-pre-wrap leading-relaxed">{children}</div>
        </div>
    );
}
