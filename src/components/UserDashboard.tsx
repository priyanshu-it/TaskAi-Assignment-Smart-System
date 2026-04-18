import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, getDocs, collectionGroup, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { SubTask, SubTaskStatus } from '../types';
import { ListChecks, PieChart, Clock, CheckCircle2, LogOut, User as UserIcon, LayoutDashboard, Loader2, AlertCircle, Menu, X, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export default function UserDashboard() {
  const { profile } = useAuth();
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'tasks' | 'profile'>('tasks');

  useEffect(() => {
    if (!profile?.email) {
      console.log("UserDashboard: No profile email, skipping subtask fetch");
      return;
    }

    console.log("UserDashboard: Fetching subtasks for email:", profile.email);
    const q = query(collection(db, 'subtasks'), where('assignedTo', '==', profile.email));
    const unsub = onSnapshot(q, (snapshot) => {
      console.log("UserDashboard: Received subtasks snapshot for", profile.email, "count:", snapshot.size);
      if (snapshot.size === 0) {
        console.log("UserDashboard: No subtasks found. Check if 'assignedTo' in Firestore exactly matches", profile.email);
      }
      setSubtasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SubTask)));
      setLoading(false);
    }, (error) => {
      console.error("UserDashboard: Error fetching subtasks:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [profile?.email]);

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

  
  const getDeadlineInfo = (deadline?: string) => {
    if (!deadline) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let label = deadline;
    if (daysRemaining < 0) {
      label = `Overdue`;
    } else if (daysRemaining === 0) {
      label = 'Due Today';
    } else if (daysRemaining <= 3) {
      label = `${daysRemaining} days left`;
    } else if (daysRemaining <= 7) {
      label = `${daysRemaining} days left`;
    }

    const colorClass =
      daysRemaining < 0 ? 'text-red-600 bg-red-50 border-red-200' :
      daysRemaining === 0 ? 'text-orange-600 bg-orange-50 border-orange-200' :
      daysRemaining <= 3 ? 'text-amber-600 bg-amber-50 border-amber-200' :
      daysRemaining <= 7 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
      'text-slate-600 bg-slate-50 border-slate-200';

    return {
      label,
      date: deadline,
      color: colorClass
    };
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
          <br/>
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Smart Assignment</span>
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
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white flex flex-col z-50 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-200 hidden lg:block">
          <h2 className="text-xl font-black text-blue-600 tracking-tighter flex items-center gap-2">
            Task<span className="text-slate-900">AI</span>
            <br/>
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Smart Assignment</span>
          </h2>
        </div>
        
        <div className="p-6 border-b border-slate-100 lg:mt-0 mt-16">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">User</div>
          <div className="text-sm font-bold text-slate-900 mb-1">{profile?.fullName}</div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="My Tasks" active={activeTab === 'tasks'} onClick={() => { setActiveTab('tasks'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<UserIcon size={20}/>} label="Profile" active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }} />
        </nav>

        <div className="p-4 border-t border-slate-200">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              {/* <StatCard label="My Tasks" value={new Set(subtasks.map(s => s.taskId)).size} icon={<LayoutDashboard className="text-blue-600" />} /> */}
              <StatCard label="Total Subtasks" value={subtasks.length} icon={<ListChecks className="text-purple-600" />} />
              <StatCard label="Pending" value={subtasks.filter(s => s.status === 'pending').length} icon={<Clock className="text-orange-600" />} />
              <StatCard label="In Progress" value={subtasks.filter(s => s.status === 'inprogress').length} icon={<Clock className="text-yellow-600" />} />
              
              <StatCard label="Deadlines Soon" value={subtasks.filter(s => {
                const info = getDeadlineInfo(s.deadline);
                return info && (info.label === 'Due Today' || info.label.endsWith('days left'));
              }).length} icon={<Calendar className="text-amber-600" />} /> 
              
              <StatCard label="Hold" value={subtasks.filter(s => s.status === 'hold').length} icon={<Clock className="text-red-600" />} />
              <StatCard label="Completed" value={subtasks.filter(s => s.status === 'done').length} icon={<CheckCircle2 className="text-emerald-600" />} />  
           
            </div>
              <h1 className="text-2xl lg:text-2xl font-bold text-slate-800 mb-4 tracking-tight"><PieChart size={24} className="inline mb-1 text-slate-600"/> Task or Subtasks Overview</h1>
            {subtasks.length > 0 ? (
              <div className="space-y-4">
                {subtasks.map(sub => (
                  <div key={sub.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[11px] font-bold uppercase tracking-wider">
                          Project: {sub.parentTaskTitle}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{sub.title}</h3>
                      <p className="text-sm text-slate-600 mb-4">{sub.description}</p>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                          <UserIcon size={14} className="text-slate-400" />
                          <span className="text-xs font-medium text-slate-600">{sub.assignedToName}</span>
                        </div>
                        {sub.deadline && getDeadlineInfo(sub.deadline) && (
                          <div className={cn(
                            "flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium",
                            getDeadlineInfo(sub.deadline)!.color
                          )}>
                            <Calendar size={14} />
                            <span>{getDeadlineInfo(sub.deadline)!.date}</span>
                            {getDeadlineInfo(sub.deadline)!.label !== getDeadlineInfo(sub.deadline)!.date && (
                              <span className="ml-1">({getDeadlineInfo(sub.deadline)!.label})</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {sub.skillsRequired.map(s => (
                          <span key={s} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider">{s}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
                        <select 
                          value={sub.status} 
                          onChange={(e) => updateStatus(sub, e.target.value as SubTaskStatus)}
                          className={cn(
                            "px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20",
                            sub.status === 'done' ? "text-emerald-600 border-emerald-500/30 bg-emerald-50/30" :
                            sub.status === 'inprogress' ? "text-blue-600 border-blue-500/30 bg-blue-50/30" :
                            sub.status === 'hold' ? "text-orange-600 border-orange-500/30 bg-orange-50/30" :
                            "text-slate-500"
                          )}
                        >
                          {sub.status !== 'done' && (
                            <>
                              <option value="pending">Pending</option>
                              <option value="inprogress">In Progress</option>
                              <option value="hold">On Hold</option>
                              <option value="done">Completed</option>
                            </>
                          )}

                          {sub.status === 'done' && (
                            <option value="">Completed</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">No tasks assigned to you yet</p>
              </div>
            )}
          </>
        ) : (
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
        )}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
        active ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <div className="text-2xl font-black text-slate-900 mb-1">{value}</div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}
