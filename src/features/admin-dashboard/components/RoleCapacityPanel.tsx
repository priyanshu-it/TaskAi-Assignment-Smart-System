import type { Dispatch, SetStateAction } from 'react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

interface RoleCapacityPanelProps {
  roleSlots: Record<string, number>;
  setRoleSlots: Dispatch<SetStateAction<Record<string, number>>>;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
}

export default function RoleCapacityPanel({
  roleSlots,
  setRoleSlots,
  saving,
  onSave,
  onBack
}: RoleCapacityPanelProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Role Capacity</h2>
            <p className="text-sm text-slate-600 font-medium"> Manage the maximum number of users for each role in the system</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className='px-2 py-2 bg-red-400 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all flex items-center gap-1'
            >
              <ArrowLeft size={18} /> Back
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="px-2 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-1 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(roleSlots).map(([role, limit]) => (
            <div key={role} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-bold text-slate-700">{role}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRoleSlots(previous => ({ ...previous, [role]: Math.max(1, (previous[role] || 0) - 1) }))}
                  className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                >-</button>
                <span className="w-8 text-center font-mono font-bold text-blue-600">{limit}</span>
                <button
                  onClick={() => setRoleSlots(previous => ({ ...previous, [role]: (previous[role] || 0) + 1 }))}
                  className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                >+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
