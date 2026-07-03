import type { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function Card({
    children,
    className = '',
    noPadding = false
}: CardProps) {
    return (
        <div className={`bg-surface rounded-2xl border border-border-light shadow-card overflow-hidden ${!noPadding ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}
