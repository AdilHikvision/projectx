import { useEffect, useRef, useState } from 'react'
import { Input, Avatar } from './ui'
import { useAuth } from '../auth/AuthContext'

interface TopBarProps {
    title: string
    breadcrumb?: string
    searchPlaceholder?: string
}

function getInitials(email: string | null | undefined): string {
    if (!email) return '?'
    const part = email.split('@')[0]
    if (!part) return '?'
    const first = part[0]?.toUpperCase() ?? '?'
    const second = part[1]?.toUpperCase()
    return second ? `${first}${second}` : first
}

export function TopBar({ title, breadcrumb, searchPlaceholder }: TopBarProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const { user, logout } = useAuth()
    const initials = getInitials(user?.email)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open])

    const handleLogout = () => {
        setOpen(false)
        logout()
        window.location.href = '/login'
    }

    return (
        <>
            <header className="hidden md:flex items-center justify-between px-8 py-3 bg-white/85 backdrop-blur-xl border-b border-border-light sticky top-0 z-20 shrink-0 min-h-[64px]">
                {/* Left side: Breadcrumb / Title */}
                <div className="flex items-center gap-3 text-sm">
                    {breadcrumb ? (
                        <div className="flex items-center gap-2">
                            <span className="text-text-light font-medium hover:text-primary transition-colors cursor-pointer">{breadcrumb}</span>
                            <span className="material-symbols-outlined text-sm text-text-light/70">chevron_right</span>
                            <span className="text-text-dark font-bold tracking-tight">{title}</span>
                        </div>
                    ) : (
                        <span className="text-xl font-bold tracking-tight text-text-dark">{title}</span>
                    )}
                </div>

                {/* Right-aligned group: Search, Action, Bell, Avatar */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                    <Input
                        icon="search"
                        placeholder={searchPlaceholder || 'Search...'}
                        containerClassName="w-full max-w-[300px]"
                    />

                    <div className="flex items-center gap-2">
                        <button type="button" className="w-9 h-9 rounded-full border border-border-base bg-white hover:border-primary/35 hover:bg-primary/4 transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl text-text-base">notifications</span>
                        </button>
                        <div className="relative" ref={ref}>
                            <button
                                type="button"
                                onClick={() => setOpen((v) => !v)}
                                className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
                            >
                                <Avatar initials={initials} className="cursor-pointer hover:opacity-90 transition-opacity" />
                            </button>
                            {open && (
                                <div className="animate-pop absolute right-0 top-full mt-2 p-1.5 w-48 bg-white rounded-2xl shadow-float border border-border-light z-50">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-text-dark hover:bg-slate-75 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">logout</span>
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Top Bar */}
            <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white/85 backdrop-blur-xl border-b border-border-light sticky top-0 z-20 shrink-0">
                <div className="flex items-center gap-2 text-[10px] font-extrabold text-text-light tracking-[0.14em] uppercase">
                    <span className="material-symbols-outlined text-text-dark text-xl cursor-pointer mr-2">menu</span>
                    <span>{breadcrumb || 'NETWORK'}</span>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-text-dark">{title}</span>
                </div>
                <div className="flex items-center gap-4">
                    <button type="button" className="w-9 h-9 rounded-full border border-border-base bg-white hover:border-primary/35 hover:bg-primary/4 transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl text-text-base">notifications</span>
                    </button>
                    <div className="relative" ref={ref}>
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
                        >
                            <Avatar size="sm" initials={initials} className="cursor-pointer" />
                        </button>
                        {open && (
                            <div className="animate-pop absolute right-0 top-full mt-2 p-1.5 w-48 bg-white rounded-2xl shadow-float border border-border-light z-50">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-text-dark hover:bg-slate-75 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    Log Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    )
}
