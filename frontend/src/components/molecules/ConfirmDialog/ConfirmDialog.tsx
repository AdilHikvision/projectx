import { useTranslation } from 'react-i18next';
import { Button } from '../../atoms';
import { Modal } from '../../organisms';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    variant = 'danger',
    isLoading = false,
}: ConfirmDialogProps) {
    const { t } = useTranslation();
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <p className="text-sm text-text-dark">{message}</p>
                <div className="flex gap-2">
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        isLoading={isLoading}
                        className={variant === 'danger' ? 'bg-error-text! text-white! rounded-[10px] shadow hover:brightness-110' : ''}
                    >
                        {confirmText ?? t('common.confirm')}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText ?? t('common.cancel')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
