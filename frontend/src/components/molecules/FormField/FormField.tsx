import type { InputHTMLAttributes } from 'react';
import { Input, Label } from '../../atoms';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label: string;
    icon?: string;
    containerClassName?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function FormField({
    label,
    icon,
    size,
    containerClassName = '',
    ...inputProps
}: FormFieldProps) {
    return (
        <div className={containerClassName}>
            <Label>{label}</Label>
            <Input icon={icon} size={size} {...inputProps} />
        </div>
    );
}
