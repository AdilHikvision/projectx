import { useTranslation } from 'react-i18next';
import { Spinner } from '../../atoms';

interface LoadingOverlayProps {
    isLoading: boolean;
    variant?: 'overlay' | 'solid';
    message?: string;
}

export function LoadingOverlay({
    isLoading,
    variant = 'overlay',
    message
}: LoadingOverlayProps) {
    const { t } = useTranslation();
    if (!isLoading) return null;

    const resolvedMessage = message ?? t('common.loading');

    const bgClasses = variant === 'solid'
        ? 'bg-background-light'
        : 'bg-black/50 backdrop-blur-sm';

    const textClasses = variant === 'solid'
        ? 'text-text-muted'
        : 'text-white/90';

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center ${bgClasses} transition-all duration-300`}
            aria-busy="true"
            aria-label={resolvedMessage}
        >
            <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className={`text-xs font-black uppercase tracking-[0.2em] ${textClasses} ml-1 animate-pulse`}>
                    {resolvedMessage}
                </p>
            </div>
        </div>
    );
}
