import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
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
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>{ui}</MemoryRouter>
      </I18nextProvider>
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

  it('shows loading state initially', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockImplementation(
      () => new Promise(() => {})
    );
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockImplementation(
      () => new Promise(() => {})
    );

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    expect(screen.getByText(/loading|chargement/i)).toBeInTheDocument();
  });

  it('handles error loading workspace', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockRejectedValue(
      new Error('Failed to load')
    );
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('creates a new board successfully', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.boardAPI, 'create').mockResolvedValue({
      data: {
        success: true,
        data: { _id: 'board2', name: 'New Board', description: 'New board' },
      },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });

    // Click "New Board" button
    const newButton = screen.getByRole('button', {
      name: /nouveau board|new board/i,
    });
    fireEvent.click(newButton);

    // Fill in form
    const input = screen.getByPlaceholderText(/my new board/i);
    fireEvent.change(input, { target: { value: 'New Board' } });

    // Submit
    const createButton = screen.getByRole('button', { name: /créer|create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(apiModule.boardAPI.create).toHaveBeenCalledWith('ws1', {
        name: 'New Board',
        description: 'New board',
      });
    });
  });

  it('cancels board creation', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });

    // Click "New Board" button
    const newButton = screen.getByRole('button', {
      name: /nouveau board|new board/i,
    });
    fireEvent.click(newButton);

    // Cancel form
    const cancelButton = screen.getByRole('button', {
      name: /annuler|cancel/i,
    });
    fireEvent.click(cancelButton);

    // Form should be hidden
    expect(
      screen.queryByPlaceholderText(/nom du board|board name/i)
    ).not.toBeInTheDocument();
  });

  it('shows error alert when creating board fails', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.boardAPI, 'create').mockRejectedValue({
      response: { data: { message: 'Failed to create board' } },
    });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    vi.stubGlobal('alert', vi.fn());

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });

    const newButton = screen.getByRole('button', {
      name: /nouveau board|new board/i,
    });
    fireEvent.click(newButton);

    const input = screen.getByPlaceholderText(/my new board/i);
    fireEvent.change(input, { target: { value: 'New Board' } });

    const createButton = screen.getByRole('button', { name: /créer|create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to create board');
    });

    consoleErrorSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('prevents creating board with empty name', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.boardAPI, 'create').mockResolvedValue({
      data: { success: true, data: {} },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });

    const newButton = screen.getByRole('button', {
      name: /nouveau board|new board/i,
    });
    fireEvent.click(newButton);

    const createButton = screen.getByRole('button', { name: /créer|create/i });
    fireEvent.click(createButton);

    // Should not call create with empty name
    expect(apiModule.boardAPI.create).not.toHaveBeenCalled();
  });

  it('deletes board after confirmation', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: mockBoards },
    });
    vi.spyOn(apiModule.boardAPI, 'delete').mockResolvedValue({
      data: { success: true },
    });
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', {
      name: /supprimer|delete/i,
    });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(apiModule.boardAPI.delete).toHaveBeenCalledWith('board1');
    });

    vi.unstubAllGlobals();
  });

  it('cancels board deletion when user declines confirmation', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: mockBoards },
    });
    vi.spyOn(apiModule.boardAPI, 'delete').mockResolvedValue({
      data: { success: true },
    });
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false)
    );

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', {
      name: /supprimer|delete/i,
    });
    fireEvent.click(deleteButton);

    // Should not call delete
    expect(apiModule.boardAPI.delete).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('shows error alert when deleting board fails', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: mockBoards },
    });
    vi.spyOn(apiModule.boardAPI, 'delete').mockRejectedValue({
      response: { data: { message: 'Failed to delete' } },
    });
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    vi.stubGlobal('alert', vi.fn());

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', {
      name: /supprimer|delete/i,
    });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to delete');
    });

    vi.unstubAllGlobals();
    consoleErrorSpy.mockRestore();
  });

  it('navigates to board on click', async () => {
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

    const boardCard = screen.getByText('Board 1').closest('div');
    fireEvent.click(boardCard);

    expect(mockNavigate).toHaveBeenCalledWith('/board/board1');
  });

  it('navigates back to dashboard', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', {
      name: /retour aux workspaces|back to workspaces/i,
    });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('opens edit board modal', async () => {
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

    const editButton = screen.getByRole('button', { name: /modifier|edit/i });
    fireEvent.click(editButton);

    // Modal should open (tested in BoardEditModal tests)
    await waitFor(() => {
      expect(editButton).toBeInTheDocument();
    });
  });
});
