import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AppLayout } from '../components/templates'
import { Button } from '../components/atoms'
import { PageHeader } from '../components/organisms'
import { DevicesTab } from './DevicesTab'

export function SystemSettingsPage() {
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const initialTab = queryParams.get('tab') === 'devices' ? 'devices' : 'global'

    const [activeTab, setActiveTab] = useState<'global' | 'devices'>(initialTab)
    const devicesRef = useRef<{ triggerAction: () => void } | null>(null)

    useEffect(() => {
        const tab = new URLSearchParams(location.search).get('tab')
        if (tab === 'devices') setActiveTab('devices')
        else if (tab === 'global') setActiveTab('global')
    }, [location.search])

    const handleAction = () => {
        if (activeTab === 'devices' && devicesRef.current) {
            devicesRef.current.triggerAction()
        }
    }

    return (
        <AppLayout onAction={handleAction}>
            <div className="flex-1 overflow-y-auto bg-background-light pb-20 md:pb-0">
                <div className="p-6 md:p-10 space-y-8">
                    <PageHeader
                        className="hidden md:flex"
                        title="System Settings"
                        description="Configure global parameters and manage your hardware fleet."
                    />

                    {/* Tab Navigation */}
                    <div className="flex gap-8 border-b border-divider-light">
                        <button
                            onClick={() => setActiveTab('global')}
                            className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'global' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-muted'
                                }`}
                        >
                            Global Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('devices')}
                            className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'devices' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-muted'
                                }`}
                        >
                            Devices
                        </button>
                    </div>

                    {activeTab === 'global' ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Localization & Runtime */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-lg">settings_suggest</span>
                                    </div>
                                    <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest leading-none">Localization & Runtime</h3>
                                </div>

                                <div className="bg-surface rounded-3xl shadow-md p-8 space-y-8 border-none text-text-light">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-text-light uppercase tracking-widest pl-1">System Language</label>
                                            <div className="relative">
                                                <select className="w-full bg-slate-50 border border-border-light rounded-2xl px-4 py-3.5 text-sm font-bold text-text-dark appearance-none focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer shadow-sm">
                                                    <option>English (United States)</option>
                                                    <option>Español (España)</option>
                                                    <option>Français (France)</option>
                                                </select>
                                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">expand_content</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-text-light uppercase tracking-widest pl-1">Temporal Zone</label>
                                            <div className="relative">
                                                <select className="w-full bg-slate-50 border border-border-light rounded-2xl px-4 py-3.5 text-sm font-bold text-text-dark appearance-none focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer shadow-sm">
                                                    <option>(UTC-05:00) Eastern Time</option>
                                                    <option>(UTC+00:00) London</option>
                                                    <option>(UTC+03:00) Istanbul</option>
                                                </select>
                                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">schedule</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-text-light uppercase tracking-widest pl-1">Console Heartbeat Interval</p>
                                        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 rounded-2xl shadow-inner border-none">
                                            {['5s', '15s', '30s', '1m'].map((val, i) => (
                                                <button
                                                    key={val}
                                                    className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${i === 1 ? 'bg-primary text-white shadow-md' : 'text-text-light hover:text-text-dark'}`}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Data Retention & Intelligence */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <span className="material-symbols-outlined text-lg">database</span>
                                    </div>
                                    <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest leading-none">Vault & Data Ops</h3>
                                </div>

                                <div className="bg-surface rounded-3xl shadow-md p-8 space-y-6 border-none text-text-light">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black text-text-dark">Automated Snapshot Engine</p>
                                            <p className="text-[9px] font-bold text-text-light uppercase tracking-widest">Daily encrypted offsite backups</p>
                                        </div>
                                        <div className="w-10 h-5 bg-slate-200 rounded-full relative shadow-inner">
                                            <div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <Button fullWidth variant="outline" icon="cyclone" size="sm" className="shadow-sm hover:shadow-md transition-shadow">Deep Reindex</Button>
                                        <Button fullWidth variant="outline" icon="history" size="sm" className="shadow-sm hover:shadow-md transition-shadow">Purge Logs</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DevicesTab ref={devicesRef} />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
