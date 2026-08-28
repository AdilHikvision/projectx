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

    // Кольцо на чистом CSS: иконочный шрифт (Material Symbols) грузится с
    // Google Fonts, и до его загрузки лигатура рисовалась как крутящееся слово.
    return (
        <span
            className={`spinner-ring text-primary ${sizes[size]} ${className}`}
            aria-hidden="true"
        />
    );
}
