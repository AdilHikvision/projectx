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
            <div className={`flex flex-wrap gap-2 ${className}`}>
                {tabs.map((t) => (
                    <button
                        key={t.value}
                        type="button"
                        onClick={() => onTabChange(t.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === t.value
                                ? 'bg-primary text-white'
                                : 'bg-slate-75 text-text-muted hover:bg-slate-100 hover:text-text-dark'
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
                    className={`pb-2.5 text-xs font-bold whitespace-nowrap uppercase tracking-widest border-b-2 transition-colors ${activeTab === t.value
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-muted hover:text-text-dark'
                        }`}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}
