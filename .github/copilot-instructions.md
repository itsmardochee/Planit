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

### Pre-commit Testing (Mandatory)

- Always run lint + tests locally BEFORE committing any change.
- Backend:
  ```bash
  cd server
  npx eslint src/
  npm test -- --watchAll=false --passWithNoTests
  ```
- Frontend:
  ```bash
  cd client
  npx eslint src/
  npm test -- --watch=false --passWithNoTests
  ```
- Optional: simulate CI locally with `act`:
  ```bash
  act push -j backend-test --container-architecture linux/amd64
  act push -j frontend-test --container-architecture linux/amd64
  ```

### Branching & Commits

Follow **Conventional Commits** (see CONTRIBUTING.md):

```bash
feat(workspace): add member invitation feature
fix(card): resolve drag-drop on mobile
test(board): add controller unit tests
```

Branch naming: `feature/description`, `bugfix/description`, `hotfix/description`

### Git Workflow

**Branch Strategy (GitFlow):**

- `main` - Production-ready code (protected)
- `dev` - Integration branch for features (protected)
- `feature/*` - New features (merge into `dev`)
- `bugfix/*` - Bug fixes (merge into `dev`)
- `hotfix/*` - Critical production fixes (merge into `main` then `dev`)

**Pull Request Rules:**

- **Always create PRs targeting `dev` branch** (not `main`)
- Exception: `hotfix/*` branches target `main` directly
- PRs must pass all CI checks before merge
- Merge `dev` into `main` only after validation/release cycle

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
      userId: req.user.id, // From JWT middleware
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

### Vite-Specific Conventions

- **Environment variables**: Must be prefixed with `VITE_`

  ```javascript
  // ✅ Access env vars
  const apiUrl = import.meta.env.VITE_API_URL;

  // ❌ Wrong - process.env doesn't work in Vite
  const apiUrl = process.env.REACT_APP_API_URL;
  ```

- **Dev server port**: 5173 (not 3000)
- **Build output**: `dist/` (not `build/`)
- **Import paths**: Use ES modules syntax only

  ```javascript
  // ✅ Correct
  import React from 'react';

  // ❌ Wrong - CommonJS not supported
  const React = require('react');
  ```

### Testing with Vitest

- Use **Vitest** (not Jest) for frontend tests
- Test files: `*.test.js` or `*.test.jsx` alongside components
- Setup file: `src/test/setup.js`
- Run tests: `npm test`
- Imports use Vitest, not Jest:
  ```javascript
  import { describe, it, expect, vi } from 'vitest'; // not from 'jest'
  ```

Example test pattern:

```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WorkspaceCard from './WorkspaceCard';

describe('WorkspaceCard', () => {
  it('renders workspace name', () => {
    const workspace = { name: 'My Workspace' };
    render(<WorkspaceCard workspace={workspace} />);
    expect(screen.getByText('My Workspace')).toBeInTheDocument();
  });
});
```

### Error Handling Patterns

- **Backend**: Always use try-catch with standardized error responses
  ```javascript
  const createWorkspace = async (req, res) => {
    try {
      const workspace = await Workspace.create(req.body);
      res.status(201).json({ success: true, data: workspace });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  ```
- **Frontend**: Use Axios interceptors for global error handling
  ```javascript
  axios.interceptors.response.use(
    response => response,
    error => {
      // Handle errors globally
      const message = error.response?.data?.message || 'An error occurred';
      // Show toast notification
      return Promise.reject(error);
    }
  );
  ```

### MongoDB Best Practices

- **Always validate ObjectId** before queries:
  ```javascript
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }
  ```
- Use `.lean()` for read-only queries (better performance):
  ```javascript
  const workspaces = await Workspace.find({ userId }).lean();
  ```
- **Always include userId filter** for user-specific data:

  ```javascript
  // ✅ Correct - prevents access to other users' data
  const workspace = await Workspace.findOne({ _id: id, userId: req.user.id });

  // ❌ Wrong - security issue
  const workspace = await Workspace.findById(id);
  ```

- **Implement cascade deletes** when deleting parent resources:
  ```javascript
  // When deleting workspace, also delete all boards, lists, cards
  await Board.deleteMany({ workspaceId });
  await List.deleteMany({ boardId: { $in: boardIds } });
  await Card.deleteMany({ boardId: { $in: boardIds } });
  ```

### Material UI Conventions

- **Import individually**: `import { Button, Card } from '@mui/material';`
- **Use MUI theme** for colors (no hardcoded colors)
- **Prefer MUI components** over custom CSS for layout
- **Use sx prop** for styling:
  ```jsx
  <Box
    sx={{
      padding: 2,
      backgroundColor: 'primary.main',
      borderRadius: 1,
    }}
  >
    Content
  </Box>
  ```
- **Icons**: Import from `@mui/icons-material`
  ```jsx
  import DeleteIcon from '@mui/icons-material/Delete';
  <IconButton>
    <DeleteIcon />
  </IconButton>;
  ```

### File Naming Conventions

- **Backend files**: camelCase.js
  - Controllers: `userController.js`, `authController.js`
  - Models: `User.js`, `Workspace.js` (PascalCase for models)
  - Middleware: `auth.js`, `errorHandler.js`
  - Routes: `authRoutes.js`, `workspaceRoutes.js`
- **Frontend Components**: PascalCase.jsx
  - Pages: `LoginPage.jsx`, `Dashboard.jsx`
  - Components: `WorkspaceCard.jsx`, `Navbar.jsx`
- **Frontend Utils**: camelCase.js
  - `apiHelpers.js`, `formatDate.js`, `validators.js`
- **Tests**: Same name as file with `.test.js` or `.test.jsx`
  - `WorkspaceCard.test.jsx`, `authController.test.js`
- **Constants**: UPPER_SNAKE_CASE.js
  - `API_ENDPOINTS.js`, `COLORS.js`

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
VITE_API_URL=http://localhost:5000/api
```

## Docker Development

```bash
docker-compose -f docker-compose.dev.yml up --build  # Dev with hot-reload
docker-compose up --build                            # Production mode
```

## Critical Gotchas

1. **MongoDB ObjectId**: Always use `mongoose.Types.ObjectId.isValid()` before queries
2. **CORS**: Backend must allow `http://localhost:5173` in development (Vite)
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
