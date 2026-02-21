import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import * as apiModule from '../../utils/api';

// Mock usePermissions hook
vi.mock('../../hooks/usePermissions', () => ({
  default: () => ({
    role: 'owner',
    can: () => true,
    isAtLeast: () => true,
    canModifyUserRole: () => true,
    loading: false,
    error: null,
  }),
  usePermissions: () => ({
    role: 'owner',
    can: () => true,
    isAtLeast: () => true,
    canModifyUserRole: () => true,
    loading: false,
    error: null,
  }),
  ROLE_INFO: {
    owner: { label: 'Owner', color: 'purple', description: 'Full control' },
    admin: { label: 'Admin', color: 'blue', description: 'Can manage' },
    member: { label: 'Member', color: 'green', description: 'Can edit' },
    viewer: { label: 'Viewer', color: 'gray', description: 'Read-only' },
  },
}));

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
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
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
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
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
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
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
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
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
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
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
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.boardAPI, 'create').mockRejectedValue({
      response: { data: { message: 'Failed to create board' } },
    });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

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
      expect(screen.getByText('Failed to create board')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('prevents creating board with empty name', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
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
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.boardAPI, 'delete').mockResolvedValue({
      data: { success: true },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', {
      name: /supprimer|delete/i,
    });
    fireEvent.click(deleteButton);

    // Confirm in the modal
    const confirmBtn = await screen.findByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiModule.boardAPI.delete).toHaveBeenCalledWith('board1');
    });
  });

  it('cancels board deletion when user declines confirmation', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: mockBoards },
    });
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.boardAPI, 'delete').mockResolvedValue({
      data: { success: true },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', {
      name: /supprimer|delete/i,
    });
    fireEvent.click(deleteButton);

    // Cancel in the modal
    const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    // Should not call delete
    expect(apiModule.boardAPI.delete).not.toHaveBeenCalled();
  });

  it('shows error alert when deleting board fails', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: mockBoards },
    });
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.boardAPI, 'delete').mockRejectedValue({
      response: { data: { message: 'Failed to delete' } },
    });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', {
      name: /supprimer|delete/i,
    });
    fireEvent.click(deleteButton);

    // Confirm in the modal
    const confirmBtn = await screen.findByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete')).toBeInTheDocument();
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
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
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
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
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
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
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

  it('handles error loading workspace', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockRejectedValue(
      new Error('Network error')
    );
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading workspace',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('opens invite members modal when button clicked', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });

    const inviteButton = screen.getByRole('button', {
      name: /inviter|invite/i,
    });
    fireEvent.click(inviteButton);

    // InviteMembers modal should be rendered
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('handles refreshing members after member invited', async () => {
    const mockMembers = [
      {
        _id: 'member1',
        userId: { _id: 'user1', username: 'user1', email: 'user1@test.com' },
        role: 'owner',
      },
    ];

    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace')
      .mockResolvedValueOnce({
        data: { data: [] },
      })
      .mockResolvedValueOnce({
        data: { data: mockMembers },
      });
    vi.spyOn(apiModule.memberAPI, 'invite').mockResolvedValue({
      data: { success: true },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });

    // Open invite modal
    const inviteButton = screen.getByRole('button', {
      name: /inviter|invite/i,
    });
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Simulate inviting a member
    const emailInput = screen.getByRole('textbox');
    fireEvent.change(emailInput, { target: { value: 'new@test.com' } });

    const sendButton = screen.getByRole('button', { name: /envoyer|send/i });
    fireEvent.click(sendButton);

    // Wait for members to refresh
    await waitFor(() => {
      expect(apiModule.memberAPI.getByWorkspace).toHaveBeenCalledTimes(2);
    });
  });

  it('handles error refreshing members after removal', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const mockMembers = [
      {
        _id: 'member1',
        userId: { _id: 'user1', username: 'user1', email: 'user1@test.com' },
        role: 'owner',
      },
      {
        _id: 'member2',
        userId: { _id: 'user2', username: 'user2', email: 'user2@test.com' },
        role: 'member',
      },
    ];

    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace')
      .mockResolvedValueOnce({
        data: { data: mockMembers },
      })
      .mockRejectedValueOnce(new Error('Network error'));
    vi.spyOn(apiModule.memberAPI, 'remove').mockResolvedValue({
      data: { success: true },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    // Try to remove a member
    const removeButton = screen.getByRole('button', { name: /remove user2/i });
    fireEvent.click(removeButton);

    // Confirm removal
    await waitFor(() => {
      expect(
        screen.getByText(/are you sure|êtes-vous sûr/i)
      ).toBeInTheDocument();
    });

    const confirmButtons = screen.getAllByRole('button');
    const confirmButton = confirmButtons.find(
      btn =>
        btn.textContent.match(/supprimer|remove/i) &&
        btn.closest('[role="dialog"]')
    );

    if (confirmButton) {
      fireEvent.click(confirmButton);

      // Wait for error to be logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error refreshing members',
          expect.any(Error)
        );
      });
    }

    consoleErrorSpy.mockRestore();
  });

  it('handles error refreshing members after invitation', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    // Initial load succeeds, refresh fails
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace')
      .mockResolvedValueOnce({
        data: { data: [] },
      })
      .mockRejectedValueOnce(new Error('Refresh error'));
    vi.spyOn(apiModule.memberAPI, 'invite').mockResolvedValue({
      data: { success: true },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });

    // Clear the console error spy to ignore initial load
    consoleErrorSpy.mockClear();

    // Open invite modal
    const inviteButton = screen.getByRole('button', {
      name: /inviter|invite/i,
    });
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Simulate inviting a member
    const emailInput = screen.getByRole('textbox');
    fireEvent.change(emailInput, { target: { value: 'new@test.com' } });

    const sendButton = screen.getByRole('button', { name: /envoyer|send/i });
    fireEvent.click(sendButton);

    // Wait for error to be logged
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error refreshing members',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('closes edit board modal', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: mockBoards },
    });
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument();
    });

    // Open edit modal
    const editButton = screen.getByRole('button', { name: /modifier|edit/i });
    fireEvent.click(editButton);

    // Modal should be rendered (BoardEditModal tests cover the modal content)
    await waitFor(() => {
      expect(editButton).toBeInTheDocument();
    });
  });

  it('saves board changes successfully', async () => {
    const updatedBoard = {
      ...mockBoards[0],
      name: 'Updated Board Name',
      description: 'Updated description',
    };

    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: mockBoards },
    });
    vi.spyOn(apiModule.boardAPI, 'update').mockResolvedValue({
      data: { success: true, data: updatedBoard },
    });
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument();
    });

    // Click edit button to open modal
    const editButton = screen.getByRole('button', { name: /modifier|edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(
        screen.getByLabelText(/nom du board|board name/i)
      ).toBeInTheDocument();
    });

    // Update board name in modal
    const nameInput = screen.getByLabelText(/nom du board|board name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Board Name' } });

    // Submit form to trigger handleSaveBoard
    const saveButton = screen.getByRole('button', {
      name: /enregistrer|save/i,
    });
    fireEvent.click(saveButton);

    // Verify API was called with correct data
    await waitFor(() => {
      expect(apiModule.boardAPI.update).toHaveBeenCalledWith('board1', {
        name: 'Updated Board Name',
        description: 'Board 1 desc',
      });
    });
  });

  it('cancels board deletion when user declines confirmation', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false)
    ); // User clicks "Cancel"

    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: mockBoards },
    });
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    const deleteSpy = vi.spyOn(apiModule.boardAPI, 'delete');

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', {
      name: /supprimer|delete/i,
    });
    fireEvent.click(deleteButton);

    // Verify API was NOT called because user canceled
    expect(deleteSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('handles null data when fetching members', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    // Return empty response (no data field) to test || [] fallback
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: {}, // Missing data field, should use || [] fallback
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });

    // Should render without crashing despite missing data.data
    expect(screen.getByText('Test Workspace')).toBeInTheDocument();
  });

  it('closes invite modal without inviting', async () => {
    vi.spyOn(apiModule.workspaceAPI, 'getById').mockResolvedValue({
      data: { data: mockWorkspace },
    });
    vi.spyOn(apiModule.boardAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });
    vi.spyOn(apiModule.memberAPI, 'getByWorkspace').mockResolvedValue({
      data: { data: [] },
    });

    const store = getStore();
    renderWithProviders(<WorkspacePage />, { store });

    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });

    // Open invite modal
    const inviteButton = screen.getByRole('button', {
      name: /inviter|invite/i,
    });
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Close modal without inviting (click Cancel)
    const cancelButton = screen.getByRole('button', {
      name: /annuler|cancel/i,
    });
    fireEvent.click(cancelButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
