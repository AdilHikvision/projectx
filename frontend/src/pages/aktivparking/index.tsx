import { AppLayout } from '../../components/templates'

// ─── Aktiv Parking embed ───────────────────────────────────────────────────────
// Aktiv Parking (bina idarəetməsi) app-ı LXC 106-da canlı işləyir. Onun səhifələri
// burada ProjectX daxilində yeni tab kimi göstərilir (iframe). `?embed=1` app-ın öz
// sidebar/header-ini gizlədir ki, ProjectX içində native görünsün. Mövcud ProjectX
// tablarına toxunulmur — bu, əlavə (additive) səhifələrdir.
const AKTIV_PARKING_BASE = 'http://192.168.88.187:5080'

function ApEmbed({ view }: { view: string }) {
    return (
        <div className="h-full w-full bg-background-light">
            <iframe
                src={`${AKTIV_PARKING_BASE}/?embed=1#${view}`}
                title={`Aktiv Parking — ${view}`}
                className="block h-full w-full border-0"
                style={{ minHeight: 'calc(100vh - 72px)' }}
            />
        </div>
    )
}

export function ApHomePage() {
    return <AppLayout><ApEmbed view="home" /></AppLayout>
}
export function ApResidentsPage() {
    return <AppLayout><ApEmbed view="residents" /></AppLayout>
}
export function ApVehiclesPage() {
    return <AppLayout><ApEmbed view="vehicles" /></AppLayout>
}
export function ApPermitsPage() {
    return <AppLayout><ApEmbed view="permits" /></AppLayout>
}
export function ApReportsPage() {
    return <AppLayout><ApEmbed view="reports" /></AppLayout>
}
