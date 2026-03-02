import { AppLayout } from '../components/AppLayout'

const people = [
  { initials: 'JD', name: 'Johnathan Doe', email: 'j.doe@company.com', status: 'Active', dept: 'Engineering', access: 'Full Access', lastActivity: '2 mins ago', color: 'bg-primary/20 text-primary' },
  { initials: 'JS', name: 'Jane Smith', email: 'jane.smith@design.io', status: 'Pending', dept: 'Marketing', access: 'Office Only', lastActivity: 'Never', color: 'bg-primary/20 text-primary' },
  { initials: 'RB', name: 'Robert Brown', email: 'r.brown@hr.corp', status: 'Disabled', dept: 'HR', access: 'Restricted', lastActivity: 'Yesterday, 4:12 PM', color: 'bg-slate-200 dark:bg-slate-700 text-slate-500' },
  { initials: 'MW', name: 'Michael Wilson', email: 'm.wilson@ops.net', status: 'Active', dept: 'Operations', access: 'Full Access', lastActivity: '5 mins ago', color: 'bg-primary/20 text-primary' },
]

export function PeopleManagementPage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

        {/* Top Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Users & Visitors</h2>
            <p className="text-sm text-slate-500">Manage digital credentials and physical access points for your organization.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-base">file_download</span>
              Export
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
              <span className="material-symbols-outlined text-base">person_add</span>
              Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none"
              placeholder="Search by name, email, or department..."
              type="text"
            />
          </div>
          <div className="h-8 w-px bg-slate-200 mx-1 hidden lg:block"></div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg">All Users</button>
            <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors">Employees</button>
            <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors">Visitors</button>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
              Status <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
              Department <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name & Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Access Level</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {people.map((person, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`size-9 rounded-full flex items-center justify-center font-bold text-sm ${person.color}`}>
                        {person.initials}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{person.name}</div>
                        <div className="text-xs text-slate-500">{person.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${person.status === 'Active' ? 'bg-emerald-100 text-emerald-600' :
                      person.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                      <span className={`size-1.5 rounded-full ${person.status === 'Active' ? 'bg-emerald-500' :
                        person.status === 'Pending' ? 'bg-amber-500' :
                          'bg-slate-400'
                        }`}></span>
                      {person.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{person.dept}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                      {person.access}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{person.lastActivity}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Additional Guest Row */}
              <tr className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                      <span className="material-symbols-outlined text-[18px]">badge</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Guest Visitor</div>
                      <div className="text-xs text-slate-500">Contractor #402</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[11px] font-bold">
                    <span className="size-1.5 rounded-full bg-emerald-500"></span> Active
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">External</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded text-xs font-bold uppercase">Temporary</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">Today, 9:00 AM</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">schedule</span>
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">SHOWING 1-5 OF 24 RESULTS</p>
            <div className="flex gap-1.5">
              <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:text-primary disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded bg-primary text-white text-[10px] font-bold">1</button>
              <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-600 text-[10px] font-bold transition-colors">2</button>
              <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-4 transition-all hover:border-primary/20">
            <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined">person_check</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Today</p>
              <p className="text-2xl font-black text-slate-900">18</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-4 transition-all hover:border-primary/20">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">group_add</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Invites</p>
              <p className="text-2xl font-black text-slate-900">4</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-4 transition-all hover:border-primary/20">
            <div className="size-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined">meeting_room</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Visitors</p>
              <p className="text-2xl font-black text-slate-900">2</p>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
