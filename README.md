# TaskFlow — Team Task Manager

A full-stack team task manager with role-based access control, kanban boards, and real-time dashboards.

## 🚀 Live Demo
> **Railway URL:** (https://team-task-manager-production-756b.up.railway.app/login)


## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, TanStack Query, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Deployment | Railway |

---

## ✨ Features

### Authentication
- JWT-based signup & login
- Persistent sessions with token refresh
- Secure password hashing with bcrypt

### Projects
- Create, edit, delete projects
- Project status tracking (active/completed/archived)
- Due dates and progress tracking
- Role-based access: **Owner**, **Admin**, **Member**

### Team Management
- Invite members by email
- Assign Admin or Member roles
- Remove members
- Per-project member lists

### Tasks
- Create tasks with title, description, priority, due date
- Assign tasks to project members
- 4-stage kanban board: **To Do → In Progress → Review → Done**
- Priority levels: Low, Medium, High, Critical
- Overdue detection

### Dashboard
- Stats: active projects, total tasks, in-progress, overdue
- Overdue tasks alert
- Tasks due in next 7 days
- Recent activity feed

### My Tasks
- All tasks assigned to current user
- Grouped by status
- Priority indicators
- Overdue highlighting

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/team-task-manager.git
cd team-task-manager
```

### 2. Set up the database
```bash
createdb taskmanager
```

### 3. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and JWT secret
npm install
node src/config/migrate.js   # Run migrations
npm run dev                  # Start on :5000
```

### 4. Frontend setup
```bash
cd frontend
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start                    # Start on :3000
```

---

## 🌐 Railway Deployment

### 1. Create a Railway project
```bash
railway login
railway init
```

### 2. Add PostgreSQL plugin
In Railway dashboard → Add Plugin → PostgreSQL

### 3. Set environment variables in Railway:
```
NODE_ENV=production
JWT_SECRET=your_secret_here
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://your-app.railway.app
```

### 4. Deploy
```bash
railway up
```

### 5. Run migrations
```bash
railway run node backend/src/config/migrate.js
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get profile |

### Projects
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects` | List user's projects | ✅ |
| POST | `/api/projects` | Create project | ✅ |
| GET | `/api/projects/:id` | Get project | Member |
| PUT | `/api/projects/:id` | Update project | Admin |
| DELETE | `/api/projects/:id` | Delete project | Admin |

### Members
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects/:id/members` | List members | Member |
| POST | `/api/projects/:id/members` | Add member by email | Admin |
| PUT | `/api/projects/:id/members/:userId` | Update role | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | Admin |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects/:id/tasks` | List tasks | Member |
| POST | `/api/projects/:id/tasks` | Create task | Member |
| GET | `/api/projects/:id/tasks/:taskId` | Get task | Member |
| PUT | `/api/projects/:id/tasks/:taskId` | Update task | Member |
| DELETE | `/api/projects/:id/tasks/:taskId` | Delete task | Member |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Overview stats |
| GET | `/api/dashboard/my-tasks` | My assigned tasks |

---

## 🔐 Role-Based Access

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| View project | ✅ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ |
| Update tasks | ✅ | ✅ | ✅ |
| Manage members | ✅ | ✅ | ❌ |
| Update project | ✅ | ✅ | ❌ |
| Delete project | ✅ | ✅ | ❌ |

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   └── src/
│       ├── config/       # DB connection, migrations
│       ├── controllers/  # Auth, Projects, Tasks, Dashboard
│       ├── middleware/   # Auth guard, error handler
│       └── routes/       # Express routers
├── frontend/
│   └── src/
│       ├── components/   # Layout, shared UI
│       ├── context/      # Auth context
│       ├── pages/        # Dashboard, Projects, Tasks, etc.
│       └── utils/        # API client
└── railway.toml          # Deployment config
```

---

## 👤 Author
Built for the Full-Stack Assignment — Team Task Manager
