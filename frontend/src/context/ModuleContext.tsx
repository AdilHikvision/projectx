import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_MODULE, MODULES, type ModuleKey } from '../config/modules'

const STORAGE_KEY = 'projectx.module'

interface ModuleContextValue {
    activeModule: ModuleKey
    isPickerOpen: boolean
    openPicker: () => void
    closePicker: () => void
    selectModule: (key: ModuleKey) => void
}

const ModuleContext = createContext<ModuleContextValue | undefined>(undefined)

export function ModuleProvider({ children }: { children: ReactNode }) {
    const [activeModule, setActiveModule] = useState<ModuleKey>(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored && stored in MODULES ? (stored as ModuleKey) : DEFAULT_MODULE
    })
    const [isPickerOpen, setPickerOpen] = useState(false)

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, activeModule)
    }, [activeModule])

    const openPicker = useCallback(() => setPickerOpen(true), [])
    const closePicker = useCallback(() => setPickerOpen(false), [])
    const selectModule = useCallback((key: ModuleKey) => {
        setActiveModule(key)
        setPickerOpen(false)
    }, [])

    return (
        <ModuleContext.Provider value={{ activeModule, isPickerOpen, openPicker, closePicker, selectModule }}>
            {children}
        </ModuleContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModule() {
    const ctx = useContext(ModuleContext)
    if (!ctx) {
        throw new Error('useModule must be used within ModuleProvider')
    }
    return ctx
}
