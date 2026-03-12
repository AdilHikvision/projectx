import { useEffect, useRef, useState } from 'react'
import { Button, Input, Avatar } from './ui'
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
            <header className="hidden md:flex items-center justify-between px-8 py-3 bg-surface border-b border-border-light sticky top-0 z-20 shrink-0 min-h-[64px]">
                {/* Left side: Breadcrumb / Title */}
                <div className="flex items-center gap-3 text-sm">
                    {breadcrumb ? (
                        <div className="flex items-center gap-2">
                            <span className="text-text-light hover:text-text-muted transition-colors cursor-pointer">{breadcrumb}</span>
                            <span className="material-symbols-outlined text-xs text-text-light">chevron_right</span>
                            <span className="text-text-dark font-bold">{title}</span>
                        </div>
                    ) : (
                        <span className="text-xl font-bold text-text-dark">{title}</span>
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
                        <Button variant="outline" size="icon" className="rounded-full bg-slate-75">
                            <span className="material-symbols-outlined text-xl">notifications</span>
                        </Button>
                        <div className="relative" ref={ref}>
                            <button
                                type="button"
                                onClick={() => setOpen((v) => !v)}
                                className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
                            >
                                <Avatar initials={initials} className="cursor-pointer hover:opacity-90 transition-opacity" />
                            </button>
                            {open && (
                                <div className="absolute right-0 top-full mt-2 py-2 w-48 bg-surface rounded-xl shadow-lg border border-border-base z-50">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm font-semibold text-text-dark hover:bg-slate-75 transition-colors"
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
            <header className="md:hidden flex items-center justify-between px-6 py-4 bg-surface border-b border-border-light sticky top-0 z-20 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-text-light tracking-widest uppercase">
                    <span className="material-symbols-outlined text-text-dark text-xl cursor-pointer mr-2">menu</span>
                    <span>{breadcrumb || 'NETWORK'}</span>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-text-dark">{title}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-text-light">notifications</span>
                    <div className="relative" ref={ref}>
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
                        >
                            <Avatar size="sm" initials={initials} className="cursor-pointer" />
                        </button>
                        {open && (
                            <div className="absolute right-0 top-full mt-2 py-2 w-48 bg-surface rounded-xl shadow-lg border border-border-base z-50">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm font-semibold text-text-dark hover:bg-slate-75 transition-colors"
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
