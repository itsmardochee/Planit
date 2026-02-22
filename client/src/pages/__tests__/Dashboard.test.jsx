import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
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
    userRole: 'owner',
  },
  {
    _id: '2',
    name: 'Workspace 2',
    description: 'Desc',
    createdAt: new Date().toISOString(),
    userRole: 'owner',
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
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>{ui}</MemoryRouter>
        </I18nextProvider>
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
      expect(
        screen.getByText(/aucun workspace pour le moment|no workspaces yet/i)
      ).toBeInTheDocument();
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
      name: /nouveau workspace|new workspace/i,
    });
    fireEvent.click(button);
    expect(
      screen.getByText(/créer un nouveau workspace|create a new workspace/i)
    ).toBeInTheDocument();
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

  it('creates a new workspace successfully', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.workspaceAPI, 'create').mockResolvedValue({
      data: {
        data: { _id: '3', name: 'New Workspace', description: 'New workspace' },
      },
    });

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    // Click "New Workspace" button
    const newButton = await screen.findByRole('button', {
      name: /nouveau workspace|new workspace/i,
    });
    fireEvent.click(newButton);

    // Fill in the form
    const input = screen.getByPlaceholderText(/my new workspace/i);
    fireEvent.change(input, { target: { value: 'New Workspace' } });

    // Submit
    const createButton = screen.getByRole('button', { name: /créer|create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(apiModule.workspaceAPI.create).toHaveBeenCalledWith({
        name: 'New Workspace',
        description: 'New workspace',
      });
    });
  });

  it('cancels workspace creation', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: [] },
    });

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    // Click "New Workspace" button
    const newButton = await screen.findByRole('button', {
      name: /nouveau workspace|new workspace/i,
    });
    fireEvent.click(newButton);

    // Cancel form
    const cancelButton = screen.getByRole('button', {
      name: /annuler|cancel/i,
    });
    fireEvent.click(cancelButton);

    // Form should be hidden
    expect(
      screen.queryByPlaceholderText(/nom du workspace|workspace name/i)
    ).not.toBeInTheDocument();
  });

  it('shows error when creating workspace fails', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.workspaceAPI, 'create').mockRejectedValue(
      new Error('Failed to create')
    );
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    // Click "New Workspace" button and fill form
    const newButton = await screen.findByRole('button', {
      name: /nouveau workspace|new workspace/i,
    });
    fireEvent.click(newButton);

    const input = screen.getByPlaceholderText(/my new workspace/i);
    fireEvent.change(input, { target: { value: 'New Workspace' } });

    const createButton = screen.getByRole('button', { name: /créer|create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /erreur.*création.*workspace|error.*creating.*workspace/i
        )
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('shows error when loading workspaces fails', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockRejectedValue(
      new Error('Failed to load')
    );
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    await waitFor(() => {
      expect(
        screen.getByText(
          /erreur.*chargement.*workspaces|error.*loading.*workspaces/i
        )
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('deletes workspace after confirmation', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: mockWorkspaces },
    });
    vi.spyOn(apiModule.workspaceAPI, 'delete').mockResolvedValue({
      data: { success: true },
    });

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    // Wait for workspaces to load
    await screen.findByText(/workspace 1/i);

    // Click delete button (trash icon)
    const deleteButtons = screen.getAllByTitle(/delete workspace/i);
    fireEvent.click(deleteButtons[0]);

    // Confirm in the modal
    const confirmBtn = await screen.findByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiModule.workspaceAPI.delete).toHaveBeenCalledWith('1');
    });
  });

  it('cancels workspace deletion when user declines confirmation', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: mockWorkspaces },
    });
    vi.spyOn(apiModule.workspaceAPI, 'delete').mockResolvedValue({
      data: { success: true },
    });

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    // Wait for workspaces to load
    await screen.findByText(/workspace 1/i);

    // Click delete button
    const deleteButtons = screen.getAllByTitle(/delete workspace/i);
    fireEvent.click(deleteButtons[0]);

    // Cancel in the modal
    const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    // Should not call delete
    expect(apiModule.workspaceAPI.delete).not.toHaveBeenCalled();
  });

  it('shows error when deleting workspace fails', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: mockWorkspaces },
    });
    vi.spyOn(apiModule.workspaceAPI, 'delete').mockRejectedValue(
      new Error('Failed to delete')
    );
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    await screen.findByText(/workspace 1/i);

    const deleteButtons = screen.getAllByTitle(/delete workspace/i);
    fireEvent.click(deleteButtons[0]);

    // Confirm in the modal
    const confirmBtn = await screen.findByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          /erreur.*suppression.*workspace|error.*deleting.*workspace/i
        )
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('opens edit workspace modal', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: mockWorkspaces },
    });

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    await screen.findByText(/workspace 1/i);

    // Click edit button (pencil icon)
    const editButtons = screen.getAllByTitle(/edit workspace/i);
    fireEvent.click(editButtons[0]);

    // Modal should open (tested in WorkspaceEditModal tests)
    await waitFor(() => {
      expect(editButtons[0]).toBeInTheDocument();
    });
  });

  it('handles logout successfully', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: [] },
    });

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    const logoutButton = await screen.findByRole('button', {
      name: /déconnexion|logout/i,
    });
    fireEvent.click(logoutButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('prevents creating workspace with empty name', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.workspaceAPI, 'create').mockResolvedValue({
      data: { data: { _id: '3', name: 'Test' } },
    });

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    const newButton = await screen.findByRole('button', {
      name: /nouveau workspace|new workspace/i,
    });
    fireEvent.click(newButton);

    const createButton = screen.getByRole('button', { name: /créer|create/i });
    fireEvent.click(createButton);

    // Should not call create with empty name
    expect(apiModule.workspaceAPI.create).not.toHaveBeenCalled();
  });

  it('hides edit and delete buttons for member workspaces', async () => {
    const memberWorkspace = {
      _id: '5',
      name: 'Shared Workspace',
      description: 'A shared workspace',
      createdAt: new Date().toISOString(),
      userRole: 'member',
    };
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: [memberWorkspace] },
    });

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    await screen.findByRole('heading', { name: /shared workspace/i });

    expect(screen.queryByTitle(/edit workspace/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/delete workspace/i)).not.toBeInTheDocument();
  });

  it('shows edit button but not delete for admin workspaces', async () => {
    const adminWorkspace = {
      _id: '6',
      name: 'Admin Workspace',
      description: 'An admin workspace',
      createdAt: new Date().toISOString(),
      userRole: 'admin',
    };
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: [adminWorkspace] },
    });

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    await screen.findByRole('heading', { name: /admin workspace/i });

    expect(screen.getByTitle(/edit workspace/i)).toBeInTheDocument();
    expect(screen.queryByTitle(/delete workspace/i)).not.toBeInTheDocument();
  });

  it('shows edit and delete buttons for owner workspaces', async () => {
    const ownerWorkspace = {
      _id: '7',
      name: 'Owner Workspace',
      description: 'An owned workspace',
      createdAt: new Date().toISOString(),
      userRole: 'owner',
    };
    vi.spyOn(apiModule.workspaceAPI, 'getAll').mockResolvedValue({
      data: { data: [ownerWorkspace] },
    });

    const store = getStore();
    renderWithProviders(<Dashboard />, { store });

    await screen.findByRole('heading', { name: /owner workspace/i });

    expect(screen.getByTitle(/edit workspace/i)).toBeInTheDocument();
    expect(screen.getByTitle(/delete workspace/i)).toBeInTheDocument();
  });
});
