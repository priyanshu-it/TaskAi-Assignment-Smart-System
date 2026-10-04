import type { Dispatch, SetStateAction } from 'react';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import type { Priority } from '../../../shared/types';
import Input from './Input';

export interface NewTaskDraft {
  title: string;
  description: string;
  priority: Priority;
  deadline: string;
  skillsRequired: string[];
}

export interface SuggestedSubtask {
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  skillsRequired: string[];
}

interface CreateTaskPanelProps {
  newTask: NewTaskDraft;
  setNewTask: Dispatch<SetStateAction<NewTaskDraft>>;
  aiBreakdown: SuggestedSubtask[] | null;
  minimumDeadline: string;
  loading: boolean;
  onAiBreakdown: () => void;
  onCreateTask: () => void;
}

export default function CreateTaskPanel({
  newTask,
  setNewTask,
  aiBreakdown,
  minimumDeadline,
  loading,
  onAiBreakdown,
  onCreateTask
}: CreateTaskPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
        <Input label="Task Title" value={newTask.title} onChange={value => setNewTask({ ...newTask, title: value })} placeholder="e.g., Build user authentication system" />
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Description</label>
          <textarea
            value={newTask.description}
            onChange={event => setNewTask({ ...newTask, description: event.target.value })}
            placeholder="Describe the task in detail..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm min-h-[120px] text-slate-900"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Priority</label>
            <select
              value={newTask.priority}
              onChange={event => setNewTask({ ...newTask, priority: event.target.value as Priority })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-900"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <Input
            label="Deadline"
            type="date"
            min={minimumDeadline}
            value={newTask.deadline}
            onChange={value => setNewTask({ ...newTask, deadline: value })}
          />
        </div>
        <button
          onClick={onAiBreakdown}
          disabled={loading || !newTask.title || !newTask.description}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> AI Breakdown</>}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
          <Sparkles size={20} className="text-purple-600" />
          AI Suggested Breakdown
        </h3>
        {aiBreakdown ? (
          <div className="space-y-4">
            {aiBreakdown.map((subtask, index) => (
              <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900">{subtask.title}</h4>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Assign to: {subtask.assignedToName}</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">{subtask.description}</p>
                <div className="flex flex-wrap gap-1">
                  {subtask.skillsRequired.map(skill => (
                    <span key={skill} className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-medium">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={onCreateTask}
              disabled={loading}
              className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-sm transition-all mt-4 shadow-lg shadow-slate-900/10"
            >
              Confirm & Create Task
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
            <AlertCircle size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">Fill in task details and click "AI Breakdown"</p>
          </div>
        )}
      </div>
    </div>
  );
}
