import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

interface AppLayoutProps {
    children: ReactNode
}

const routeMeta: Record<string, { title: string; breadcrumb?: string; actionText?: string; actionIcon?: string; searchPlaceholder: string }> = {
    '/': { title: 'Dashboard', searchPlaceholder: 'Search dashboard...' },
    '/devices': { title: 'Devices', actionText: 'Add Device', actionIcon: 'add', searchPlaceholder: 'Search devices...' },
    '/people': { title: 'People Management', breadcrumb: 'Main Site', actionText: 'Add User', actionIcon: 'person_add', searchPlaceholder: 'Search Users & Visitors...' },
    '/access-levels': { title: 'Access Control', breadcrumb: 'Security Hub', actionText: 'Create Policy', actionIcon: 'add_moderator', searchPlaceholder: 'Search policies...' },
    '/work-hours': { title: 'Attendance', actionText: 'Export Report', actionIcon: 'download', searchPlaceholder: 'Search attendance...' },
    '/payroll': { title: 'Payroll Calculation', actionText: 'Process All', actionIcon: 'payments', searchPlaceholder: 'Search payroll...' },
    '/settings': { title: 'Global Configuration', actionText: 'Save Changes', actionIcon: 'save', searchPlaceholder: 'Search settings...' },
    '/status': { title: 'System Status', searchPlaceholder: 'Search logs...' },
}

export function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation()
    const meta = routeMeta[location.pathname] || { title: 'Dashboard', searchPlaceholder: 'Search...' }

    return (
        <div className="flex h-screen overflow-hidden bg-[#f7f6f7] font-sans antialiased text-dark">
            {/* ─── Sidebar ─── */}
            <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-[#f3f4f6] py-6 shrink-0 h-full">
                <div className="px-6 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl !fill-1">person_filled</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold leading-tight text-dark">UniFi Access</h1>
                        <p className="text-[10px] text-muted font-bold tracking-widest uppercase">HQ CONSOLE</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-gray-50'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">grid_view</span>
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/people"
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-gray-50'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">group</span>
                        People
                    </NavLink>
                    <NavLink
                        to="/devices"
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-gray-50'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">sensors</span>
                        Devices
                    </NavLink>
                    <NavLink
                        to="/access-levels"
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-gray-50'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">admin_panel_settings</span>
                        Access Levels
                    </NavLink>
                    <NavLink
                        to="/work-hours"
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-gray-50'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">schedule</span>
                        Work Hours
                    </NavLink>
                    <NavLink
                        to="/payroll"
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-gray-50'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">payments</span>
                        Payroll
                    </NavLink>
                </nav>

                <div className="px-6 py-4 mb-2">
                    <p className="text-[10px] font-extrabold text-muted tracking-widest uppercase mb-3">SYSTEM</p>
                    <nav className="space-y-1">
                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:text-dark'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined shrink-0 text-xl">settings</span>
                            Settings
                        </NavLink>
                        <NavLink
                            to="/status"
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:text-dark'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined shrink-0 text-xl">monitoring</span>
                            System Status
                        </NavLink>
                    </nav>
                </div>

                {/* Pro Plan Badge */}
                <div className="mx-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-extrabold text-muted uppercase tracking-wider mb-2">PRO PLAN</p>
                    <p className="text-[10px] text-muted leading-relaxed mb-3">Access advanced scheduling & visitor management.</p>
                    <button className="w-full py-1.5 bg-primary text-[10px] font-bold text-white rounded-lg hover:bg-primary/90 transition-colors">
                        Upgrade Now
                    </button>
                </div>
            </aside>


            {/* ─── Main Content Area ─── */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#f7f6f7] overflow-hidden">

                {/* ─── Top Header Bar ─── */}
                <header className="hidden md:flex items-center justify-between px-8 py-3 bg-white border-b border-gray-100 sticky top-0 z-20 shrink-0 min-h-[64px]">
                    {/* Left side: Breadcrumb / Title */}
                    <div className="flex items-center gap-3 text-[13px]">
                        {meta.breadcrumb ? (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">{meta.breadcrumb}</span>
                                <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
                                <span className="text-slate-900 font-bold">{meta.title}</span>
                            </div>
                        ) : (
                            <span className="text-xl font-bold text-slate-900">{meta.title}</span>
                        )}
                    </div>

                    {/* Right-aligned group: Search, Action, Bell, Avatar */}
                    <div className="flex items-center gap-4 flex-1 justify-end">
                        {/* Search bar */}
                        <div className="relative w-full max-w-[300px]">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[18px]">search</span>
                            <input
                                className="w-full h-11 pl-10 pr-4 bg-[#f1f4f8] border border-[#eceff3] rounded-[6px] text-[14px] text-[#374151] placeholder-[#9ca3af] focus:ring-2 focus:ring-primary/20 focus:border-[#d9dce2] outline-none transition-all"
                                placeholder={meta.searchPlaceholder}
                                type="text"
                            />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            {meta.actionText && (
                                <button className="h-11 bg-primary hover:bg-primary/90 text-white px-5 rounded-[8px] text-[13px] font-semibold flex items-center gap-2 transition-all shadow-[0_10px_24px_rgba(170,154,212,0.35)]">
                                    <span className="material-symbols-outlined text-[16px]">{meta.actionIcon || 'add'}</span>
                                    {meta.actionText}
                                </button>
                            )}

                            {/* Notification icon */}
                            <button className="h-10 w-10 bg-[#f4f6f9] border border-[#eceff3] rounded-full text-muted hover:text-[#4b5563] hover:bg-[#eef2f7] transition-colors flex items-center justify-center">
                                <span className="material-symbols-outlined text-[20px]">notifications</span>
                            </button>

                            {/* User Avatar */}
                            <div className="h-10 w-10 rounded-full bg-[#f9dfc5] border border-[#f0d5ba] flex items-center justify-center text-[13px] font-bold text-[#b57321] cursor-pointer hover:opacity-90 transition-opacity">
                                L
                            </div>
                        </div>
                    </div>
                </header>

                {/* ─── Mobile Header ─── */}
                <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-20 shrink-0">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                        <span className="material-symbols-outlined text-slate-900 text-xl cursor-pointer mr-2">menu</span>
                        <span>{meta.breadcrumb || 'NETWORK'}</span>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-slate-900">{meta.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-slate-400">notifications</span>
                        <div className="w-7 h-7 rounded-lg bg-[#f9dbbc] flex items-center justify-center text-[11px] font-bold text-[#b57321]">
                            L
                        </div>
                    </div>
                </header>

                {/* ─── Page Content ─── */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
