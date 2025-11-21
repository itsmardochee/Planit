# Frontend UI - Trello-like Kanban Board

This React frontend replicates Trello's interface with a complete Kanban board experience.

## ✨ UI Features

### 1. **Landing Page** (`/`)

- Hero section with features overview
- Call-to-action buttons
- Tech stack showcase
- Responsive design

### 2. **Authentication** (`/login`)

- Toggle between login and registration
- Email validation
- Password confirmation on register
- JWT token management
- Persistent login (localStorage)

### 3. **Dashboard** (`/dashboard`)

- Grid of workspace cards
- Create new workspace button
- Workspace metadata (name, description)
- Quick access to boards
- Responsive grid layout

### 4. **Workspace Page** (`/workspace/:workspaceId`)

- Workspace header with details
- Grid of board cards
- Create new board button
- Navigate to individual boards
- Color-coded board backgrounds

### 5. **Kanban Board** (`/board/:boardId`)

- **Lists as Columns**: Each list displayed as a vertical column
- **Cards in Lists**: Cards shown as individual items within lists
- **Add New List**: "Add another list" button at the end
- **Add New Card**: Quick add card form in each list
- **Edit Card Modal**: Click card to open detail view
  - Edit title and description
  - View metadata (created, updated dates)
  - Delete card
- **Responsive Layout**: Scrollable horizontal list layout

## 🎨 Design System

### Colors (Trello-inspired)

- Primary Blue: `#0052CC`
- Dark Blue: `#003399`
- Success Green: `#61BD4F`
- Error Red: `#EB5A46`
- Light Gray: `#F8F9FA`

### Component Styling

- Tailwind CSS for all styling
- MUI removed from main layouts (kept for legacy theme)
- Consistent button styles
- Rounded corners and shadows
- Hover effects and transitions

### Typography

- Clean sans-serif stack
- Font sizes for hierarchy
- Proper line heights
- Color contrast for accessibility

## 📱 Responsive Breakpoints

- **Mobile**: < 640px - Single column layouts
- **Tablet**: 640px - 1024px - Two columns
- **Desktop**: > 1024px - Three+ columns
- **Kanban Board**: Horizontal scroll for lists

## 🔐 Authentication Flow

```
User visits / (home)
  ↓
Not authenticated → Redirects to login
  ↓
User logs in/registers
  ↓
JWT token stored in localStorage
  ↓
Axios interceptor adds token to all requests
  ↓
User redirected to /dashboard
  ↓
Can now access protected routes
```

## 📊 Data Flow

```
Dashboard
  ├── Fetch workspaces
  ├── Display workspace cards
  └── Click → Navigate to workspace

WorkspacePage
  ├── Fetch boards in workspace
  ├── Display board cards
  └── Click → Navigate to board

BoardPage
  ├── Fetch lists in board
  ├── Fetch cards for each list
  ├── Display Kanban layout
  ├── User interacts:
  │   ├── Add list
  │   ├── Add card
  │   ├── Edit card (modal)
  │   └── Delete card
  └── API calls update backend
```

## 🚀 Quick Start

```bash
# Install dependencies
cd client
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Component Hierarchy

```
App.jsx
├── Routes
│   ├── Home (public)
│   ├── Login (public)
│   ├── Dashboard (protected)
│   │   └── Workspace cards
│   ├── WorkspacePage (protected)
│   │   └── Board cards
│   └── BoardPage (protected)
│       ├── KanbanList (x multiple)
│       │   ├── KanbanCard (x multiple)
│       │   └── Add Card Form
│       ├── Add List Form
│       └── CardModal (when card clicked)
├── ToastProvider (notifications)
└── Redux Store
    ├── Auth state
    ├── Workspaces state
    ├── Boards state
    ├── Lists state
    └── Cards state
```

## 🎯 User Journeys

### Journey 1: First Time User

1. User lands on `/` (Home)
2. Clicks "Get Started" or "Sign Up"
3. Fills register form
4. Backend validates and creates account
5. Redirects to login
6. User logs in
7. Redirected to `/dashboard`
8. Creates first workspace
9. Creates first board
10. Starts using Kanban board

### Journey 2: Existing User

1. User visits `/`
2. Already logged in → Redirects to `/dashboard`
3. Clicks on workspace → Goes to `/workspace/:id`
4. Clicks on board → Goes to `/board/:id`
5. Creates lists and cards
6. Edits/deletes cards
7. Navigates back via "← Back" buttons

## 🔧 Key Technical Decisions

1. **Tailwind CSS over Material UI**: Faster styling, more control
2. **Redux Toolkit**: Centralized state management for data fetching
3. **Vite**: Fast builds and dev server
4. **localStorage for tokens**: Simple persistence (no refresh token yet)
5. **Axios interceptors**: Centralized API error handling
6. **Protected routes**: React component wrapping unauthorized access

## 🎨 Future UI Enhancements

- [ ] Dark mode toggle
- [ ] Drag-and-drop cards between lists
- [ ] Drag-and-drop list reordering
- [ ] Card labels with colors
- [ ] Card due dates with calendar
- [ ] Card cover images
- [ ] Comments section on cards
- [ ] Activity feed
- [ ] User avatars
- [ ] Real-time collaboration (WebSocket)
- [ ] Card templates
- [ ] Board templates
- [ ] Keyboard shortcuts
- [ ] Search functionality
- [ ] Filter by label/member

## 📖 Component Documentation

### KanbanList.jsx

Displays a column of cards with add new card functionality.

Props:

- `list` (object): List data with id, name, cards
- `boardId` (string): Board ID for context
- `onCardClick` (function): Callback when card clicked
- `onListUpdate` (function): Callback to refresh data

### KanbanCard.jsx

Single card component with delete functionality.

Props:

- `card` (object): Card data
- `listId` (string): Parent list ID
- `onClick` (function): Callback when card clicked
- `onDelete` (function): Callback when delete clicked

### CardModal.jsx

Modal for viewing/editing card details.

Props:

- `card` (object): Card to edit
- `boardId` (string): Board context
- `onClose` (function): Close modal callback
- `onCardUpdate` (function): Update data callback

### ProtectedRoute.jsx

Guard component for authenticated routes.

Props:

- `children` (ReactNode): Route component

## 🌐 API Integration

All API calls go through centralized `utils/api.js`:

- Request interceptor adds JWT token
- Response interceptor handles 401 errors
- Automatic token refresh on expiry (future)
- Centralized error handling

## 💾 State Management

Redux Toolkit slices:

1. **auth**: User and token data
2. **workspaces**: Workspace list and current
3. **boards**: Board list and current
4. **lists**: Lists in current board
5. **cards**: Cards in current list

Each slice has reducers for SET, ADD, UPDATE, DELETE operations.

## ♿ Accessibility

- Semantic HTML elements
- Color contrast ratios meet WCAG AA
- Keyboard navigation support (planned)
- ARIA labels on interactive elements
- Focus states on buttons

## 🧪 Testing (Planned)

- Unit tests for components
- Integration tests for API calls
- E2E tests for user journeys
- Coverage reporting

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Security Considerations

- JWT token in localStorage (xss risk - consider HttpOnly)
- CORS requests to backend
- No sensitive data in Redux (logs visible in DevTools)
- Input validation on forms
- API error messages sanitized
