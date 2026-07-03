import type { ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'neutral' | 'primary';
    dot?: boolean;
    className?: string;
}

export function Badge({
    children,
    variant = 'neutral',
    dot = false,
    className = ''
}: BadgeProps) {
    const variants = {
        success: 'bg-success-bg text-success-text ring-success-text/15',
        warning: 'bg-warning-bg text-warning-text ring-warning-text/15',
        error: 'bg-error-bg text-error-text ring-error-text/15',
        primary: 'bg-primary/10 text-primary-dark ring-primary/15',
        neutral: 'bg-slate-75 text-text-muted ring-border-base',
    };

    const dotColors = {
        success: 'bg-success-text',
        warning: 'bg-warning-text',
        error: 'bg-error-text',
        primary: 'bg-primary',
        neutral: 'bg-text-light',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ring-1 ring-inset ${variants[variant]} ${className}`}>
            {dot && <span className={`size-1.5 rounded-full ${dotColors[variant]}`}></span>}
            {children}
        </span>
    );
}
