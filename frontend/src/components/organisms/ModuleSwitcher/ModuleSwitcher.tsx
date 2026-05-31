import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useModule } from '../../../context/ModuleContext'
import { MODULE_LIST, type ModuleKey } from '../../../config/modules'

export function ModuleSwitcher() {
    const { isPickerOpen, closePicker, selectModule, activeModule } = useModule()
    const { t } = useTranslation()
    const navigate = useNavigate()

    // Switching module always lands on that module's dashboard, so the user is
    // never stranded on a page that the new module hides from the menu.
    const handleSelect = (key: ModuleKey) => {
        selectModule(key)
        navigate('/')
    }

    useEffect(() => {
        if (!isPickerOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closePicker()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isPickerOpen, closePicker])

    if (!isPickerOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-hidden">
            {/* ─── Full-screen blurred backdrop (click to dismiss) ─── */}
            <button
                type="button"
                aria-label={t('common.close')}
                onClick={closePicker}
                className="absolute inset-0 h-full w-full cursor-default bg-background-dark/40 backdrop-blur-2xl"
            />
            {/* decorative colour wash so the blur has something to chew on */}
            <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-violet-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-sky-500/30 blur-3xl" />

            {/* ─── Content ─── */}
            <div className="relative z-10 flex w-full max-w-6xl flex-col items-center px-6">
                <button
                    type="button"
                    onClick={closePicker}
                    aria-label={t('common.close')}
                    className="absolute right-4 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <header className="mb-10 text-center">
                    <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-sm sm:text-4xl">
                        {t('modules.pickerTitle')}
                    </h2>
                    <p className="mt-2 text-sm font-medium text-white/80">{t('modules.pickerSubtitle')}</p>
                </header>

                <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {MODULE_LIST.map((m) => {
                        const isActive = m.key === activeModule
                        return (
                            <button
                                key={m.key}
                                type="button"
                                onClick={() => handleSelect(m.key)}
                                className={`group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl text-left ring-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl focus:outline-none ${
                                    isActive ? 'ring-white shadow-2xl' : 'ring-white/10 hover:ring-white/40'
                                }`}
                            >
                                {/* module image */}
                                <img
                                    src={m.image}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {/* readability gradient */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />

                                {/* status badges */}
                                <div className="absolute left-3 top-3 flex gap-2">
                                    {isActive && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-text-dark shadow">
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            {t('modules.active')}
                                        </span>
                                    )}
                                    {!m.available && (
                                        <span className="inline-flex items-center rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur">
                                            {t('modules.soon')}
                                        </span>
                                    )}
                                </div>

                                {/* icon + name */}
                                <div className="relative z-10 p-5">
                                    <span className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${m.gradient} text-white shadow-lg`}>
                                        <span className="material-symbols-outlined">{m.icon}</span>
                                    </span>
                                    <p className="text-lg font-bold leading-tight text-white drop-shadow">{t(m.nameKey)}</p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
