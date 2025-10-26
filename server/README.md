# Planit Server

Backend API for Planit - A Trello-like Kanban board application.

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
```

See `.env.example` for reference.

### 3. Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### 4. Run Tests

```bash
npm test
```

## Project Structure

```
server/
├── src/
│   ├── config/          # Database and other configs
│   ├── models/          # Mongoose models
│   ├── controllers/     # Business logic
│   ├── routes/          # API routes
│   ├── middlewares/     # Auth, validation, error handling
│   └── index.js         # Entry point
├── __tests__/           # Test files
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
└── package.json
```

## API Endpoints

### Health Check
- `GET /` - Welcome message
- `GET /api/health` - Server health status

### Authentication (Coming Soon)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Workspaces (Coming Soon)
- `GET /api/workspaces` - Get all workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace by ID
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage report
