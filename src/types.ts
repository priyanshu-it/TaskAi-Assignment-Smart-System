export type Role = 
  | "Front-End Developer"
  | "Back-End Developer"
  | "Full-Stack Developer"
  | "Mobile App Developer"
  | "DevOps Engineer"
  | "QA Engineer (Tester)"
  | "UI/UX Designer"
  | "Data Scientist"
  | "Data Analyst"
  | "Data Engineer"
  | "Business Intelligence (BI) Analyst"
  | "Machine Learning Engineer"
  | "AI Specialist"
  | "Admin";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  userId: string;
  role: Role;
  skills: string[];
  activeTasksCount: number;
}

export type TaskStatus = "pending" | "inprogress" | "done";
export type SubTaskStatus = "pending" | "inprogress" | "hold" | "done";
export type Priority = "Low" | "Medium" | "High";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  deadline: string;
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
}

export interface SubTask {
  id: string;
  taskId: string;
  parentTaskTitle?: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  status: SubTaskStatus;
  skillsRequired: string[];
  deadline: string;
}
