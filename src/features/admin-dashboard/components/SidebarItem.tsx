import type { ReactNode } from 'react';
import { cn } from '../../../shared/lib/utils';

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
        active ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
      )}
    >
      {icon} {label} {label === 'Create Task' && <span className="ml-1 text-xs font-bold text-slate-500 uppercase tracking-wider border border-slate-200 px-1 py-0.5 rounded-lg">
        AI</span>}
    </button>
  );
}
