import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import * as apiModule from '../../utils/api';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ workspaceId: 'ws1' }),
    useNavigate: () => mockNavigate,
  };
});

import WorkspacePage from '../WorkspacePage';

const mockWorkspace = {
  _id: 'ws1',
  name: 'Test Workspace',
  description: 'Test Description',
  userId: 'user1',
  createdAt: new Date().toISOString(),
};

const mockBoards = [
  {
    _id: 'board1',
    name: 'Board 1',
    description: 'Board 1 desc',
    workspaceId: 'ws1',
    createdAt: new Date().toISOString(),
  },
];

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: { username: 'Test' }, token: 'abc123' },
  reducers: {},
});

const boardsSlice = createSlice({
  name: 'boards',
  initialState: { list: [] },
  reducers: {
    setBoards: (state, action) => {
      state.list = action.payload;
    },
  },
});

function getStore() {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      boards: boardsSlice.reducer,
    },
  });
}

function renderWithProviders(ui, { store } = {}) {
  const testStore = store || getStore();
  return render(
    <Provider store={testStore}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  );
}

describe('WorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders workspace title after loading', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: mockBoards },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });
  });

  it('shows empty state if no boards', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText(/no boards yet/i)).toBeInTheDocument();
    });
  });

  it('displays list of boards', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: mockBoards },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument();
    });
  });
});
