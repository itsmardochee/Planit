import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardModal from '../CardModal';
import { cardAPI, labelAPI, commentAPI } from '../../utils/api';

// Mock usePermissions to grant all permissions by default
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

describe('CardModal - Labels and Status Integration', () => {
  const mockCard = {
    _id: 'card123',
    title: 'Test Card',
    description: 'Test description',
    assignedTo: [],
    labels: [],
    status: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
  };

  const mockBoardId = 'board123';
  const mockMembers = [];

  const mockLabels = [
    { _id: 'label1', name: 'Bug', color: '#FF0000', boardId: mockBoardId },
    {
      _id: 'label2',
      name: 'Feature',
      color: '#00FF00',
      boardId: mockBoardId,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    labelAPI.getByBoard.mockResolvedValue({
      data: { success: true, data: mockLabels },
    });
    commentAPI.getByCard.mockResolvedValue({
      data: { success: true, data: [] },
    });
  });

  describe('Labels integration', () => {
    it('should display LabelPicker component', async () => {
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
        expect(labelAPI.getByBoard).toHaveBeenCalledWith(mockBoardId);
      });

      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
    });

    it('should show assigned labels with a check icon', async () => {
      const cardWithLabels = {
        ...mockCard,
        labels: [mockLabels[0]],
      };

      render(
        <CardModal
          card={cardWithLabels}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Bug label should have check icon (assigned)
      const bugLabel = screen
        .getByText('Bug')
        .closest('[data-testid*="label"]');
      expect(
        bugLabel?.querySelector('[data-testid="check-icon"]')
      ).toBeInTheDocument();
    });

    it('should call cardAPI.assignLabel on Save after clicking an unassigned label', async () => {
      cardAPI.update.mockResolvedValue({ data: { data: mockCard } });
      cardAPI.assignLabel.mockResolvedValue({ data: { success: true } });

      const user = userEvent.setup();
      const onCardUpdate = vi.fn();
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
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Click the label (pending only — no API call yet)
      await user.click(screen.getByText('Bug'));
      expect(cardAPI.assignLabel).not.toHaveBeenCalled();

      // Press Save
      await user.click(screen.getByRole('button', { name: /cards:save/i }));

      await waitFor(() => {
        expect(cardAPI.assignLabel).toHaveBeenCalledWith('card123', 'label1');
      });
    });

    it('should call cardAPI.removeLabel on Save after clicking an assigned label', async () => {
      const cardWithLabels = { ...mockCard, labels: [mockLabels[0]] };
      cardAPI.update.mockResolvedValue({ data: { data: cardWithLabels } });
      cardAPI.removeLabel.mockResolvedValue({ data: { success: true } });

      const user = userEvent.setup();
      render(
        <CardModal
          card={cardWithLabels}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Click assigned label (pending only — no API call yet)
      await user.click(screen.getByText('Bug'));
      expect(cardAPI.removeLabel).not.toHaveBeenCalled();

      // Press Save
      await user.click(screen.getByRole('button', { name: /cards:save/i }));

      await waitFor(() => {
        expect(cardAPI.removeLabel).toHaveBeenCalledWith('card123', 'label1');
      });
    });
  });

  describe('Status integration', () => {
    it('should display StatusSelector component', () => {
      render(
        <CardModal
          card={mockCard}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      const statusSelect = screen.getByRole('combobox');
      expect(statusSelect).toBeInTheDocument();
    });

    it('should show current status', () => {
      const cardWithStatus = {
        ...mockCard,
        status: 'in-progress',
      };

      render(
        <CardModal
          card={cardWithStatus}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      const statusSelect = screen.getByRole('combobox');
      expect(statusSelect).toHaveTextContent(/in progress/i);
    });

    it('should call cardAPI.updateStatus on Save after changing the status', async () => {
      cardAPI.update.mockResolvedValue({ data: { data: mockCard } });
      cardAPI.updateStatus.mockResolvedValue({ data: { success: true } });

      const user = userEvent.setup();
      render(
        <CardModal
          card={mockCard}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      // Change status (pending only — no API call yet)
      await user.selectOptions(
        screen.getByRole('combobox'),
        screen.getByRole('option', { name: /done/i })
      );
      expect(cardAPI.updateStatus).not.toHaveBeenCalled();

      // Press Save
      await user.click(screen.getByRole('button', { name: /cards:save/i }));

      await waitFor(() => {
        expect(cardAPI.updateStatus).toHaveBeenCalledWith('card123', 'done');
      });
    });
  });

  describe('Combined functionality', () => {
    it('should display labels, status, and member assignment together', async () => {
      const fullCard = {
        ...mockCard,
        labels: [mockLabels[0]],
        status: 'in-progress',
        assignedTo: [],
      };

      render(
        <CardModal
          card={fullCard}
          boardId={mockBoardId}
          members={mockMembers}
          onClose={vi.fn()}
          onCardUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Verify all sections are present
      expect(screen.getByText('cards:labels')).toBeInTheDocument();
      expect(screen.getByText('cards:status')).toBeInTheDocument();
      const statusSelect = screen.getByRole('combobox');
      expect(statusSelect).toHaveTextContent(/in progress/i);
    });
  });
});
