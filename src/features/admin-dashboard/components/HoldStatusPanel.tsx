import type { SubTask, UserProfile } from '../../../shared/types';

interface HoldStatusPanelProps {
  users: UserProfile[];
  subtasks: SubTask[];
}

export default function HoldStatusPanel({ users, subtasks }: HoldStatusPanelProps) {
  const usersWithHoldTasks = users.filter(user =>
    user.role !== 'Admin' && subtasks.some(subtask => subtask.assignedTo === user.email && subtask.status === 'hold')
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-100 text-center border-b border-slate-200">
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User Details</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hold Tasks</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Task Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {usersWithHoldTasks.map(user => {
              const userHoldTasks = subtasks.filter(subtask => subtask.assignedTo === user.email && subtask.status === 'hold');
              return (
                <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800 flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-sm">{user.fullName}</p>
                        <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-sm font-bold border border-orange-200">
                      {userHoldTasks.length}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="space-y-2">
                      {userHoldTasks.map(task => (
                        <div key={task.id} className="text-xs bg-orange-50 border border-orange-200 rounded-lg p-2">
                          <div className="font-bold text-slate-900">{task.title}</div>
                          <div className="text-slate-600">{task.description}</div>
                          <div className="text-orange-600 font-semibold mt-1">Status: On Hold</div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {usersWithHoldTasks.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 text-sm font-medium italic">
                  No users with hold status tasks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
