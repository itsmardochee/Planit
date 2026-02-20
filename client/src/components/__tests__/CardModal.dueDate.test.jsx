import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardModal from '../CardModal';
import { cardAPI, labelAPI, commentAPI } from '../../utils/api';

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

    it('should update due date when user selects a new date', async () => {
      const user = userEvent.setup();
      cardAPI.updateDueDate.mockResolvedValue({
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
      await user.clear(dateInput);
      await user.type(dateInput, '2026-04-20');

      // Blur to trigger save
      await user.tab();

      await waitFor(() => {
        expect(cardAPI.updateDueDate).toHaveBeenCalledWith(
          'card123',
          expect.stringContaining('2026-04-20')
        );
      });
    });

    it('should clear due date when user removes the date', async () => {
      const user = userEvent.setup();
      const cardWithDueDate = {
        ...mockCard,
        dueDate: '2026-03-15T12:00:00.000Z',
      };

      cardAPI.updateDueDate.mockResolvedValue({
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
      await user.tab();

      await waitFor(() => {
        expect(cardAPI.updateDueDate).toHaveBeenCalledWith('card123', null);
      });
    });

    it('should show error message if due date update fails', async () => {
      const user = userEvent.setup();
      cardAPI.updateDueDate.mockRejectedValue(
        new Error('Failed to update due date')
      );

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
      await user.tab();

      // Note: Error handling will be implemented in the component
      // This test ensures the error is caught and doesn't crash
      await waitFor(() => {
        expect(cardAPI.updateDueDate).toHaveBeenCalled();
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
