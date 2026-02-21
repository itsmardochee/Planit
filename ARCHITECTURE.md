# Planit Architecture

## System Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Vite + React   │ ◄─────► │  Express API    │ ◄─────► │  MongoDB Atlas  │
│  (Port 5173)    │  HTTP   │  (Port 5000)    │         │                 │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Data Hierarchy

```
User
 └── Workspace (many)
      └── Board (many)
           └── List (many)
                └── Card (many)
```

### Relationships

- **User ← Workspace**: One user owns many workspaces
- **Workspace ← Board**: One workspace contains many boards
- **Board ← List**: One board contains many lists
- **List ← Card**: One list contains many cards

### Cascade Deletes

When deleting:
- **User** → Deletes all workspaces → all boards → all lists → all cards
- **Workspace** → Deletes all boards → all lists → all cards
- **Board** → Deletes all lists → all cards
- **List** → Deletes all cards

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Workspace Model
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  userId: ObjectId (ref: User, indexed),
  createdAt: Date,
  updatedAt: Date
}
```

### Board Model
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  workspaceId: ObjectId (ref: Workspace, indexed),
  userId: ObjectId (ref: User, indexed),
  background: String,
  archived: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### List Model
```javascript
{
  _id: ObjectId,
  title: String,
  boardId: ObjectId (ref: Board, indexed),
  position: Number (for ordering),
  createdAt: Date,
  updatedAt: Date
}
```

### Card Model
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  listId: ObjectId (ref: List, indexed),
  boardId: ObjectId (ref: Board, indexed),
  position: Number (for ordering),
  assignedTo: [ObjectId] (ref: User),
  labels: [ObjectId] (ref: Label),
  dueDate: Date,
  status: String (enum: active, archived),
  createdAt: Date,
  updatedAt: Date
}
```

### Activity Model
```javascript
{
  _id: ObjectId,
  workspaceId: ObjectId (ref: Workspace, required, indexed),
  boardId: ObjectId (ref: Board, indexed),
  cardId: ObjectId (ref: Card, indexed),
  userId: ObjectId (ref: User, required, indexed),
  action: String (enum: created, updated, moved, deleted, commented, assigned, archived, required),
  entityType: String (enum: workspace, board, list, card, comment, member, label, required),
  details: Mixed (flexible field for additional context),
  createdAt: Date
}
```

**Activity Indexes:**
- `{ workspaceId: 1, createdAt: -1 }` — Workspace activity queries
- `{ boardId: 1, createdAt: -1 }` — Board activity queries
- `{ cardId: 1, createdAt: -1 }` — Card activity queries
- `{ userId: 1, createdAt: -1 }` — User activity queries

### Comment Model
```javascript
{
  _id: ObjectId,
  cardId: ObjectId (ref: Card, required, indexed),
  userId: ObjectId (ref: User, required),
  text: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

### Label Model
```javascript
{
  _id: ObjectId,
  boardId: ObjectId (ref: Board, required, indexed),
  name: String (required),
  color: String (hex color code),
  createdAt: Date,
  updatedAt: Date
}
```

### WorkspaceMember Model
```javascript
{
  _id: ObjectId,
  workspaceId: ObjectId (ref: Workspace, required, indexed),
  userId: ObjectId (ref: User, required, indexed),
  role: String (enum: owner, member, default: member),
  invitedAt: Date,
  position: Number (for ordering),
  // Stretch goals:
  // labels: [String],
  // dueDate: Date,
  // assignees: [ObjectId],
  // attachments: [String],
  createdAt: Date,
  updatedAt: Date
}
```

## API Structure

### Authentication Flow

```
1. User Registration
   POST /api/auth/register
   ├── Validate input
   ├── Hash password (bcrypt)
   ├── Create user
   └── Return JWT token

2. User Login
   POST /api/auth/login
   ├── Validate credentials
   ├── Compare password
   └── Return JWT token

3. Protected Routes
   GET /api/workspaces
   ├── Extract token from header
   ├── Verify JWT
   ├── Attach user to req.user
   └── Process request
```

### Request/Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Frontend Architecture

### State Management (Redux Toolkit)

```
store/
├── authSlice.js        # User authentication state
├── workspaceSlice.js   # Workspaces state
├── boardSlice.js       # Boards state
├── listSlice.js        # Lists state
├── cardSlice.js        # Cards state
└── index.js            # Store configuration
```

### Component Structure

```
pages/
├── Login.jsx           # Login page
├── Register.jsx        # Registration page
├── Dashboard.jsx       # Workspaces overview
├── BoardView.jsx       # Board with lists and cards
└── NotFound.jsx        # 404 page

components/
├── Layout/
│   ├── Navbar.jsx
│   └── Sidebar.jsx
├── Workspace/
│   ├── WorkspaceCard.jsx
│   ├── WorkspaceModal.jsx
│   └── WorkspaceList.jsx
├── Board/
│   ├── BoardCard.jsx
│   ├── BoardModal.jsx
│   ├── BoardHeader.jsx
│   └── BoardEditModal.jsx
├── List/
│   ├── KanbanList.jsx
│   ├── ListEditModal.jsx
│   └── AddList.jsx
├── Card/
│   ├── KanbanCard.jsx
│   ├── CardModal.jsx
│   └── AddCard.jsx
├── Activity/
│   ├── ActivityFeed.jsx
│   └── ActivityItem.jsx
├── Members/
│   ├── InviteMembers.jsx
│   ├── MemberList.jsx
│   └── MemberSelector.jsx
└── Common/
    ├── DarkModeToggle.jsx
    ├── LanguageSelector.jsx
    ├── ToastProvider.jsx
    └── ProtectedRoute.jsx
