import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  fullScreen?: boolean;
}

export function Modal({ isOpen, onClose, title, children, fullScreen }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative flex flex-col bg-white shadow-xl border border-border-base overflow-hidden rounded-2xl ${
          fullScreen ? 'w-[calc(100%-2rem)] h-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]' : 'w-full max-w-lg max-h-[90vh]'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-base">
          <h2 id="modal-title" className="text-base font-black text-text-dark uppercase tracking-wider">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-dark hover:bg-slate-75 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6`}>{children}</div>
      </div>
    </div>
  );
}
