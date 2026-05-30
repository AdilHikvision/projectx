import { useTranslation } from 'react-i18next';
import { Input } from '../../atoms';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    containerClassName?: string;
}

export function SearchInput({
    value,
    onChange,
    placeholder,
    className = '',
    containerClassName = '',
}: SearchInputProps) {
    const { t } = useTranslation();
    return (
        <div className={`relative ${containerClassName}`}>
            <Input
                placeholder={placeholder ?? t('common.search')}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                icon="search"
                className={`pr-9 ${className}`}
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-dark hover:bg-slate-100 transition-colors"
                    aria-label={t('common.clear')}
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            )}
        </div>
    );
}
