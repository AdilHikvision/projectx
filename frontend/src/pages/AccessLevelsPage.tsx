import { AppLayout } from '../components/AppLayout'
import { Card, Badge, Button, Avatar, PageHeader } from '../components/ui'

const accessLevels = [
    { name: 'Full Access', zone: 'Main Entrance', schedule: '24/7 Unrestricted', users: 38, priority: 'High' },
    { name: 'Tier 1 Required', zone: 'IT Server Room', schedule: 'Business Hours Only', users: 124, priority: 'Critical' },
    { name: 'Security Pass', zone: 'Warehouse A', schedule: 'Shift-based', users: 14, priority: 'Medium' },
    { name: 'Guest Access', zone: 'Lobby', schedule: 'Temporary', users: 52, priority: 'Low' },
]

export function AccessLevelsPage() {
    return (
        <AppLayout>
            <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">

                {/* Unified Page Header Section */}
                <PageHeader
                    title="Access Control Policies"
                    actions={
                        <Button icon="add_moderator" size="md">
                            Create New Policy
                        </Button>
                    }
                />

                {/* Zone Grid Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    <Card className="relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">door_front</span>
                        </div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Active Zones</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-text-dark">12</span>
                            <Badge variant="success" className="uppercase tracking-tighter">Monitoring</Badge>
                        </div>
                    </Card>
                    <Card className="relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">group</span>
                        </div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Authorized Users</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-text-dark">842</span>
                            <span className="text-xs font-bold text-text-muted">Total</span>
                        </div>
                    </Card>
                    <Card className="relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">policy</span>
                        </div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Unique Policies</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-text-dark">24</span>
                            <Badge variant="primary">Active</Badge>
                        </div>
                    </Card>
                    <Card className="hidden xl:block relative overflow-hidden group border-l-4 border-l-success-text">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-success-text">
                            <span className="material-symbols-outlined text-5xl">verified_user</span>
                        </div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Security Integrity</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-success-text uppercase tracking-tighter">All Clear</span>
                        </div>
                    </Card>
                </div>

                {/* Main List */}
                <Card noPadding className="overflow-hidden">
                    <div className="p-6 border-b border-border-base flex items-center justify-between">
                        <h4 className="text-sm font-black text-text-dark uppercase tracking-widest">Active Security Zones</h4>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" icon="filter_list" />
                            <Button variant="ghost" size="icon" icon="search" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-75 border-b border-border-base">
                                    <th className="px-8 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Zone / Facility</th>
                                    <th className="px-8 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Policy Name</th>
                                    <th className="px-8 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest">Schedule Type</th>
                                    <th className="px-8 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest text-center">User Count</th>
                                    <th className="px-8 py-4 text-[11px] font-black text-text-muted uppercase tracking-widest text-right">Settings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {accessLevels.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-75 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar icon="shield_lock" variant="default" size="md" className="group-hover:bg-primary/20 transition-colors" />
                                                <span className="text-sm font-bold text-text-dark">{item.zone}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant={item.priority === 'Critical' ? 'error' : item.priority === 'High' ? 'primary' : 'neutral'}>
                                                {item.name}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-medium text-text-muted">{item.schedule}</td>
                                        <td className="px-8 py-6 text-center text-[15px] font-black text-text-dark">{item.users}</td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" icon="settings" className="text-text-muted hover:text-primary" />
                                                <Button variant="ghost" size="icon" icon="more_vert" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Matrix Note Card */}
                <div className="bg-primary/5 rounded-2xl p-8 border border-primary/20 border-dashed flex items-center gap-6">
                    <div className="size-14 rounded-2xl bg-surface shadow-xl flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-3xl">hub</span>
                    </div>
                    <div>
                        <p className="text-text-dark font-black tracking-tight text-lg mb-1">Global Permissions Propagation</p>
                        <p className="text-text-muted text-sm max-w-2xl leading-relaxed">
                            Changes to access policies are pushed to all edge controllers in real-time. System-wide sync typically completes in under 45 seconds for all decentralized nodes.
                        </p>
                    </div>
                    <Button className="ml-auto" variant="primary">
                        Force Sync Fleet
                    </Button>
                </div>

            </div>
        </AppLayout>
    )
}
