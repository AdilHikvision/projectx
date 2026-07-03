interface Tab {
    value: string;
    label: string;
}

interface TabBarProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (value: string) => void;
    variant?: 'underline' | 'pill';
    className?: string;
}

export function TabBar({
    tabs,
    activeTab,
    onTabChange,
    variant = 'underline',
    className = '',
}: TabBarProps) {
    if (variant === 'pill') {
        return (
            <div className={`inline-flex flex-wrap gap-1 rounded-xl bg-slate-75 p-1 ${className}`}>
                {tabs.map((t) => (
                    <button
                        key={t.value}
                        type="button"
                        onClick={() => onTabChange(t.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === t.value
                                ? 'bg-white text-primary-dark shadow-card'
                                : 'text-text-muted hover:text-text-dark'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className={`flex border-b border-border-light overflow-x-auto no-scrollbar gap-8 ${className}`}>
            {tabs.map((t) => (
                <button
                    key={t.value}
                    type="button"
                    onClick={() => onTabChange(t.value)}
                    className={`relative pb-2.5 text-xs font-bold whitespace-nowrap uppercase tracking-widest transition-colors ${activeTab === t.value
                            ? 'text-primary-dark'
                            : 'text-text-muted hover:text-text-dark'
                        }`}
                >
                    {t.label}
                    <span
                        className={`absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-brand-gradient transition-all duration-200 ${activeTab === t.value ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50'}`}
                        aria-hidden="true"
                    />
                </button>
            ))}
        </div>
    );
}