```

## Activity Logging System

### Architecture

The activity logging system tracks all user actions across the application hierarchy:

```
User Action → Controller → logActivity() → Activity Model → Database
                                ↓
                    Activity Feed (Frontend) ← API Endpoint
```

### Integration Points (19 total)

**Card Controller** (7 actions):
- `createCard` → action: 'created', entityType: 'card'
- `updateCard` → action: 'updated', entityType: 'card'
- `deleteCard` → action: 'deleted', entityType: 'card'
- `reorderCard` → action: 'moved', entityType: 'card'
- `assignMember` → action: 'assigned', entityType: 'card'
- `unassignMember` → action: 'unassigned', entityType: 'card'
- `updateCardStatus` → action: 'updated', entityType: 'card'

**List Controller** (4 actions):
- `createList`, `updateList`, `deleteList`, `reorderList`

**Board Controller** (3 actions):
- `createBoard`, `updateBoard`, `deleteBoard`

**Workspace Controller** (3 actions):
- `createWorkspace`, `updateWorkspace`, `deleteWorkspace`

**Comment Controller** (2 actions):
- `createComment` → action: 'commented', entityType: 'comment'
- `deleteComment` → action: 'deleted', entityType: 'comment'

### Activity Endpoints

- `GET /api/workspaces/:workspaceId/activity` — Get workspace activities
- `GET /api/boards/:id/activity` — Get board activities
- `GET /api/cards/:id/activity` — Get card activities

**Query Parameters:**
- `limit` (default: 50) — Pagination limit
- `skip` (default: 0) — Pagination offset
- `action` — Filter by action type
- `entityType` — Filter by entity type

### Details Field Structure

The `details` field stores action-specific context:

```javascript
// Card created
{ cardTitle: "Task 1" }

// Card moved between lists
{
  cardTitle: "Task 1",
  fromList: "To Do",
  toList: "In Progress",
  from: { listId: ObjectId, position: 0 },
  to: { listId: ObjectId, position: 1 }
}

// Member assigned
{
  cardTitle: "Task 1",
  assignedUser: "john.doe"
}
```

### Frontend Components

- **ActivityFeed.jsx** — Main container fetching and displaying activities
- **ActivityItem.jsx** — Individual activity entry with formatted messages
- **BoardPage.jsx** — Drawer integration with activity feed

## Security

### Authentication
- JWT tokens with 7-day expiry
- Tokens stored in localStorage
- HTTP-only cookies (stretch goal)

### Authorization
- User can only access their own resources
- Middleware checks ownership before operations
- MongoDB queries include userId filter
- Activity endpoints protected by `checkWorkspaceAccess` middleware

### Validation
- Input validation with express-validator
- Sanitize user input
- Validate ObjectId format

### Password Security
- Passwords hashed with bcrypt (10 rounds)
- Never return passwords in API responses
- Password minimum length: 6 characters

## Performance Considerations

### Database
- Index on frequently queried fields (userId, workspaceId, boardId, listId)
- Limit query results with pagination
- Use lean() for read-only queries

### Frontend
- React.memo for expensive components
- Lazy loading for routes
- Debounce search inputs
- Virtual scrolling for long lists (stretch goal)

### Caching
- Redux state as client-side cache
- MongoDB query result caching (stretch goal)

## Deployment Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Vercel    │         │   Render    │         │   MongoDB   │
│  (Frontend) │ ──────► │  (Backend)  │ ──────► │    Atlas    │
│             │  HTTPS  │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

### Environment Variables

**Production Backend:**
- `NODE_ENV=production`
- `MONGO_URI=<production-uri>`
- `JWT_SECRET=<strong-secret>`
- `PORT=5000`

**Production Frontend:**
- `VITE_API_URL=<backend-url>/api`

## Testing Strategy

### Backend Tests (Jest + Supertest)
```
__tests__/
├── auth.test.js        # Auth endpoints
├── workspace.test.js   # Workspace CRUD
├── board.test.js       # Board CRUD
├── list.test.js        # List CRUD + ordering
└── card.test.js        # Card CRUD + ordering
```

### Frontend Tests (Vitest + RTL)
```
src/
├── components/
│   ├── WorkspaceCard.test.jsx
│   ├── Board.test.jsx
│   └── Card.test.jsx
└── hooks/
    ├── useAuth.test.js
    └── useWorkspaces.test.js
```

## Error Handling

### Backend
- Global error handler middleware
- Try-catch in async controllers
- Mongoose error handling
- Validation errors

### Frontend
- Error boundaries for React errors
- Axios interceptors for API errors
- Toast notifications for user feedback
- Fallback UI for errors

## Monitoring & Logging

### Development
- Console logging
- Request logging (morgan)

### Production (Stretch Goals)
- Error tracking (Sentry)
- Performance monitoring
- Database query logging
- User activity tracking

---

**Last Updated:** February 21, 2026
