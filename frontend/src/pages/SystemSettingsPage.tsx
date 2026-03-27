import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { AppLayout } from '../components/templates'
import { Button, Input } from '../components/atoms'
import { Modal, PageHeader } from '../components/organisms'
import { CompanyTab } from './CompanyTab'
import { DevicesTab } from './DevicesTab'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../lib/api'
import { useLoading } from '../context/LoadingContext'

function formatLocalDate(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function SystemSettingsPage() {
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const tabParam = queryParams.get('tab')
    const initialTab: 'global' | 'devices' | 'company' | 'logSync' =
        tabParam === 'devices' ? 'devices' : tabParam === 'company' ? 'company' : tabParam === 'log-sync' ? 'logSync' : 'global'

    const [activeTab, setActiveTab] = useState<'global' | 'devices' | 'company' | 'logSync'>(initialTab)
    const devicesRef = useRef<{ triggerAction: () => void } | null>(null)
    const { token } = useAuth()
    const { startLoading, stopLoading } = useLoading()
    const [companyMode, setCompanyMode] = useState<'Single' | 'Multiple' | 'None'>('None')
    const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
    const [isSavingMode, setIsSavingMode] = useState(false)
    const [showCompanyNameModal, setShowCompanyNameModal] = useState<'Single' | 'Multiple' | null>(null)
    const [companyNameInput, setCompanyNameInput] = useState('')

    useEffect(() => {
        const tab = new URLSearchParams(location.search).get('tab')
        if (tab === 'devices') setActiveTab('devices')
        else if (tab === 'company') setActiveTab('company')
        else if (tab === 'log-sync') setActiveTab('logSync')
        else if (tab === 'global') setActiveTab('global')
    }, [location.search])

    const [logSyncSettings, setLogSyncSettings] = useState<{
        autoEnabled: boolean
        dailyTimeLocal: string
        lastRunUtc?: string | null
        lastRecordsAdded?: number | null
        lastRunKind?: string | null
    } | null>(null)
    const [logSyncManualFrom, setLogSyncManualFrom] = useState(() => formatLocalDate(new Date()))
    const [logSyncManualTo, setLogSyncManualTo] = useState(() => formatLocalDate(new Date()))
    const [logSyncDraftAuto, setLogSyncDraftAuto] = useState(false)
    const [logSyncDraftTime, setLogSyncDraftTime] = useState('03:00')
    const [logSyncLoading, setLogSyncLoading] = useState(false)
    const [logSyncSaving, setLogSyncSaving] = useState(false)
    const [logSyncManualRunning, setLogSyncManualRunning] = useState(false)

    const loadLogSyncSettings = useCallback(async () => {
        if (!token) return
        setLogSyncLoading(true)
        try {
            const s = await apiRequest<{
                autoEnabled: boolean
                dailyTimeLocal: string
                lastRunUtc?: string | null
                lastRecordsAdded?: number | null
                lastRunKind?: string | null
            }>('/api/attendance/log-sync-settings', { token })
            setLogSyncSettings(s)
            setLogSyncDraftAuto(s.autoEnabled)
            setLogSyncDraftTime(s.dailyTimeLocal || '03:00')
            const today = formatLocalDate(new Date())
            setLogSyncManualFrom((prev) => (prev || today))
            setLogSyncManualTo((prev) => (prev || today))
        } catch (e) {
            console.error(e)
        } finally {
            setLogSyncLoading(false)
        }
    }, [token])

    useEffect(() => {
        if (!token || activeTab !== 'logSync') return
        void loadLogSyncSettings()
    }, [token, activeTab, loadLogSyncSettings])

    const saveLogSyncSchedule = async () => {
        if (!token) return
        setLogSyncSaving(true)
        try {
            await apiRequest('/api/attendance/log-sync-settings', {
                method: 'POST',
                token,
                body: JSON.stringify({ autoEnabled: logSyncDraftAuto, dailyTimeLocal: logSyncDraftTime }),
            })
            await loadLogSyncSettings()
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Не удалось сохранить')
        } finally {
            setLogSyncSaving(false)
        }
    }

    const runManualLogSync = async () => {
        if (!token || !logSyncManualFrom || !logSyncManualTo) return
        setLogSyncManualRunning(true)
        try {
            const res = await apiRequest<{
                recordsAdded: number
                devicesProcessed: number
                warnings: string[]
            }>('/api/attendance/sync-logs', {
                method: 'POST',
                token,
                body: JSON.stringify({ fromDate: logSyncManualFrom, toDate: logSyncManualTo }),
            })
            const w = res.warnings?.length ? `\n${res.warnings.join('\n')}` : ''
            alert(`Добавлено записей: ${res.recordsAdded}. Устройств: ${res.devicesProcessed}.${w}`)
            await loadLogSyncSettings()
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Ошибка синхронизации')
        } finally {
            setLogSyncManualRunning(false)
        }
    }

    useEffect(() => {
        if (!token || activeTab !== 'global') return
        
        const loadSettings = async () => {
            startLoading()
            try {
                const [settings, companyList] = await Promise.all([
                    apiRequest<any[]>('/api/system-settings', { token }),
                    apiRequest<{ id: string; name: string }[]>('/api/companies', { token })
                ])
                const mode = settings.find(s => s.key === 'CompanyMode')?.value || 'None'
                setCompanyMode(mode)
                setCompanies(companyList)
            } catch (e) {
                console.error('Failed to load settings', e)
            } finally {
                stopLoading()
            }
        }
        loadSettings()
    }, [token, activeTab, startLoading, stopLoading])

    const handleUpdateMode = async (newMode: 'Single' | 'Multiple', companyName?: string) => {
        if (!token) return
        if (newMode === 'Single' && companies.length === 0 && !companyName?.trim()) return
        setIsSavingMode(true)
        try {
            if (newMode === 'Single' && companies.length === 0 && companyName?.trim()) {
                await apiRequest('/api/companies', {
                    method: 'POST',
                    token,
                    body: JSON.stringify({ name: companyName.trim() })
                })
            }
            await apiRequest('/api/system-settings', {
                method: 'POST',
                token,
                body: JSON.stringify({ key: 'CompanyMode', value: newMode })
            })
            setCompanyMode(newMode)
            setShowCompanyNameModal(null)
            setCompanyNameInput('')
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to update mode')
        } finally {
            setIsSavingMode(false)
        }
    }

    const handleSingleModeClick = () => {
        if (companies.length > 0) {
            handleUpdateMode('Single')
        } else {
            setShowCompanyNameModal('Single')
        }
    }

    const handleConfirmModeWithName = () => {
        const name = companyNameInput.trim()
        if (!name) return
        handleUpdateMode('Single', name)
    }

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
                            onClick={() => setActiveTab('company')}
                            className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'company' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-muted'
                                }`}
                        >
                            Company
                        </button>
                        <button
                            onClick={() => setActiveTab('devices')}
                            className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'devices' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-muted'
                                }`}
                        >
                            Devices
                        </button>
                        <button
                            onClick={() => setActiveTab('logSync')}
                            className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'logSync' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-muted'
                                }`}
                        >
                            Log sync
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

                            {/* Organizational Structure */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
                                        <span className="material-symbols-outlined text-lg">corporate_fare</span>
                                    </div>
                                    <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest leading-none">Organizational Structure</h3>
                                </div>

                                <div className="bg-surface rounded-3xl shadow-md p-8 space-y-6 border-none text-text-light">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-black text-text-dark">Company Management Mode</p>
                                            <p className="text-[9px] font-bold text-text-light uppercase tracking-widest">Defines how companies and departments are handled</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={handleSingleModeClick}
                                                disabled={isSavingMode}
                                                className={`p-4 rounded-2xl shadow-md transition-all flex flex-col items-center gap-2 border-none ${
                                                    companyMode === 'Single' 
                                                    ? 'bg-sky-50 text-sky-700 shadow-lg' 
                                                    : 'bg-surface hover:bg-slate-50 text-text-light hover:text-text-dark hover:shadow-lg'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined">business</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Single Company</span>
                                            </button>
                                            
                                            <button
                                                onClick={() => handleUpdateMode('Multiple')}
                                                disabled={isSavingMode}
                                                className={`p-4 rounded-2xl shadow-md transition-all flex flex-col items-center gap-2 border-none ${
                                                    companyMode === 'Multiple' 
                                                    ? 'bg-sky-50 text-sky-700 shadow-lg' 
                                                    : 'bg-surface hover:bg-slate-50 text-text-light hover:text-text-dark hover:shadow-lg'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined">hub</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Group of Companies</span>
                                            </button>
                                        </div>

                                        {companyMode === 'None' && (
                                            <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">warning</span>
                                                Mode not selected. Initial setup required.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'company' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <CompanyTab />
                        </div>
                    ) : activeTab === 'devices' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DevicesTab ref={devicesRef} />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl space-y-8">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600">
                                    <span className="material-symbols-outlined text-lg">sync</span>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest leading-none">Синхронизация логов устройств</h3>
                                    <p className="text-xs text-text-muted mt-1">
                                        События проходов (ACS) с панелей Hikvision в учёт посещаемости. Время автозапуска — локальное время сервера.
                                    </p>
                                </div>
                            </div>

                            {logSyncLoading && !logSyncSettings ? (
                                <p className="text-sm text-text-light px-2">Загрузка…</p>
                            ) : (
                                <>
                                    <div className="bg-surface rounded-3xl shadow-md p-8 space-y-6 border-none">
                                        <p className="text-xs font-black text-text-dark">Ручная синхронизация</p>
                                        <p className="text-[11px] text-text-light">Выберите период (календарные даты, границы дня в локальной зоне сервера).</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-text-light uppercase tracking-widest">С даты</label>
                                                <input
                                                    type="date"
                                                    value={logSyncManualFrom}
                                                    onChange={(e) => setLogSyncManualFrom(e.target.value)}
                                                    className="w-full bg-slate-50 border border-border-light rounded-2xl px-4 py-3 text-sm font-bold text-text-dark"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-text-light uppercase tracking-widest">По дату</label>
                                                <input
                                                    type="date"
                                                    value={logSyncManualTo}
                                                    onChange={(e) => setLogSyncManualTo(e.target.value)}
                                                    className="w-full bg-slate-50 border border-border-light rounded-2xl px-4 py-3 text-sm font-bold text-text-dark"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            icon="sync"
                                            onClick={() => void runManualLogSync()}
                                            isLoading={logSyncManualRunning}
                                            disabled={!logSyncManualFrom || !logSyncManualTo}
                                        >
                                            Синхронизировать
                                        </Button>
                                    </div>

                                    <div className="bg-surface rounded-3xl shadow-md p-8 space-y-6 border-none">
                                        <p className="text-xs font-black text-text-dark">Автоматическая синхронизация</p>
                                        <p className="text-[11px] text-text-light">
                                            Каждый день в указанное время выполняется загрузка событий за последние 24 часа со всех устройств.
                                        </p>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={logSyncDraftAuto}
                                                onChange={(e) => setLogSyncDraftAuto(e.target.checked)}
                                                className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary/30"
                                            />
                                            <span className="text-sm font-bold text-text-dark">Включить ежедневный запуск</span>
                                        </label>
                                        <div className="space-y-2 max-w-xs">
                                            <label className="text-[10px] font-black text-text-light uppercase tracking-widest">Время (локально)</label>
                                            <input
                                                type="time"
                                                value={logSyncDraftTime}
                                                onChange={(e) => setLogSyncDraftTime(e.target.value)}
                                                className="w-full bg-slate-50 border border-border-light rounded-2xl px-4 py-3 text-sm font-bold text-text-dark"
                                            />
                                        </div>
                                        <Button type="button" icon="save" onClick={() => void saveLogSyncSchedule()} isLoading={logSyncSaving}>
                                            Сохранить расписание
                                        </Button>
                                    </div>

                                    {logSyncSettings && (
                                        <div className="rounded-2xl border border-border-light bg-slate-50/80 px-4 py-3 text-[11px] text-text-light">
                                            <p className="font-black text-text-dark text-[10px] uppercase tracking-widest mb-2">Последний запуск</p>
                                            {logSyncSettings.lastRunUtc ? (
                                                <>
                                                    <p>
                                                        {new Date(logSyncSettings.lastRunUtc).toLocaleString()} — записей:{' '}
                                                        {logSyncSettings.lastRecordsAdded ?? '—'}
                                                        {logSyncSettings.lastRunKind ? ` (${logSyncSettings.lastRunKind === 'auto' ? 'авто' : 'вручную'})` : ''}
                                                    </p>
                                                </>
                                            ) : (
                                                <p>Ещё не выполнялся</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showCompanyNameModal === 'Single' && (
                <Modal isOpen title="Company name" onClose={() => { setShowCompanyNameModal(null); setCompanyNameInput('') }}>
                    <div className="space-y-4">
                        <p className="text-xs text-text-light">Enter the company name. This is required for Single Company mode.</p>
                        <Input
                            placeholder="Company name"
                            value={companyNameInput}
                            onChange={(e) => setCompanyNameInput(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <Button fullWidth onClick={handleConfirmModeWithName} isLoading={isSavingMode} disabled={!companyNameInput.trim()}>
                                Save
                            </Button>
                            <Button fullWidth variant="outline" onClick={() => { setShowCompanyNameModal(null); setCompanyNameInput('') }} disabled={isSavingMode}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AppLayout>
    )
}
