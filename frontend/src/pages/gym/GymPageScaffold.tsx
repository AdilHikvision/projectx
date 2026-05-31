import { useTranslation } from 'react-i18next'
import { AppLayout } from '../../components/templates'

interface GymPageScaffoldProps {
    titleKey: string
    icon: string
}

/**
 * Placeholder shell for Gym Management pages that are scaffolded but not yet
 * implemented. Replace the body with the real screen as each feature is built.
 */
export function GymPageScaffold({ titleKey, icon }: GymPageScaffoldProps) {
    const { t } = useTranslation()

    return (
        <AppLayout>
            <div className="p-8">
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border-base bg-surface px-6 py-24 text-center shadow-sm">
                    <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                        <span className="material-symbols-outlined text-4xl">{icon}</span>
                    </span>
                    <h2 className="text-2xl font-black tracking-tight text-text-dark">{t(titleKey)}</h2>
                    <p className="mt-2 max-w-md text-sm font-medium text-text-muted leading-relaxed">
                        {t('gym.underDevelopment')}
                    </p>
                </div>
            </div>
        </AppLayout>
    )
}
