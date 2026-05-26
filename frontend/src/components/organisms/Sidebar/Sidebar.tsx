import { NavItem } from '../../molecules';

export function Sidebar() {
    return (
        <aside className="hidden md:flex flex-col w-[260px] bg-surface shadow-md py-6 shrink-0 h-full border-none">
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
                <NavItem to="/" icon="grid_view" label="Dashboard" end />
                <NavItem to="/people" icon="group" label="People" />
                <NavItem to="/monitoring" icon="monitor_heart" label="Monitoring" />
                <NavItem to="/access-levels" icon="admin_panel_settings" label="Access Levels" />
                <NavItem to="/work-hours" icon="schedule" label="Work Hours" />
                <NavItem to="/schedule-planner" icon="calendar_month" label="Schedule Planner" />
                <NavItem to="/approvals" icon="approval" label="Approvals" />
                <NavItem to="/geo-zones" icon="my_location" label="Geo-zones" />
                <NavItem to="/payroll" icon="payments" label="Payroll" />
            </nav>

            <div className="px-6 py-4 mb-2">
                <p className="text-[10px] font-extrabold text-text-muted tracking-widest uppercase mb-3">SYSTEM</p>
                <nav className="space-y-1">
                    <NavItem to="/settings" icon="settings" label="Settings" />
                    <NavItem to="/status" icon="monitoring" label="System Status" />
                </nav>
            </div>

        </aside>
    );
}
