import { useEffect, useState, type FormEvent } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db } from '../../../shared/infrastructure/firebase';
import { ROLE_SLOTS } from '../../../shared/constants/roles';
import { isReminderDue } from '../../../shared/lib/utils';
import { breakdownTask } from '../../../shared/infrastructure/taskBreakdown';
import type { Role, SubTask, Task, UserProfile } from '../../../shared/types';
import type { AdminTab } from '../components/AdminDashboardLayout';
import type { NewUserDraft } from '../components/UserManagementPanel';
import type { NewTaskDraft, SuggestedSubtask } from '../components/CreateTaskPanel';

const initialUser: NewUserDraft = {
  fullName: '',
  email: '',
  userId: '',
  role: 'Front-End Developer',
  skills: []
};

const initialTask: NewTaskDraft = {
  title: '',
  description: '',
  priority: 'Medium',
  deadline: '',
  skillsRequired: []
};

function generateUserId(email: string, fullName: string) {
  if (!email || !fullName) return '';
  const emailPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const namePart = fullName
    .split(' ')
    .map(name => name.charAt(0).toLowerCase())
    .join('')
    .replace(/[^a-z]/g, '');
  const randomSuffix = Math.floor(Math.random() * 900) + 100;
  return `${emailPart}_${namePart}_${randomSuffix}`;
}

