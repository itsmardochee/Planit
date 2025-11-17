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
│   └── BoardHeader.jsx
├── List/
│   ├── List.jsx
│   ├── ListHeader.jsx
│   └── AddList.jsx
└── Card/
    ├── Card.jsx
    ├── CardModal.jsx
    └── AddCard.jsx
```

## Security

### Authentication
- JWT tokens with 7-day expiry
- Tokens stored in localStorage
- HTTP-only cookies (stretch goal)

### Authorization
- User can only access their own resources
- Middleware checks ownership before operations
- MongoDB queries include userId filter

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

**Last Updated:** October 26, 2025
