import { AppLayout } from '../components/AppLayout'

const accessLevels = [
    { name: 'Full Access', zone: 'Main Entrance', schedule: '24/7 Unrestricted', users: 38, priority: 'High' },
    { name: 'Tier 1 Required', zone: 'IT Server Room', schedule: 'Business Hours Only', users: 124, priority: 'Critical' },
    { name: 'Security Pass', zone: 'Warehouse A', schedule: 'Shift-based', users: 14, priority: 'Medium' },
    { name: 'Guest Access', zone: 'Lobby', schedule: 'Temporary', users: 52, priority: 'Low' },
]

export function AccessLevelsPage() {
    return (
        <AppLayout>
            <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">

                {/* Top Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            <span>Security Hub</span>
                            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                            <span className="text-primary">Policy Management</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Access Control Policies</h2>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                        <span className="material-symbols-outlined text-[18px]">add_moderator</span>
                        Create New Policy
                    </button>
                </div>

                {/* Zone Grid Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">door_front</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Active Zones</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">12</span>
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Monitoring</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">group</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Authorized Users</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">842</span>
                            <span className="text-xs font-bold text-slate-400">Total</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">policy</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Unique Policies</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">24</span>
                            <span className="text-xs font-bold text-primary">Active</span>
                        </div>
                    </div>
                    <div className="hidden xl:block bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group border-l-4 border-l-emerald-500">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
                            <span className="material-symbols-outlined text-5xl">verified_user</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Security Integrity</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-emerald-500 uppercase tracking-tighter">All Clear</span>
                        </div>
                    </div>
                </div>

                {/* Main List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Active Security Zones</h4>
                        <div className="flex gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"><span className="material-symbols-outlined text-xl">filter_list</span></button>
                            <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"><span className="material-symbols-outlined text-xl">search</span></button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Zone / Facility</th>
                                    <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Policy Name</th>
                                    <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Schedule Type</th>
                                    <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">User Count</th>
                                    <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Settings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {accessLevels.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                                    <span className="material-symbols-outlined text-xl !fill-0">shield_lock</span>
                                                </div>
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.zone}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${item.priority === 'Critical' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' :
                                                item.priority === 'High' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                                                }`}>
                                                {item.name}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-medium text-slate-600 dark:text-slate-400">{item.schedule}</td>
                                        <td className="px-8 py-6 text-center text-[15px] font-black text-slate-900 dark:text-slate-100">{item.users}</td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">settings</span>
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Matrix Note Card */}
                <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-8 border border-primary/20 border-dashed flex items-center gap-6">
                    <div className="size-14 rounded-2xl bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-3xl">hub</span>
                    </div>
                    <div>
                        <p className="text-slate-900 dark:text-slate-100 font-black tracking-tight text-lg mb-1">Global Permissions Propagation</p>
                        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl leading-relaxed">
                            Changes to access policies are pushed to all edge controllers in real-time. System-wide sync typically completes in under 45 seconds for all decentralized nodes.
                        </p>
                    </div>
                    <button className="ml-auto px-6 py-2.5 bg-slate-900 dark:bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all">
                        Force Sync Fleet
                    </button>
                </div>

            </div>
        </AppLayout>
    )
}
