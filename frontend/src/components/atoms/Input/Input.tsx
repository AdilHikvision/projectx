import type { InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    icon?: string;
    containerClassName?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Input({
    icon,
    className = '',
    containerClassName = '',
    size = 'md',
    ...props
}: InputProps) {
    const sizes = {
        sm: 'h-8 text-[11px]',
        md: 'h-10 text-xs',
        lg: 'h-12 text-sm',
    };

    return (
        <div className={`relative ${containerClassName}`}>
            {icon && (
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-light text-[18px]">
                    {icon}
                </span>
            )}
            <input
                className={`w-full ${sizes[size]} ${icon ? 'pl-10' : 'px-4'} pr-4 bg-slate-50 border-none rounded-2xl text-text-dark placeholder-text-light/50 shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold ${className}`}
                {...props}
            />
        </div>
    );
}
