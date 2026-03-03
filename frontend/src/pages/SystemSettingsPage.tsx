import { AppLayout } from '../components/AppLayout'
import { Card, Button, Avatar, PageHeader } from '../components/ui'

export function SystemSettingsPage() {
    return (
        <AppLayout>
            <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">

                {/* Unified Page Header */}
                <PageHeader
                    title="Global Configuration"
                    description="Manage system-wide parameters and security protocols."
                    actions={
                        <>
                            <Button variant="outline" size="md">
                                Cancel
                            </Button>
                            <Button variant="primary" size="md" className="font-black">
                                Save Changes
                            </Button>
                        </>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* General Settings */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <span className="material-symbols-outlined text-primary">settings_suggest</span>
                            <h3 className="text-sm font-black text-text-dark uppercase tracking-widest leading-none">General Settings</h3>
                        </div>

                        <Card className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Preferred Language</label>
                                    <select className="w-full bg-slate-75 border-none rounded-xl px-4 py-3 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/50 outline-none transition-all">
                                        <option>English (United States)</option>
                                        <option>Español (España)</option>
                                        <option>Français (France)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Server Timezone</label>
                                    <select className="w-full bg-slate-75 border-none rounded-xl px-4 py-3 text-sm font-bold text-text-dark focus:ring-2 focus:ring-primary/50 outline-none transition-all">
                                        <option>(GMT-05:00) Eastern Time</option>
                                        <option>(GMT+00:00) London</option>
                                        <option>(GMT+03:00) Moscow</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Console Refresh Interval</p>
                                <div className="flex flex-wrap gap-2">
                                    {['5s', '15s', '30s', '1m'].map((val, i) => (
                                        <Button
                                            key={val}
                                            variant={i === 1 ? 'primary' : 'outline'}
                                            size="sm"
                                            className="font-black uppercase tracking-widest"
                                        >
                                            {val}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Security Protocol */}
                        <div className="flex items-center gap-3 px-2 pt-4">
                            <span className="material-symbols-outlined text-primary">security</span>
                            <h3 className="text-sm font-black text-text-dark uppercase tracking-widest leading-none">Security Protocol</h3>
                        </div>

                        <Card noPadding className="divide-y divide-border-light overflow-hidden">
                            <div className="p-6 flex items-center justify-between hover:bg-slate-75/50 transition-all cursor-pointer group">
                                <div>
                                    <p className="text-sm font-bold text-text-dark group-hover:text-primary transition-colors">Multi-Factor Authentication</p>
                                    <p className="text-xs text-text-muted mt-1">Enforce biometric or TOTP secondary validation.</p>
                                </div>
                                <div className="w-12 h-6 bg-primary rounded-full relative p-1 shadow-inner shadow-black/20">
                                    <div className="size-4 bg-white rounded-full shadow-md ml-auto"></div>
                                </div>
                            </div>
                            <div className="p-6 flex items-center justify-between hover:bg-slate-75/50 transition-all cursor-pointer group">
                                <div>
                                    <p className="text-sm font-bold text-text-dark group-hover:text-primary transition-colors">Encrypted UDP Heartbeats</p>
                                    <p className="text-xs text-text-muted mt-1">All fleet nodes use AES-256 for status broadcasts.</p>
                                </div>
                                <div className="w-12 h-6 bg-primary rounded-full relative p-1">
                                    <div className="size-4 bg-white rounded-full shadow-md ml-auto"></div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Connected Nodes */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <span className="material-symbols-outlined text-primary">hub</span>
                            <h3 className="text-sm font-black text-text-dark uppercase tracking-widest leading-none">Communication Nodes</h3>
                        </div>

                        <div className="space-y-4">
                            <Card className="flex items-center gap-5 border-l-4 border-l-success-text p-6">
                                <Avatar icon="lan" variant="neutral" size="lg" className="shrink-0 text-success-text bg-success-bg" />
                                <div className="flex-1">
                                    <p className="text-base font-black text-text-dark tracking-tight">Main Access SDK Node</p>
                                    <p className="text-[10px] font-bold text-success-text uppercase tracking-widest mt-1">Status: High Availability</p>
                                </div>
                                <Button variant="ghost" size="icon" icon="settings" className="text-text-muted hover:text-text-dark" />
                            </Card>

                            <Card className="flex items-center gap-5 border-l-4 border-l-warning-text p-6">
                                <Avatar icon="storage" variant="neutral" size="lg" className="shrink-0 text-warning-text bg-warning-bg" />
                                <div className="flex-1">
                                    <p className="text-base font-black text-text-dark tracking-tight">PostgreSQL Database Clusters</p>
                                    <p className="text-[10px] font-bold text-warning-text uppercase tracking-widest mt-1">Status: Syncing (84%)</p>
                                </div>
                                <Button variant="ghost" size="icon" icon="analytics" className="text-text-muted hover:text-text-dark" />
                            </Card>

                            <Button variant="outline" className="w-full py-8 border-2 border-dashed border-border-base rounded-2xl flex flex-col items-center justify-center gap-3 text-text-muted hover:text-primary hover:border-primary/40 transition-all hover:bg-primary/5">
                                <span className="material-symbols-outlined text-3xl">add_circle_outline</span>
                                <p className="text-xs font-bold uppercase tracking-widest">Connect New Node Integration</p>
                            </Button>
                        </div>

                        {/* Version Profile */}
                        <div className="bg-background-dark p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-white/5 mt-12">
                            <div className="absolute -top-12 -right-12 size-48 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h4 className="text-white text-xl font-black italic tracking-tighter">PROJECT-X ENTERPRISE</h4>
                                    <p className="text-slate-500 text-xs mt-1 font-medium italic">Operational Integrity: 99.98% • Build 2023.Q4.V2</p>
                                </div>
                                <Button variant="outline" className="px-6 py-2.5 bg-white/10 backdrop-blur-lg border border-white/10 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all border-none">
                                    Verify Updates
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    )
}
