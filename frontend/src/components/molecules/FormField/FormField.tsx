import type { InputHTMLAttributes } from 'react';
import { Input, Label } from '../../atoms';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: string;
    containerClassName?: string;
}

export function FormField({
    label,
    icon,
    containerClassName = '',
    ...inputProps
}: FormFieldProps) {
    return (
        <div className={containerClassName}>
            <Label>{label}</Label>
            <Input icon={icon} {...inputProps} />
        </div>
    );
}
