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

### Test-Driven Development (TDD)

**Mandatory TDD approach for all features:**

Planit follows strict **Test-Driven Development** (TDD) for all backend and frontend implementations. This ensures code quality, prevents regressions, and documents expected behavior.

**Red-Green-Refactor Cycle:**

1. **Red**: Write a failing test first that describes the desired behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code structure while keeping tests green

**Backend TDD Workflow:**

```bash
# 1. Create test file (e.g., cardController.test.js)
# 2. Write failing test
describe('Card Controller', () => {
  it('should create a card with valid data', async () => {
    const res = await request(app)
      .post('/api/lists/123/cards')
      .send({ title: 'Test Card' });
    expect(res.status).toBe(201);
  });
});

# 3. Run test (should fail)
npm test -- cardController.test.js

# 4. Implement controller logic to pass test
# 5. Run test again (should pass)
# 6. Refactor if needed
```

**Frontend TDD Workflow:**

```bash
# 1. Create test file (e.g., CardModal.test.jsx)
# 2. Write failing test
describe('CardModal', () => {
  it('renders card title input', () => {
    render(<CardModal />);
    expect(screen.getByLabelText('Card Title')).toBeInTheDocument();
  });
});

# 3. Run test (should fail)
npm test -- CardModal.test.jsx

# 4. Implement component to pass test
# 5. Run test again (should pass)
# 6. Refactor if needed
```

**TDD Best Practices:**

- **Never write production code without a failing test first**
- **Write the simplest test first**, then add edge cases
- **One test failure at a time** - fix before moving to next test
- **Test behavior, not implementation** - tests should survive refactoring
- **Mock external dependencies** (database, API calls) in unit tests
- **Integration tests** verify full request/response cycle

**Example TDD Session (Card Model):**

```bash
# Step 1: Write model test
it('should require title field', async () => {
  const card = new Card({ listId: '123' });
  await expect(card.save()).rejects.toThrow();
});

# Step 2: Run test → FAILS (model doesn't exist yet)

# Step 3: Create minimal Card model
const cardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  listId: { type: mongoose.Schema.Types.ObjectId, required: true }
});

# Step 4: Run test → PASSES

# Step 5: Add more tests (position, description, etc.)
# Step 6: Implement features to pass new tests
```

**CI Enforcement:**

All PRs must have:

- 100% test coverage for new code (enforced in reviews)
- All tests passing (automated CI check)
- No skipped/pending tests without justification

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

### Modular Component Architecture (Testability-First)

**CRITICAL: Design components for testability from the start by extracting logic into separate, testable units.**

#### Architecture Layers

Components should be organized into three testable layers:

1. **Pure Functions (Helpers)** → `utils/` directory
   - Business logic without side effects
   - Data transformations, filtering, calculations
   - 100% unit testable with simple input/output tests
   - Zero dependencies on React or external APIs

2. **Custom Hooks** → `hooks/` directory
   - Stateful logic and side effects
   - API calls, state management, computed values
   - Testable with `@testing-library/react-hooks`
   - Reusable across components

3. **Presentational Components** → `components/`, `pages/`
   - Primarily JSX and UI logic
   - Minimal state (UI-only: modals, forms)
   - Uses helpers and hooks for all business logic
   - Simple integration tests

#### When to Extract Logic

**Extract to helpers when:**

- Logic is deterministic (same input → same output)
- No React state or hooks needed
- Examples: filtering, sorting, validation, date calculations

**Extract to custom hooks when:**

- Logic uses React hooks (useState, useEffect, etc.)
- Managing component lifecycle or side effects
- API calls, subscriptions, event listeners
- Examples: data fetching, form handling, drag & drop

**Keep in component when:**

- Simple event handlers (e.g., `onClick={() => setOpen(true)}`)
- Direct JSX rendering logic
- UI-only state (modal visibility, form inputs)

#### Example: Complex Component Refactoring

**❌ Before: Monolithic Component (Hard to Test)**

```jsx
const BoardPage = () => {
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  // 50+ lines of data fetching logic
  useEffect(() => {
    const fetchData = async () => {
      const boardRes = await boardAPI.getById(id);
      const listsRes = await listAPI.getByBoard(id);
      // ... complex logic
    };
    fetchData();
  }, [id]);

  // Complex filtering logic (untestable)
  const filteredLists = lists.map(list => ({
    ...list,
    cards: list.cards.filter(card => {
      if (!selectedMember) return true;
      return card.assignedTo?.some(m => m._id === selectedMember);
    }),
  }));

  // 100+ lines of drag & drop handlers
  const handleDragEnd = event => {
    // Complex reordering logic
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>{/* 200+ lines of JSX */}</DndContext>
  );
};
```

