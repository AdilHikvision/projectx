import type { ReactNode } from 'react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    breadcrumbs,
    actions,
    className = '',
}: PageHeaderProps) {
    return (
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}>
            <div className="space-y-1">
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">
                        {breadcrumbs.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className={idx === breadcrumbs.length - 1 ? 'text-primary' : ''}>
                                    {item.label}
                                </span>
                                {idx < breadcrumbs.length - 1 && (
                                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <h2 className="text-2xl font-black text-text-dark tracking-tight leading-tight">{title}</h2>
                {description && (
                    <p className="text-sm text-text-muted max-w-2xl">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
