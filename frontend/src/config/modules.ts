// Platform modules. The app currently ships the Workforce Management module;
// the others are scaffolded here so the sidebar card + module picker can switch
// between them. Drop real artwork into /public/modules/<key>.(svg|jpg) and update
// `image` below if you change the extension.

export type ModuleKey = 'workforce' | 'gym' | 'parking' | 'housing'

export interface ModuleDef {
    key: ModuleKey
    /** i18n key for the human-readable name. */
    nameKey: string
    /** Image shown in the sidebar card and the picker block (path under /public). */
    image: string
    /** Material Symbols glyph used as a fallback / accent badge. */
    icon: string
    /** Tailwind gradient classes used for accents and image overlays. */
    gradient: string
    /** Whether the module has working pages yet. */
    available: boolean
}

export const MODULE_LIST: ModuleDef[] = [
    {
        key: 'workforce',
        nameKey: 'modules.workforce',
        image: '/modules/workforce.svg',
        icon: 'groups',
        gradient: 'from-violet-500 to-indigo-600',
        available: true,
    },
    {
        key: 'parking',
        nameKey: 'modules.parking',
        image: '/modules/parking.svg',
        icon: 'local_parking',
        gradient: 'from-amber-500 to-orange-600',
        available: true,
    },
    {
        key: 'housing',
        nameKey: 'modules.housing',
        image: '/modules/housing.svg',
        icon: 'apartment',
        gradient: 'from-teal-500 to-emerald-600',
        available: true,
    },
]

export const MODULES: Record<ModuleKey, ModuleDef> = Object.fromEntries(
    MODULE_LIST.map((m) => [m.key, m]),
) as Record<ModuleKey, ModuleDef>

export const DEFAULT_MODULE: ModuleKey = 'workforce'
