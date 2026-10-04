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
  const dashboard = useAdminDashboard(setActiveTab);

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
          {dashboard.tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={() => dashboard.handleDeleteTask(task.id)}
            />
          ))}
        </div>
      )}

      {activeTab === 'hold-status' && (
        <HoldStatusPanel users={dashboard.users} subtasks={dashboard.subtasks} />
      )}
    </AdminDashboardLayout>
  );
}
