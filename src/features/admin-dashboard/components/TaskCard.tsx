import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { ArrowBigRightDash, CheckCircle2, Clock, ListChecks, Trash2 } from 'lucide-react';
import { db } from '../../../shared/infrastructure/firebase';
import type { SubTask, Task } from '../../../shared/types';
import { cn, getDaysPastDeadline, isReminderDue } from '../../../shared/lib/utils';

interface TaskCardProps {
  task: Task;
  onDelete: () => void;
}

function getTaskStatusFromSubtasks(subtasks: SubTask[]): string {
  if (subtasks.length === 0) return 'pending';
  if (subtasks.every(subtask => subtask.status === 'done')) return 'done';
  if (subtasks.some(subtask => subtask.status === 'hold')) return 'hold';
  if (subtasks.some(subtask => subtask.status === 'inprogress')) return 'inprogress';
  return 'pending';
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const subtasksQuery = query(collection(db, 'subtasks'), where('taskId', '==', task.id));
    const unsubscribe = onSnapshot(subtasksQuery, async snapshot => {
      const nextSubtasks = snapshot.docs.map(document => ({
        id: document.id,
        ...document.data()
      } as SubTask));
      setSubtasks(nextSubtasks);

      const nextStatus = getTaskStatusFromSubtasks(nextSubtasks);
      if (nextStatus !== task.status) {
        await updateDoc(doc(db, 'tasks', task.id), { status: nextStatus });
      }
    });
    return () => unsubscribe();
  }, [task.id, task.status]);

  const completedCount = subtasks.filter(subtask => subtask.status === 'done').length;
  const overdueDays = getDaysPastDeadline(task.deadline);
  const taskReminderDue = task.deadline && task.status !== 'done' && isReminderDue(task.deadline);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div
        className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1"><Clock size={14} /> Due: {new Date(task.deadline).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
            {taskReminderDue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-red-700">
                Reminder overdue by {overdueDays} day{overdueDays === 1 ? '' : 's'}
              </span>
            )}
            <span className="flex items-center gap-1">{task.status === 'done' ? <CheckCircle2 size={17} className="text-emerald-500" /> :
              <ListChecks size={14} />} {completedCount}/{subtasks.length} subtasks done</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ArrowBigRightDash size={21} className={cn("text-slate-400 transition-transform",
            expanded && "rotate-90 text-blue-600 cursor-default"
          )} />
          {expanded ? (
            <>
              {showConfirm ? (
                <div className="flex items-center gap-2" onClick={event => event.stopPropagation()}>
                  <button
                    onClick={onDelete}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 transition-all"
                  >Confirm</button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-300 transition-all"
                  >Cancel</button>
                </div>
              ) : (
                <button
                  onClick={event => { event.stopPropagation(); setShowConfirm(true); }}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                ><Trash2 size={21} /></button>
              )}
            </>
          ) : (
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
              task.status === 'done' && "bg-emerald-50 text-emerald-600 border border-emerald-100",
              task.status === 'inprogress' && "bg-blue-50 text-blue-600 border border-blue-100",
              task.status === 'hold' && "bg-red-50 text-red-600 border border-red-100",
              task.status === 'pending' && "bg-slate-100 text-slate-500 border border-slate-200"
            )}>{task.status}</span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Subtasks
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gap-1 ml-2",
              task.priority === 'High' ? "bg-red-50 text-red-600 border border-red-100" :
                task.priority === 'Medium' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                  "bg-blue-50 text-blue-600 border border-blue-100"
            )}> {task.priority}</span>
          </h4>
          <div className="space-y-3">
            {subtasks.map(subtask => (
              <div key={subtask.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full",
                    subtask.status === 'done' ? "bg-emerald-500" : subtask.status === 'inprogress' ? "bg-blue-600" : "bg-slate-300"
                  )} />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{subtask.title}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Assigned to: <span className="text-blue-600">{subtask.assignedToName}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                    subtask.status === 'done' ? "bg-emerald-50 text-emerald-600" :
                      subtask.status === 'inprogress' ? "bg-blue-50 text-blue-600" :
                        subtask.status === 'hold' ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                  )}> {subtask.status}</span>
                  <br />
                </div>
              </div>
            ))}
            {subtasks.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm font-medium italic">
                No subtasks created for this task.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
