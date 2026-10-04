import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, getDocs, collectionGroup, increment } from 'firebase/firestore';
import { db, auth } from '../../../shared/infrastructure/firebase';
import { useAuth } from '../../auth/context/AuthContext';
import type { SubTask, SubTaskStatus } from '../../../shared/types';
import { ListChecks, PieChart, Clock, CheckCircle2, LogOut, User as UserIcon, LayoutDashboard, Loader2, AlertCircle, Menu, X } from 'lucide-react';
import { cn, getDaysPastDeadline, isReminderDue } from '../../../shared/lib/utils';
import SidebarItem from '../components/SidebarItem';
import SubtaskCard from '../components/SubtaskCard';
import TaskDetailsPanel from '../components/TaskDetailsPanel';
import ProfilePanel from '../components/ProfilePanel';

export default function UserDashboard() {
  const { profile } = useAuth();
  const [userSubtasks, setUserSubtasks] = useState<SubTask[]>([]);
  const [allSubtasks, setAllSubtasks] = useState<SubTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'tasks' | 'details' | 'profile'>('tasks');

  const overdueReminders = userSubtasks.filter(sub => sub.deadline && sub.status !== 'done' && isReminderDue(sub.deadline));

  useEffect(() => {
    if (!profile?.email) {
      console.log("UserDashboard: No profile email, skipping subtask fetch");
      return;
    }

    console.log("UserDashboard: Fetching assigned subtasks for email:", profile.email);
    const q = query(collection(db, 'subtasks'), where('assignedTo', '==', profile.email));
    const unsub = onSnapshot(q, (snapshot) => {
      console.log("UserDashboard: Received assigned subtasks snapshot for", profile.email, "count:", snapshot.size);
      if (snapshot.size === 0) {
        console.log("UserDashboard: No subtasks found. Check if 'assignedTo' in Firestore exactly matches", profile.email);
      }
      setUserSubtasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SubTask)));
      setLoading(false);
    }, (error) => {
      console.error("UserDashboard: Error fetching assigned subtasks:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [profile?.email]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'subtasks'), (snapshot) => {
      setAllSubtasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SubTask)));
    }, (error) => {
      console.error("UserDashboard: Error fetching all subtasks:", error);
    });

    return () => unsub();
  }, []);

  const taskDetails = useMemo(() => {
    const taskIdSet = new Set(userSubtasks.map(sub => sub.taskId));
    const grouped = Array.from(allSubtasks.reduce((map, sub) => {
      if (!taskIdSet.has(sub.taskId)) return map;
      const existing = map.get(sub.taskId) ?? {
        taskId: sub.taskId,
        taskTitle: sub.parentTaskTitle || 'Untitled Task',
        handlerNames: new Set<string>(),
        subtasks: [] as SubTask[]
      };
      existing.handlerNames.add(sub.assignedToName || sub.assignedTo);
      existing.subtasks.push(sub);
      map.set(sub.taskId, existing);
      return map;
    }, new Map<string, { taskId: string; taskTitle: string; handlerNames: Set<string>; subtasks: SubTask[] }>()).values());

    return grouped.map(group => ({
      ...group,
      handlerNames: Array.from(group.handlerNames).sort(),
    }));
  }, [allSubtasks, userSubtasks]);

  const updateStatus = async (sub: SubTask, newStatus: SubTaskStatus) => {
    try {
      const oldStatus = sub.status;
      await updateDoc(doc(db, 'subtasks', sub.id), { status: newStatus });

      // Update user active tasks count
      if (oldStatus !== 'done' && newStatus === 'done') {
        const userQuery = query(collection(db, 'users'), where('email', '==', profile?.email));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          await updateDoc(doc(db, 'users', userSnap.docs[0].id), {
            activeTasksCount: increment(-1)
          });
        }
      } else if (oldStatus === 'done' && newStatus !== 'done') {
        const userQuery = query(collection(db, 'users'), where('email', '==', profile?.email));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          await updateDoc(doc(db, 'users', userSnap.docs[0].id), {
            activeTasksCount: increment(1)
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans relative">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <h2 className="text-xl font-black text-blue-600 tracking-tighter flex items-center gap-2">
          Task<span className="text-slate-900">AI</span>
          <br />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Assignment</span>
        </h2>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
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
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">User</div>
          <div className="text-sm font-bold text-slate-900 mb-1">{profile?.fullName}</div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="My Tasks" active={activeTab === 'tasks'} onClick={() => { setActiveTab('tasks'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<ListChecks size={20} />} label="Task Details" active={activeTab === 'details'} onClick={() => { setActiveTab('details'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<UserIcon size={20} />} label="Profile Status" active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }} />
        </nav>

        <div className="mt-auto p-4 border-t border-slate-200">
          <button onClick={() => auth.signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto lg:mt-0 mt-16">
        {activeTab === 'tasks' ? (
          <>
            <header className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 tracking-tight">My Tasks</h1>
              <p className="text-slate-600 text-sm font-medium">Your assigned tasks and subtasks</p>
            </header>

            {/* Reminder Alerts */}
            {overdueReminders.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6 text-orange-900">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle size={20} className="text-orange-600" />
                  <div>
                    <h3 className="text-sm font-bold">Overdue reminder alerts</h3>
                    <p className="text-xs text-orange-700">{overdueReminders.length} task(s) are overdue by 2+ days and need follow-up.</p>
                  </div>
                </div>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {overdueReminders.map(sub => (
                    <li key={sub.id}>
                      <span className="font-semibold">{sub.title}</span> for {sub.assignedToName} was due {new Date(sub.deadline!).toLocaleDateString('en-GB').replace(/\//g, '-')} ({getDaysPastDeadline(sub.deadline)} days ago)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Completion Progress Bar */}
            {userSubtasks.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Task Completion Status</h3>
                    <span className="text-sm font-bold text-emerald-600">
                      {Math.round((userSubtasks.filter(s => s.status === 'done').length / userSubtasks.length) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(userSubtasks.filter(s => s.status === 'done').length / userSubtasks.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-slate-100">
                    <ListChecks className="text-purple-600" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Subtask</div>
                      <div className="text-lg font-bold text-slate-600">{userSubtasks.length}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <Clock className="text-orange-600" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending</div>
                      <div className="text-lg font-bold text-orange-600">{userSubtasks.filter(s => s.status === 'pending').length}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Clock className="text-blue-600" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">In Progress</div>
                      <div className="text-lg font-bold text-blue-600">{userSubtasks.filter(s => s.status === 'inprogress').length}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <AlertCircle className="text-red-600" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">On Hold</div>
                      <div className="text-lg font-bold text-red-600">{userSubtasks.filter(s => s.status === 'hold').length}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100 mt-4">
                  <CheckCircle2 className="text-emerald-600" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</div>
                    <div className="text-lg font-bold text-emerald-600">{userSubtasks.filter(s => s.status === 'done').length}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center mb-4">
              <h1 className="text-2xl lg:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <PieChart size={26} className="text-slate-600" /> Subtasks Overview
              </h1>
            </div>

            {userSubtasks.length > 0 ? (
              <div className="space-y-4">
                {userSubtasks.map(subtask => (
                  <SubtaskCard key={subtask.id} subtask={subtask} onStatusChange={updateStatus} />
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">No tasks assigned to you yet</p>
              </div>
            )}
          </>
        ) : activeTab === 'details' ? (
          <TaskDetailsPanel taskDetails={taskDetails} />
        ) : (
          <ProfilePanel profile={profile} />
        )}

      </main>
    </div>
  );
}

// <!--line off 390 --> 475  -->