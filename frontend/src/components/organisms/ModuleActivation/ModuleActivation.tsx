import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../auth/AuthContext'
import { useModule } from '../../../context/ModuleContext'
import { MODULE_LIST, type ModuleKey } from '../../../config/modules'
import { apiRequest } from '../../../lib/api'

type ParkingMode = 'Free' | 'Paid'

/* ═══ Служебное меню активации модулей. Открывается только сочетанием
   Ctrl + Shift + Backspace + 1 — в интерфейсе на него нет ни одной кнопки.
   Набор включённых модулей хранится в системных настройках (EnabledModules),
   то есть действует на всю установку, а не на конкретный браузер. ═══ */

export function ModuleActivation() {
    const { t } = useTranslation()
    const { token } = useAuth()
    const { isActivationOpen, closeActivation, enabledModules, saveEnabledModules, applyParkingMode } = useModule()

    const [selected, setSelected] = useState<ModuleKey[]>(enabledModules)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)
    /** Режим парковки — такое же решение уровня установки, как и набор модулей. */
    const [parkingMode, setParkingMode] = useState<ParkingMode>('Free')
    const [savedParkingMode, setSavedParkingMode] = useState<ParkingMode>('Free')

    // При каждом открытии показываем актуальное состояние, а не остатки прошлого сеанса.
    useEffect(() => {
        if (!isActivationOpen) return
        setSelected(enabledModules)
        setError(null)
        setSaved(false)
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeActivation() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isActivationOpen, enabledModules, closeActivation])

    // Текущий режим парковки читаем при открытии; ключа может не быть — тогда бесплатный.
    useEffect(() => {
        if (!isActivationOpen || !token) return
        apiRequest<{ key: string; value: string }>('/api/system-settings/parking.mode', { token })
            .then((r) => {
                const mode: ParkingMode = r?.value === 'Paid' ? 'Paid' : 'Free'
                setParkingMode(mode)
                setSavedParkingMode(mode)
            })
            .catch(() => { setParkingMode('Free'); setSavedParkingMode('Free') })
    }, [isActivationOpen, token])

    if (!isActivationOpen) return null

    const toggle = (key: ModuleKey) => {
        setSaved(false)
        setSelected((prev) => {
            if (!prev.includes(key)) return [...prev, key]
            // Полностью выключить всё нельзя — приложению нужен хотя бы один модуль.
            if (prev.length === 1) {
                setError(t('moduleActivation.atLeastOne'))
                return prev
            }
            setError(null)
            return prev.filter((k) => k !== key)
        })
    }

    const save = async () => {
        setSaving(true); setError(null)
        try {
            await saveEnabledModules(selected)
            // Режим парковки пишем только если он реально менялся и модуль включён.
            if (parkingMode !== savedParkingMode && selected.includes('parking')) {
                await apiRequest('/api/system-settings', {
                    method: 'POST', token,
                    body: JSON.stringify({ key: 'parking.mode', value: parkingMode }),
                })
                setSavedParkingMode(parkingMode)
                // Сразу применяем в интерфейсе: пункты «Касса» и «Тарифы» появятся без перезагрузки.
                applyParkingMode(parkingMode)
            }
            setSaved(true)
        } catch (e) {
            setError(e instanceof Error ? e.message : t('moduleActivation.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    const dirty =
        selected.length !== enabledModules.length ||
        selected.some((k) => !enabledModules.includes(k)) ||
        (selected.includes('parking') && parkingMode !== savedParkingMode)

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0B0A12]/80 backdrop-blur-md" onClick={closeActivation} aria-hidden />

            <div
                role="dialog"
                aria-modal="true"
                className="relative w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#15131F] text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] animate-pop"
            >
                {/* Шапка «служебного» вида, чтобы окно нельзя было спутать с обычными настройками */}
                <div className="relative px-7 pt-7 pb-5 border-b border-white/10">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-600/25 blur-3xl" />
                    <div className="relative flex items-start gap-3.5">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30">
                            <span className="material-symbols-outlined text-[22px]">shield_lock</span>
                        </span>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-[17px] font-bold tracking-[-0.3px]">{t('moduleActivation.title')}</h2>
                            <p className="mt-1 text-[12px] leading-relaxed text-white/55">{t('moduleActivation.subtitle')}</p>
                        </div>
                        <button
                            type="button"
                            onClick={closeActivation}
                            aria-label={t('common.close')}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                    <code className="relative mt-4 inline-flex items-center gap-1.5 rounded-lg bg-black/40 px-2.5 py-1 text-[10.5px] font-semibold tracking-wider text-white/45 ring-1 ring-white/10">
                        <span className="material-symbols-outlined text-[13px]">keyboard</span>
                        Ctrl + Shift + Backspace + 1
                    </code>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-7 py-5">
                    {!token && (
                        <p className="mb-4 rounded-xl bg-amber-500/10 px-4 py-3 text-[12px] text-amber-200 ring-1 ring-amber-400/20">
                            {t('moduleActivation.authRequired')}
                        </p>
                    )}

                    <ul className="flex flex-col gap-2">
                        {MODULE_LIST.map((m) => {
                            const on = selected.includes(m.key)
                            return (
                                <li key={m.key}>
                                    <button
                                        type="button"
                                        onClick={() => toggle(m.key)}
                                        className={`flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all ${
                                            on
                                                ? 'border-violet-400/40 bg-violet-500/10'
                                                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                                        }`}
                                    >
                                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-linear-to-br ${m.gradient} text-white ${on ? '' : 'opacity-40 grayscale'}`}>
                                            <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className={`block text-[13.5px] font-semibold ${on ? 'text-white' : 'text-white/55'}`}>
                                                {t(m.nameKey)}
                                            </span>
                                            <span className="block text-[11px] text-white/40">
                                                {m.available ? t('moduleActivation.ready') : t('modules.soon')}
                                            </span>
                                        </span>
                                        {/* Переключатель */}
                                        <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-violet-500' : 'bg-white/15'}`}>
                                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
                                        </span>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>

                    {/* Режим парковки: определяет, берутся ли деньги, поэтому живёт здесь,
                        рядом с активацией модулей, а не в обычных настройках. */}
                    {selected.includes('parking') && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[18px] text-violet-300">
                                    {parkingMode === 'Paid' ? 'paid' : 'money_off'}
                                </span>
                                <span className="text-[13px] font-semibold">{t('moduleActivation.parkingMode')}</span>
                            </div>
                            <div className="mt-3 flex gap-1 rounded-xl bg-black/25 p-1">
                                {(['Free', 'Paid'] as const).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => { setSaved(false); setParkingMode(m) }}
                                        className={`flex-1 rounded-lg py-2 text-[12px] font-semibold transition-colors ${
                                            parkingMode === m ? 'bg-violet-500 text-white' : 'text-white/55 hover:text-white'
                                        }`}
                                    >
                                        {t(`moduleActivation.parking${m}`)}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2.5 text-[11px] leading-relaxed text-white/45">
                                {t(parkingMode === 'Paid' ? 'moduleActivation.parkingPaidHint' : 'moduleActivation.parkingFreeHint')}
                            </p>
                        </div>
                    )}

                    <p className="mt-4 flex items-start gap-2 rounded-xl bg-white/[0.04] px-3.5 py-3 text-[11px] leading-relaxed text-white/50">
                        <span className="material-symbols-outlined text-[15px] text-violet-300">info</span>
                        {t('moduleActivation.singleModuleNote')}
                    </p>

                    {error && (
                        <p className="mt-3 rounded-xl bg-red-500/10 px-3.5 py-3 text-[11.5px] text-red-300 ring-1 ring-red-400/20">{error}</p>
                    )}
                    {saved && !dirty && (
                        <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3.5 py-3 text-[11.5px] text-emerald-300 ring-1 ring-emerald-400/20">
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            {t('moduleActivation.saved')}
                        </p>
                    )}
                </div>

                <div className="flex gap-2 border-t border-white/10 px-7 py-5">
                    <button
                        type="button"
                        onClick={save}
                        disabled={saving || !dirty || !token}
                        className="h-11 flex-1 rounded-xl bg-violet-500 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                        {saving ? t('common.saving') : t('common.save')}
                    </button>
                    <button
                        type="button"
                        onClick={closeActivation}
                        className="h-11 flex-1 rounded-xl bg-white/10 text-[12.5px] font-semibold text-white/80 transition-colors hover:bg-white/15"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    )
}
