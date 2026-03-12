interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Spinner({
    size = 'md',
    className = '',
}: SpinnerProps) {
    const sizes = {
        sm: 'text-xl',
        md: 'text-3xl',
        lg: 'text-5xl',
    };

    return (
        <span className={`material-symbols-outlined animate-spin text-primary ${sizes[size]} ${className}`}>
            progress_activity
        </span>
    );
}
