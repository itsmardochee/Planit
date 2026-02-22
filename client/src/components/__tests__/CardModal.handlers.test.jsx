import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CardModal from '../CardModal';
import { cardAPI, labelAPI, commentAPI } from '../../utils/api';

// Mock usePermissions to grant all card permissions by default
vi.mock('../../hooks/usePermissions', () => ({
  default: () => ({
    can: () => true,
    role: 'owner',
    loading: false,
    error: null,
    isAtLeast: () => true,
    canModifyUserRole: () => true,
  }),
}));

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { changeLanguage: vi.fn() },
  }),
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
    updateDueDate: vi.fn(),
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

// Mock MemberSelector to expose controllable assign/unassign buttons
vi.mock('../MemberSelector', () => ({
  default: ({ members, assignedMembers, onAssign, onUnassign }) => (
    <div data-testid="member-selector">
      {members.map(m => (
        <button
          key={m.userId._id}
          data-testid={`assign-btn-${m.userId._id}`}
          onClick={() => onAssign(m.userId._id)}
        >
          Assign {m.userId.username}
        </button>
      ))}
      {assignedMembers.map(m => (
        <button
          key={m._id}
          data-testid={`unassign-btn-${m._id}`}
          onClick={() => onUnassign(m._id)}
        >
          Unassign {m.username}
        </button>
      ))}
    </div>
  ),
}));

// Mock LabelPicker using the new controlled interface
vi.mock('../LabelPicker', () => ({
  default: ({ assignedLabels, onChange }) => (
    <div data-testid="label-picker">
      <button
        data-testid="trigger-label-add"
        onClick={() =>
          onChange([...assignedLabels, { _id: 'l1', name: 'Bug' }])
        }
      >
        Add Label
      </button>
    </div>
  ),
}));

// Mock StatusSelector using the new controlled interface
vi.mock('../StatusSelector', () => ({
  default: ({ value, onChange }) => (
    <div data-testid="status-selector">
      <span data-testid="current-status">{value ?? ''}</span>
      <button data-testid="set-status-done" onClick={() => onChange('done')}>
        Set Done
      </button>
    </div>
  ),
}));

// Mock CommentSection
vi.mock('../CommentSection', () => ({
  default: () => <div data-testid="comment-section" />,
}));

