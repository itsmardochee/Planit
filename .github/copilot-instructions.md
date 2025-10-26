# Planit - AI Coding Agent Instructions

## Project Overview

Planit is a **Trello-like Kanban board application** built with the MERN stack (MongoDB, Express, React, Node.js). The architecture follows a strict hierarchical model: **Workspaces → Boards → Lists → Cards**.

## Architecture Principles

### Monorepo Structure
```
client/          # React frontend with Material UI
server/          # Express backend with MongoDB
  ├── models/    # Mongoose schemas (User, Workspace, Board, List, Card)
  ├── controllers/  # Business logic
  ├── routes/    # API endpoints
  └── middlewares/  # Auth (JWT), validation, error handling
```

### Data Hierarchy & Relationships
- **One Workspace** has many **Boards** (userId reference)
- **One Board** has many **Lists** (workspaceId + boardId reference)
- **One List** has many **Cards** (boardId + listId reference)
- **Critical**: Maintain referential integrity - deleting a parent cascades to children

### Authentication Flow
- JWT tokens stored in `localStorage` (frontend)
- Protected routes use `auth` middleware validating `req.header('Authorization')`
- Token includes `userId` payload for ownership checks

## Development Conventions

### Documentation Language

**ALL code, documentation, and communication MUST be in English:**
- Code comments: `// Calculate total price`
- Variable/function names: `calculateTotal`, `userList` (not `calculerTotal`, `listeUtilisateurs`)
- Commit messages: `feat(auth): add JWT validation`
- Pull requests, issues, README files
- API documentation and inline docs

This ensures international accessibility and codebase consistency.

### Package Manager
**Always use `npm`** - never yarn. Commands:
```bash
cd server && npm install    # Backend deps
cd client && npm install    # Frontend deps
npm run dev                 # Development mode
npm test                    # Run Jest tests
```

### Branching & Commits
Follow **Conventional Commits** (see CONTRIBUTING.md):
```bash
feat(workspace): add member invitation feature
fix(card): resolve drag-drop on mobile
test(board): add controller unit tests
```

Branch naming: `feature/description`, `bugfix/description`, `hotfix/description`

### API Design Patterns
- **RESTful endpoints**: `/api/workspaces`, `/api/boards/:id`, etc.
- **Response format**: Always `{ success: boolean, data?: any, message?: string }`
- **Error handling**: Use try-catch in controllers, return `res.status(4xx/5xx).json({ message })`
- **Validation**: Use express-validator middleware before controllers

Example controller pattern:
```javascript
const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    const workspace = await Workspace.create({
      name,
      description,
      userId: req.user.id  // From JWT middleware
    });
    res.status(201).json({ success: true, data: workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Frontend Component Patterns
- **Functional components only** with React hooks
- **Material UI (MUI)** for all UI - never custom CSS for layout
- **State management**: Redux Toolkit (preferred) or React Query
- **File structure**:
  - `pages/` for route components (Dashboard, BoardView)
  - `components/` for reusable UI (WorkspaceCard, CardModal)
  - `hooks/` for custom hooks (useAuth, useWorkspaces)

Example component pattern:
```jsx
import { Card, CardContent, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const WorkspaceCard = ({ workspace, onDelete }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">{workspace.name}</Typography>
        <IconButton onClick={() => onDelete(workspace.id)}>
          <DeleteIcon />
        </IconButton>
      </CardContent>
    </Card>
  );
};
```

### Drag & Drop Implementation
- Use **dnd-kit** or **Pragmatic Drag and Drop** (not react-beautiful-dnd)
- Implement reordering with `position` field in Lists/Cards models
- Update positions on backend after D&D complete

### Testing Requirements
- **Backend**: Jest + Supertest for API endpoints
  - Test auth flows, CRUD operations, error cases
  - Mock MongoDB with `mongodb-memory-server`
- **Frontend**: Jest + React Testing Library
  - Test component rendering, user interactions, hooks
- **CI**: GitHub Actions runs tests on every PR (`npm test` in both dirs)

## Environment Configuration

**Backend** (`server/.env`):
```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
NODE_ENV=development
```

**Frontend** (`client/.env`):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Docker Development
```bash
docker-compose -f docker-compose.dev.yml up --build  # Dev with hot-reload
docker-compose up --build                            # Production mode
```

## Critical Gotchas

1. **MongoDB ObjectId**: Always use `mongoose.Types.ObjectId.isValid()` before queries
2. **CORS**: Backend must allow `http://localhost:3000` in development
3. **Token expiry**: JWT expires in 7 days - no refresh token in MVP
4. **Cascade deletes**: When deleting Workspace → delete all Boards → delete all Lists → delete all Cards
5. **Position indexing**: Lists/Cards use integer `position` field (0-indexed) for ordering

## MVP Scope vs Stretch Goals

**MVP (must implement first)**:
- Auth (register, login, JWT)
- Workspaces, Boards, Lists, Cards CRUD
- Drag & drop for Lists and Cards
- Basic Material UI dashboard

**Stretch goals (only after MVP)**:
- Members & roles
- Comments, labels, due dates
- File attachments
- Real-time updates (Socket.IO)
- Dark mode

## Deployment Targets
- **Frontend**: Vercel (auto-deploy from `main`)
- **Backend**: Render or Railway
- **Database**: MongoDB Atlas (shared cluster for dev/prod)

## When in Doubt
1. Check CONTRIBUTING.md for conventions
2. Follow patterns from existing controllers/components
3. Write tests alongside features (TDD encouraged)
4. Keep MVP scope - no feature creep before basic functionality works
