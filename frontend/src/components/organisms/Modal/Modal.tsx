import type { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    fullScreen?: boolean;
    actions?: ReactNode;
    className?: string; // Add className prop
}

export function Modal({ isOpen, onClose, title, children, fullScreen, actions, className = '' }: ModalProps) {
    if (!isOpen) return null;

    const baseClasses = `relative flex flex-col shadow-xl overflow-hidden rounded-2xl border-none`;
    const sizeClasses = fullScreen
        ? 'w-[calc(100%-2rem)] h-[calc(100%-2rem)]'
        : 'w-full max-w-lg max-h-[90vh]';

    const bgClass = className.includes('bg-') ? '' : 'bg-surface';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
                onClick={onClose}
                aria-hidden
            />
            <div
                className={`${baseClasses} ${sizeClasses} ${bgClass} ${className}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-divider-light">
                    <h2 id="modal-title" className="text-xl font-bold text-text-dark tracking-tight">
                        {title}
                    </h2>
                    <div className="flex items-center gap-2">
                        {actions}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-lg text-text-muted hover:text-text-dark hover:bg-slate-75 transition-colors"
                            aria-label="Close"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>
                </div>
                <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6`}>{children}</div>
            </div>
        </div>
    );
}
