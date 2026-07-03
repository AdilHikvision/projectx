import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    icon?: ReactNode;
    children?: ReactNode;
    isLoading?: boolean;
    fullWidth?: boolean;
}

export function Button({
    variant = 'primary',
    size = 'md',
    icon,
    children,
    isLoading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
    const widthStyle = fullWidth ? 'w-full' : '';

    const variants = {
        primary: 'bg-brand-gradient text-white shadow-primary hover:brightness-110 hover:shadow-lg hover:shadow-primary/30',
        secondary: 'bg-primary/10 text-primary-dark hover:bg-primary/15',
        outline: 'border border-border-base bg-white text-text-base hover:border-primary/35 hover:text-primary-dark hover:bg-primary/4',
        ghost: 'text-text-muted hover:text-text-dark hover:bg-slate-75',
        danger: 'bg-error-bg text-error-text hover:bg-error-text hover:text-white',
    };

    const sizes = {
        sm: 'px-2 py-1 text-[10px] leading-none gap-1',
        md: 'px-3 py-1.5 text-[11px] leading-tight gap-1',
        lg: 'px-4 py-2 text-xs leading-tight gap-1.5',
        icon: 'h-7 w-7',
    };

    const combinedClassName = `${baseStyles} ${widthStyle} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
        <button className={combinedClassName} disabled={disabled || isLoading} {...props}>
            {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[13px]">progress_activity</span>
            ) : (
                icon && <span className="material-symbols-outlined text-[15px]">{icon}</span>
            )}
            {children}
        </button>
    );
}
