import { useState } from 'react';
import AdminDashboardLayout, { type AdminTab } from '../components/AdminDashboardLayout';
import CreateTaskPanel from '../components/CreateTaskPanel';
import DashboardOverview from '../components/DashboardOverview';
import HoldStatusPanel from '../components/HoldStatusPanel';
import RoleCapacityPanel from '../components/RoleCapacityPanel';
import TaskCard from '../components/TaskCard';
import UserManagementPanel from '../components/UserManagementPanel';
import useAdminDashboard from '../hooks/useAdminDashboard';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'done' | 'not-done'>('all');
  const dashboard = useAdminDashboard(setActiveTab);
  const filteredTasks = dashboard.tasks.filter(task => {
    if (taskStatusFilter === 'done') return task.status === 'done';
    if (taskStatusFilter === 'not-done') return task.status !== 'done';
    return true;
  });

  return (
    <AdminDashboardLayout
      activeTab={activeTab}
      isSidebarOpen={isSidebarOpen}
      onTabChange={setActiveTab}
      onToggleSidebar={() => setIsSidebarOpen(open => !open)}
      onCloseSidebar={() => setIsSidebarOpen(false)}
      onExportReport={dashboard.handleExportText}
    >
      {activeTab === 'dashboard' && (
        <DashboardOverview
          users={dashboard.users}
          tasks={dashboard.tasks}
          subtasks={dashboard.subtasks}
          roleSlots={dashboard.roleSlots}
          overdueReminders={dashboard.overdueReminders}
          getUserLoad={dashboard.getUserLoad}
          onEditSlots={() => setActiveTab('settings')}
        />
      )}

      {activeTab === 'users' && (
        <UserManagementPanel
          users={dashboard.users}
          newUser={dashboard.newUser}
          roleSlots={dashboard.roleSlots}
          loading={dashboard.loading}
          onSubmit={dashboard.handleAddUser}
          onUserChange={dashboard.setNewUser}
          getSlotUsage={dashboard.getSlotUsage}
          getRoleLimit={dashboard.getRoleLimit}
          onDeleteUser={dashboard.deleteUser}
        />
      )}

      {activeTab === 'create-task' && (
        <CreateTaskPanel
          newTask={dashboard.newTask}
          setNewTask={dashboard.setNewTask}
          aiBreakdown={dashboard.aiBreakdown}
          minimumDeadline={dashboard.minimumDeadline}
          loading={dashboard.loading}
          onAiBreakdown={dashboard.handleAiBreakdown}
          onCreateTask={dashboard.handleCreateTask}
        />
      )}

      {activeTab === 'settings' && (
        <RoleCapacityPanel
          roleSlots={dashboard.roleSlots}
          setRoleSlots={dashboard.setRoleSlots}
          saving={dashboard.savingSettings}
          onSave={dashboard.handleUpdateRoleSlots}
          onBack={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'all-tasks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-start gap-3">
            <label htmlFor="task-status-filter" className="text-sm font-medium text-slate-600">
              Show tasks
            </label>
            <select
              id="task-status-filter"
              value={taskStatusFilter}
              onChange={event => setTaskStatusFilter(event.target.value as typeof taskStatusFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All tasks</option>
              <option value="done">Done</option>
              <option value="not-done">Not done</option>
            </select>
          </div>
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={() => dashboard.handleDeleteTask(task.id)}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No {taskStatusFilter === 'done' ? 'completed' : 'unfinished'} tasks.
            </div>
          )}
        </div>
      )}

      {activeTab === 'hold-status' && (
        <HoldStatusPanel users={dashboard.users} subtasks={dashboard.subtasks} />
      )}
    </AdminDashboardLayout>
  );
}
