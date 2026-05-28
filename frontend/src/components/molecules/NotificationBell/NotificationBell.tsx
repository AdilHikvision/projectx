import { useEffect, useRef, useState } from 'react';
import type { AppNotification } from '../../../hooks/useNotifications';

const TYPE_ICON: Record<string, string> = {
    DeviceOffline: 'wifi_off',
    DeviceOnline: 'wifi',
    ApprovalRequest: 'assignment',
    ApprovalApproved: 'check_circle',
    ApprovalRejected: 'cancel',
    DailyReport: 'bar_chart',
};

const TYPE_COLOR: Record<string, string> = {
    DeviceOffline: 'text-red-500',
    DeviceOnline: 'text-green-500',
    ApprovalRequest: 'text-blue-500',
    ApprovalApproved: 'text-green-500',
    ApprovalRejected: 'text-red-500',
    DailyReport: 'text-indigo-500',
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'только что';
    if (mins < 60) return `${mins} мин. назад`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ч. назад`;
    return `${Math.floor(hrs / 24)} дн. назад`;
}

interface NotificationBellProps {
    notifications: AppNotification[];
    unreadCount: number;
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
}

export function NotificationBell({ notifications, unreadCount, onMarkRead, onMarkAllRead }: NotificationBellProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="relative w-9 h-9 rounded-full border border-border-base bg-white hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
                <span className="material-symbols-outlined text-xl text-text-base">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-border z-50 overflow-hidden flex flex-col max-h-[420px]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <span className="text-sm font-bold text-text-dark">Уведомления</span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={onMarkAllRead}
                                className="text-xs text-primary font-semibold hover:underline"
                            >
                                Прочитать все
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted">
                                <span className="material-symbols-outlined text-3xl">notifications_none</span>
                                <span className="text-sm">Нет уведомлений</span>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={() => { if (!n.isRead) onMarkRead(n.id); }}
                                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-border last:border-0 ${n.isRead ? 'bg-white hover:bg-slate-50' : 'bg-primary/5 hover:bg-primary/10'}`}
                                >
                                    <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${TYPE_COLOR[n.type] ?? 'text-text-muted'}`}>
                                        {TYPE_ICON[n.type] ?? 'circle_notifications'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-bold leading-snug ${n.isRead ? 'text-text-dark' : 'text-text-dark'}`}>{n.title}</p>
                                        <p className="text-xs text-text-light leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                                        <p className="text-[10px] text-text-muted mt-1">{timeAgo(n.createdAtUtc)}</p>
                                    </div>
                                    {!n.isRead && (
                                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
