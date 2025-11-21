# Frontend Development Guide

## Quick Start

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 3. Backend Must Be Running

Ensure the backend is running on `http://localhost:5000`:

```bash
cd server
npm install
npm run dev
```

## 📁 Folder Structure

```
src/
├── pages/                      # Route pages (full page components)
│   ├── Home.jsx               # Landing page
│   ├── Login.jsx              # Auth (login/register)
│   ├── Dashboard.jsx          # Workspace listing
│   ├── WorkspacePage.jsx      # Workspace with boards
│   └── BoardPage.jsx          # Kanban board view
├── components/                # Reusable components
│   ├── KanbanList.jsx         # List component with cards
│   ├── KanbanCard.jsx         # Individual card
│   ├── CardModal.jsx          # Card detail modal
│   ├── ProtectedRoute.jsx     # Auth guard
│   └── ToastProvider.jsx      # Notifications
├── hooks/                     # Custom React hooks
│   └── useAuth.js             # Auth state hook
├── store/                     # Redux state
│   └── index.js               # Store & slices
├── utils/                     # Utility functions
│   └── api.js                 # API client with interceptors
├── theme/                     # Theme configuration
│   └── theme.js               # MUI theme (legacy)
└── App.jsx                    # Main routing
```

## 🎯 Key Features Implemented

### Authentication

- Register with email/password
- Login with JWT token
- Token stored in localStorage
- Protected routes redirect to login

### Dashboard

- View all user workspaces
- Create new workspace
- Navigate to workspace

### Workspaces

- View workspace details
- List all boards in workspace
- Create new board
- Navigate to board

### Kanban Board (Main UI)

- Display lists as columns
- Display cards in lists
- Create new cards
- Edit card details in modal
- Delete cards
- Create new lists
- Responsive layout

## 🔧 Development Workflow

### Adding a New Page

1. Create component in `src/pages/YourPage.jsx`
2. Import in `App.jsx`
3. Add route:
   ```jsx
   <Route path="/your-route" element={<YourPage />} />
   ```

### Adding a New Component

1. Create component in `src/components/YourComponent.jsx`
2. Use props for data and callbacks
3. Import and use in pages

### Using Redux State

```jsx
import { useDispatch, useSelector } from 'react-redux';
import { setBoards } from '../store/index';

const MyComponent = () => {
  const dispatch = useDispatch();
  const boards = useSelector(state => state.boards.list);

  // dispatch actions
  dispatch(setBoards(newBoards));
};
```

### Calling API

```jsx
import { boardAPI } from '../utils/api';

const response = await boardAPI.getByWorkspace(workspaceId);
const boards = response.data.data;
```

### Using Toast Notifications

```jsx
import { useToast } from '../components/ToastProvider';

const MyComponent = () => {
  const { addToast } = useToast();

  const handleSuccess = () => {
    addToast('Success!', 'success');
  };

  const handleError = () => {
    addToast('Error occurred', 'error');
  };
};
```

## 🎨 Tailwind CSS Colors

Custom Trello-like colors configured in `tailwind.config.js`:

```js
colors: {
  trello: {
    blue: '#0052CC',         // Primary blue
    'blue-dark': '#003399',  // Darker blue
    'blue-light': '#091E42', // Very dark
    gray: '#F8F9FA',         // Light gray
    'gray-dark': '#5E6C84',  // Dark gray
    green: '#61BD4F',        // Success green
    red: '#EB5A46',          // Error red
    orange: '#F2CC0C',       // Warning orange
  }
}
```

Usage in components:

```jsx
<button className="bg-trello-blue hover:bg-trello-blue-dark">Click me</button>
```

## 🚀 Commands

```bash
# Development
npm run dev              # Start dev server on :5173

# Build & Preview
npm run build           # Create production build (dist/)
npm run preview         # Preview production build locally

# Testing
npm test                # Run tests once
npm test:ui             # Open test UI
npm test:coverage       # Generate coverage report

# Linting
npm run lint            # Check code style
```

## 🔄 Workflow: Create a Card

1. User clicks "+ Add Card" button in KanbanList
2. Component shows textarea and confirm/cancel buttons
3. User enters title and clicks "Add"
4. Component calls `cardAPI.create(listId, data)`
5. API returns new card
6. Component adds card to local state
7. UI updates immediately

## 🐛 Debugging Tips

### Check Redux State

Add Redux DevTools browser extension to inspect state

### Check API Calls

- Open browser DevTools → Network tab
- Look for API requests to `http://localhost:5000/api`

### Check Console

- Open browser DevTools → Console
- Look for error messages

### Test API Directly

Use Postman/Insomnia with:

- Endpoint: `http://localhost:5000/api/...`
- Headers: `Authorization: Bearer {token}`

## 📚 Environment Variables

### Development (.env.local)

```env
VITE_API_URL=http://localhost:5000/api
```

### Production (.env.production)

```env
VITE_API_URL=https://api.yourdomain.com/api
```

## 🎯 Future Enhancements

- [ ] Drag-and-drop cards between lists (dnd-kit ready)
- [ ] Drag-and-drop lists reordering
- [ ] Card labels and colors
- [ ] Due dates and reminders
- [ ] Comments on cards
- [ ] File attachments
- [ ] Real-time updates with Socket.IO
- [ ] Dark mode toggle
- [ ] User profile editing
- [ ] Workspace members & permissions
- [ ] Board templates
- [ ] Activity log

## 📖 Useful Documentation

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [React Router](https://reactrouter.com)
- [Axios](https://axios-http.com)

## ❓ Common Issues

**"Cannot find module" errors**

```bash
rm -rf node_modules
npm install
npm run dev
```

**Env vars not working**

- Variable must start with `VITE_`
- Restart dev server after changing `.env`

**API 401 Unauthorized**

- Token expired → clear localStorage and login again
- Backend CORS not allowing frontend origin

**Tailwind styles not applying**

- Make sure component file is in `tailwind.config.js` content array
- Restart dev server

**Build fails**

- Check Node version: `node --version` (should be 18+)
- Check no TypeScript errors if you add types
- Check console for specific error messages
