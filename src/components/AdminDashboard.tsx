import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, doc, setDoc, deleteDoc, updateDoc, increment, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Role, Task, SubTask } from '../types';
import { ROLE_SLOTS, ALL_SKILLS } from '../constants';
import { Users, Plus, Trash2, LayoutDashboard, ListChecks, PieChart, LogOut, Loader2, Sparkles, CheckCircle2, Clock, AlertCircle, BarChart3, Menu, X, Bell, Pause, Copy, ArrowBigDown, ArrowBigDownDash, ArrowBigDownDashIcon, ArrowBigLeft, ArrowBigRight, ArrowBigRightDash } from 'lucide-react';
import { cn } from '../lib/utils';
import { breakdownTask } from '../lib/gemini';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'create-task' | 'all-tasks' | 'hold-status' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [roleSlots, setRoleSlots] = useState<Record<string, number>>(ROLE_SLOTS);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({ fullName: '', email: '', userId: '', role: 'Front-End Developer' as Role, skills: [] as string[] });
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium' as any, deadline: '', skillsRequired: [] as string[] });
  const [aiBreakdown, setAiBreakdown] = useState<any[] | null>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => d.data() as UserProfile));
    });
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
    const unsubSubtasks = onSnapshot(collection(db, 'subtasks'), (snapshot) => {
      setSubtasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SubTask)));
    });
    const unsubSettings = onSnapshot(doc(db, 'settings', 'role_slots'), (doc) => {
      if (doc.exists()) {
        setRoleSlots(doc.data() as Record<string, number>);
      }
    });

    return () => { unsubUsers(); unsubTasks(); unsubSubtasks(); unsubSettings(); };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // strict validation
    if (!newUser.fullName.trim() || !newUser.email.trim() || !newUser.userId.trim() || newUser.skills.length === 0) {
      alert("fill the form to register a user");
      return;
    }

    if (users.some(u => u.email === newUser.email)) {
      alert("Email already exists");
      return;
    }

    setLoading(true);
    try {
      // But the prompt asks for real Firebase.
      const tempUid = Math.random().toString(36).substring(7);
      await setDoc(doc(db, 'users', tempUid), {
        uid: tempUid,
        ...newUser,
        activeTasksCount: 0
      });
      setNewUser({ fullName: '', email: '', userId: '', role: 'Front-End Developer', skills: [] });
      setActiveTab('users');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAiBreakdown = async () => {
    if (!newTask.title || !newTask.description) return;
    setLoading(true);
    try {
      const result = await breakdownTask(newTask.title, newTask.description, users.filter(u => u.role !== 'Admin'));
      setAiBreakdown(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!aiBreakdown) return;
    setLoading(true);
    try {
      const taskRef = await addDoc(collection(db, 'tasks'), {
        ...newTask,
        status: 'pending',
        createdBy: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      });

      for (const sub of aiBreakdown) {
        await addDoc(collection(db, 'subtasks'), {
          taskId: taskRef.id,
          parentTaskTitle: newTask.title,
          ...sub,
          status: 'pending',
          deadline: newTask.deadline // ADD THIS
        });
        // Increment user task count - find user by email
        const userQuery = query(collection(db, 'users'), where('email', '==', sub.assignedTo));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          await updateDoc(doc(db, 'users', userSnap.docs[0].id), {
            activeTasksCount: increment(1)
          });
        }
      }
      setNewTask({ title: '', description: '', priority: 'Medium', deadline: '', skillsRequired: [] });
      setAiBreakdown(null);
      setActiveTab('all-tasks');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getUserLoad = (email: string) => {
    return subtasks.filter(
      s => s.assignedTo === email && s.status !== 'done'
    ).length;
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const subQuery = query(collection(db, 'subtasks'), where('taskId', '==', taskId));
      const subSnap = await getDocs(subQuery);

      // collect user decrement counts
      const userMap: Record<string, number> = {};
      for (const d of subSnap.docs) {
        const sub = d.data();
        if (sub.assignedTo) {
          userMap[sub.assignedTo] = (userMap[sub.assignedTo] || 0) + 1;
        }
      }

      // update users once per email
      for (const email in userMap) {
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const userSnap = await getDocs(userQuery);

        if (!userSnap.empty) {
          await updateDoc(doc(db, 'users', userSnap.docs[0].id), {
            activeTasksCount: increment(-userMap[email])
          });
        }
      }
      // delete subtasks
      await Promise.all(
        subSnap.docs.map(d => deleteDoc(doc(db, 'subtasks', d.id)))
      );
      // delete main task
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubTask = async (sub: SubTask) => {
    try {
      const userQuery = query(collection(db, 'users'), where('email', '==', sub.assignedTo));
      const userSnap = await getDocs(userQuery);

      if (!userSnap.empty) {
        await updateDoc(doc(db, 'users', userSnap.docs[0].id), {
          activeTasksCount: increment(-1)
        });
      }

      await deleteDoc(doc(db, 'subtasks', sub.id));

    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRoleSlots = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'role_slots'), roleSlots);
      window.location.href = '/Dashboard';
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // New export function to generate a text report of all tasks and users
  const handleExportText = () => {
    try {
      let text = `TASK AI EXPORT\n`;
      text += `Date: ${new Date().toLocaleString()}\n\n`;

      // USERS
      text += `=== USERS ===\n`;
      users.forEach((u, i) => {
        text += `${i + 1}. ${u.fullName} (${u.email})\n`;
        text += `   Role: ${u.role}\n\n`;
      });

      // TASKS + SUBTASKS
      text += `=== TASKS ===\n`;
      tasks.forEach((t, i) => {
        const taskSubs = subtasks.filter(s => s.taskId === t.id);
        text += `${i + 1}. ${t.title}\n`;
        text += `   Status: ${t.status}\n`;
        text += `   Priority: ${t.priority}\n`;
        text += `   Deadline: ${t.deadline}\n`;
        text += `   Subtasks:\n`;
        taskSubs.forEach((s, j) => {
          text += `     ${j + 1}. ${s.title}\n`;
          text += `        Assigned: ${s.assignedToName}\n`;
          text += `        Status: ${s.status}\n`;
        });
        text += `\n`;
      });

      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskai_export_${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Text export failed:', err);
    }
  };
  // end of new export function

  const getSlotUsage = (role: Role) => {
    if (role === 'Admin') return 0;
    return users.filter(u => u.role === role).length;
  };

  const getRoleLimit = (role: string) => {
    return roleSlots[role] || (ROLE_SLOTS as any)[role] || 5;
  };

  const generateUserId = (email: string, fullName: string) => {
    if (!email || !fullName) return '';
    const emailPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const namePart = fullName
      .split(' ')
      .map((n) => n.charAt(0).toLowerCase())
      .join('')
      .replace(/[^a-z]/g, '');
    const randomSuffix = Math.floor(Math.random() * 900) + 100;
    return `${emailPart}_${namePart}_${randomSuffix}`;
  };

  useEffect(() => {
    if (newUser.email || newUser.fullName) {
      const generatedId = generateUserId(newUser.email, newUser.fullName);
      setNewUser(prev => ({ ...prev, userId: generatedId }));
    }
  }, [newUser.email, newUser.fullName]);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans relative">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <h2 className="text-xl font-black text-blue-600 tracking-tighter flex items-center gap-2">
          Task<span className="text-slate-900">AI</span>
          <br />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Assignment</span>
        </h2>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white flex flex-col z-50 transition-transform duration-300 lg:relative lg:translate-x-0",
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
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Users size={20} />} label="Create User's" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Plus size={20} />} label="Create Task AI" active={activeTab === 'create-task'} onClick={() => { setActiveTab('create-task'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<ListChecks size={20} />} label="Tasks Status" active={activeTab === 'all-tasks'} onClick={() => { setActiveTab('all-tasks'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<Pause size={20} />} label="Hold Status" active={activeTab === 'hold-status'} onClick={() => { setActiveTab('hold-status'); setIsSidebarOpen(false); }} />
          {/* <SidebarItem icon={<PieChart size={20}/>} label="Edits Slots" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} /> */}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button onClick={() => auth.signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto lg:mt-0 mt-16">
        <header className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            {activeTab === 'dashboard' && "Dashboard"}
            {activeTab === 'users' && "User Management"}
            {activeTab === 'create-task' && "Create New Task"}
            {activeTab === 'all-tasks' && "All Tasks"}
            {activeTab === 'hold-status' && "Hold Status"}
            {activeTab === 'settings' && "Settings"}
          </h1>
          <p className="text-slate-600 text-sm font-medium">
            {activeTab === 'dashboard' && "Overview of all team activities and capacity"}
            {activeTab === 'users' && "Add and manage team members"}
            {activeTab === 'create-task' && "AI will break it into subtasks and suggest assignments"}
            {activeTab === 'all-tasks' && "View and manage all assigned tasks"}
            {activeTab === 'hold-status' && "Users with tasks on hold - contact for status"}
            {activeTab === 'settings' && "Manage role capacity and global limits"}
          </p>
        </header>
        {activeTab === 'all-tasks' && (<button onClick={handleExportText} className="mb-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20
        right-8 top-18 absolute cursor-pointer z-10">
          <BarChart3 size={16} />
          Export Report
        </button>)}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6">
              <div className="flex items-center gap-3 p-5 bg-white rounded-lg border border-blue-100 shadow-sm">
                <Users className="text-purple-600" />
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Team Members</div>
                  <div className="text-lg font-bold text-slate-600">{users.length}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-5 bg-pink-50 rounded-lg border border-orange-100 shadow-sm">
                <ListChecks className="text-orange-600" />
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tasks</div>
                  <div className="text-lg font-bold text-slate-600">{tasks.length}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-5 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
                <Clock className="text-blue-600" />
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Progress</div>
                  <div className="text-lg font-bold text-slate-600">{tasks.filter(t => t.status === 'inprogress').length}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-5 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm">
                <CheckCircle2 className="text-emerald-600" />
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</div>
                  <div className="text-lg font-bold text-slate-600">{tasks.filter(t => t.status === 'done').length}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">

                { /* Pending Hold Tasks Notification */}
                {subtasks.filter(s => s.status === 'hold').length > 0 && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="text-orange-600 flex-shrink-0 mt-1" size={24} />
                      <div>
                        <h3 className="font-bold text-slate-900 mb-2">Pending Hold Tasks Notification</h3>
                        <div className="space-y-2 text-sm text-slate-700">
                          <p>There are <span className="font-bold text-orange-600">{subtasks.filter(s => s.status === 'hold').length}</span> task(s) currently on hold.</p>
                          <p>Users assigned to these tasks need to be contacted for status updates:</p>
                          <ul className="list-disc list-inside space-y-1 mt-2">
                            {Array.from(new Set(subtasks.filter(s => s.status === 'hold').map(s => s.assignedTo))).map(email => {
                              const user = users.find(u => u.email === email);
                              return (
                                <li key={email}>
                                  <span className="font-semibold">{user?.fullName}</span> - {email} ({subtasks.filter(s => s.assignedTo === email && s.status === 'hold').length} hold task(s))
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Overview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users size={20} className="text-blue-600" />
                    Team Overview
                  </h3>
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Member</th>
                          <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                          <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Load</th>
                          <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {users.filter(u => u.role !== 'Admin').slice(0, 5).map(user => {
                          const load = getUserLoad(user.email); // ✅ dynamic load

                          return (
                            <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-900 text-sm">{user.fullName}</div>
                                <div className="text-[11px] text-slate-600">{user.email}</div>
                              </td>

                              <td className="p-4">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                  {user.role.split(' ')[0]}
                                </span>
                              </td>

                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[60px]">
                                    <div
                                      className={cn("h-full bg-blue-600",
                                        load > 3 && "bg-orange-500",
                                        load > 4 && "bg-red-500"
                                      )}
                                      style={{ width: `${Math.min((load / 6) * 100, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-600">{load}</span>
                                </div>
                              </td>

                              <td className="p-4">
                                <span
                                  className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                                    load === 0
                                      ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                  )}
                                >
                                  {load === 0 ? "Available" : "Active"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {users.filter(u => u.role !== 'Admin').length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400 text-xs font-medium italic">
                              No team members registered yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {users.filter(u => u.role !== 'Admin').length > 5 && (
                      <div className="p-3 border-t border-slate-100 text-center">
                        <button onClick={() => setActiveTab('users')} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">
                          View All Members
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChart size={20} className="text-blue-600" />
                    Capacity
                  </div>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wider"
                  >
                    Edit Slots
                  </button>
                </h3>
                <div className="space-y-3">
                  {Object.entries(roleSlots).map(([role, limit]) => {
                    const usage = getSlotUsage(role as Role);
                    const percentage = (usage / (limit as number)) * 100;
                    return (
                      <div key={role} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-[10px] text-slate-900 uppercase tracking-tight truncate max-w-[150px]">{role}</h4>
                          <span className="text-[10px] font-mono text-slate-500">{usage}/{limit}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full transition-all duration-500",
                              percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-orange-500" : "bg-blue-600"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
                <Plus size={20} className="text-blue-600" />
                Add New User
              </h3>
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Full Name" value={newUser.fullName} onChange={v => setNewUser({ ...newUser, fullName: v })} placeholder="John Doe" />
                <Input label="Email" type="email" value={newUser.email} onChange={v => setNewUser({ ...newUser, email: v })} placeholder="john@example.com" />
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">User ID (Auto-Generated)</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 font-bold flex items-center justify-between cursor-not-allowed">
                      {newUser.userId || 'Generating...'}
                    </div>
                    {newUser.userId && (
                      <button type="button" onClick={() => {
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
                  <select value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })}
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
                      <button key={skill} type="button" onClick={() => {
                        let skills;
                        if (newUser.skills.includes(skill)) {
                          // remove if already selected
                          skills = newUser.skills.filter(s => s !== skill);
                        } else {
                          // limit to 6
                          if (newUser.skills.length >= 6) return;
                          skills = [...newUser.skills, skill];
                        }
                        setNewUser({ ...newUser, skills });
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

            <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
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
                  {users.filter(u => u.role !== 'Admin').map(user => (
                    <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{user.fullName}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-700 font-bold">{user.userId}</span>
                          <button type="button" onClick={() => {
                            navigator.clipboard.writeText(user.userId);
                            alert('User ID copied!');
                          }}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Copy User ID"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-blue-200">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {user.skills.slice(0, 3).map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">{s}</span>
                          ))}
                          {user.skills.length > 3 && <span className="text-[9px] text-slate-500">+{user.skills.length - 3} more</span>}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm text-blue-600">{user.activeTasksCount}</td>
                      <td className="p-4">
                        <button onClick={() => deleteDoc(doc(db, 'users', user.uid))} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'create-task' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
              <Input label="Task Title" value={newTask.title} onChange={v => setNewTask({ ...newTask, title: v })} placeholder="e.g., Build user authentication system" />
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Description</label>
                <textarea value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Describe the task in detail..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm min-h-[120px] text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Priority</label>
                  <select value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-900"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <Input label="Deadline" type="date" value={newTask.deadline} onChange={v => setNewTask({ ...newTask, deadline: v })} />
              </div>
              <button onClick={handleAiBreakdown}
                disabled={loading || !newTask.title || !newTask.description}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl font-bold tracking-wide shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> AI Breakdown</>}
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
                <Sparkles size={20} className="text-purple-600" />
                AI Suggested Breakdown
              </h3>
              {aiBreakdown ? (
                <div className="space-y-4">
                  {aiBreakdown.map((sub, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-900">{sub.title}</h4>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Assign to: {sub.assignedToName}</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-3">{sub.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {sub.skillsRequired.map((s: string) => (
                          <span key={s} className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleCreateTask}
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
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Role Capacity</h2>
                  <p className="text-sm text-slate-600 font-medium">Manage the maximum number of active tasks each role can have.</p>
                </div>
                <button onClick={handleUpdateRoleSlots} disabled={savingSettings}
                  className="px-3 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  {savingSettings ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  Save
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(roleSlots).map(([role, limit]) => (
                  <div key={role} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">{role}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setRoleSlots(prev => ({ ...prev, [role]: Math.max(1, (prev[role] || 0) - 1) }))}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                      > -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-blue-600">{limit}</span>
                      <button onClick={() => setRoleSlots(prev => ({ ...prev, [role]: (prev[role] || 0) + 1 }))}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                      > +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'all-tasks' && (
          <div className="space-y-6">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onDelete={() => handleDeleteTask(task.id)} onDeleteSubTask={handleDeleteSubTask} />
            ))}
          </div>
        )}

        {activeTab === 'hold-status' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-center">
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User Details</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hold Tasks</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Task Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users
                    .filter(u => u.role !== 'Admin' && subtasks.some(s => s.assignedTo === u.email && s.status === 'hold'))
                    .map(user => {
                      const userHoldTasks = subtasks.filter(s => s.assignedTo === user.email && s.status === 'hold');
                      return (
                        <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-800 flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                              <div className="space-y-1">
                                <p className="text-sm">{user.fullName}</p>
                                <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-sm font-bold border border-orange-200">
                              {userHoldTasks.length}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="space-y-2">
                              {userHoldTasks.map(task => (
                                <div key={task.id} className="text-xs bg-orange-50 border border-orange-200 rounded-lg p-2">
                                  <div className="font-bold text-slate-900">{task.title}</div>
                                  <div className="text-slate-600">{task.description}</div>
                                  <div className="text-orange-600 font-semibold mt-1">Status: On Hold</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {users.filter(u => u.role !== 'Admin' && subtasks.some(s => s.assignedTo === u.email && s.status === 'hold')).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 text-sm font-medium italic">
                        No users with hold status tasks.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
      active ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
    )}
    >
      {icon} {label}
    </button>
  );
}

function Input({ label, type = "text", value, onChange, placeholder }: { label: string, type?: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-900"
      />
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onDelete: () => void;
  onDeleteSubTask: (sub: SubTask) => void;
  key?: any;
}

const TaskCard = ({ task, onDelete, onDeleteSubTask }: TaskCardProps) => {
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'subtasks'), where('taskId', '==', task.id));
    const unsub = onSnapshot(q, async (snapshot) => {
      const subs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as SubTask));
      setSubtasks(subs);

      // ✅ derive status
      const newStatus = getTaskStatusFromSubtasks(subs);
      // ✅ update only if changed (prevents loop)
      if (newStatus !== task.status) {
        await updateDoc(doc(db, 'tasks', task.id), {
          status: newStatus
        });
      }
    });
    return () => unsub();
  }, [task.id, task.status]);

  const completedCount = subtasks.filter(s => s.status === 'done').length;

  const getTaskStatusFromSubtasks = (subs: SubTask[]) => {
    if (subs.length === 0) return 'pending';

    const allDone = subs.every(s => s.status === 'done');
    if (allDone) return 'done';

    const hasHold = subs.some(s => s.status === 'hold');
    if (hasHold) return 'hold';

    const hasInProgress = subs.some(s => s.status === 'inprogress');
    if (hasInProgress) return 'inprogress';

    return 'pending';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1"><Clock size={14} /> Due: {new Date(task.deadline).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
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
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={onDelete}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 transition-all"
                  > Confirm
                  </button>

                  <button onClick={() => setShowConfirm(false)}
                    className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-300 transition-all"
                  > Cancel
                  </button>
                </div>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                > <Trash2 size={21} />
                </button>
              )}
            </>
          ) : (
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
              task.status === 'done' && "bg-emerald-50 text-emerald-600 border border-emerald-100",
              task.status === 'inprogress' && "bg-blue-50 text-blue-600 border border-blue-100",
              task.status === 'hold' && "bg-red-50 text-red-600 border border-red-100",
              task.status === 'pending' && "bg-slate-100 text-slate-500 border border-slate-200"
            )} > {task.status}
            </span>
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
            )}> {task.priority}
            </span>
          </h4>
          <div className="space-y-3">
            {subtasks.map(sub => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full",
                    sub.status === 'done' ? "bg-emerald-500" : sub.status === 'inprogress' ? "bg-blue-600" : "bg-slate-300"
                  )} />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{sub.title}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Assigned to: <span className="text-blue-600">{sub.assignedToName}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                    sub.status === 'done' ? "bg-emerald-50 text-emerald-600" :
                      sub.status === 'inprogress' ? "bg-blue-50 text-blue-600" :
                        sub.status === 'hold' ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                  )}> {sub.status}
                  </span>
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
};

// <!--Line off -->