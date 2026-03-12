import type { ReactNode, HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    children: ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'neutral' | 'primary';
    dot?: boolean;
}

export function Badge({
    children,
    variant = 'neutral',
    dot = false,
    className = '',
    title,
    ...props
}: BadgeProps) {
    const variants = {
        success: 'bg-success-bg text-success-text',
        warning: 'bg-warning-bg text-warning-text',
        error: 'bg-error-bg text-error-text',
        primary: 'bg-primary/10 text-primary',
        neutral: 'bg-slate-100 text-text-muted',
    };

    const dotColors = {
        success: 'bg-success-text',
        warning: 'bg-warning-text',
        error: 'bg-error-text',
        primary: 'bg-primary',
        neutral: 'bg-text-light',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${variants[variant]} ${className}`}
            title={title}
            {...props}
        >
            {dot && <span className={`size-1.5 rounded-full ${dotColors[variant]}`}></span>}
            {children}
        </span>
    );
}
