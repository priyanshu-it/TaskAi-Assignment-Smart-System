import { Role } from "./types";

export const ROLE_SLOTS: Record<Exclude<Role, "Admin">, number> = {
  "Front-End Developer": 5,
  "Back-End Developer": 5,
  "Full-Stack Developer": 4,
  "Mobile App Developer": 3,
  "DevOps Engineer": 2,
  "QA Engineer (Tester)": 2,
  "UI/UX Designer": 3,
  "Data Scientist": 2,
  "Data Analyst": 2,
  "Data Engineer": 2,
  "Business Intelligence (BI) Analyst": 2,
  "Machine Learning Engineer": 3,
  "AI Specialist": 2,
};

export const ALL_SKILLS = [
  "React", "Node.js", "Python", "TypeScript", "PostgreSQL", "MongoDB", "Docker", "AWS",
  "TensorFlow", "REST API", "Testing", "Figma", "SQL", "Kubernetes", "Flutter", "Swift",
  "Kotlin", "Go", "Java", "C++", "PyTorch", "Scikit-learn", "Tableau", "PowerBI"
];
