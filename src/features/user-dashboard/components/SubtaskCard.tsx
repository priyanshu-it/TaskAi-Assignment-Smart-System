import { AlertCircle, Clock, User as UserIcon } from 'lucide-react';
import type { SubTask, SubTaskStatus } from '../../../shared/types';
import { cn, getDaysPastDeadline, isReminderDue } from '../../../shared/lib/utils';

interface SubtaskCardProps {
  subtask: SubTask;
  onStatusChange: (subtask: SubTask, status: SubTaskStatus) => void;
}

const statusStyles = {
  pending: { background: 'bg-orange-50', border: 'border-orange-200' },
  inprogress: { background: 'bg-blue-50', border: 'border-blue-200' },
  hold: { background: 'bg-red-50', border: 'border-red-200' },
  done: { background: 'bg-emerald-50', border: 'border-emerald-200' }
};

export default function SubtaskCard({ subtask, onStatusChange }: SubtaskCardProps) {
  const styles = statusStyles[subtask.status];
  const overdueDays = subtask.deadline ? getDaysPastDeadline(subtask.deadline) ?? 0 : 0;
  const reminderDue = subtask.deadline && subtask.status !== 'done' && isReminderDue(subtask.deadline);

  return (
    <div className={cn(
      "border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all",
      styles.background,
      styles.border,
      "bg-white border-slate-200"
    )}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[11px] font-bold uppercase tracking-wider">
            Project: {subtask.parentTaskTitle}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{subtask.title}</h3>
        <p className="text-sm text-slate-600 mb-4">{subtask.description}</p>

        <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg mb-3">
          <UserIcon size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-600">{subtask.assignedToName}</span>
          <br />
          {subtask.deadline && (
            <>
              <Clock size={14} className="text-blue-400" />
              <span className="text-xs font-medium text-slate-500">
                {new Date(subtask.deadline).toLocaleDateString('en-GB').replace(/\//g, '-')}
              </span>
            </>
          )}
        </div>

        {reminderDue && (
          <div className="mt-3 mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-semibold">
            <AlertCircle size={14} /> Reminder overdue by {overdueDays} day{overdueDays === 1 ? '' : 's'}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {subtask.skillsRequired.map(skill => (
            <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider">{skill}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
          <select
            value={subtask.status}
            onChange={event => {
              const status = event.target.value as SubTaskStatus;
              if (status === "done" && !window.confirm("Mark this task as completed?")) return;
              onStatusChange(subtask, status);
            }}
            className={cn(
              "px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20",
              subtask.status === 'done' ? "text-emerald-600 border-emerald-500/30 bg-emerald-50/30" :
                subtask.status === 'inprogress' ? "text-blue-600 border-blue-500/30 bg-blue-50/30" :
                  subtask.status === 'hold' ? "text-orange-600 border-orange-500/30 bg-orange-50/30" :
                    "text-slate-500"
            )}
          >
            {subtask.status !== "done" ? (
              <>
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="hold">On Hold</option>
                <option value="done">Completed</option>
              </>
            ) : (
              <option value="done">"Completed"</option>
            )}
          </select>
        </div>
      </div>
    </div>
  );
}
