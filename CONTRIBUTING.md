# Contributing to Planit

Thank you for considering contributing to **Planit**! We welcome contributions from everyone.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)

---

## 📜 Code of Conduct

Please be respectful and professional in all interactions. We aim to create a welcoming and inclusive environment for all contributors.

---

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/Planit.git
   cd Planit
   ```
3. **Add the upstream remote:**
   ```bash
   git remote add upstream https://github.com/itsmardochee/Planit.git
   ```
4. **Install dependencies** (see [README.md](./README.md))
5. **Create a new branch** for your feature or bugfix

---

## 🔄 Development Workflow

1. **Sync with upstream** before starting work:
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and test thoroughly

4. **Commit your changes** following our [commit conventions](#commit-message-convention)

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

---

## 🌿 Branching Strategy

We follow a simplified **Git Flow** approach:

### Branch Types

| Branch Type | Naming Convention | Purpose |
|------------|-------------------|---------|
| **main** | `main` | Production-ready code |
| **feature** | `feature/description` | New features |
| **bugfix** | `bugfix/description` | Bug fixes |
| **hotfix** | `hotfix/description` | Urgent production fixes |
| **refactor** | `refactor/description` | Code refactoring |
| **docs** | `docs/description` | Documentation updates |
| **test** | `test/description` | Test additions/updates |

### Examples

```bash
feature/workspace-crud
bugfix/login-validation
hotfix/jwt-expiration
refactor/card-component
docs/api-endpoints
test/board-controller
```

---

## 💬 Commit Message Convention

We follow the **Conventional Commits** specification for clear and consistent commit history.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| **feat** | A new feature |
| **fix** | A bug fix |
| **docs** | Documentation changes |
| **style** | Code style changes (formatting, no logic change) |
| **refactor** | Code refactoring (no feature or bug fix) |
| **test** | Adding or updating tests |
| **chore** | Build process, dependencies, tooling |
| **perf** | Performance improvements |

### Scope (optional)

The scope specifies the area of the codebase affected:
- `auth` - Authentication
- `workspace` - Workspaces
- `board` - Boards
- `list` - Lists
- `card` - Cards
- `ui` - User interface
- `api` - Backend API
- `db` - Database

### Examples

```bash
feat(auth): add JWT token refresh mechanism
fix(board): resolve drag and drop issue on mobile
docs(readme): update installation instructions
refactor(card): simplify card component structure
test(workspace): add unit tests for workspace controller
chore(deps): update Material UI to v5.15.0
```

### Rules

- Use **present tense** ("add feature" not "added feature")
- Use **imperative mood** ("move cursor to..." not "moves cursor to...")
- Don't capitalize first letter
- No period (.) at the end
- Keep subject line under 50 characters
- Separate subject from body with a blank line

---

## 🔀 Pull Request Process

1. **Ensure your branch is up to date** with `main`

2. **Run all tests** and ensure they pass:
   ```bash
   # Backend tests
   cd server
   npm test

   # Frontend tests
   cd client
   npm test
   ```

3. **Update documentation** if needed

4. **Fill out the PR template** with:
   - Clear description of changes
   - Related issue number (if applicable)
   - Screenshots (for UI changes)
   - Testing steps

5. **Request review** from at least one team member

6. **Address review comments** promptly

7. **Squash commits** if requested before merging

### PR Title Format

Follow the same convention as commit messages:
```
feat(workspace): add member invitation feature
fix(ui): resolve responsive layout on mobile
```

---

## 💻 Coding Standards

### General

- Write **clean, readable code**
- Follow the **DRY principle** (Don't Repeat Yourself)
- Add **comments** for complex logic
- Keep functions **small and focused**
- Use **meaningful variable names**

### Backend (Node.js/Express)

- Use **ES6+ syntax** (async/await, arrow functions, destructuring)
- Follow **MVC pattern** (Models, Controllers, Routes)
- Use **async/await** instead of callbacks
- Handle **errors properly** with try-catch
- Validate **input data** with middleware
- Use **environment variables** for configuration

**Example:**
```javascript
// ✅ Good
const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ userId: req.user.id });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ❌ Bad
function getWorkspaces(req, res) {
  Workspace.find({ userId: req.user.id }, function(err, workspaces) {
    if (err) return res.send(err);
    res.send(workspaces);
  });
}
```

### Frontend (React)

- Use **functional components** with hooks
- Follow **React best practices**
- Use **Material UI components** consistently
- Keep components **small and reusable**
- Use **PropTypes** or TypeScript for type checking
- Extract **custom hooks** for reusable logic
- Use **meaningful component names**

**Example:**
```javascript
// ✅ Good
const WorkspaceCard = ({ workspace, onDelete }) => {
  const handleDelete = () => {
    onDelete(workspace.id);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">{workspace.name}</Typography>
        <IconButton onClick={handleDelete}>
          <DeleteIcon />
        </IconButton>
      </CardContent>
    </Card>
  );
};

// ❌ Bad
function WorkspaceCard(props) {
  return (
    <div className="card">
      <h5>{props.workspace.name}</h5>
      <button onClick={() => props.onDelete(props.workspace.id)}>Delete</button>
    </div>
  );
}
```

### File Naming

- **Backend:** `camelCase.js` (e.g., `workspaceController.js`)
- **Frontend Components:** `PascalCase.jsx` (e.g., `WorkspaceCard.jsx`)
- **Frontend Utilities:** `camelCase.js` (e.g., `apiHelpers.js`)
- **Test Files:** `*.test.js` or `*.spec.js`

---

## 🧪 Testing Guidelines

### Backend Tests

- Write tests for **all API endpoints**
- Test **authentication** and **authorization**
- Test **error handling**
- Use **Jest + Supertest**

**Example:**
```javascript
describe('Workspace API', () => {
  it('should create a new workspace', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Workspace' });
    
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Workspace');
  });
});
```

### Frontend Tests

- Test **component rendering**
- Test **user interactions**
- Test **edge cases**
- Use **Jest + React Testing Library**

**Example:**
```javascript
test('renders workspace card with name', () => {
  const workspace = { id: '1', name: 'My Workspace' };
  render(<WorkspaceCard workspace={workspace} />);
  
  expect(screen.getByText('My Workspace')).toBeInTheDocument();
});
```

### Test Coverage

- Aim for **>80% code coverage**
- Focus on **critical paths** and **business logic**
- Don't test third-party libraries

---

## 🤝 Questions?

If you have any questions, feel free to:
- Open an **issue** on GitHub
<!-- - Contact the team via **Discord** -->
- Check existing **documentation**

---

## 📝 License

By contributing to Planit, you agree that your contributions will be licensed under the project's license.

---

**Thank you for contributing to Planit! 🎉**