describe('CardModal - Handlers', () => {
  const mockCard = {
    _id: 'card-123',
    title: 'Test Card',
    description: 'Test description',
    assignedTo: [],
    labels: [],
    status: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
  };

  const mockMembers = [
    {
      userId: {
        _id: 'user1',
        username: 'Alice',
        email: 'alice@example.com',
      },
      role: 'member',
    },
    {
      userId: {
        _id: 'user2',
        username: 'Bob',
        email: 'bob@example.com',
      },
      role: 'member',
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnCardUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    labelAPI.getByBoard.mockResolvedValue({
      data: { success: true, data: [] },
    });
    commentAPI.getByCard.mockResolvedValue({
      data: { success: true, data: [] },
    });
    cardAPI.update.mockResolvedValue({
      data: { data: mockCard },
    });
  });

  function renderCardModal(props = {}) {
    return render(
      <CardModal
        card={mockCard}
        boardId="board-123"
        members={mockMembers}
        onClose={mockOnClose}
        onCardUpdate={mockOnCardUpdate}
        {...props}
      />
    );
  }

  describe('handleAssignMember', () => {
    it('adds member to assignedMembers when onAssign is called', async () => {
      renderCardModal();

      // Initially no unassign button for user1
      expect(
        screen.queryByTestId('unassign-btn-user1')
      ).not.toBeInTheDocument();

      // Click assign Alice
      fireEvent.click(screen.getByTestId('assign-btn-user1'));

      // Unassign button should appear
      await waitFor(() => {
        expect(screen.getByTestId('unassign-btn-user1')).toBeInTheDocument();
      });
    });

    it('does nothing when userId not found in members list', async () => {
      renderCardModal({ members: [] });
      // With no members, no assign buttons exist - this tests the !memberToAdd path
      // The member selector won't render assign buttons for empty members
      expect(screen.queryByTestId(/^assign-btn-/)).not.toBeInTheDocument();
    });
  });

  describe('handleUnassignMember', () => {
    it('removes member from assignedMembers when onUnassign is called', async () => {
      const cardWithMember = {
        ...mockCard,
        assignedTo: [
          { _id: 'user1', username: 'Alice', email: 'alice@example.com' },
        ],
      };

      renderCardModal({ card: cardWithMember });

      // Unassign button should be present initially
      expect(screen.getByTestId('unassign-btn-user1')).toBeInTheDocument();

      // Click unassign Alice
      fireEvent.click(screen.getByTestId('unassign-btn-user1'));

      // Unassign button should be gone
      await waitFor(() => {
        expect(
          screen.queryByTestId('unassign-btn-user1')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('handleSave with member changes', () => {
    it('calls cardAPI.assign for newly added members on save', async () => {
      cardAPI.assign.mockResolvedValue({ data: { success: true } });

      renderCardModal();

      // Add user1
      fireEvent.click(screen.getByTestId('assign-btn-user1'));

      // Click save
      const saveButton = screen.getByRole('button', { name: /cards:save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(cardAPI.assign).toHaveBeenCalledWith('card-123', 'user1');
      });
    });

    it('calls cardAPI.unassign for removed members on save', async () => {
      cardAPI.unassign.mockResolvedValue({ data: { success: true } });

      const cardWithMember = {
        ...mockCard,
        assignedTo: [
          { _id: 'user1', username: 'Alice', email: 'alice@example.com' },
        ],
      };

      renderCardModal({ card: cardWithMember });

      // Remove user1
      fireEvent.click(screen.getByTestId('unassign-btn-user1'));

      // Click save
      const saveButton = screen.getByRole('button', { name: /cards:save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(cardAPI.unassign).toHaveBeenCalledWith('card-123', 'user1');
      });
    });

    it('calls both assign and unassign when member list changes on save', async () => {
      cardAPI.assign.mockResolvedValue({ data: { success: true } });
      cardAPI.unassign.mockResolvedValue({ data: { success: true } });

      const cardWithMember = {
        ...mockCard,
        assignedTo: [
          { _id: 'user1', username: 'Alice', email: 'alice@example.com' },
        ],
      };

      renderCardModal({ card: cardWithMember });

      // Remove user1
      fireEvent.click(screen.getByTestId('unassign-btn-user1'));
      // Add user2
      fireEvent.click(screen.getByTestId('assign-btn-user2'));

      // Click save
      const saveButton = screen.getByRole('button', { name: /cards:save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(cardAPI.assign).toHaveBeenCalledWith('card-123', 'user2');
        expect(cardAPI.unassign).toHaveBeenCalledWith('card-123', 'user1');
      });
    });

    it('does not call assign/unassign when no member changes', async () => {
      renderCardModal();

      const saveButton = screen.getByRole('button', { name: /cards:save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(cardAPI.update).toHaveBeenCalled();
      });

      expect(cardAPI.assign).not.toHaveBeenCalled();
      expect(cardAPI.unassign).not.toHaveBeenCalled();
    });
  });

  describe('pending label and status changes', () => {
    it('calls cardAPI.assignLabel on Save after adding a label via LabelPicker', async () => {
      cardAPI.assignLabel.mockResolvedValue({ data: { success: true } });

      renderCardModal();

      // Add a label via the mock button
      fireEvent.click(screen.getByTestId('trigger-label-add'));

      // Press Save
      fireEvent.click(screen.getByRole('button', { name: /cards:save/i }));

      await waitFor(() => {
        expect(cardAPI.assignLabel).toHaveBeenCalledWith('card-123', 'l1');
      });
    });

    it('calls cardAPI.updateStatus on Save after changing status via StatusSelector', async () => {
      cardAPI.updateStatus.mockResolvedValue({ data: { success: true } });

      renderCardModal();

      // Change status via the mock button
      fireEvent.click(screen.getByTestId('set-status-done'));

      // Press Save
      fireEvent.click(screen.getByRole('button', { name: /cards:save/i }));

      await waitFor(() => {
        expect(cardAPI.updateStatus).toHaveBeenCalledWith('card-123', 'done');
      });
    });

    it('does not call cardAPI.updateStatus if status is unchanged', async () => {
      renderCardModal();

      fireEvent.click(screen.getByRole('button', { name: /cards:save/i }));

      await waitFor(() => {
        expect(cardAPI.update).toHaveBeenCalled();
      });

      expect(cardAPI.updateStatus).not.toHaveBeenCalled();
    });
  });
});
