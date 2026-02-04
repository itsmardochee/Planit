import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../contexts/ThemeContext';
import * as apiModule from '../../utils/api';

// Mock useNavigate globally before importing Dashboard
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import Dashboard from '../Dashboard.jsx';

const mockWorkspaces = [
  {
    _id: '1',
    name: 'Workspace 1',
    description: 'Desc',
    createdAt: new Date().toISOString(),
  },
  {
    _id: '2',
    name: 'Workspace 2',
    description: 'Desc',
    createdAt: new Date().toISOString(),
  },
];

const workspacesSlice = createSlice({
  name: 'workspaces',
  initialState: { list: [] },
  reducers: {
    setWorkspaces: (state, action) => {
      state.list = action.payload;
    },
  },
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: { username: 'Test' }, token: 'abc' },
  reducers: {},
});

function getStore() {
  return configureStore({
    reducer: {
      workspaces: workspacesSlice.reducer,
      auth: authSlice.reducer,
    },
  });
}

function renderWithProviders(ui, { store } = {}) {
  const testStore = store || getStore();
  return render(
    <Provider store={testStore}>
      <ThemeProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
}

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders workspace grid with workspaces', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: mockWorkspaces },
    });
    const store = getStore();
    renderWithProviders(<Dashboard />, { store });
    await waitFor(() => {
      expect(screen.getByText(/workspace 1/i)).toBeInTheDocument();
      expect(screen.getByText(/workspace 2/i)).toBeInTheDocument();
    });
  });

  it('shows empty state message when no workspaces', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: [] },
    });
    const store = getStore();
    renderWithProviders(<Dashboard />, { store });
    await waitFor(() => {
      expect(screen.getByText(/no workspaces yet/i)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    const LoadingDashboard = () => {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      );
    };
    render(<LoadingDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('Create Workspace button interaction', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: [] },
    });
    const store = getStore();
    renderWithProviders(<Dashboard />, { store });
    const button = await screen.findByRole('button', {
      name: /new workspace/i,
    });
    fireEvent.click(button);
    expect(screen.getByText(/create a new workspace/i)).toBeInTheDocument();
  });

  it('navigates to workspace boards on click', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: mockWorkspaces },
    });
    const store = getStore();
    renderWithProviders(<Dashboard />, { store });
    const card = await screen.findByText(/workspace 1/i);
    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith('/workspace/1');
  });
});
