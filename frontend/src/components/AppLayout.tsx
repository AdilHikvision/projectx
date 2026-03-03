import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Button } from './ui'
import { TopBar } from './TopBar'

interface AppLayoutProps {
    children: ReactNode
}

const routeMeta: Record<string, { title: string; breadcrumb?: string; actionText?: string; actionIcon?: string; searchPlaceholder: string }> = {
    '/': { title: 'Dashboard', breadcrumb: 'Main Site', searchPlaceholder: 'Search dashboard...' },
    '/devices': { title: 'Devices', breadcrumb: 'Main Site', actionText: 'Add Device', actionIcon: 'add', searchPlaceholder: 'Search devices...' },
    '/people': { title: 'People Management', breadcrumb: 'Main Site', actionText: 'Add User', actionIcon: 'person_add', searchPlaceholder: 'Search Users & Visitors...' },
    '/access-levels': { title: 'Access Control', breadcrumb: 'Main Site', actionText: 'Create Policy', actionIcon: 'add_moderator', searchPlaceholder: 'Search policies...' },
    '/work-hours': { title: 'Attendance Tracking', breadcrumb: 'Main Site', actionText: 'Export Report', actionIcon: 'download', searchPlaceholder: 'Search attendance...' },
    '/payroll': { title: 'Payroll Calculation', breadcrumb: 'Main Site', actionText: 'Process All', actionIcon: 'payments', searchPlaceholder: 'Search payroll...' },
    '/settings': { title: 'Global Configuration', breadcrumb: 'Main Site', actionText: 'Save Changes', actionIcon: 'save', searchPlaceholder: 'Search settings...' },
    '/status': { title: 'System Status', breadcrumb: 'Main Site', searchPlaceholder: 'Search logs...' },
}

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
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl !fill-1">person_filled</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold leading-tight text-text-dark">UniFi Access</h1>
                        <p className="text-xs text-text-muted font-bold tracking-widest uppercase">HQ CONSOLE</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-slate-75'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">grid_view</span>
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/people"
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-slate-75'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">group</span>
                        People
                    </NavLink>
                    <NavLink
                        to="/devices"
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-slate-75'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">sensors</span>
                        Devices
                    </NavLink>
                    <NavLink
                        to="/access-levels"
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-slate-75'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">admin_panel_settings</span>
                        Access Levels
                    </NavLink>
                    <NavLink
                        to="/work-hours"
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-slate-75'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">schedule</span>
                        Work Hours
                    </NavLink>
                    <NavLink
                        to="/payroll"
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-slate-75'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">payments</span>
                        Payroll
                    </NavLink>
                </nav>

                <div className="px-6 py-4 mb-2">
                    <p className="text-[10px] font-extrabold text-text-muted tracking-widest uppercase mb-3">SYSTEM</p>
                    <nav className="space-y-1">
                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text-dark'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined shrink-0 text-xl">settings</span>
                            Settings
                        </NavLink>
                        <NavLink
                            to="/status"
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text-dark'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined shrink-0 text-xl">monitoring</span>
                            System Status
                        </NavLink>
                    </nav>
                </div>

                {/* Pro Plan Badge */}
                <div className="mx-3 p-4 bg-slate-75 rounded-xl border border-border-light">
                    <p className="text-xs font-extrabold text-text-muted uppercase tracking-wider mb-2">PRO PLAN</p>
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
