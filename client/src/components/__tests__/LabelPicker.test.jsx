import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LabelPicker from '../LabelPicker';
import { labelAPI, cardAPI } from '../../utils/api';

// Mock the API
vi.mock('../../utils/api', () => ({
  labelAPI: {
    getByBoard: vi.fn(),
  },
  cardAPI: {
    assignLabel: vi.fn(),
    removeLabel: vi.fn(),
  },
}));

describe('LabelPicker', () => {
  const mockBoardId = 'board123';
  const mockCardId = 'card456';
  const mockLabels = [
    { _id: 'label1', name: 'Bug', color: '#FF0000', boardId: mockBoardId },
    {
      _id: 'label2',
      name: 'Feature',
      color: '#00FF00',
      boardId: mockBoardId,
    },
    {
      _id: 'label3',
      name: 'Documentation',
      color: '#0000FF',
      boardId: mockBoardId,
    },
  ];
  const mockCard = {
    _id: mockCardId,
    title: 'Test Card',
    labels: [mockLabels[0], mockLabels[2]], // Bug and Documentation
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display labels', () => {
    it('should fetch and display all available labels', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      render(<LabelPicker boardId={mockBoardId} card={mockCard} />);

      await waitFor(() => {
        expect(labelAPI.getByBoard).toHaveBeenCalledWith(mockBoardId);
      });

      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('should visually distinguish assigned labels from unassigned ones', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      render(<LabelPicker boardId={mockBoardId} card={mockCard} />);

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Check that assigned labels have a checkmark icon
      const bugLabel = screen
        .getByText('Bug')
        .closest('[data-testid*="label"]');
      const featureLabel = screen
        .getByText('Feature')
        .closest('[data-testid*="label"]');

      // Bug and Documentation should show as assigned (have check icon)
      expect(
        bugLabel?.querySelector('[data-testid="CheckIcon"]')
      ).toBeInTheDocument();
      // Feature should not have check icon (unassigned)
      expect(
        featureLabel?.querySelector('[data-testid="CheckIcon"]')
      ).not.toBeInTheDocument();
    });
  });

  describe('Assign label', () => {
    it('should assign a label when clicking on unassigned label', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });
      const updatedCard = {
        ...mockCard,
        labels: [...mockCard.labels, mockLabels[1]], // Add Feature
      };
      cardAPI.assignLabel.mockResolvedValue({
        data: { success: true, data: updatedCard },
      });

      const onUpdate = vi.fn();
      const user = userEvent.setup();

      render(
        <LabelPicker
          boardId={mockBoardId}
          card={mockCard}
          onUpdate={onUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Feature')).toBeInTheDocument();
      });

      // Click on Feature label (not currently assigned)
      const featureLabel = screen.getByText('Feature');
      await user.click(featureLabel);

      await waitFor(() => {
        expect(cardAPI.assignLabel).toHaveBeenCalledWith(mockCardId, 'label2');
      });

      expect(onUpdate).toHaveBeenCalledWith(updatedCard);
    });

    it('should show error message if assign fails', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });
      cardAPI.assignLabel.mockRejectedValue({
        response: { data: { message: 'Failed to assign label' } },
      });

      const user = userEvent.setup();
      render(<LabelPicker boardId={mockBoardId} card={mockCard} />);

      await waitFor(() => {
        expect(screen.getByText('Feature')).toBeInTheDocument();
      });

      const featureLabel = screen.getByText('Feature');
      await user.click(featureLabel);

      await waitFor(() => {
        expect(screen.getByText(/failed to assign label/i)).toBeInTheDocument();
      });
    });
  });

  describe('Remove label', () => {
    it('should remove a label when clicking on assigned label', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });
      const updatedCard = {
        ...mockCard,
        labels: [mockLabels[2]], // Only Documentation, Bug removed
      };
      cardAPI.removeLabel.mockResolvedValue({
        data: { success: true, data: updatedCard },
      });

      const onUpdate = vi.fn();
      const user = userEvent.setup();

      render(
        <LabelPicker
          boardId={mockBoardId}
          card={mockCard}
          onUpdate={onUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Click on Bug label (currently assigned)
      const bugLabel = screen.getByText('Bug');
      await user.click(bugLabel);

      await waitFor(() => {
        expect(cardAPI.removeLabel).toHaveBeenCalledWith(mockCardId, 'label1');
      });

      expect(onUpdate).toHaveBeenCalledWith(updatedCard);
    });

    it('should show error message if remove fails', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });
      cardAPI.removeLabel.mockRejectedValue({
        response: { data: { message: 'Failed to remove label' } },
      });

      const user = userEvent.setup();
      render(<LabelPicker boardId={mockBoardId} card={mockCard} />);

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      const bugLabel = screen.getByText('Bug');
      await user.click(bugLabel);

      await waitFor(() => {
        expect(screen.getByText(/failed to remove label/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty states', () => {
    it('should show message when no labels exist', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: [] },
      });

      render(<LabelPicker boardId={mockBoardId} card={mockCard} />);

      await waitFor(() => {
        expect(screen.getByText(/no labels available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator while fetching labels', () => {
      labelAPI.getByBoard.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<LabelPicker boardId={mockBoardId} card={mockCard} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
