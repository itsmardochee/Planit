# Planit - Frontend (React + Vite + Tailwind CSS)

A modern, responsive Kanban board application built with React, inspired by Trello, using Vite for fast builds and Tailwind CSS for styling.

## 🚀 Features

- **Kanban Boards**: Create and manage workspaces, boards, lists, and cards
- **Real-time Updates**: Interact with cards and lists with instant feedback
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Authentication**: JWT-based login and registration
- **Modern Stack**: React 19, Vite, Tailwind CSS, Redux Toolkit

## 📋 Project Structure

```
src/
├── pages/                    # Route components
│   ├── Home.jsx             # Landing page
│   ├── Login.jsx            # Auth page (login/register)
│   ├── Dashboard.jsx        # Workspace listing
│   ├── WorkspacePage.jsx    # Workspace with boards
│   └── BoardPage.jsx        # Kanban board view
├── components/              # Reusable components
│   ├── KanbanList.jsx       # List of cards
│   ├── KanbanCard.jsx       # Individual card
│   └── CardModal.jsx        # Card details modal
├── hooks/                   # Custom hooks
│   └── useAuth.js           # Auth state hook
├── store/                   # Redux state management
│   └── index.js             # Store configuration
├── utils/                   # Utility functions
│   └── api.js               # API endpoints
├── theme/                   # Theme configuration
│   └── theme.js             # MUI theme (legacy)
└── App.jsx                  # Main app component
```

## ⚙️ Setup & Installation

### Prerequisites

- Node.js 18+
- npm (not yarn)

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Environment Variables

Create `.env` or `.env.local` file:

```env
VITE_API_URL=http://localhost:5000/api
```

For production, create `.env.production`:

```env
VITE_API_URL=https://api.example.com/api
```

### 3. Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### 4. Production Build

```bash
npm run build
# output: dist/
```

### 5. Run Tests

```bash
npm test                    # Run tests once
npm test:ui                 # Open test UI
npm test:coverage           # Generate coverage
```

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **dnd-kit**: Drag-and-drop library (prepared for future implementation)
- **Material Icons**: Icon library via `@mui/icons-material`

### Tailwind Configuration

Custom colors defined in `tailwind.config.js`:

```js
colors: {
  trello: {
    blue: '#0052CC',
    'blue-dark': '#003399',
    green: '#61BD4F',
    red: '#EB5A46',
    orange: '#F2CC0C',
  }
}
```

## 🔐 Authentication Flow

1. User registers/logs in via `/login`
2. Backend returns JWT token
3. Token stored in `localStorage`
4. Axios interceptors add token to API requests
5. Authenticated pages redirect to `/login` if token expired

## 📡 API Integration

### Auth API

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Workspace API

- `GET /api/workspaces` - Get all workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Board API

- `GET /api/workspaces/:id/boards` - Get boards in workspace
- `POST /api/workspaces/:id/boards` - Create board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### List API

- `GET /api/boards/:id/lists` - Get lists in board
- `POST /api/boards/:id/lists` - Create list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list

### Card API

- `GET /api/lists/:id/cards` - Get cards in list
- `POST /api/lists/:id/cards` - Create card
- `GET /api/cards/:id` - Get card details
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card

## 🎯 Key Components

### Login Page (`pages/Login.jsx`)

- Toggle between login and registration
- Email and password validation
- Redux integration for state management

### Dashboard (`pages/Dashboard.jsx`)

- Display all user workspaces
- Create new workspace
- Navigation to workspace

### Workspace Page (`pages/WorkspacePage.jsx`)

- Display all boards in a workspace
- Create new board
- Board navigation

### Board Page (`pages/BoardPage.jsx`)

- Main Kanban view with lists and cards
- Create lists and cards
- Card detail modal for editing

### Kanban Components

- `KanbanList.jsx` - Column component showing cards
- `KanbanCard.jsx` - Individual card component
- `CardModal.jsx` - Detail view and editing

## 🛠️ Development Tips

### Running Lint

```bash
npm run lint
```

### Adding New Pages

1. Create component in `src/pages/`
2. Import in `App.jsx`
3. Add route in `<Routes>`

### Adding New Components

1. Create component in `src/components/`
2. Use props for data and callbacks
3. Import in pages

### Redux Store

Add new slices in `src/store/index.js`:

```js
const mySlice = createSlice({
  name: 'myFeature',
  initialState: {},
  reducers: {
    // reducers here
  },
});
```

## 🚀 Deployment

See [../../docs/DEPLOYMENT-VERCEL.md](../../docs/DEPLOYMENT-VERCEL.md) for Vercel deployment instructions.

### Quick Deploy to Vercel

```bash
# Link repo to Vercel
vercel link

# Deploy
vercel
```

Environment variable on Vercel:

- `VITE_API_URL` (set to your production API URL)

## 📚 Useful Links

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [React Router](https://reactrouter.com)

## 🐛 Troubleshooting

**Build fails with "module not found"**

- Run `npm install` again
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

**Env variables not working**

- Must start with `VITE_` prefix
- Restart dev server after changing `.env`

**CORS errors when calling API**

- Ensure backend CORS allows frontend origin
- Check `VITE_API_URL` points to correct backend

**Components not re-rendering**

- Check Redux store is properly connected
- Verify hooks dependencies are correct

## 📝 Contributing

Follow the conventions in [../../CONTRIBUTING.md](../../CONTRIBUTING.md):

- Use Conventional Commits (e.g., `feat(auth): add login`)
- TDD approach: write tests before code
- Pre-commit: run lint and tests locally
- All PRs must pass CI checks

## 📄 License

MIT (see project root)
