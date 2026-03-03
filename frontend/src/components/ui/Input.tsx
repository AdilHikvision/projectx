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
        <div className={`relative ${containerClassName}`}>
            {icon && (
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-light text-[18px]">
                    {icon}
                </span>
            )}
            <input
                className={`w-full h-9 ${icon ? 'pl-9' : 'px-3'} pr-3 bg-slate-75 border border-border-base rounded-md text-xs text-text-base placeholder-text-light focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all ${className}`}
                {...props}
            />
        </div>
    );
}
