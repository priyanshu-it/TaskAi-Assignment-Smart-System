import { User as UserIcon } from 'lucide-react';
import type { UserProfile } from '../../../shared/types';

interface ProfilePanelProps {
  profile: UserProfile | null;
}

export default function ProfilePanel({ profile }: ProfilePanelProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Profile Settings</h1>
        <p className="text-slate-600 text-sm font-medium">Manage your professional information</p>
      </header>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <UserIcon size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{profile?.fullName}</h2>
            <p className="text-slate-500 font-medium">{profile?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">
              {profile?.email}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">User ID</label>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">
              {profile?.userId}
            </div>
          </div>
        </div>

        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Professional Role</label>
        <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-blue-900 rounded-xl text-xs font-bold uppercase">
          {profile?.role}
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">My Skills</label>
          <div className="flex flex-wrap gap-2">
            {profile?.skills.map(skill => (
              <span key={skill} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <span className="text-state-100 text-blue-300 flex items-center justify-center">* Please capture a photo, open your device's camera app</span>
      </div>
    </div>
  );
}
