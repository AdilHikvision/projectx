import { AppLayout } from '../components/AppLayout'
import { Card, Button, PageHeader } from '../components/ui'

export function SystemSettingsPage() {
    return (
        <AppLayout>
            <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">

                {/* Unified Page Header */}
                <PageHeader
                    title="Global Configuration"
                    description="Manage system-wide parameters and security protocols."
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

                    </div>
                </div>

            </div>
        </AppLayout>
    )
}
