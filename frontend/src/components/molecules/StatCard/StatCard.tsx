import type { ReactNode } from 'react';
import { Card } from '../../atoms';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: ReactNode;
    className?: string;
}

export function StatCard({
    title,
    value,
    subtitle,
    className = '',
}: StatCardProps) {
    return (
        <Card className={`group relative flex flex-col gap-2 transition-all hover:border-primary/25 hover:-translate-y-0.5 hover:shadow-float ${className}`}>
            <span className="absolute inset-x-0 top-0 h-[3px] bg-brand-gradient opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            <p className="text-[11px] font-extrabold text-text-light tracking-[0.14em] uppercase">{title}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold tracking-tight text-text-dark">{value}</p>
                {subtitle && (
                    <span className="text-xs font-bold text-text-muted">
                        {subtitle}
                    </span>
                )}
            </div>
        </Card>
    );
}
