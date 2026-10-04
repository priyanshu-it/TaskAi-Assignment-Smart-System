import { AlertCircle } from 'lucide-react';
import type { SubTask } from '../../../shared/types';

interface TaskDetail {
  taskId: string;
  taskTitle: string;
  subtasks: SubTask[];
}

interface TaskDetailsPanelProps {
  taskDetails: TaskDetail[];
}

export default function TaskDetailsPanel({ taskDetails }: TaskDetailsPanelProps) {
  return (
    <div className="space-y-6">
      <header className="mb-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 tracking-tight">Task Details</h1>
        <p className="text-slate-600 text-sm font-medium">See the users handling your tasks and who owns each subtask.</p>
      </header>

      {taskDetails.length > 0 ? (
        <div className="space-y-5">
          {taskDetails.map(task => (
            <div key={task.taskId} className="bg-white border border-slate-300 border-left-8 border-l-blue-600 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h2 className="text-xl font-bold text-blue-900 uppercase tracking-wider underline decoration-blue-900 decoration-2">{task.taskTitle}</h2>
                  <p className="text-sm text-slate-500 mt-2">Users handling this task: </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                  {task.subtasks.length} Subtask{task.subtasks.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {task.subtasks.map(subtask => (
                  <div key={subtask.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{subtask.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{subtask.description}</p>
                      </div>
                      <div className="text-sm text-slate-600">
                        Assigned to: <span className="font-semibold text-slate-900">{subtask.assignedToName || subtask.assignedTo}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                      <div className="px-3 py-2 bg-white rounded-full border border-slate-200">Status: <span className="font-semibold text-slate-700">{subtask.status}</span></div>
                      {subtask.deadline && (
                        <div className="px-3 py-2 bg-white rounded-full border border-slate-200">
                          Due: <span className="font-semibold text-slate-700">{new Date(subtask.deadline).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
          <AlertCircle size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-medium">There are no task details to display yet.</p>
        </div>
      )}
    </div>
  );
}
