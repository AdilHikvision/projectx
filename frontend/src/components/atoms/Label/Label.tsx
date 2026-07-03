interface LabelProps {
    children: string;
    htmlFor?: string;
    className?: string;
}

export function Label({
    children,
    htmlFor,
    className = '',
}: LabelProps) {
    return (
        <label
            htmlFor={htmlFor}
            className={`block text-xs font-semibold text-text-base mb-1.5 ${className}`}
        >
            {children}
        </label>
    );
}
