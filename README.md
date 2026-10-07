# Task-AI Assignment Smart System

TaskAI is a real-time team task management system for assigning work based on team roles and skills. Admins create users and high-level tasks, API suggests a breakdown into subtasks, and team members update the status of their assigned work. 

## Features

- Firebase Email/Password authentication for admins and team members.
- Separate admin and team-member dashboards.
- Team member registration with role, user ID, and skills.
- Task creation with Low, Medium, and High priorities.
- API-powered task breakdown into 3–5 suggested subtasks.
- Skill- and role-aware assignee suggestions based on the available team.
- Subtask statuses: `pending`, `inprogress`, `hold`, and `done`.
- Real-time Firestore updates for users, tasks, subtasks, and settings.
- Completion progress, workload counts, overdue reminders, and charts.
- Configurable role capacity limits.
- Text export of users and task data.
- Responsive layouts for desktop and mobile screens.

## Tech Stack

- React 19 and TypeScript
- Vite 6 with Tailwind CSS 4
- Firebase Authentication and Cloud Firestore
- API via `@google/genai`
- Express and `tsx` for the local and production server
- Lucide React, Motion, and Recharts

## Project Structure

The source is organized by application layer and business feature:

```text
src/
  app/                  # Application composition and top-level providers
  features/
    auth/               # Sign-in UI and authentication context
    admin-dashboard/    # Admin pages, dashboard components, and data hook
    user-dashboard/     # Team-member pages and dashboard components
  shared/
    constants/          # Role and skill definitions
    infrastructure/     # Firebase setup and AI task-breakdown integration
    lib/                # Shared utilities
    types/              # Shared domain types
  main.tsx              # Browser entry point
  index.css             # Global styles
```

Keep feature-specific UI and behavior inside its feature folder. Put code in `shared/` only when it is reused across features or represents an application-wide integration or domain definition.

## Prerequisites

- Node.js 18 or newer
- npm
- A Firebase project with Authentication and Cloud Firestore enabled
- A API API key for AI task breakdowns

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root:

   ```env
   API_KEY=your_api_key
   ```

   Vite injects this value into the client bundle through `vite.config.ts`. Do not use a production client bundle for a sensitive API key without adding a server-side proxy and rotating the exposed key.

3. Enable **Email/Password** under Firebase Authentication.

4. Create a Firestore database and deploy the rules:

   ```bash
   firebase deploy --only firestore:rules
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The Express server hosts Vite in middleware mode and exposes `GET /api/health`, which returns `{ "status": "ok" }`.

## Available Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express/Vite development server on port 3000 |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the Vite production build |
| `npm run lint` | Run the TypeScript compiler without emitting files |
| `npm run clean` | Remove the `dist/` directory |

## Authentication and Onboarding

### Admins

Use the **Admin** login tab with Firebase Email/Password credentials. The current demo includes a bootstrap path for ` ? `; the first login can create the account and an Admin profile automatically.

After signing in, an admin can:

1. Register team members with an email, custom user ID, role, and at least one skill.
2. Create a task and generate an AI breakdown.
3. Review the suggested subtasks and their assignees.
4. Monitor task progress, workload, deadlines, and reminders.
5. Adjust role capacity settings and export a text report.

## Firestore Data Model

The application uses these top-level collections:

| Collection | Purpose |
| --- | --- |
| `users/{uid}` | User profiles, roles, skills, and active task counts |
| `tasks/{taskId}` | High-level tasks created by admins |
| `subtasks/{subTaskId}` | AI-generated work items assigned to team members |
| `settings/role_slots` | Role capacity limits |

Important fields include:

- **User:** `uid`, `email`, `fullName`, `userId`, `role`, `skills`, `activeTasksCount`
- **Task:** `title`, `description`, `priority`, `deadline`, `status`, `createdBy`, `createdAt`
- **Subtask:** `taskId`, `title`, `description`, `assignedTo`, `assignedToName`, `status`, `skillsRequired`, `deadline`

Firestore rules are stored in [firestore.rules](firestore.rules). Authenticated users can read application data. Admins can create, update, and delete users and tasks; assigned users can update only the status of their own subtasks.

## Production Build

Build the frontend:

```bash
npm run build
```

The included Express server serves `dist/` when `NODE_ENV=production`:

PowerShell:

```powershell
$env:NODE_ENV="production"
npm run dev
```

The server listens on `0.0.0.0:3000`. Set the hosting platform's start command to `npm run dev` and provide `NODE_ENV=production` and `API_API_KEY`.

## Project Structure

```text
.
├── server.ts                  # Express server and Vite middleware
├── firebase-applet-config.json # Firebase web app configuration
├── firestore.rules             # Firestore access rules
├── vite.config.ts              # Vite, Tailwind, and API env injection
└── src/
    ├── App.tsx                 # Authenticated app routing
    ├── components/
    │   ├── Auth.tsx
    │   ├── AdminDashboard.tsx
    │   └── UserDashboard.tsx
    ├── contexts/AuthContext.tsx
    ├── lib/API.ts           # API task breakdown
    ├── firebase.ts             # Firebase initialization
    ├── types.ts
    └── constants.ts
```

## GIT UPDATE 
```text

PS C:\Users\user\Downloads\AI Project 2026\TaskAi-Assignment-Smart-System> git init                      
Reinitialized existing Git repository in C:/Users/user/Downloads/AI Project 2026/TaskAi-Assignment-Smart-System/.git/
PS C:\Users\user\Downloads\AI Project 2026\TaskAi-Assignment-Smart-System> git add .                     
PS C:\Users\user\Downloads\AI Project 2026\TaskAi-Assignment-Smart-System> git commit -m "Initial commit"
[main ecda375] Initial commit
 3 files changed, 3 insertions(+), 3 deletions(-)
PS C:\Users\user\Downloads\AI Project 2026\TaskAi-Assignment-Smart-System> git Push
Github update!

```
