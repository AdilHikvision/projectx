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
            className={`block text-xs font-bold text-text-muted mb-1 ${className}`}
        >
            {children}
        </label>
    );
}
