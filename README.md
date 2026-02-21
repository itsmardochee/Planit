# Planit

[![Backend CI](https://github.com/itsmardochee/Planit/actions/workflows/backend.yml/badge.svg?branch=main)](https://github.com/itsmardochee/Planit/actions/workflows/backend.yml)
[![Frontend CI](https://github.com/itsmardochee/Planit/actions/workflows/frontend.yml/badge.svg?branch=main)](https://github.com/itsmardochee/Planit/actions/workflows/frontend.yml)
[![Docker Build](https://github.com/itsmardochee/Planit/actions/workflows/docker.yml/badge.svg?branch=main)](https://github.com/itsmardochee/Planit/actions/workflows/docker.yml)
[![Code Quality](https://github.com/itsmardochee/Planit/actions/workflows/code-quality.yml/badge.svg?branch=main)](https://github.com/itsmardochee/Planit/actions/workflows/code-quality.yml)
[![codecov](https://codecov.io/github/itsmardochee/Planit/branch/main/graph/badge.svg?token=XD6A1ZX2UN)](https://codecov.io/github/itsmardochee/Planit)

> "Plan your success, one board at a time." — _The Planit Team_

**A Trello-like Web Application built with React, Node.js, and MongoDB**

---

## 📘 Overview

Planit is a professional, production-oriented **Trello-like web application** built as part of a 3-month simulated professional project at Epitech. The app focuses on implementing **core Kanban features** — Workspaces → Boards → Lists → Cards — with an emphasis on clean architecture, collaboration tools, and scalability.

Planit provides a solid foundation for team organization and project tracking while remaining flexible enough to evolve with future needs.

### 🌐 Live Demo

- **Frontend**: [https://planit-nine-psi.vercel.app](https://planit-nine-psi.vercel.app)
- **Backend API**: [https://planit-3fms.onrender.com](https://planit-3fms.onrender.com)
- **API Documentation**: [https://planit-3fms.onrender.com/api-docs](https://planit-3fms.onrender.com/api-docs)

---

## 🧠 Objectives

- Deliver a **maintainable, modular MVP** focused on reliability and usability.
- Apply **agile practices**, **test-driven development**, and **CI/CD pipelines**.
- Provide a **responsive**, **Material UI-based** user interface.
- Prepare a foundation ready for **future collaboration and real-time updates**.

---

## 🚀 Features

### ✅ MVP (Must-Have)

- **Authentication & User Management**: Sign up, login/logout (JWT), profile editing.
- **Workspaces**: CRUD operations, workspace metadata (name, description).
- **Boards**: CRUD operations, workspace-based grouping, board settings (title, background, archive).
- **Lists**: CRUD + drag & drop reordering within a board.
- **Cards**: CRUD + reordering within lists and between lists.
- **Activity Log**: Complete activity tracking across workspace → board → list → card hierarchy with 19 integration points.
- **UI/UX**: Material UI components, snackbars for feedback, responsive dashboard.

### ✨ Implemented Features

- **Workspace members & roles** (Owner, Member)
- **Comments** on cards
- **Labels** for card categorization
- **Due dates** with overdue indicators
- **Assignees** - assign/unassign members to cards
- **Activity Log** - Track all actions (create, update, delete, move, assign, comment) with:
  - Real-time activity feed in BoardPage drawer
  - Pagination and filtering support
  - Internationalization (EN/FR)
  - 50 comprehensive tests

### 🌟 Stretch Goals

- File attachments
- Real-time updates (Socket.IO)
- Search functionality
- Export boards

---

## 🧩 Technology Stack

### Frontend

- **React.js (latest stable)**
- **Vite** (build tool and dev server)
- **Material UI (MUI)**
- **Redux Toolkit** or **React Query** (for state management)
- **react-router-dom** (routing)
- **dnd-kit** or **Pragmatic Drag and Drop** (drag & drop)
- **Axios** (API communication)
- **Vitest** (testing framework)

### Backend

- **Node.js + Express**
- **MongoDB (Atlas)** with **Mongoose** ORM
- **JWT** authentication (jsonwebtoken)
- **Jest + Supertest** for API testing

### DevOps / Tools

- **GitHub** (repo, issues, Projects/Kanban)
- **GitHub Actions** (CI)
- **Docker** (for dev and production)
- **Vercel** (frontend deployment)
- **Render/Railway** (backend deployment)
- **MongoDB Atlas** (database)
- **Postman / Insomnia** (API testing)

---

## 🧱 Architecture

```
client/ (React)
  ├── src/
  │   ├── components/
  │   │   ├── ActivityFeed.jsx
  │   │   ├── ActivityItem.jsx
  │   │   ├── BoardEditModal.jsx
  │   │   ├── CardModal.jsx
  │   │   ├── InviteMembers.jsx
  │   │   ├── KanbanCard.jsx
  │   │   ├── KanbanList.jsx
  │   │   ├── LabelManager.jsx
  │   │   ├── MemberList.jsx
  │   │   └── MemberSelector.jsx
  │   ├── pages/
  │   │   ├── Login.jsx
  │   │   ├── Dashboard.jsx
  │   │   ├── BoardPage.jsx
  │   │   └── WorkspacePage.jsx
  │   ├── store/
  │   ├── hooks/
  │   ├── utils/
  │   └── App.jsx
server/ (Express)
  ├── src/
  │   ├── routes/
  │   ├── controllers/
  │   │   ├── authController.js
  │   │   ├── activityController.js
  │   │   ├── boardController.js
  │   │   ├── cardController.js
  │   │   ├── commentController.js
  │   │   ├── labelController.js
  │   │   ├── listController.js
  │   │   └── workspaceController.js
  │   ├── models/
  │   │   ├── Activity.js
  │   │   ├── Board.js
  │   │   ├── Card.js
  │   │   ├── Comment.js
  │   │   ├── Label.js
  │   │   ├── List.js
  │   │   ├── User.js
  │   │   ├── Workspace.js
  │   │   └── WorkspaceMember.js
  │   ├── middlewares/
  │   └── index.js
```

---

## 🧪 Testing Strategy

- **Backend:** Jest + Supertest for API endpoints (auth, workspaces, boards, lists, cards, comments, labels, notifications, activities).
  - **664 tests passing** including 50 activity-specific tests
- **Frontend:** Vitest + React Testing Library for components, hooks, and pages.
  - **658 tests passing** including 30 activity-specific tests
- **Total:** **1322 tests passing** across backend and frontend
- **CI:** GitHub Actions runs tests on every PR before merging with automated coverage reporting.

---

## ⚙️ Setup & Run

### 1. Clone the repository

```bash
git clone https://github.com/itsmardochee/Planit.git
cd Planit
```

### 2. Setup environment variables

Create a `.env` file in both `client/` and `server/` directories.

**Backend `.env` example:**

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
NODE_ENV=development
```

**Frontend `.env` example:**

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 4. Run without Docker

#### Backend

```bash
cd server
npm run dev
```

(Default: [http://localhost:5000](http://localhost:5000))

#### Frontend

```bash
cd client
npm run dev
```

(Default: [http://localhost:5173](http://localhost:5173))

### 5. Run with Docker (Development Mode)

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This will start both frontend and backend services in development mode with hot-reload enabled.

### 6. Run with Docker (Production)

```bash
docker-compose up --build
```

This will start both frontend and backend services in a production-like environment.

---

## 🧭 Contributing

We welcome contributions from anyone interested in improving **Planit**.
Please refer to the [CONTRIBUTING.md](./CONTRIBUTING.md) file for detailed guidelines on branching strategy, coding conventions, and commit message formatting.

---

## 🧱 Deployment

### Production URLs

- **Frontend**: [https://planit-nine-psi.vercel.app](https://planit-nine-psi.vercel.app) (Vercel)
- **Backend API**: [https://planit-3fms.onrender.com](https://planit-3fms.onrender.com) (Render)
- **API Docs**: [https://planit-3fms.onrender.com/api-docs](https://planit-3fms.onrender.com/api-docs) (Swagger UI)
- **Database**: MongoDB Atlas (shared cluster)
- **CI/CD**: GitHub Actions

### Deployment Guides

- **Frontend:** deployed on Vercel - see [docs/DEPLOYMENT-VERCEL.md](./docs/DEPLOYMENT-VERCEL.md)
- **Backend:** deployed on Render - see [docs/DEPLOYMENT-RENDER.md](./docs/DEPLOYMENT-RENDER.md)

### Quick Deployment Guide

**Step 1: Deploy Backend to Render**

- Follow the comprehensive guide in [docs/DEPLOYMENT-RENDER.md](./docs/DEPLOYMENT-RENDER.md)
- Set environment variables (`NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `API_URL`)
- Test Swagger documentation at `https://your-service.onrender.com/api-docs`

**Step 2: Deploy Frontend to Vercel**

- Follow the guide in [docs/DEPLOYMENT-VERCEL.md](./docs/DEPLOYMENT-VERCEL.md)
- Configure `VITE_API_URL` to point to your Render backend URL
- Test the deployed application

For detailed step-by-step instructions, refer to the deployment guides above.

---
