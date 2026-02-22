import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Mock the API
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

describe('CardModal - Due Date', () => {
  const mockCard = {
    _id: 'card123',
    title: 'Test Card',
    description: 'Test description',
    assignedTo: [],
    labels: [],
    status: null,
    dueDate: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
  };

  const mockBoardId = 'board123';
  const mockMembers = [];

  beforeEach(() => {
    vi.clearAllMocks();
    labelAPI.getByBoard.mockResolvedValue({
      data: { success: true, data: [] },
    });
    commentAPI.getByCard.mockResolvedValue({
      data: { success: true, data: [] },
    });
  });

  describe('Due Date Picker', () => {
    it('should display due date input field', async () => {
      render(
        <CardModal
          card={mockCard}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/cards:dueDate/i)).toBeInTheDocument();
      });
    });

    it('should display empty date input when no due date is set', async () => {
      render(
        <CardModal
          card={mockCard}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/cards:dueDate/i);
        expect(dateInput).toHaveValue('');
      });
    });

    it('should display existing due date when card has one', async () => {
      const cardWithDueDate = {
        ...mockCard,
        dueDate: '2026-03-15T12:00:00.000Z',
      };

      render(
        <CardModal
          card={cardWithDueDate}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/cards:dueDate/i);
        // Input type="date" uses YYYY-MM-DD format
        expect(dateInput).toHaveValue('2026-03-15');
      });
    });

    it('should update due date when user selects a new date and clicks Save', async () => {
      const user = userEvent.setup();
      const onCardUpdate = vi.fn();
      cardAPI.update.mockResolvedValue({
        data: { success: true },
      });

      render(
        <CardModal
          card={mockCard}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={onCardUpdate}
        />
      );

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/cards:dueDate/i);
        expect(dateInput).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/cards:dueDate/i);
      await user.clear(dateInput);
      await user.type(dateInput, '2026-04-20');

      // Click Save button to trigger save
      const saveButton = screen.getByText(/cards:save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(cardAPI.update).toHaveBeenCalledWith(
          'card123',
          expect.objectContaining({
            title: 'Test Card',
            description: 'Test description',
            dueDate: expect.stringContaining('2026-04-20'),
          })
        );
      });
    });

    it('should clear due date when user removes the date and clicks Save', async () => {
      const user = userEvent.setup();
      const cardWithDueDate = {
        ...mockCard,
        dueDate: '2026-03-15T12:00:00.000Z',
      };

      cardAPI.update.mockResolvedValue({
        data: { success: true },
      });

      render(
        <CardModal
          card={cardWithDueDate}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/cards:dueDate/i);
        expect(dateInput).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/cards:dueDate/i);
      await user.clear(dateInput);

      // Click Save button
      const saveButton = screen.getByText(/cards:save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(cardAPI.update).toHaveBeenCalledWith(
          'card123',
          expect.objectContaining({
            dueDate: null,
          })
        );
      });
    });

    it('should handle error if due date update fails', async () => {
      const user = userEvent.setup();
      cardAPI.update.mockRejectedValue(new Error('Failed to update card'));

      render(
        <CardModal
          card={mockCard}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/cards:dueDate/i);
        expect(dateInput).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/cards:dueDate/i);
      await user.type(dateInput, '2026-04-20');

      const saveButton = screen.getByText(/cards:save/i);
      await user.click(saveButton);

      // Error is caught and logged, component doesn't crash
      await waitFor(() => {
        expect(cardAPI.update).toHaveBeenCalled();
      });
    });

    it('should NOT auto-save due date (requires Save button click)', async () => {
      const user = userEvent.setup();
      cardAPI.update.mockResolvedValue({
        data: { success: true },
      });

      render(
        <CardModal
          card={mockCard}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/cards:dueDate/i);
        expect(dateInput).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/cards:dueDate/i);
      await user.type(dateInput, '2026-04-20');

      // Wait a bit to ensure no auto-save happens
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify that the API was NOT called (no auto-save)
      expect(cardAPI.update).not.toHaveBeenCalled();

      // Now click Save and verify it's called
      const saveButton = screen.getByText(/cards:save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(cardAPI.update).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Due Date Label', () => {
    it('should display "Due Date" label above the input', async () => {
      render(
        <CardModal
          card={mockCard}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/cards:dueDate/i)).toBeInTheDocument();
      });
    });
  });

  describe('Integration with other fields', () => {
    it('should display due date field alongside other card fields', async () => {
      render(
        <CardModal
          card={mockCard}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        // Check for title and description using text content
        expect(screen.getByText(/cards:titleLabel/i)).toBeInTheDocument();
        expect(screen.getByText(/cards:descriptionLabel/i)).toBeInTheDocument();
        // Check for due date using proper label association
        expect(screen.getByLabelText(/cards:dueDate/i)).toBeInTheDocument();
      });
    });
  });
});
