import { AppLayout } from '../components/AppLayout'
import { Card, Badge, Button, Input, Avatar, PageHeader } from '../components/ui'

const people = [
  { initials: 'JD', name: 'Johnathan Doe', email: 'j.doe@company.com', status: 'Active' as const, dept: 'Engineering', access: 'Full Access', lastActivity: '2 mins ago', variant: 'primary' as const },
  { initials: 'JS', name: 'Jane Smith', email: 'jane.smith@design.io', status: 'Pending' as const, dept: 'Marketing', access: 'Office Only', lastActivity: 'Never', variant: 'primary' as const },
  { initials: 'RB', name: 'Robert Brown', email: 'r.brown@hr.corp', status: 'Disabled' as const, dept: 'HR', access: 'Restricted', lastActivity: 'Yesterday, 4:12 PM', variant: 'neutral' as const },
  { initials: 'MW', name: 'Michael Wilson', email: 'm.wilson@ops.net', status: 'Active' as const, dept: 'Operations', access: 'Full Access', lastActivity: '5 mins ago', variant: 'primary' as const },
]

export function PeopleManagementPage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* Top Actions */}
        {/* Unified Page Header */}
        <PageHeader
          title="Users & Visitors"
          description="Manage digital credentials and physical access points for your organization."
          actions={
            <>
              <Button variant="outline" size="sm" icon="file_download">
                Export
              </Button>
              <Button size="sm" icon="person_add">
                Add User
              </Button>
            </>
          }
        />

        {/* Filters */}
        <Card noPadding className="flex flex-wrap items-center gap-3 p-2">
          <Input
            icon="search"
            placeholder="Search by name, email, or department..."
            containerClassName="flex-1 min-w-[280px]"
            className="border-none bg-slate-75"
          />
          <div className="h-8 w-px bg-border-base mx-1 hidden lg:block"></div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary">All Users</Button>
            <Button size="sm" variant="ghost">Employees</Button>
            <Button size="sm" variant="ghost">Visitors</Button>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="gap-1 font-semibold text-text-base">
              Status <span className="material-symbols-outlined text-[12px]">expand_more</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1 font-semibold text-text-base">
              Department <span className="material-symbols-outlined text-[12px]">expand_more</span>
            </Button>
          </div>
        </Card>

        {/* Table Container */}
        <Card noPadding className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-75 border-b border-border-base">
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Name & Email</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Access Level</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {people.map((person, idx) => (
                <tr key={idx} className="hover:bg-slate-75 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={person.initials} variant={person.variant} size="md" />
                      <div>
                        <div className="text-sm font-bold text-text-dark">{person.name}</div>
                        <div className="text-xs text-text-muted">{person.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      dot
                      variant={person.status === 'Active' ? 'success' : person.status === 'Pending' ? 'warning' : 'neutral'}
                    >
                      {person.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-base">{person.dept}</td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral">{person.access}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">{person.lastActivity}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" icon="edit" className="p-2 h-auto" />
                      <Button variant="ghost" size="sm" icon="more_vert" className="p-2 h-auto" />
                    </div>
                  </td>
                </tr>
              ))}
              {/* Additional Guest Row */}
              <tr className="hover:bg-slate-75 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar icon="badge" variant="neutral" size="md" className="bg-primary/10 text-primary" />
                    <div>
                      <div className="text-sm font-bold text-text-dark">Guest Visitor</div>
                      <div className="text-xs text-text-muted">Contractor #402</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge dot variant="success">Active</Badge>
                </td>
                <td className="px-6 py-4 text-sm text-text-base">External</td>
                <td className="px-6 py-4">
                  <Badge variant="primary">Temporary</Badge>
                </td>
                <td className="px-6 py-4 text-sm text-text-muted">Today, 9:00 AM</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" icon="schedule" className="p-2 h-auto" />
                    <Button variant="ghost" size="sm" icon="more_vert" className="p-2 h-auto" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 bg-slate-75 border-t border-border-base flex items-center justify-between">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">SHOWING 1-5 OF 24 RESULTS</p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" icon="chevron_left" disabled />
              <Button size="sm" className="text-[10px]">1</Button>
              <Button variant="ghost" size="sm" className="text-[10px] text-text-base">2</Button>
              <Button variant="outline" size="sm" icon="chevron_right" />
            </div>
          </div>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex items-center gap-4 transition-all hover:border-primary/20">
            <div className="size-12 rounded-full bg-success-bg text-success-text flex items-center justify-center">
              <span className="material-symbols-outlined">person_check</span>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Today</p>
              <p className="text-2xl font-black text-text-dark">18</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 transition-all hover:border-primary/20">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">group_add</span>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Pending Invites</p>
              <p className="text-2xl font-black text-text-dark">4</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 transition-all hover:border-primary/20">
            <div className="size-12 rounded-full bg-primary/5 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">meeting_room</span>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Visitors</p>
              <p className="text-2xl font-black text-text-dark">2</p>
            </div>
          </Card>
        </div>

      </div>
    </AppLayout>
  )
}
