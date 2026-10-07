import { AlertCircle, Bell, CheckCircle2, Clock, ListChecks, PieChart, Users } from 'lucide-react';
import type { SubTask, Task, UserProfile } from '../../../shared/types';
import { cn } from '../../../shared/lib/utils';

interface DashboardOverviewProps {
  users: UserProfile[];
  tasks: Task[];
  subtasks: SubTask[];
  roleSlots: Record<string, number>;
  overdueReminders: SubTask[];
  getUserLoad: (email: string) => number;
  onEditSlots: () => void;
}

export default function DashboardOverview({
  users,
  tasks,
  subtasks,
  roleSlots,
  overdueReminders,
  getUserLoad,
  onEditSlots
}: DashboardOverviewProps) {
  const heldSubtasks = subtasks.filter(subtask => subtask.status === 'hold');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6">
        <div className="flex items-center gap-3 p-5 bg-white rounded-lg border border-blue-100 shadow-sm">
          <Users className="text-purple-600" />
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Team Members</div>
            <div className="text-lg font-bold text-slate-600">{users.length}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-5 bg-pink-50 rounded-lg border border-orange-100 shadow-sm">
          <ListChecks className="text-orange-600" />
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tasks</div>
            <div className="text-lg font-bold text-slate-600">{tasks.length}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-5 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
          <Clock className="text-blue-600" />
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Progress</div>
            <div className="text-lg font-bold text-slate-600">{tasks.filter(task => task.status === 'inprogress').length}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-5 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm">
          <CheckCircle2 className="text-emerald-600" />
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</div>
            <div className="text-lg font-bold text-slate-600">{tasks.filter(task => task.status === 'done').length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {heldSubtasks.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-orange-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Pending Hold Tasks Notification</h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    <p>There are <span className="font-bold text-orange-600">{heldSubtasks.length}</span> task(s) currently on hold.</p>
                    <p>Users assigned to these tasks need to be contacted for status updates:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {Array.from(new Set(heldSubtasks.map(subtask => subtask.assignedTo))).map(email => {
                        const user = users.find(candidate => candidate.email === email);
                        const count = heldSubtasks.filter(subtask => subtask.assignedTo === email).length;
                        return (
                          <li key={email}>
                            <span className="font-semibold">{user?.fullName}</span> - {email} ({count} hold task(s))
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {overdueReminders.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Bell className="text-amber-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Reminder sent alerts</h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    <p>There are <span className="font-bold text-amber-600">{overdueReminders.length}</span> subtask(s) overdue by 2+ days and ready for reminder follow-up.</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {Array.from(new Set(overdueReminders.map(subtask => subtask.assignedTo))).map(email => {
                        const user = users.find(candidate => candidate.email === email);
                        const count = overdueReminders.filter(subtask => subtask.assignedTo === email).length;
                        return (
                          <li key={email}>
                            <span className="font-semibold">{user?.fullName || email}</span> - {count} overdue reminder(s)
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Team Overview
            </h3>
            <div
              className="bg-white border border-slate-200 rounded-xl max-h-96 overflow-auto shadow-sm"
              role="region"
              aria-label="Team overview list"
              tabIndex={0}
            >
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300">
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Member</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Load</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.filter(user => user.role !== 'Admin').map(user => {
                    const load = getUserLoad(user.email);
                    return (
                      <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 text-sm">{user.fullName}</div>
                          <div className="text-[11px] text-slate-600">{user.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">
                            {user.role.split(' ')[0]}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[60px]">
                              <div
                                className={cn("h-full bg-blue-600", load > 3 && "bg-orange-500", load > 4 && "bg-red-500")}
                                style={{ width: `${Math.min((load / 6) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{load}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                            load === 0 ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {load === 0 ? "Available" : "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {users.filter(user => user.role !== 'Admin').length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 text-xs font-medium italic">
                        No team members registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart size={20} className="text-blue-600" />
              Capacity
            </div>
            <button onClick={onEditSlots} className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wider">
              Edit Slots
            </button>
          </h3>
          <div
            className="max-h-96 space-y-3 overflow-y-auto pr-1"
            role="region"
            aria-label="Team capacity by role"
            tabIndex={0}
          >
            {Object.entries(roleSlots).map(([role, limit]) => {
              const usage = role === 'Admin' ? 0 : users.filter(user => user.role === role).length;
              const percentage = (usage / limit) * 100;
              return (
                <div key={role} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-[10px] text-slate-900 uppercase tracking-tight truncate max-w-[150px]">{role}</h4>
                    <span className="text-[10px] font-mono text-slate-500">{usage}/{limit}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-orange-500" : "bg-blue-600"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
