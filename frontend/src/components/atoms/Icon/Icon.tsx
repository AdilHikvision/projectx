interface IconProps {
    name: string;
    className?: string;
    filled?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function Icon({
    name,
    className = '',
    filled = false,
    size = 'md',
}: IconProps) {
    const sizes = {
        xs: 'text-[12px]',
        sm: 'text-[16px]',
        md: 'text-[20px]',
        lg: 'text-[24px]',
        xl: 'text-[32px]',
    };

    return (
        <span
            className={`material-symbols-outlined ${filled ? '!fill-1' : ''} ${sizes[size]} ${className}`}
        >
            {name}
        </span>
    );
}