**✅ After: Modular Architecture (100% Testable)**

```javascript
// utils/boardHelpers.js - Pure Functions (100% coverage)
export const filterCardsByMember = (cards, memberId) => {
  if (!memberId) return cards;
  return cards.filter(card => card.assignedTo?.some(m => m._id === memberId));
};

export const applyFilters = (lists, filters) => {
  return lists.map(list => ({
    ...list,
    cards: filterCardsByMember(list.cards, filters.memberId),
  }));
};

// hooks/useBoardData.js - Data Fetching Hook
export const useBoardData = boardId => {
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const boardRes = await boardAPI.getById(boardId);
      const listsRes = await listAPI.getByBoard(boardId);
      setBoard(boardRes.data);
      setLists(listsRes.data);
      setLoading(false);
    };
    fetchData();
  }, [boardId]);

  return { board, lists, loading, setLists };
};

// hooks/useBoardFilters.js - Filtering Logic Hook
export const useBoardFilters = lists => {
  const [selectedMember, setSelectedMember] = useState(null);

  const filteredLists = useMemo(
    () => applyFilters(lists, { memberId: selectedMember }),
    [lists, selectedMember]
  );

  return { filteredLists, selectedMember, setSelectedMember };
};

// hooks/useBoardDrag.js - Drag & Drop Hook
export const useBoardDrag = (lists, setLists) => {
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const handleDragEnd = useCallback(
    event => {
      // Drag & drop logic
    },
    [lists, setLists]
  );

  return { sensors, handleDragEnd };
};

// pages/BoardPage.jsx - Clean Component (Mostly JSX)
const BoardPage = () => {
  const { boardId } = useParams();
  const { board, lists, loading, setLists } = useBoardData(boardId);
  const { filteredLists, selectedMember, setSelectedMember } =
    useBoardFilters(lists);
  const { sensors, handleDragEnd } = useBoardDrag(lists, setLists);

  if (loading) return <Loading />;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <h1>{board.name}</h1>
      <MemberFilter value={selectedMember} onChange={setSelectedMember} />
      {filteredLists.map(list => (
        <KanbanList key={list._id} list={list} />
      ))}
    </DndContext>
  );
};
```

#### Testing Strategy

**Helpers (Unit Tests):**

```javascript
// utils/__tests__/boardHelpers.test.js
describe('filterCardsByMember', () => {
  it('should filter cards by member ID', () => {
    const cards = [
      { _id: '1', assignedTo: [{ _id: 'user1' }] },
      { _id: '2', assignedTo: [{ _id: 'user2' }] },
    ];
    const result = filterCardsByMember(cards, 'user1');
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('1');
  });
});
```

**Hooks (Hook Tests):**

```javascript
// hooks/__tests__/useBoardData.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { useBoardData } from '../useBoardData';

describe('useBoardData', () => {
  it('should fetch board data', async () => {
    const { result } = renderHook(() => useBoardData('board123'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.board).toBeDefined();
    });
  });
});
```

**Components (Integration Tests):**

```javascript
// pages/__tests__/BoardPage.test.jsx
describe('BoardPage', () => {
  it('should render board with filtered cards', async () => {
    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByText('My Board')).toBeInTheDocument();
    });

    // Select member filter
    userEvent.selectOptions(screen.getByRole('combobox'), 'user1');

    // Verify only filtered cards are visible
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.queryByText('Card 2')).not.toBeInTheDocument();
  });
});
```

#### Refactoring Existing Components

When inheriting large, untestable components:

1. **Identify logic types**: pure functions, stateful hooks, UI-only
2. **Extract helpers first**:Move pure logic to `utils/`
3. **Extract hooks**: Move stateful logic to `hooks/`
4. **Simplify component**: Keep only JSX and simple handlers
5. **Write tests progressively**: Start with helpers (easiest), then hooks, then integration

**Metrics:**

- Target: 80%+ branch coverage
- Helpers should achieve 100% coverage
- Hooks should achieve 85%+ coverage
- Components need only integration tests (not full unit coverage)

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
