import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: string;
    containerClassName?: string;
}

export function Input({
    icon,
    className = '',
    containerClassName = '',
    ...props
}: InputProps) {
    return (
        <div className={`relative group ${containerClassName}`}>
            {icon && (
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-primary transition-colors text-[18px]">
                    {icon}
                </span>
            )}
            <input
                className={`w-full h-9 ${icon ? 'pl-9' : 'px-3'} pr-3 bg-slate-75 border border-transparent rounded-xl text-xs font-semibold text-text-dark placeholder:text-text-light/70 focus:ring-2 focus:ring-primary/25 focus:border-primary/40 focus:bg-white outline-none transition-all ${className}`}
                {...props}
            />
        </div>
    );
}
