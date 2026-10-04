import type { FormEvent } from 'react';
import { Copy, Loader2, Mail, Plus, Trash2 } from 'lucide-react';
import type { Role, UserProfile } from '../../../shared/types';
import { ALL_SKILLS } from '../../../shared/constants/roles';
import { cn } from '../../../shared/lib/utils';
import Input from './Input';

export interface NewUserDraft {
  fullName: string;
  email: string;
  userId: string;
  role: Role;
  skills: string[];
}

interface UserManagementPanelProps {
  users: UserProfile[];
  newUser: NewUserDraft;
  roleSlots: Record<string, number>;
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUserChange: (user: NewUserDraft) => void;
  getSlotUsage: (role: Role) => number;
  getRoleLimit: (role: string) => number;
  onDeleteUser: (uid: string) => void;
}

export default function UserManagementPanel({
  users,
  newUser,
  roleSlots,
  loading,
  onSubmit,
  onUserChange,
  getSlotUsage,
  getRoleLimit,
  onDeleteUser
}: UserManagementPanelProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
          <Plus size={20} className="text-blue-600" />
          Add New User
        </h3>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Full Name" value={newUser.fullName} onChange={value => onUserChange({ ...newUser, fullName: value })} placeholder="John Doe" />
          <Input label="Email" type="email" value={newUser.email} onChange={value => onUserChange({ ...newUser, email: value })} placeholder="john@example.com" />
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">User ID (Auto-Generated)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 font-bold flex items-center justify-between cursor-not-allowed">
                {newUser.userId || 'Generating...'}
              </div>
              {newUser.userId && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newUser.userId);
                    alert('User ID copied to clipboard!');
                  }}
                  className="px-3 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-blue-200 flex items-center gap-1.5"
                >
                  <Copy size={14} />
                  Copy
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Role</label>
            <select
              value={newUser.role}
              onChange={event => onUserChange({ ...newUser, role: event.target.value as Role })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-900"
            >
              {Object.keys(roleSlots).map(role => (
                <option key={role} value={role}>{role} ({getSlotUsage(role as Role)}/{getRoleLimit(role)})</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Skills</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => {
                    if (newUser.skills.includes(skill)) {
                      onUserChange({ ...newUser, skills: newUser.skills.filter(selected => selected !== skill) });
                    } else if (newUser.skills.length < 6) {
                      onUserChange({ ...newUser, skills: [...newUser.skills, skill] });
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                    newUser.skills.includes(skill)
                      ? "bg-blue-50 border-blue-600 text-blue-600" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-500 font-medium italic">
              * Registered users will log in using their Email and User ID.
            </p>
            <button disabled={loading} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20">
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Register User"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User ID</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skills</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tasks</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.filter(user => user.role !== 'Admin').map(user => (
              <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-900">{user.fullName}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-700 font-bold">xxxxx</span>
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(user.email)}&su=${encodeURIComponent('TaskAI account details')}&body=${encodeURIComponent(`Your TaskAI User ID is: ${user.userId}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Open Gmail with user ID"
                    >
                      <Mail size={18} />
                    </a>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-blue-200">
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {user.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">{skill}</span>
                    ))}
                    {user.skills.length > 3 && <span className="text-[9px] text-slate-500">+{user.skills.length - 3} more</span>}
                  </div>
                </td>
                <td className="p-4 font-mono text-sm text-blue-600">{user.activeTasksCount}</td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onDeleteUser(user.uid)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Delete user">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
