import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CardModal from '../CardModal';
import usePermissions from '../../hooks/usePermissions';
import { cardAPI, labelAPI, commentAPI } from '../../utils/api';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

// Mock usePermissions as a spy so we can assert the arguments it receives
vi.mock('../../hooks/usePermissions', () => ({
  default: vi.fn(() => ({
    can: () => true,
    role: 'owner',
    loading: false,
    error: null,
    isAtLeast: () => true,
    canModifyUserRole: () => true,
  })),
}));

// Mock API
vi.mock('../../utils/api', () => ({
  cardAPI: {
    update: vi.fn(),
    delete: vi.fn(),
    assign: vi.fn(),
    unassign: vi.fn(),
    assignLabel: vi.fn(),
    removeLabel: vi.fn(),
    updateStatus: vi.fn(),
  },
  labelAPI: {
    getByBoard: vi.fn(),
  },
  commentAPI: {
    getByCard: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CardModal - Basic Fields', () => {
  const mockCard = {
    _id: 'card-123',
    title: 'Test Card',
    description: 'Original description',
    listId: 'list-1',
    assignedTo: [],
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  };

  const mockOnClose = vi.fn();
  const mockOnCardUpdate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockBoardId = 'board123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock labelAPI to prevent errors
    labelAPI.getByBoard.mockResolvedValue({
      data: { success: true, data: [] },
    });
    // Mock commentAPI to prevent errors
    commentAPI.getByCard.mockResolvedValue({
      data: { success: true, data: [] },
    });
  });

  function renderCardModal(props = {}) {
    return render(
      <I18nextProvider i18n={i18n}>
        <CardModal
          open={true}
          boardId={mockBoardId}
          onClose={mockOnClose}
          onCardUpdate={mockOnCardUpdate}
          onDelete={mockOnDelete}
          card={mockCard}
          {...props}
        />
      </I18nextProvider>
    );
  }

  it('renders card title in input field', () => {
    renderCardModal();

    const titleInput = screen.getByDisplayValue('Test Card');
    expect(titleInput).toBeInTheDocument();
  });

  it('renders card description in textarea', () => {
    renderCardModal();

    const descriptionTextarea = screen.getByDisplayValue(
      'Original description'
    );
    expect(descriptionTextarea).toBeInTheDocument();
  });

  it('updates title when user types', () => {
    renderCardModal();

    const titleInput = screen.getByDisplayValue('Test Card');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    expect(titleInput.value).toBe('Updated Title');
  });

  it('updates description when user types', () => {
    renderCardModal();

    const descriptionTextarea = screen.getByDisplayValue(
      'Original description'
    );
    fireEvent.change(descriptionTextarea, {
      target: { value: 'Updated description content' },
    });

    expect(descriptionTextarea.value).toBe('Updated description content');
  });

  it('saves both title and description changes when save button clicked', async () => {
    cardAPI.update.mockResolvedValue({
      data: {
        data: {
          _id: 'card-123',
          title: 'New Title',
          description: 'New description',
        },
      },
    });

    renderCardModal();

    // Change title
    const titleInput = screen.getByDisplayValue('Test Card');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    // Change description
    const descriptionTextarea = screen.getByDisplayValue(
      'Original description'
    );
    fireEvent.change(descriptionTextarea, {
      target: { value: 'New description' },
    });

    // Click save
    const saveButton = screen.getByRole('button', {
      name: /save|enregistrer/i,
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(cardAPI.update).toHaveBeenCalledWith(
        'card-123',
        expect.objectContaining({
          title: 'New Title',
          description: 'New description',
        })
      );
    });

    expect(mockOnCardUpdate).toHaveBeenCalled();
  });

  it('renders description placeholder text', () => {
    const cardWithoutDescription = {
      ...mockCard,
      description: '',
    };

    render(
      <I18nextProvider i18n={i18n}>
        <CardModal
          open={true}
          onClose={mockOnClose}
          onCardUpdate={mockOnCardUpdate}
          card={cardWithoutDescription}
        />
      </I18nextProvider>
    );

    const descriptionTextarea = screen.getByPlaceholderText(/description/i);
    expect(descriptionTextarea).toBeInTheDocument();
  });

  it('handles description with multiple lines', () => {
    const multilineDescription = 'Line 1\nLine 2\nLine 3';
    const cardWithMultiline = {
      ...mockCard,
      description: multilineDescription,
    };

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <CardModal
          open={true}
          onClose={mockOnClose}
          onCardUpdate={mockOnCardUpdate}
          card={cardWithMultiline}
        />
      </I18nextProvider>
    );

    const descriptionTextarea = container.querySelector('textarea');
    expect(descriptionTextarea).toBeInTheDocument();
    expect(descriptionTextarea.value).toContain('Line 1');
    expect(descriptionTextarea.value).toContain('Line 2');
  });

  it('calls delete API and callbacks when delete button is clicked', async () => {
    cardAPI.delete.mockResolvedValue({ data: { success: true } });

    renderCardModal();

    const deleteButton = screen.getByRole('button', {
      name: /delete|supprimer/i,
    });
    fireEvent.click(deleteButton);

    // Confirm in the modal
    const confirmBtn = await screen.findByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(cardAPI.delete).toHaveBeenCalledWith('card-123');
      expect(mockOnCardUpdate).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('does not delete card when confirmation is cancelled', async () => {
    renderCardModal();

    const deleteButton = screen.getByRole('button', {
      name: /delete|supprimer/i,
    });
    fireEvent.click(deleteButton);

    // Cancel in the modal
    const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(cardAPI.delete).not.toHaveBeenCalled();
    });
  });

  it('handles delete error gracefully', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    cardAPI.delete.mockRejectedValue(new Error('Failed to delete'));

    renderCardModal();

    const deleteButton = screen.getByRole('button', {
      name: /delete|supprimer/i,
    });
    fireEvent.click(deleteButton);

    // Confirm in the modal
    const confirmBtn = await screen.findByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Error deleting card',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  it('calls onClose when close button is clicked', () => {
    renderCardModal();

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    renderCardModal();

    const cancelButton = screen.getByRole('button', {
      name: /cancel|annuler/i,
    });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders member assignment section when members are provided', () => {
    const mockMembers = [
      {
        userId: {
          _id: 'user1',
          username: 'John Doe',
          email: 'john@example.com',
        },
        role: 'member',
      },
    ];

    renderCardModal({ members: mockMembers });

    expect(screen.getByText(/assigned to/i)).toBeInTheDocument();
  });

  it('does not render member assignment section when members are not provided', () => {
    renderCardModal({ members: undefined });

    expect(screen.queryByText(/assigned to/i)).not.toBeInTheDocument();
  });

  it('renders labels section when boardId is provided', () => {
    renderCardModal({ boardId: 'board123' });

    expect(screen.getByText(/labels/i)).toBeInTheDocument();
  });

  it('renders status selector', () => {
    renderCardModal();

    expect(screen.getByText(/status/i)).toBeInTheDocument();
  });

  it('renders card information section', async () => {
    renderCardModal();

    // Click on Info tab to show card information
    const infoTab = screen.getByRole('button', { name: /info/i });
    fireEvent.click(infoTab);

    await waitFor(() => {
      expect(screen.getByText(/created on/i)).toBeInTheDocument();
      expect(screen.getByText(/modified on/i)).toBeInTheDocument();
    });
  });

  it('disables save and delete buttons when saving', async () => {
    cardAPI.update.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    renderCardModal();

    const saveButton = screen.getByRole('button', {
      name: /save|enregistrer/i,
    });
    const deleteButton = screen.getByRole('button', {
      name: /delete|supprimer/i,
    });

    fireEvent.click(saveButton);

    // Buttons should be disabled during save
    expect(deleteButton).toBeDisabled();

    await waitFor(() => {
      expect(deleteButton).not.toBeDisabled();
    });
  });

  // Regression test: workspaceId must be forwarded to usePermissions so that
  // the comment form is not incorrectly disabled for all users.
  it('passes workspaceId to usePermissions (regression: comment form disabled for all)', () => {
    renderCardModal({ workspaceId: 'workspace-abc' });

    // usePermissions must have been called with the workspaceId received by CardModal
    const calls = vi.mocked(usePermissions).mock.calls;
    const calledWithWorkspaceId = calls.some(([id]) => id === 'workspace-abc');
    expect(calledWithWorkspaceId).toBe(true);
  });
});
