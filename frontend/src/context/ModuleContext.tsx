import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_MODULE, MODULE_LIST, MODULES, type ModuleKey } from '../config/modules'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../lib/api'

const STORAGE_KEY = 'projectx.module'
/** Локальный кэш включённых модулей: чтобы до ответа сервера не мигал переключатель. */
const ENABLED_CACHE_KEY = 'projectx.modules.enabled'
/** Ключ в /api/system-settings — набор активных модулей на всю установку. */
const ENABLED_SETTING_KEY = 'EnabledModules'
/** Режим парковки держим здесь, а не в сайдбаре: сайдбар пересоздаётся на каждой
 *  странице, и пункты «Касса»/«Тарифы» мигали бы при каждом переходе. */
const PARKING_MODE_CACHE_KEY = 'projectx.parking.mode'

const ALL_KEYS = MODULE_LIST.map((m) => m.key)

function parseKeys(raw: string | null | undefined): ModuleKey[] {
    if (!raw) return []
    const keys = raw.split(',').map((s) => s.trim()).filter((s): s is ModuleKey => s in MODULES)
    return ALL_KEYS.filter((k) => keys.includes(k)) // порядок каталога + без дублей
}

interface ModuleContextValue {
    activeModule: ModuleKey
    /** Активированные модули установки. Пустым не бывает. */
    enabledModules: ModuleKey[]
    /** Переключение показываем, только когда включено больше одного модуля. */
    canSwitchModules: boolean
    isPickerOpen: boolean
    openPicker: () => void
    closePicker: () => void
    selectModule: (key: ModuleKey) => void
    /** Платный режим парковки: от него зависят пункты «Касса» и «Тарифы». */
    parkingPaid: boolean
    /** Применить режим парковки локально (после сохранения в служебном окне). */
    applyParkingMode: (mode: 'Free' | 'Paid') => void
    /** Служебное окно активации (Ctrl+Shift+Backspace+1). */
    isActivationOpen: boolean
    openActivation: () => void
    closeActivation: () => void
    saveEnabledModules: (keys: ModuleKey[]) => Promise<void>
}

const ModuleContext = createContext<ModuleContextValue | undefined>(undefined)

export function ModuleProvider({ children }: { children: ReactNode }) {
    const { token } = useAuth()

    const [activeModule, setActiveModule] = useState<ModuleKey>(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored && stored in MODULES ? (stored as ModuleKey) : DEFAULT_MODULE
    })
    const [enabledModules, setEnabledModules] = useState<ModuleKey[]>(() => {
        const cached = parseKeys(localStorage.getItem(ENABLED_CACHE_KEY))
        return cached.length > 0 ? cached : ALL_KEYS
    })
    const [parkingPaid, setParkingPaid] = useState<boolean>(
        () => localStorage.getItem(PARKING_MODE_CACHE_KEY) === 'Paid',
    )
    const [isPickerOpen, setPickerOpen] = useState(false)
    const [isActivationOpen, setActivationOpen] = useState(false)

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, activeModule)
    }, [activeModule])

    // Набор модулей — настройка установки, а не браузера: тянем с сервера.
    useEffect(() => {
        if (!token) return
        let cancelled = false
        apiRequest<{ key: string; value: string }>(`/api/system-settings/${ENABLED_SETTING_KEY}`, { token })
            .then((s) => {
                if (cancelled) return
                const keys = parseKeys(s.value)
                const next = keys.length > 0 ? keys : ALL_KEYS
                setEnabledModules(next)
                localStorage.setItem(ENABLED_CACHE_KEY, next.join(','))
            })
            .catch(() => { /* ключа ещё нет — значит включено всё */ })
        return () => { cancelled = true }
    }, [token])

    // Режим парковки читаем один раз на сессию — сайдбар берёт его отсюда.
    useEffect(() => {
        if (!token) return
        let cancelled = false
        apiRequest<{ key: string; value: string }>('/api/system-settings/parking.mode', { token })
            .then((r) => {
                if (cancelled) return
                const paid = r?.value === 'Paid'
                setParkingPaid(paid)
                localStorage.setItem(PARKING_MODE_CACHE_KEY, paid ? 'Paid' : 'Free')
            })
            .catch(() => { /* ключа ещё нет — остаётся бесплатный режим */ })
        return () => { cancelled = true }
    }, [token])

    // Активный модуль всегда должен оставаться среди включённых.
    useEffect(() => {
        if (enabledModules.length > 0 && !enabledModules.includes(activeModule)) {
            setActiveModule(enabledModules[0])
        }
    }, [enabledModules, activeModule])

    // ─── Секретная комбинация: Ctrl + Shift + Backspace + 1 (все четыре одновременно) ───
    useEffect(() => {
        const down = new Set<string>()
        const onKeyDown = (e: KeyboardEvent) => {
            down.add(e.code)
            const hasOne = down.has('Digit1') || down.has('Numpad1')
            if (e.ctrlKey && e.shiftKey && down.has('Backspace') && hasOne) {
                e.preventDefault()
                down.clear()
                setActivationOpen(true)
            }
        }
        const onKeyUp = (e: KeyboardEvent) => down.delete(e.code)
        const onBlur = () => down.clear()
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        window.addEventListener('blur', onBlur)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
            window.removeEventListener('blur', onBlur)
        }
    }, [])

    const openPicker = useCallback(() => setPickerOpen(true), [])
    const closePicker = useCallback(() => setPickerOpen(false), [])
    const openActivation = useCallback(() => setActivationOpen(true), [])
    const closeActivation = useCallback(() => setActivationOpen(false), [])
    const selectModule = useCallback((key: ModuleKey) => {
        setActiveModule(key)
        setPickerOpen(false)
    }, [])
    const applyParkingMode = useCallback((mode: 'Free' | 'Paid') => {
        setParkingPaid(mode === 'Paid')
        localStorage.setItem(PARKING_MODE_CACHE_KEY, mode)
    }, [])

    const saveEnabledModules = useCallback(async (keys: ModuleKey[]) => {
        const next = ALL_KEYS.filter((k) => keys.includes(k))
        if (next.length === 0) throw new Error('at least one module required')
        await apiRequest('/api/system-settings', {
            method: 'POST',
            token,
            body: JSON.stringify({ key: ENABLED_SETTING_KEY, value: next.join(',') }),
        })
        setEnabledModules(next)
        localStorage.setItem(ENABLED_CACHE_KEY, next.join(','))
    }, [token])

    const value = useMemo<ModuleContextValue>(() => ({
        activeModule,
        enabledModules,
        canSwitchModules: enabledModules.length > 1,
        isPickerOpen,
        openPicker,
        closePicker,
        selectModule,
        parkingPaid,
        applyParkingMode,
        isActivationOpen,
        openActivation,
        closeActivation,
        saveEnabledModules,
    }), [
        activeModule, enabledModules, isPickerOpen, openPicker, closePicker, selectModule,
        parkingPaid, applyParkingMode,
        isActivationOpen, openActivation, closeActivation, saveEnabledModules,
    ])

    return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModule() {
    const ctx = useContext(ModuleContext)
    if (!ctx) {
        throw new Error('useModule must be used within ModuleProvider')
    }
    return ctx
}
