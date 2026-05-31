import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar, TopBar, BottomBar } from '../../organisms';

interface AppLayoutProps {
    children: ReactNode;
    onAction?: () => void;
}

interface RouteMeta {
    titleKey: string;
    breadcrumbKey?: string;
    actionTextKey?: string;
    actionIcon?: string;
    searchPlaceholderKey: string;
}

const ROUTE_META: Record<string, RouteMeta> = {
    '/': { titleKey: 'nav.dashboard', searchPlaceholderKey: 'topBar.searchDashboard' },
    '/monitoring': { titleKey: 'nav.monitoring', breadcrumbKey: 'nav.dashboard', searchPlaceholderKey: 'topBar.searchMonitoring' },
    '/people': { titleKey: 'nav.people', breadcrumbKey: 'nav.dashboard', actionTextKey: 'topBar.addPeople', actionIcon: 'person_add', searchPlaceholderKey: 'topBar.searchPeople' },
    '/access-levels': { titleKey: 'nav.accessLevels', breadcrumbKey: 'nav.dashboard', actionTextKey: 'topBar.createPolicy', actionIcon: 'add', searchPlaceholderKey: 'topBar.searchPolicies' },
    '/work-hours': { titleKey: 'nav.workHours', breadcrumbKey: 'nav.dashboard', actionTextKey: 'topBar.exportReport', actionIcon: 'download', searchPlaceholderKey: 'topBar.searchAttendance' },
    '/approvals': { titleKey: 'nav.approvals', breadcrumbKey: 'nav.dashboard', searchPlaceholderKey: 'topBar.searchRequests' },
    '/schedule-planner': { titleKey: 'nav.schedulePlanner', breadcrumbKey: 'nav.dashboard', searchPlaceholderKey: 'common.search' },
    '/geo-zones': { titleKey: 'nav.geoZones', breadcrumbKey: 'nav.dashboard', searchPlaceholderKey: 'topBar.searchZones' },
    '/payroll': { titleKey: 'nav.payroll', breadcrumbKey: 'nav.dashboard', actionTextKey: 'topBar.processAll', actionIcon: 'payments', searchPlaceholderKey: 'topBar.searchPayroll' },
    '/settings': { titleKey: 'nav.settings', breadcrumbKey: 'nav.dashboard', actionTextKey: 'common.saveChanges', actionIcon: 'save', searchPlaceholderKey: 'topBar.searchSettings' },
    '/status': { titleKey: 'nav.systemStatus', breadcrumbKey: 'nav.dashboard', searchPlaceholderKey: 'topBar.searchLogs' },

    // ─── Gym Management module ───
    '/gym/customers': { titleKey: 'gym.nav.customers', breadcrumbKey: 'nav.dashboard', searchPlaceholderKey: 'common.search' },
    '/gym/subscriptions': { titleKey: 'gym.nav.subscriptions', breadcrumbKey: 'nav.dashboard', searchPlaceholderKey: 'common.search' },
    '/gym/inventory': { titleKey: 'gym.nav.inventory', breadcrumbKey: 'nav.dashboard', searchPlaceholderKey: 'common.search' },
    '/gym/finance': { titleKey: 'gym.nav.finance', breadcrumbKey: 'nav.dashboard', searchPlaceholderKey: 'common.search' },
    '/gym/analytics': { titleKey: 'gym.nav.analytics', breadcrumbKey: 'nav.dashboard', searchPlaceholderKey: 'common.search' },
    '/gym/pos': { titleKey: 'gym.nav.pos', breadcrumbKey: 'nav.dashboard', searchPlaceholderKey: 'common.search' },

    // ─── Parking Management module ───
    '/parking/management': { titleKey: 'parking.nav.management', breadcrumbKey: 'nav.dashboard', searchPlaceholderKey: 'common.search' },
};

export function AppLayout({ children, onAction }: AppLayoutProps) {
    const location = useLocation();
    const { t } = useTranslation();

    const meta = ROUTE_META[location.pathname] ?? {
        titleKey: 'nav.dashboard',
        breadcrumbKey: 'nav.dashboard',
        searchPlaceholderKey: 'common.search',
    };

    const title = t(meta.titleKey);
    const breadcrumb = meta.breadcrumbKey ? t(meta.breadcrumbKey) : undefined;
    const searchPlaceholder = t(meta.searchPlaceholderKey);

    return (
        <div className="flex h-screen overflow-hidden bg-background-light font-sans antialiased text-text-dark">
            {/* ─── Sidebar (Desktop only) ─── */}
            <Sidebar />

            {/* ─── Main Content Area ─── */}
            <main className="flex-1 flex flex-col min-w-0 bg-background-light overflow-hidden">
                {/* Unified Top Header Bar */}
                <TopBar
                    title={title}
                    breadcrumb={breadcrumb !== title ? breadcrumb : undefined}
                    searchPlaceholder={searchPlaceholder}
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
