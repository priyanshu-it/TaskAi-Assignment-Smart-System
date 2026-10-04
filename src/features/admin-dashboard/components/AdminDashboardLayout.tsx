import type { ReactNode } from 'react';
import { BarChart3, LayoutDashboard, ListChecks, LogOut, Menu, Pause, Plus, Users, X } from 'lucide-react';
import { auth } from '../../../shared/infrastructure/firebase';
import { cn } from '../../../shared/lib/utils';
import SidebarItem from './SidebarItem';

export type AdminTab = 'dashboard' | 'users' | 'create-task' | 'all-tasks' | 'hold-status' | 'settings';

interface AdminDashboardLayoutProps {
  activeTab: AdminTab;
  isSidebarOpen: boolean;
  children: ReactNode;
  onTabChange: (tab: AdminTab) => void;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
  onExportReport: () => void;
}

const tabContent: Record<AdminTab, { title: string; description: string }> = {
  dashboard: {
    title: 'Dashboard',
    description: 'Overview of all team activities and capacity'
  },
  users: {
    title: 'User Management',
    description: 'Add and manage team members'
  },
  'create-task': {
    title: 'Create New Task',
    description: 'AI will break it into subtasks and suggest assignments'
  },
  'all-tasks': {
    title: 'All Tasks',
    description: 'View and manage all assigned tasks'
  },
  'hold-status': {
    title: 'Hold Status',
    description: 'Users with tasks on hold - contact for status'
  },
  settings: {
    title: 'Settings',
    description: 'Manage role capacity and global limits'
  }
};

export default function AdminDashboardLayout({
  activeTab,
  isSidebarOpen,
  children,
  onTabChange,
  onToggleSidebar,
  onCloseSidebar,
  onExportReport
}: AdminDashboardLayoutProps) {
  const pageContent = tabContent[activeTab];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans relative">
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <h2 className="text-xl font-black text-blue-600 tracking-tighter flex items-center gap-2">
          Task<span className="text-slate-900">AI</span>
          <br />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Assignment</span>
        </h2>
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          onClick={onCloseSidebar}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white flex flex-col z-50 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-200 hidden lg:block">
          <h2 className="text-xl font-black text-blue-600 tracking-tighter flex items-center gap-2">
            Task<span className="text-slate-900">AI</span>
            <br />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Assignment Smart System</span>
          </h2>
        </div>

        <div className="p-6 border-b border-slate-100 lg:mt-0 mt-16">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Admin</div>
          <div className="text-sm font-bold text-slate-900 mb-1">Priyanshu</div>
        </div>

        <nav className="flex-1 p-4 space-y-2 lg:mt-0 mt-16">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { onTabChange('dashboard'); onCloseSidebar(); }} />
          <SidebarItem icon={<Users size={20} />} label="Create User's" active={activeTab === 'users'} onClick={() => { onTabChange('users'); onCloseSidebar(); }} />
          <SidebarItem icon={<Plus size={20} />} label="Create Task AI" active={activeTab === 'create-task'} onClick={() => { onTabChange('create-task'); onCloseSidebar(); }} />
          <SidebarItem icon={<ListChecks size={20} />} label="Tasks Status" active={activeTab === 'all-tasks'} onClick={() => { onTabChange('all-tasks'); onCloseSidebar(); }} />
          <SidebarItem icon={<Pause size={20} />} label="Hold Status" active={activeTab === 'hold-status'} onClick={() => { onTabChange('hold-status'); onCloseSidebar(); }} />
        </nav>

        <div className="mt-auto p-4 border-t border-slate-200">
          <button
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto lg:mt-0 mt-16">
        <header className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 tracking-tight">{pageContent.title}</h1>
          <p className="text-slate-600 text-sm font-medium">{pageContent.description}</p>
        </header>
        {activeTab === 'all-tasks' && (
          <button
            onClick={onExportReport}
            className="mb-4 px-4 py-2 hover:underline hover:text-blue-600 bg-blue-100 rounded-lg text-sm font-bold transition-all flex items-center gap-2 right-8 top-18 absolute cursor-pointer z-10"
          >
             <BarChart3 size={16} /> All Reports
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
