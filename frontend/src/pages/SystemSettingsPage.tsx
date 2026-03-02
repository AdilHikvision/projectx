import { AppLayout } from '../components/AppLayout'

export function SystemSettingsPage() {
    return (
        <AppLayout>
            <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">

                {/* Action Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight text-center md:text-left">Global Configuration</h2>
                        <p className="text-sm text-slate-500 text-center md:text-left">Manage system-wide parameters and security protocols.</p>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                        <button className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            Cancel
                        </button>
                        <button className="px-5 py-2.5 bg-primary text-white text-xs font-black rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                            Save Changes
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* General Settings */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <span className="material-symbols-outlined text-primary">settings_suggest</span>
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest leading-none">General Settings</h3>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-8 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Preferred Language</label>
                                    <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 outline-none transition-all">
                                        <option>English (United States)</option>
                                        <option>Español (España)</option>
                                        <option>Français (France)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Server Timezone</label>
                                    <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 outline-none transition-all">
                                        <option>(GMT-05:00) Eastern Time</option>
                                        <option>(GMT+00:00) London</option>
                                        <option>(GMT+03:00) Moscow</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Console Refresh Interval</p>
                                <div className="flex flex-wrap gap-2">
                                    {['5s', '15s', '30s', '1m'].map((val, i) => (
                                        <button key={val} className={`px-5 py-2.5 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all ${i === 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}>
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Security Protocol */}
                        <div className="flex items-center gap-3 px-2 pt-4">
                            <span className="material-symbols-outlined text-primary">security</span>
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest leading-none">Security Protocol</h3>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
                            <div className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all cursor-pointer group">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">Multi-Factor Authentication</p>
                                    <p className="text-xs text-slate-500 mt-1">Enforce biometric or TOTP secondary validation.</p>
                                </div>
                                <div className="w-12 h-6 bg-primary rounded-full relative p-1 shadow-inner shadow-black/20">
                                    <div className="size-4 bg-white rounded-full shadow-md ml-auto"></div>
                                </div>
                            </div>
                            <div className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all cursor-pointer group">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">Encrypted UDP Heartbeats</p>
                                    <p className="text-xs text-slate-500 mt-1">All fleet nodes use AES-256 for status broadcasts.</p>
                                </div>
                                <div className="w-12 h-6 bg-primary rounded-full relative p-1">
                                    <div className="size-4 bg-white rounded-full shadow-md ml-auto"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Connected Nodes */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <span className="material-symbols-outlined text-primary">hub</span>
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest leading-none">Communication Nodes</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 border-l-4 border-l-emerald-500">
                                <div className="size-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-3xl italic">lan</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">Main Access SDK Node</p>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Status: High Availability</p>
                                </div>
                                <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">settings</span>
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 border-l-4 border-l-amber-500">
                                <div className="size-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-3xl">storage</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">PostgreSQL Database Clusters</p>
                                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">Status: Syncing (84%)</p>
                                </div>
                                <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">analytics</span>
                                </button>
                            </div>

                            <button className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-primary hover:border-primary/40 transition-all hover:bg-primary/5">
                                <span className="material-symbols-outlined text-3xl">add_circle_outline</span>
                                <p className="text-xs font-bold uppercase tracking-widest">Connect New Node Integration</p>
                            </button>
                        </div>

                        {/* Version Profile */}
                        <div className="bg-slate-900 dark:bg-black p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-white/5 mt-12">
                            <div className="absolute -top-12 -right-12 size-48 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h4 className="text-white text-xl font-black italic tracking-tighter">PROJECT-X ENTERPRISE</h4>
                                    <p className="text-slate-500 text-xs mt-1 font-medium italic">Operational Integrity: 99.98% • Build 2023.Q4.V2</p>
                                </div>
                                <button className="px-6 py-2.5 bg-white/10 backdrop-blur-lg border border-white/10 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all">
                                    Verify Updates
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    )
}
