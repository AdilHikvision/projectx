interface AvatarProps {
    initials?: string;
    icon?: string;
    className?: string;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'purple' | 'neutral';
    size?: 'sm' | 'md' | 'lg';
}

export function Avatar({
    initials,
    icon,
    className = '',
    variant = 'default',
    size = 'md',
}: AvatarProps) {
    const variants = {
        default: 'bg-avatar-bg text-avatar-text ring-avatar-border',
        primary: 'bg-primary/10 text-primary ring-primary/20',
        success: 'bg-success-bg text-success-text ring-success-text/10',
        warning: 'bg-warning-bg text-warning-text ring-warning-text/10',
        purple: 'bg-purple-100 text-purple-600 ring-purple-200',
        neutral: 'bg-slate-75 text-text-muted ring-border-base',
    };

    const sizes = {
        sm: 'size-7 text-[10px]',
        md: 'size-10 text-[13px]',
        lg: 'size-12 text-[15px]',
    };

    return (
        <div className={`rounded-full ring-1 ring-inset flex items-center justify-center font-bold shrink-0 ${variants[variant]} ${sizes[size]} ${className}`}>
            {initials && <span>{initials}</span>}
            {icon && <span className="material-symbols-outlined">{icon}</span>}
        </div>
    );
}
