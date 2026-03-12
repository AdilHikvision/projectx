import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar, TopBar, BottomBar } from '../../organisms';

interface AppLayoutProps {
    children: ReactNode;
    onAction?: () => void;
}

const routeMeta: Record<string, { title: string; breadcrumb?: string; actionText?: string; actionIcon?: string; searchPlaceholder: string }> = {
    '/': { title: 'Dashboard', searchPlaceholder: 'Search dashboard...' },
    '/monitoring': { title: 'Monitoring', breadcrumb: 'Dashboard', searchPlaceholder: 'Search monitoring...' },
    '/people': { title: 'People', breadcrumb: 'Dashboard', actionText: 'Add People', actionIcon: 'person_add', searchPlaceholder: 'Search People & Visitors...' },
    '/access-levels': { title: 'Access Levels', breadcrumb: 'Dashboard', actionText: 'Create Policy', actionIcon: 'add', searchPlaceholder: 'Search policies...' },
    '/work-hours': { title: 'Work Hours', breadcrumb: 'Dashboard', actionText: 'Export Report', actionIcon: 'download', searchPlaceholder: 'Search attendance...' },
    '/payroll': { title: 'Payroll', breadcrumb: 'Dashboard', actionText: 'Process All', actionIcon: 'payments', searchPlaceholder: 'Search payroll...' },
    '/settings': { title: 'Settings', breadcrumb: 'Dashboard', actionText: 'Save Changes', actionIcon: 'save', searchPlaceholder: 'Search settings...' },
    '/status': { title: 'System Status', breadcrumb: 'Dashboard', searchPlaceholder: 'Search logs...' },
};

export function AppLayout({ children, onAction }: AppLayoutProps) {
    const location = useLocation();
    const meta = routeMeta[location.pathname] || {
        title: 'Dashboard',
        breadcrumb: 'Dashboard',
        searchPlaceholder: 'Search...',
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light font-sans antialiased text-text-dark">
            {/* ─── Sidebar (Desktop only) ─── */}
            <Sidebar />

            {/* ─── Main Content Area ─── */}
            <main className="flex-1 flex flex-col min-w-0 bg-background-light overflow-hidden">
                {/* Unified Top Header Bar */}
                <TopBar
                    title={meta.title}
                    breadcrumb={meta.breadcrumb !== meta.title ? meta.breadcrumb : undefined}
                    searchPlaceholder={meta.searchPlaceholder}
                    actionIcon={meta.actionIcon}
                    onAction={onAction}
                />

                {/* ─── Page Content ─── */}
                <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
                    {children}
                </div>

                {/* ─── Mobile Bottom Navigation ─── */}
                <BottomBar />
            </main>
        </div>
    );
}
