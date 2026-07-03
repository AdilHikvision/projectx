import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Button } from './ui'
import { Logo } from './atoms'
import { TopBar } from './TopBar'

interface AppLayoutProps {
    children: ReactNode
}

const routeMeta: Record<string, { title: string; breadcrumb?: string; actionText?: string; actionIcon?: string; searchPlaceholder: string }> = {
    '/': { title: 'Dashboard', breadcrumb: 'Main Site', searchPlaceholder: 'Search dashboard...' },
    '/devices': { title: 'Devices', breadcrumb: 'Main Site', actionText: 'Add Device', actionIcon: 'add', searchPlaceholder: 'Search devices...' },
    '/monitoring': { title: 'Monitoring', breadcrumb: 'Main Site', searchPlaceholder: 'Search monitoring...' },
    '/people': { title: 'People Management', breadcrumb: 'Main Site', actionText: 'Add User', actionIcon: 'person_add', searchPlaceholder: 'Search Users & Visitors...' },
    '/access-levels': { title: 'Access Control', breadcrumb: 'Main Site', actionText: 'Create Policy', actionIcon: 'add_moderator', searchPlaceholder: 'Search policies...' },
    '/work-hours': { title: 'Attendance Tracking', breadcrumb: 'Main Site', actionText: 'Export Report', actionIcon: 'download', searchPlaceholder: 'Search attendance...' },
    '/approvals': { title: 'Approvals', breadcrumb: 'Dashboard', searchPlaceholder: 'Search requests...' },
    '/geo-zones': { title: 'Geo-zones', breadcrumb: 'Dashboard', searchPlaceholder: 'Search zones...' },
    '/payroll': { title: 'Payroll Calculation', breadcrumb: 'Main Site', actionText: 'Process All', actionIcon: 'payments', searchPlaceholder: 'Search payroll...' },
    '/settings': { title: 'Global Configuration', breadcrumb: 'Main Site', actionText: 'Save Changes', actionIcon: 'save', searchPlaceholder: 'Search settings...' },
    '/status': { title: 'System Status', breadcrumb: 'Main Site', searchPlaceholder: 'Search logs...' },
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive
        ? 'bg-linear-to-r from-primary/12 to-primary/4 text-primary'
        : 'text-text-muted hover:bg-slate-75 hover:text-text-dark'
    }`

const navLinkContent = (icon: string, label: string) =>
    ({ isActive }: { isActive: boolean }) => (
        <>
            <span className={`material-symbols-outlined shrink-0 text-xl ${isActive ? 'icon-fill' : ''}`}>{icon}</span>
            {label}
        </>
    )

export function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation()
    const meta = routeMeta[location.pathname] || {
        title: 'Dashboard',
        breadcrumb: 'Main Site',
        searchPlaceholder: 'Search...'
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background-light font-sans antialiased text-text-dark">
            {/* ─── Sidebar ─── */}
            <aside className="hidden md:flex flex-col w-[260px] bg-surface border-r border-border-light py-6 shrink-0 h-full">
                <div className="px-6 mb-8 flex items-center gap-3">
                    <Logo size={40} />
                    <div>
                        <h1 className="text-sm font-bold leading-tight text-text-dark">ProjectX</h1>
                    </div>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    <NavLink to="/" end className={navLinkClass}>
                        {navLinkContent('grid_view', 'Dashboard')}
                    </NavLink>
                    <NavLink to="/people" className={navLinkClass}>
                        {navLinkContent('group', 'People')}
                    </NavLink>
                    <NavLink to="/devices" className={navLinkClass}>
                        {navLinkContent('sensors', 'Devices')}
                    </NavLink>
                    <NavLink to="/monitoring" className={navLinkClass}>
                        {navLinkContent('monitor_heart', 'Monitoring')}
                    </NavLink>
                    <NavLink to="/access-levels" className={navLinkClass}>
                        {navLinkContent('admin_panel_settings', 'Access Levels')}
                    </NavLink>
                    <NavLink to="/work-hours" className={navLinkClass}>
                        {navLinkContent('schedule', 'Work Hours')}
                    </NavLink>
                    <NavLink to="/approvals" className={navLinkClass}>
                        {navLinkContent('approval', 'Approvals')}
                    </NavLink>
                    <NavLink to="/geo-zones" className={navLinkClass}>
                        {navLinkContent('my_location', 'Geo-zones')}
                    </NavLink>
                    <NavLink to="/payroll" className={navLinkClass}>
                        {navLinkContent('payments', 'Payroll')}
                    </NavLink>
                </nav>

                <div className="px-6 py-4 mb-2">
                    <p className="text-[10px] font-extrabold text-text-light tracking-[0.14em] uppercase mb-3">SYSTEM</p>
                    <nav className="space-y-1">
                        <NavLink to="/settings" className={navLinkClass}>
                            {navLinkContent('settings', 'Settings')}
                        </NavLink>
                        <NavLink to="/status" className={navLinkClass}>
                            {navLinkContent('monitoring', 'System Status')}
                        </NavLink>
                    </nav>
                </div>

                {/* Pro Plan Badge */}
                <div className="mx-3 p-4 bg-slate-75 rounded-2xl border border-border-light">
                    <p className="text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] mb-2">PRO PLAN</p>
                    <p className="text-xs text-text-muted leading-relaxed mb-3">Access advanced scheduling & visitor management.</p>
                    <Button fullWidth size="sm">
                        Upgrade Now
                    </Button>
                </div>
            </aside>


            {/* ─── Main Content Area ─── */}
            <main className="flex-1 flex flex-col min-w-0 bg-background-light overflow-hidden">

                {/* Unified Top Header Bar */}
                <TopBar
                    title={meta.title}
                    breadcrumb={meta.breadcrumb}
                    searchPlaceholder={meta.searchPlaceholder}
                />

                {/* ─── Page Content ─── */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
