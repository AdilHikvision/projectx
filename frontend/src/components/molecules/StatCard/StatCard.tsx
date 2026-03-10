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
        <Card className={`flex flex-col gap-2 transition-all hover:border-primary/20 ${className}`}>
            <p className="text-xs font-black text-text-muted tracking-widest uppercase">{title}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-text-dark">{value}</p>
                {subtitle && (
                    <span className="text-xs font-bold text-text-muted">
                        {subtitle}
                    </span>
                )}
            </div>
        </Card>
    );
}