export default function useAdminDashboard(onNavigate: (tab: AdminTab) => void) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [roleSlots, setRoleSlots] = useState<Record<string, number>>(ROLE_SLOTS);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [newUser, setNewUser] = useState<NewUserDraft>(initialUser);
  const [newTask, setNewTask] = useState<NewTaskDraft>(initialTask);
  const [aiBreakdown, setAiBreakdown] = useState<SuggestedSubtask[] | null>(null);

  const minimumDeadlineDate = new Date();
  minimumDeadlineDate.setDate(minimumDeadlineDate.getDate() + 5);
  const minimumDeadline = minimumDeadlineDate.toLocaleDateString('en-CA');

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), snapshot => {
      setUsers(snapshot.docs.map(document => document.data() as UserProfile));
    });
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), snapshot => {
      setTasks(snapshot.docs.map(document => ({ id: document.id, ...document.data() } as Task)));
    });
    const unsubscribeSubtasks = onSnapshot(collection(db, 'subtasks'), snapshot => {
      setSubtasks(snapshot.docs.map(document => ({ id: document.id, ...document.data() } as SubTask)));
    });
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'role_slots'), snapshot => {
      if (snapshot.exists()) {
        setRoleSlots(snapshot.data() as Record<string, number>);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
      unsubscribeSubtasks();
      unsubscribeSettings();
    };
  }, []);

  useEffect(() => {
    if (newUser.email || newUser.fullName) {
      const generatedId = generateUserId(newUser.email, newUser.fullName);
      setNewUser(previous => ({ ...previous, userId: generatedId }));
    }
  }, [newUser.email, newUser.fullName]);

  const handleAddUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newUser.fullName.trim() || !newUser.email.trim() || !newUser.userId.trim() || newUser.skills.length === 0) {
      alert("fill the form to register a user");
      return;
    }

    if (users.some(user => user.email === newUser.email)) {
      alert("Email already exists");
      return;
    }

    setLoading(true);
    try {
      const tempUid = Math.random().toString(36).substring(7);
      await setDoc(doc(db, 'users', tempUid), {
        uid: tempUid,
        ...newUser,
        activeTasksCount: 0
      });
      setNewUser(initialUser);
      onNavigate('users');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAiBreakdown = async () => {
    if (!newTask.title || !newTask.description) return;
    setLoading(true);
    try {
      const result = await breakdownTask(newTask.title, newTask.description, users.filter(user => user.role !== 'Admin'));
      setAiBreakdown(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!aiBreakdown) return;
    if (newTask.deadline && newTask.deadline < minimumDeadline) {
      alert('Deadline must be at least 5 days from today');
      return;
    }
    setLoading(true);
    try {
      const taskRef = await addDoc(collection(db, 'tasks'), {
        ...newTask,
        status: 'pending',
        createdBy: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      });

      for (const subtask of aiBreakdown) {
        await addDoc(collection(db, 'subtasks'), {
          taskId: taskRef.id,
          parentTaskTitle: newTask.title,
          ...subtask,
          status: 'pending',
          deadline: newTask.deadline
        });
        const assignedUserQuery = query(collection(db, 'users'), where('email', '==', subtask.assignedTo));
        const assignedUserSnapshot = await getDocs(assignedUserQuery);
        if (!assignedUserSnapshot.empty) {
          await updateDoc(doc(db, 'users', assignedUserSnapshot.docs[0].id), {
            activeTasksCount: increment(1)
          });
        }
      }

      setNewTask(initialTask);
      setAiBreakdown(null);
      onNavigate('all-tasks');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLoad = (email: string) =>
    subtasks.filter(subtask => subtask.assignedTo === email && subtask.status !== 'done').length;

  const handleDeleteTask = async (taskId: string) => {
    try {
      const taskSubtasksQuery = query(collection(db, 'subtasks'), where('taskId', '==', taskId));
      const taskSubtasksSnapshot = await getDocs(taskSubtasksQuery);
      const userTaskCounts: Record<string, number> = {};

      for (const document of taskSubtasksSnapshot.docs) {
        const subtask = document.data();
        if (subtask.assignedTo) {
          userTaskCounts[subtask.assignedTo] = (userTaskCounts[subtask.assignedTo] || 0) + 1;
        }
      }

      for (const email in userTaskCounts) {
        const assignedUserQuery = query(collection(db, 'users'), where('email', '==', email));
        const assignedUserSnapshot = await getDocs(assignedUserQuery);
        if (!assignedUserSnapshot.empty) {
          await updateDoc(doc(db, 'users', assignedUserSnapshot.docs[0].id), {
            activeTasksCount: increment(-userTaskCounts[email])
          });
        }
      }

      await Promise.all(
        taskSubtasksSnapshot.docs.map(document => deleteDoc(doc(db, 'subtasks', document.id)))
      );
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error(error);
    }
  };

  const overdueReminders = subtasks.filter(subtask =>
    subtask.deadline && subtask.status !== 'done' && isReminderDue(subtask.deadline)
  );

  const handleUpdateRoleSlots = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'role_slots'), roleSlots);
      window.location.href = '/Dashboard';
    } catch (error) {
      console.error(error);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportText = () => {
    try {
      let text = `TASK AI EXPORT\n`;
      text += `Date: ${new Date().toLocaleString()}\n\n`;
      text += `=== USERS ===\n`;
      users.forEach((user, index) => {
        text += `${index + 1}. ${user.fullName} (${user.email})\n`;
        text += `   Role: ${user.role}\n\n`;
      });

      text += `=== TASKS ===\n`;
      tasks.forEach((task, index) => {
        const taskSubtasks = subtasks.filter(subtask => subtask.taskId === task.id);
        text += `${index + 1}. ${task.title}\n`;
        text += `   Status: ${task.status}\n`;
        text += `   Priority: ${task.priority}\n`;
        text += `   Deadline: ${task.deadline}\n`;
        text += `   Subtasks:\n`;
        taskSubtasks.forEach((subtask, subtaskIndex) => {
          text += `     ${subtaskIndex + 1}. ${subtask.title}\n`;
          text += `        Assigned: ${subtask.assignedToName}\n`;
          text += `        Status: ${subtask.status}\n`;
        });
        text += `\n`;
      });

      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `taskai_export_${new Date().toISOString().slice(0, 10)}.txt`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Text export failed:', error);
    }
  };

  const getSlotUsage = (role: Role) => {
    if (role === 'Admin') return 0;
    return users.filter(user => user.role === role).length;
  };

  const getRoleLimit = (role: string) =>
    roleSlots[role] || (ROLE_SLOTS as Record<string, number>)[role] || 5;

  const deleteUser = (uid: string) => deleteDoc(doc(db, 'users', uid));

  return {
    users,
    tasks,
    subtasks,
    roleSlots,
    setRoleSlots,
    loading,
    savingSettings,
    newUser,
    setNewUser,
    newTask,
    setNewTask,
    aiBreakdown,
    minimumDeadline,
    overdueReminders,
    handleAddUser,
    handleAiBreakdown,
    handleCreateTask,
    getUserLoad,
    handleDeleteTask,
    handleUpdateRoleSlots,
    handleExportText,
    getSlotUsage,
    getRoleLimit,
    deleteUser
  };
}
