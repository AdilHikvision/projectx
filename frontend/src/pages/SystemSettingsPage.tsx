import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { AppLayout } from '../components/templates'
import { Button, Input } from '../components/atoms'
import { Modal, PageHeader } from '../components/organisms'
import { CompanyTab } from './CompanyTab'
import { DevicesTab } from './DevicesTab'
import { useAuth } from '../auth/AuthContext'
import { apiRequest, getApiBaseUrl } from '../lib/api'
import { useLoading } from '../context/LoadingContext'

function formatLocalDate(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function SystemSettingsPage() {
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const tabParam = queryParams.get('tab')
    const initialTab: 'global' | 'devices' | 'company' | 'logSync' | 'email' | 'templates' =
        tabParam === 'devices' ? 'devices' : tabParam === 'company' ? 'company' : tabParam === 'log-sync' ? 'logSync' : tabParam === 'email' ? 'email' : tabParam === 'templates' ? 'templates' : 'global'

    const [activeTab, setActiveTab] = useState<'global' | 'devices' | 'company' | 'logSync' | 'email' | 'templates'>(initialTab)
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
        else if (tab === 'email') setActiveTab('email')
        else if (tab === 'templates') setActiveTab('templates')
    }, [location.search])

    // ─── Localization & Runtime: time/timezone push to devices ───
    // POSIX-style strings as Hikvision ISAPI accepts (sign inverted relative to UTC).
    const TIMEZONE_OPTIONS: { label: string; posix: string }[] = [
        { label: '(UTC+04:00) Baku, Azerbaijan', posix: 'AZT-4:00:00' },
        { label: '(UTC+03:00) Istanbul, Moscow', posix: 'TRT-3:00:00' },
        { label: '(UTC+00:00) London, UTC', posix: 'GMT0:00:00' },
        { label: '(UTC+01:00) Berlin, Paris', posix: 'CET-1:00:00' },
        { label: '(UTC+02:00) Athens, Kyiv', posix: 'EET-2:00:00' },
        { label: '(UTC+05:00) Tashkent', posix: 'UZT-5:00:00' },
        { label: '(UTC+05:30) New Delhi', posix: 'IST-5:30:00' },
        { label: '(UTC+08:00) Beijing, Singapore', posix: 'CST-8:00:00' },
        { label: '(UTC+09:00) Tokyo', posix: 'JST-9:00:00' },
        { label: '(UTC-05:00) New York (EST)', posix: 'EST5:00:00' },
        { label: '(UTC-08:00) Los Angeles (PST)', posix: 'PST8:00:00' },
    ]
    const [selectedTimeZone, setSelectedTimeZone] = useState<string>(TIMEZONE_OPTIONS[0].posix)
    const [serverNow, setServerNow] = useState<Date>(new Date())
    const [timeSyncing, setTimeSyncing] = useState(false)
    type TimeSyncResult = { deviceId: string; deviceName: string; success: boolean; message: string | null }
    const [timeSyncResults, setTimeSyncResults] = useState<TimeSyncResult[] | null>(null)

    // Расписание автосинхронизации времени
    type TimeSchedule = {
        autoEnabled: boolean
        dailyTimeLocal: string
        timeZone: string | null
        lastRunUtc: string | null
        lastSuccessCount: number | null
        lastTotal: number | null
        lastRunKind: string | null
    }
    const [timeSchedule, setTimeSchedule] = useState<TimeSchedule | null>(null)
    const [timeScheduleDraftEnabled, setTimeScheduleDraftEnabled] = useState(false)
    const [timeScheduleDraftTime, setTimeScheduleDraftTime] = useState('03:00')
    const [timeScheduleSaving, setTimeScheduleSaving] = useState(false)

    useEffect(() => {
        const id = setInterval(() => setServerNow(new Date()), 1000)
        return () => clearInterval(id)
    }, [])

    const loadTimeSchedule = useCallback(async () => {
        if (!token) return
        try {
            const s = await apiRequest<TimeSchedule>('/api/devices/time/schedule', { token })
            setTimeSchedule(s)
            setTimeScheduleDraftEnabled(s.autoEnabled)
            setTimeScheduleDraftTime(s.dailyTimeLocal || '03:00')
            if (s.timeZone) setSelectedTimeZone(s.timeZone)
        } catch (e) {
            console.error('Failed to load time-sync schedule', e)
        }
    }, [token])

    useEffect(() => {
        if (!token || activeTab !== 'global') return
        void loadTimeSchedule()
    }, [token, activeTab, loadTimeSchedule])

    const saveTimeSchedule = async () => {
        if (!token) return
        setTimeScheduleSaving(true)
        try {
            await apiRequest('/api/devices/time/schedule', {
                method: 'POST',
                token,
                body: JSON.stringify({
                    autoEnabled: timeScheduleDraftEnabled,
                    dailyTimeLocal: timeScheduleDraftTime,
                    timeZone: selectedTimeZone,
                }),
            })
            await loadTimeSchedule()
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to save schedule')
        } finally {
            setTimeScheduleSaving(false)
        }
    }

    const syncTimeToAllDevices = async () => {
        if (!token) return
        setTimeSyncing(true)
        setTimeSyncResults(null)
        try {
            const res = await apiRequest<{ total: number; successCount: number; results: TimeSyncResult[] }>(
                '/api/devices/time/sync-all',
                { method: 'POST', token, body: JSON.stringify({ timeZone: selectedTimeZone }) },
            )
            setTimeSyncResults(res.results)
            await loadTimeSchedule()
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Time sync failed')
        } finally {
            setTimeSyncing(false)
        }
    }

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
            alert(e instanceof Error ? e.message : 'Failed to save')
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
            alert(`Records added: ${res.recordsAdded}. Devices processed: ${res.devicesProcessed}.${w}`)
            await loadLogSyncSettings()
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Sync failed')
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

    // ─── Vault ────────────────────────────────────────────────────────────────
    interface BackupFile { filename: string; sizeBytes: number; createdAt: string }

    const [backups, setBackups] = useState<BackupFile[]>([])
    const [backupsLoading, setBackupsLoading] = useState(false)
    const [backingUp, setBackingUp] = useState(false)
    const [backupError, setBackupError] = useState<string | null>(null)
    const [secondaryDb, setSecondaryDb] = useState('')
    const [secondaryDbSaving, setSecondaryDbSaving] = useState(false)
    const [secondaryDbTesting, setSecondaryDbTesting] = useState(false)
    const [secondaryDbTestResult, setSecondaryDbTestResult] = useState<{ success: boolean; message: string } | null>(null)

    const loadBackups = useCallback(async () => {
        if (!token) return
        setBackupsLoading(true)
        try {
            const data = await apiRequest<BackupFile[]>('/api/vault/backups', { token })
            setBackups(data)
        } catch { setBackups([]) } finally { setBackupsLoading(false) }
    }, [token])

    const loadSecondaryDb = useCallback(async () => {
        if (!token) return
        try {
            const data = await apiRequest<{ connectionString: string | null }>('/api/vault/secondary-db', { token })
            setSecondaryDb(data.connectionString ?? '')
        } catch { /* ignore */ }
    }, [token])

    useEffect(() => {
        if (!token || activeTab !== 'global') return
        void loadBackups()
        void loadSecondaryDb()
    }, [token, activeTab, loadBackups, loadSecondaryDb])

    const triggerBackup = async () => {
        if (!token) return
        setBackingUp(true)
        setBackupError(null)
        try {
            await apiRequest('/api/vault/backup', { method: 'POST', token })
            await loadBackups()
        } catch (e) {
            setBackupError(e instanceof Error ? e.message : 'Backup failed')
        } finally { setBackingUp(false) }
    }

    const deleteBackup = async (filename: string) => {
        if (!token) return
        await apiRequest(`/api/vault/backups/${encodeURIComponent(filename)}`, { method: 'DELETE', token })
        await loadBackups()
    }

    const downloadBackup = async (filename: string) => {
        if (!token) return
        const res = await fetch(`${getApiBaseUrl()}/api/vault/backups/${encodeURIComponent(filename)}/download`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = filename
        document.body.appendChild(a); a.click()
        document.body.removeChild(a); URL.revokeObjectURL(url)
    }

    const saveSecondaryDb = async () => {
        if (!token) return
        setSecondaryDbSaving(true)
        try {
            await apiRequest('/api/vault/secondary-db', { method: 'POST', token, body: JSON.stringify({ connectionString: secondaryDb }) })
        } finally { setSecondaryDbSaving(false) }
    }

    const testSecondaryDb = async () => {
        if (!token) return
        setSecondaryDbTesting(true)
        setSecondaryDbTestResult(null)
        try {
            const res = await apiRequest<{ success: boolean; message: string }>('/api/vault/secondary-db/test', {
                method: 'POST', token, body: JSON.stringify({ connectionString: secondaryDb })
            })
            setSecondaryDbTestResult(res)
        } catch (e) {
            setSecondaryDbTestResult({ success: false, message: e instanceof Error ? e.message : 'Test failed' })
        } finally { setSecondaryDbTesting(false) }
    }

    function fmtSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`
    }

    // ─── SMTP Settings ────────────────────────────────────────────────────────
    const [smtp, setSmtp] = useState({
        enabled: false,
        host: '',
        port: 587,
        username: '',
        password: '',
        fromAddress: '',
        fromName: '',
        enableSsl: true,
    })
    const [smtpLoading, setSmtpLoading] = useState(false)
    const [smtpSaving, setSmtpSaving] = useState(false)
    const [smtpTesting, setSmtpTesting] = useState(false)
    const [smtpTestResult, setSmtpTestResult] = useState<{ ok: boolean; message: string } | null>(null)

    const loadSmtp = useCallback(async () => {
        if (!token) return
        setSmtpLoading(true)
        try {
            const data = await apiRequest<typeof smtp>('/api/settings/smtp', { token })
            setSmtp(data)
        } catch { /* ignore */ } finally { setSmtpLoading(false) }
    }, [token])

    useEffect(() => {
        if (!token || activeTab !== 'email') return
        void loadSmtp()
    }, [token, activeTab, loadSmtp])

    const saveSmtp = async () => {
        if (!token) return
        setSmtpSaving(true)
        setSmtpTestResult(null)
        try {
            await apiRequest('/api/settings/smtp', { method: 'PUT', token, body: JSON.stringify(smtp) })
            alert('SMTP settings saved.')
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to save')
        } finally { setSmtpSaving(false) }
    }

    const testSmtp = async () => {
        if (!token) return
        setSmtpTesting(true)
        setSmtpTestResult(null)
        try {
            const res = await apiRequest<{ message: string }>('/api/settings/smtp/test', { method: 'POST', token })
            setSmtpTestResult({ ok: true, message: res.message })
        } catch (e) {
            setSmtpTestResult({ ok: false, message: e instanceof Error ? e.message : 'Test failed' })
        } finally { setSmtpTesting(false) }
    }

    // ─── Email Templates ──────────────────────────────────────────────────────
    interface EmailTemplate {
        key: string
        name: string
        description: string
        subject: string
        htmlBody: string
        variables: string[]
        isCustomized: boolean
    }

    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [tplLoading, setTplLoading] = useState(false)
    const [selectedTplKey, setSelectedTplKey] = useState<string | null>(null)
    const [tplDraft, setTplDraft] = useState<{ subject: string; htmlBody: string } | null>(null)
    const [tplSaving, setTplSaving] = useState(false)
    const [tplResetting, setTplResetting] = useState(false)
    const [tplPreviewHtml, setTplPreviewHtml] = useState<string | null>(null)
    const [tplPreviewLoading, setTplPreviewLoading] = useState(false)
    const [tplView, setTplView] = useState<'edit' | 'preview'>('edit')

    const loadTemplates = useCallback(async () => {
        if (!token) return
        setTplLoading(true)
        try {
            const data = await apiRequest<EmailTemplate[]>('/api/email-templates', { token })
            setTemplates(data)
            if (!selectedTplKey && data.length > 0) {
                setSelectedTplKey(data[0].key)
                setTplDraft({ subject: data[0].subject, htmlBody: data[0].htmlBody })
            }
        } catch { /* ignore */ } finally { setTplLoading(false) }
    }, [token, selectedTplKey])

    useEffect(() => {
        if (!token || activeTab !== 'templates') return
        void loadTemplates()
    }, [token, activeTab, loadTemplates])

    const selectTemplate = (t: EmailTemplate) => {
        setSelectedTplKey(t.key)
        setTplDraft({ subject: t.subject, htmlBody: t.htmlBody })
        setTplPreviewHtml(null)
        setTplView('edit')
    }

    const saveTpl = async () => {
        if (!token || !selectedTplKey || !tplDraft) return
        setTplSaving(true)
        try {
            const updated = await apiRequest<EmailTemplate>(`/api/email-templates/${selectedTplKey}`, {
                method: 'PUT', token,
                body: JSON.stringify({ subject: tplDraft.subject, htmlBody: tplDraft.htmlBody }),
            })
            setTemplates(ts => ts.map(t => t.key === selectedTplKey ? updated : t))
            setTplDraft({ subject: updated.subject, htmlBody: updated.htmlBody })
        } catch (e) { alert(e instanceof Error ? e.message : 'Save failed') }
        setTplSaving(false)
    }

    const resetTpl = async () => {
        if (!token || !selectedTplKey) return
        if (!confirm('Reset this template to the built-in default? Your custom version will be deleted.')) return
        setTplResetting(true)
        try {
            const updated = await apiRequest<EmailTemplate>(`/api/email-templates/${selectedTplKey}/reset`, {
                method: 'POST', token,
            })
            setTemplates(ts => ts.map(t => t.key === selectedTplKey ? updated : t))
            setTplDraft({ subject: updated.subject, htmlBody: updated.htmlBody })
            setTplPreviewHtml(null)
        } catch (e) { alert(e instanceof Error ? e.message : 'Reset failed') }
        setTplResetting(false)
    }

    const previewTpl = async () => {
        if (!token || !selectedTplKey || !tplDraft) return
        setTplPreviewLoading(true)
        try {
            const res = await apiRequest<{ subject: string; body: string }>(`/api/email-templates/${selectedTplKey}/preview`, {
                method: 'POST', token,
                body: JSON.stringify({ subject: tplDraft.subject, htmlBody: tplDraft.htmlBody }),
            })
            setTplPreviewHtml(res.body)
            setTplView('preview')
        } catch (e) { alert(e instanceof Error ? e.message : 'Preview failed') }
        setTplPreviewLoading(false)
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
                        <button
                            onClick={() => setActiveTab('email')}
                            className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'email' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-muted'
                                }`}
                        >
                            Email (SMTP)
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'templates' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-muted'
                                }`}
                        >
                            Email Templates
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

                                <div className="bg-surface rounded-3xl shadow-md p-8 space-y-6 border-none text-text-light">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            <label className="text-[10px] font-black text-text-light uppercase tracking-widest pl-1">Time Zone (push to devices)</label>
                                            <div className="relative">
                                                <select
                                                    value={selectedTimeZone}
                                                    onChange={(e) => setSelectedTimeZone(e.target.value)}
                                                    className="w-full bg-slate-50 border border-border-light rounded-2xl px-4 py-3.5 text-sm font-bold text-text-dark appearance-none focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer shadow-sm"
                                                >
                                                    {TIMEZONE_OPTIONS.map((tz) => (
                                                        <option key={tz.posix} value={tz.posix}>{tz.label}</option>
                                                    ))}
                                                </select>
                                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">schedule</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black text-text-light uppercase tracking-widest pl-1">Server time (UTC)</p>
                                            <p className="font-mono text-sm font-bold text-text-dark tabular-nums">
                                                {serverNow.toISOString().replace('T', ' ').slice(0, 19)}
                                            </p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black text-text-light uppercase tracking-widest pl-1">Server time (local)</p>
                                            <p className="font-mono text-sm font-bold text-text-dark tabular-nums">
                                                {serverNow.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            icon="sync"
                                            onClick={syncTimeToAllDevices}
                                            isLoading={timeSyncing}
                                            disabled={timeSyncing}
                                        >
                                            {timeSyncing ? 'Syncing…' : 'Sync time & timezone to all devices'}
                                        </Button>
                                        <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mt-2 pl-1">
                                            Sets manual mode on every Hikvision device using the selected timezone and current server UTC.
                                        </p>
                                    </div>

                                    {timeSyncResults && timeSyncResults.length > 0 && (
                                        <div className="rounded-2xl border border-border-light overflow-hidden">
                                            <div className="px-4 py-2 bg-slate-50 border-b border-border-light">
                                                <p className="text-[10px] font-black text-text-light uppercase tracking-widest">
                                                    Sync results — {timeSyncResults.filter(r => r.success).length} of {timeSyncResults.length} succeeded
                                                </p>
                                            </div>
                                            <ul className="divide-y divide-border-light max-h-56 overflow-y-auto">
                                                {timeSyncResults.map((r) => (
                                                    <li key={r.deviceId} className="flex items-start gap-3 px-4 py-2.5">
                                                        <span className={`material-symbols-outlined text-base shrink-0 mt-0.5 ${r.success ? 'text-green-600' : 'text-red-500'}`}>
                                                            {r.success ? 'check_circle' : 'error'}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-bold text-text-dark truncate">{r.deviceName}</p>
                                                            {!r.success && r.message && (
                                                                <p className="text-[11px] text-text-light truncate">{r.message}</p>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Daily auto-sync schedule */}
                                    <div className="border-t border-border-light pt-6 space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-text-dark">Daily auto-sync</p>
                                                <p className="text-[10px] font-bold text-text-light uppercase tracking-widest">
                                                    Pushes time & timezone every day at the chosen local time.
                                                </p>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={timeScheduleDraftEnabled}
                                                    onChange={(e) => setTimeScheduleDraftEnabled(e.target.checked)}
                                                    className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary/30"
                                                />
                                                <span className="text-xs font-black text-text-dark uppercase tracking-widest">
                                                    {timeScheduleDraftEnabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-text-light uppercase tracking-widest pl-1">Daily run time (server local)</label>
                                                <input
                                                    type="time"
                                                    value={timeScheduleDraftTime}
                                                    onChange={(e) => setTimeScheduleDraftTime(e.target.value)}
                                                    className="w-full bg-slate-50 border border-border-light rounded-2xl px-4 py-3 text-sm font-bold text-text-dark"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button
                                                    icon="save"
                                                    onClick={saveTimeSchedule}
                                                    isLoading={timeScheduleSaving}
                                                    disabled={timeScheduleSaving}
                                                    fullWidth
                                                >
                                                    {timeScheduleSaving ? 'Saving…' : 'Save schedule'}
                                                </Button>
                                            </div>
                                        </div>

                                        {timeSchedule?.lastRunUtc && (
                                            <div className="rounded-2xl bg-slate-50 px-4 py-3 flex items-center gap-3">
                                                <span className="material-symbols-outlined text-text-light">history</span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-black text-text-light uppercase tracking-widest">
                                                        Last {timeSchedule.lastRunKind ?? 'run'}
                                                    </p>
                                                    <p className="text-sm font-bold text-text-dark">
                                                        {new Date(timeSchedule.lastRunUtc).toLocaleString()}
                                                        {timeSchedule.lastTotal != null && (
                                                            <span className="ml-2 text-text-light">
                                                                — {timeSchedule.lastSuccessCount ?? 0}/{timeSchedule.lastTotal} devices
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Vault & Data Ops */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <span className="material-symbols-outlined text-lg">database</span>
                                    </div>
                                    <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest leading-none">Vault & Data Ops</h3>
                                </div>

                                <div className="bg-surface rounded-3xl shadow-md p-8 space-y-6 border-none">
                                    {/* Backup section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-black text-text-dark">Database Backup</p>
                                                <p className="text-[10px] font-bold text-text-light uppercase tracking-widest">pg_dump snapshot of the primary database</p>
                                            </div>
                                            <Button icon="backup" onClick={triggerBackup} isLoading={backingUp} disabled={backingUp} size="sm">
                                                Backup now
                                            </Button>
                                        </div>

                                        {backupError && (
                                            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 font-bold">
                                                {backupError}
                                            </div>
                                        )}

                                        <div className="rounded-2xl border border-border-light overflow-hidden">
                                            <div className="px-4 py-2.5 bg-slate-50 border-b border-border-light flex items-center justify-between">
                                                <p className="text-[10px] font-black text-text-light uppercase tracking-widest">
                                                    {backupsLoading ? 'Loading…' : `${backups.length} snapshot${backups.length === 1 ? '' : 's'}`}
                                                </p>
                                                <button type="button" onClick={loadBackups} className="text-text-muted hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-base">refresh</span>
                                                </button>
                                            </div>

                                            {backupsLoading ? (
                                                <div className="flex justify-center py-8">
                                                    <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
                                                </div>
                                            ) : backups.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-8 gap-2 text-text-light">
                                                    <span className="material-symbols-outlined text-3xl">cloud_off</span>
                                                    <p className="text-xs">No backups yet. Click "Backup now" to create one.</p>
                                                </div>
                                            ) : (
                                                <ul className="divide-y divide-border-light max-h-48 overflow-y-auto">
                                                    {backups.map(b => (
                                                        <li key={b.filename} className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-light transition-colors">
                                                            <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">archive</span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-text-dark truncate font-mono">{b.filename}</p>
                                                                <p className="text-[10px] text-text-muted">
                                                                    {fmtSize(b.sizeBytes)} · {new Date(b.createdAt).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <button type="button" onClick={() => downloadBackup(b.filename)} title="Download" className="text-text-muted hover:text-primary transition-colors shrink-0">
                                                                <span className="material-symbols-outlined text-base">download</span>
                                                            </button>
                                                            <button type="button" onClick={() => deleteBackup(b.filename)} title="Delete" className="text-text-muted hover:text-error-text transition-colors shrink-0">
                                                                <span className="material-symbols-outlined text-base">delete</span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    {/* Secondary DB */}
                                    <div className="border-t border-border-light pt-6 space-y-4">
                                        <div>
                                            <p className="text-xs font-black text-text-dark">Secondary / Backup Database</p>
                                            <p className="text-[10px] font-bold text-text-light uppercase tracking-widest">PostgreSQL connection string for replica or standby</p>
                                        </div>
                                        <Input
                                            placeholder="Host=host;Port=5432;Database=db;Username=user;Password=pass"
                                            value={secondaryDb}
                                            onChange={e => { setSecondaryDb(e.target.value); setSecondaryDbTestResult(null) }}
                                        />
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" icon="lan" onClick={testSecondaryDb} isLoading={secondaryDbTesting} disabled={!secondaryDb.trim() || secondaryDbTesting}>
                                                Test connection
                                            </Button>
                                            <Button size="sm" icon="save" onClick={saveSecondaryDb} isLoading={secondaryDbSaving} disabled={secondaryDbSaving}>
                                                Save
                                            </Button>
                                        </div>
                                        {secondaryDbTestResult && (
                                            <div className={`rounded-2xl px-4 py-3 text-xs font-bold flex items-center gap-2 ${secondaryDbTestResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                <span className="material-symbols-outlined text-base">{secondaryDbTestResult.success ? 'check_circle' : 'error'}</span>
                                                {secondaryDbTestResult.message}
                                            </div>
                                        )}
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
                    ) : activeTab === 'email' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl space-y-8">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
                                    <span className="material-symbols-outlined text-lg">mail</span>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest leading-none">SMTP Email Settings</h3>
                                    <p className="text-xs text-text-muted mt-1">Used for password reset emails, self-service credentials, and report delivery.</p>
                                </div>
                            </div>

                            {smtpLoading ? (
                                <p className="text-sm text-text-light px-2">Loading…</p>
                            ) : (
                                <div className="bg-surface rounded-3xl shadow-md p-8 space-y-6 border-none">
                                    {/* Enable toggle */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black text-text-dark">Enable SMTP</p>
                                            <p className="text-[9px] text-text-light uppercase tracking-widest mt-0.5">Send emails via your SMTP server</p>
                                        </div>
                                        <button
                                            onClick={() => setSmtp(s => ({ ...s, enabled: !s.enabled }))}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${smtp.enabled ? 'bg-primary' : 'bg-slate-200'}`}
                                        >
                                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${smtp.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-light uppercase tracking-widest">SMTP Host</label>
                                            <Input placeholder="smtp.gmail.com" value={smtp.host} onChange={e => setSmtp(s => ({ ...s, host: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-light uppercase tracking-widest">Port</label>
                                            <Input placeholder="587" value={String(smtp.port)} onChange={e => setSmtp(s => ({ ...s, port: parseInt(e.target.value) || 587 }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-light uppercase tracking-widest">Username</label>
                                            <Input placeholder="your@email.com" value={smtp.username} onChange={e => setSmtp(s => ({ ...s, username: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-light uppercase tracking-widest">Password</label>
                                            <Input type="password" placeholder="••••••••" value={smtp.password} onChange={e => setSmtp(s => ({ ...s, password: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-light uppercase tracking-widest">From Address</label>
                                            <Input placeholder="noreply@yourcompany.com" value={smtp.fromAddress} onChange={e => setSmtp(s => ({ ...s, fromAddress: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-light uppercase tracking-widest">From Name</label>
                                            <Input placeholder="ProjectX" value={smtp.fromName} onChange={e => setSmtp(s => ({ ...s, fromName: e.target.value }))} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSmtp(s => ({ ...s, enableSsl: !s.enableSsl }))}
                                            className={`relative w-10 h-5 rounded-full transition-colors ${smtp.enableSsl ? 'bg-primary' : 'bg-slate-200'}`}
                                        >
                                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${smtp.enableSsl ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className="text-xs font-bold text-text-dark">Enable SSL/TLS</span>
                                    </div>

                                    {smtpTestResult && (
                                        <div className={`rounded-2xl px-4 py-3 text-xs font-bold flex items-center gap-2 ${smtpTestResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                            <span className="material-symbols-outlined text-sm">{smtpTestResult.ok ? 'check_circle' : 'error'}</span>
                                            {smtpTestResult.message}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Button onClick={saveSmtp} isLoading={smtpSaving}>
                                            Save Settings
                                        </Button>
                                        <Button variant="outline" onClick={testSmtp} isLoading={smtpTesting}>
                                            Send Test Email
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'templates' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-3 px-2 mb-6">
                                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600">
                                    <span className="material-symbols-outlined text-lg">edit_note</span>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest leading-none">Email Templates</h3>
                                    <p className="text-xs text-text-muted mt-1">Customize the HTML body and subject for every outgoing email. Use <code className="bg-slate-100 px-1 rounded text-[11px] font-mono">{'{{variable}}'}</code> placeholders — they are replaced with real data at send time.</p>
                                </div>
                            </div>

                            {tplLoading ? (
                                <p className="text-sm text-text-light px-2">Loading…</p>
                            ) : (
                                <div className="flex gap-6" style={{ minHeight: '600px' }}>
                                    {/* ── Left sidebar: template list ── */}
                                    <div className="w-56 shrink-0 space-y-1">
                                        {templates.map(t => (
                                            <button
                                                key={t.key}
                                                onClick={() => selectTemplate(t)}
                                                className={`w-full text-left px-4 py-3 rounded-2xl transition-all ${selectedTplKey === t.key ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 text-text-dark'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-base">
                                                        {t.key === 'password_reset' ? 'lock_reset' : t.key === 'selfservice_created' ? 'person_add' : t.key === 'attendance_report' ? 'calendar_month' : 'payments'}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-black uppercase tracking-wide truncate">{t.name}</p>
                                                        {t.isCustomized && <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Customized</span>}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* ── Right: editor panel ── */}
                                    {tplDraft && selectedTplKey && (() => {
                                        const tpl = templates.find(t => t.key === selectedTplKey)
                                        if (!tpl) return null
                                        return (
                                            <div className="flex-1 min-w-0 space-y-4">
                                                {/* Description */}
                                                <p className="text-xs text-text-muted">{tpl.description}</p>

                                                {/* Variable chips */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {tpl.variables.map(v => (
                                                        <button
                                                            key={v}
                                                            title="Click to copy"
                                                            onClick={() => navigator.clipboard.writeText(v)}
                                                            className="font-mono text-[10px] px-2 py-0.5 bg-violet-50 text-violet-700 rounded-lg border border-violet-200 hover:bg-violet-100 transition-colors cursor-copy"
                                                        >
                                                            {v}
                                                        </button>
                                                    ))}
                                                    <span className="text-[10px] text-text-muted self-center ml-1">click to copy</span>
                                                </div>

                                                {/* Subject */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-text-light uppercase tracking-widest">Subject</label>
                                                    <Input
                                                        value={tplDraft.subject}
                                                        onChange={e => setTplDraft(d => d ? { ...d, subject: e.target.value } : d)}
                                                        placeholder="Email subject…"
                                                    />
                                                </div>

                                                {/* Edit / Preview toggle */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
                                                        <button
                                                            onClick={() => setTplView('edit')}
                                                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tplView === 'edit' ? 'bg-white shadow-sm text-text-dark' : 'text-text-light hover:text-text-dark'}`}
                                                        >
                                                            HTML Editor
                                                        </button>
                                                        <button
                                                            onClick={previewTpl}
                                                            disabled={tplPreviewLoading}
                                                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${tplView === 'preview' ? 'bg-white shadow-sm text-text-dark' : 'text-text-light hover:text-text-dark'}`}
                                                        >
                                                            {tplPreviewLoading && <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>}
                                                            Preview
                                                        </button>
                                                    </div>
                                                    <span className="text-[9px] text-text-muted uppercase tracking-widest">Sample data is used in preview</span>
                                                </div>

                                                {/* Editor area */}
                                                {tplView === 'edit' ? (
                                                    <textarea
                                                        value={tplDraft.htmlBody}
                                                        onChange={e => setTplDraft(d => d ? { ...d, htmlBody: e.target.value } : d)}
                                                        spellCheck={false}
                                                        className="w-full font-mono text-[12px] leading-relaxed bg-slate-950 text-green-300 rounded-2xl p-5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 border-none"
                                                        style={{ minHeight: '420px', tabSize: 2 }}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Tab') {
                                                                e.preventDefault()
                                                                const el = e.currentTarget
                                                                const start = el.selectionStart
                                                                const end = el.selectionEnd
                                                                const val = el.value
                                                                el.value = val.substring(0, start) + '  ' + val.substring(end)
                                                                el.selectionStart = el.selectionEnd = start + 2
                                                                setTplDraft(d => d ? { ...d, htmlBody: el.value } : d)
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="rounded-2xl border border-border-light overflow-hidden bg-white" style={{ minHeight: '420px' }}>
                                                        {tplPreviewHtml ? (
                                                            <iframe
                                                                srcDoc={tplPreviewHtml}
                                                                title="Email preview"
                                                                className="w-full border-none"
                                                                style={{ minHeight: '420px' }}
                                                                sandbox="allow-same-origin"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-64 text-text-muted text-sm">
                                                                Click Preview to render with sample data
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-3">
                                                    <Button onClick={saveTpl} isLoading={tplSaving}>
                                                        Save Template
                                                    </Button>
                                                    {tpl.isCustomized && (
                                                        <Button variant="outline" onClick={resetTpl} isLoading={tplResetting}>
                                                            Reset to Default
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl space-y-8">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600">
                                    <span className="material-symbols-outlined text-lg">sync</span>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-text-light uppercase tracking-widest leading-none">Device log synchronization</h3>
                                    <p className="text-xs text-text-muted mt-1">
                                        Pulls Hikvision ACS access events into attendance records. Auto-run time is in the server's local timezone.
                                    </p>
                                </div>
                            </div>

                            {logSyncLoading && !logSyncSettings ? (
                                <p className="text-sm text-text-light px-2">Loading…</p>
                            ) : (
                                <>
                                    <div className="bg-surface rounded-3xl shadow-md p-8 space-y-6 border-none">
                                        <p className="text-xs font-black text-text-dark">Manual sync</p>
                                        <p className="text-[11px] text-text-light">Select a date range (calendar dates; day boundaries in the server's local timezone).</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-text-light uppercase tracking-widest">From</label>
                                                <input
                                                    type="date"
                                                    value={logSyncManualFrom}
                                                    onChange={(e) => setLogSyncManualFrom(e.target.value)}
                                                    className="w-full bg-slate-50 border border-border-light rounded-2xl px-4 py-3 text-sm font-bold text-text-dark"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-text-light uppercase tracking-widest">To</label>
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
                                            Sync now
                                        </Button>
                                    </div>

                                    <div className="bg-surface rounded-3xl shadow-md p-8 space-y-6 border-none">
                                        <p className="text-xs font-black text-text-dark">Automatic sync</p>
                                        <p className="text-[11px] text-text-light">
                                            Each day at the configured time the system pulls the last 24 hours of events from all devices.
                                        </p>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={logSyncDraftAuto}
                                                onChange={(e) => setLogSyncDraftAuto(e.target.checked)}
                                                className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary/30"
                                            />
                                            <span className="text-sm font-bold text-text-dark">Enable daily run</span>
                                        </label>
                                        <div className="space-y-2 max-w-xs">
                                            <label className="text-[10px] font-black text-text-light uppercase tracking-widest">Time (local)</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="HH:MM"
                                                maxLength={5}
                                                value={logSyncDraftTime}
                                                onChange={(e) => {
                                                  const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                                                  setLogSyncDraftTime(digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`)
                                                }}
                                                className="w-full bg-slate-50 border border-border-light rounded-2xl px-4 py-3 text-sm font-bold font-mono text-text-dark"
                                            />
                                        </div>
                                        <Button type="button" icon="save" onClick={() => void saveLogSyncSchedule()} isLoading={logSyncSaving}>
                                            Save schedule
                                        </Button>
                                    </div>

                                    {logSyncSettings && (
                                        <div className="rounded-2xl border border-border-light bg-slate-50/80 px-4 py-3 text-[11px] text-text-light">
                                            <p className="font-black text-text-dark text-[10px] uppercase tracking-widest mb-2">Last run</p>
                                            {logSyncSettings.lastRunUtc ? (
                                                <>
                                                    <p>
                                                        {new Date(logSyncSettings.lastRunUtc).toLocaleString('en-GB', { hour12: false })} — records added:{' '}
                                                        {logSyncSettings.lastRecordsAdded ?? '—'}
                                                        {logSyncSettings.lastRunKind ? ` (${logSyncSettings.lastRunKind === 'auto' ? 'auto' : 'manual'})` : ''}
                                                    </p>
                                                </>
                                            ) : (
                                                <p>Never run</p>
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
