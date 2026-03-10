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
        error: 'bg-error-bg text-error-text border-error-text/10',
        info: 'bg-primary/5 text-primary border-primary/20',
        success: 'bg-success-bg text-success-text border-success-text/10',
        warning: 'bg-warning-bg text-warning-text border-warning-text/10',
    };

    return (
        <div className={`p-4 rounded-xl text-xs font-bold border max-h-40 overflow-y-auto whitespace-pre-wrap ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
}
