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
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
    const widthStyle = fullWidth ? 'w-full' : '';

    const variants = {
        primary: 'bg-primary text-white hover:bg-primary-dark shadow-[0_10px_24px_rgba(170,154,212,0.35)]',
        secondary: 'bg-primary/10 text-primary hover:bg-primary/20',
        outline: 'border border-border-base bg-white text-text-base hover:bg-slate-75',
        ghost: 'text-text-muted hover:text-text-dark hover:bg-slate-75',
        danger: 'bg-error-bg text-error-text hover:bg-error-text hover:text-white',
    };

    const sizes = {
        sm: 'px-1.5 py-0.5 text-[9px] leading-none gap-1',
        md: 'px-2.5 py-1 text-[10px] leading-tight gap-1',
        lg: 'px-3.5 py-1.5 text-[11.5px] leading-tight gap-1.5',
        icon: 'h-6 w-6',
    };

    const combinedClassName = `${baseStyles} ${widthStyle} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
        <button className={combinedClassName} disabled={disabled || isLoading} {...props}>
            {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[12px]">progress_activity</span>
            ) : (
                icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>
            )}
            {children}
        </button>
    );
}
