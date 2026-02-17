import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatusSelector from '../StatusSelector';
import { cardAPI } from '../../utils/api';

// Mock the API
vi.mock('../../utils/api', () => ({
  cardAPI: {
    updateStatus: vi.fn(),
  },
}));

describe('StatusSelector', () => {
  const mockCard = {
    _id: 'card123',
    title: 'Test Card',
    status: 'todo',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display status options', () => {
    it('should display all status options', async () => {
      const user = userEvent.setup();
      render(<StatusSelector card={mockCard} />);

      // Click to open the select dropdown
      const selectButton = screen.getByRole('combobox');
      await user.click(selectButton);

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: /to do/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: /in progress/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: /done/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: /blocked/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: /none/i })
        ).toBeInTheDocument();
      });
    });

    it('should show current status as selected', () => {
      render(<StatusSelector card={mockCard} />);

      const selectButton = screen.getByRole('combobox');
      expect(selectButton).toHaveTextContent(/to do/i);
    });

    it('should show "None" when status is null', () => {
      const cardWithNoStatus = { ...mockCard, status: null };
      render(<StatusSelector card={cardWithNoStatus} />);

      const selectButton = screen.getByRole('combobox');
      expect(selectButton).toHaveTextContent(/none/i);
    });
  });

  describe('Change status', () => {
    it('should update status to "in-progress"', async () => {
      const updatedCard = { ...mockCard, status: 'in-progress' };
      cardAPI.updateStatus.mockResolvedValue({
        data: { success: true, data: updatedCard },
      });

      const onUpdate = vi.fn();
      const user = userEvent.setup();

      render(<StatusSelector card={mockCard} onUpdate={onUpdate} />);

      // Open dropdown
      const selectButton = screen.getByRole('combobox');
      await user.click(selectButton);

      // Select "In Progress"
      const inProgressOption = screen.getByRole('option', {
        name: /in progress/i,
      });
      await user.click(inProgressOption);

      await waitFor(() => {
        expect(cardAPI.updateStatus).toHaveBeenCalledWith(
          'card123',
          'in-progress'
        );
      });

      expect(onUpdate).toHaveBeenCalledWith(updatedCard);
    });

    it('should update status to "done"', async () => {
      const updatedCard = { ...mockCard, status: 'done' };
      cardAPI.updateStatus.mockResolvedValue({
        data: { success: true, data: updatedCard },
      });

      const onUpdate = vi.fn();
      const user = userEvent.setup();

      render(<StatusSelector card={mockCard} onUpdate={onUpdate} />);

      const selectButton = screen.getByRole('combobox');
      await user.click(selectButton);

      const doneOption = screen.getByRole('option', { name: /done/i });
      await user.click(doneOption);

      await waitFor(() => {
        expect(cardAPI.updateStatus).toHaveBeenCalledWith('card123', 'done');
      });

      expect(onUpdate).toHaveBeenCalledWith(updatedCard);
    });

    it('should update status to "blocked"', async () => {
      const updatedCard = { ...mockCard, status: 'blocked' };
      cardAPI.updateStatus.mockResolvedValue({
        data: { success: true, data: updatedCard },
      });

      const onUpdate = vi.fn();
      const user = userEvent.setup();

      render(<StatusSelector card={mockCard} onUpdate={onUpdate} />);

      const selectButton = screen.getByRole('combobox');
      await user.click(selectButton);

      const blockedOption = screen.getByRole('option', { name: /blocked/i });
      await user.click(blockedOption);

      await waitFor(() => {
        expect(cardAPI.updateStatus).toHaveBeenCalledWith('card123', 'blocked');
      });

      expect(onUpdate).toHaveBeenCalledWith(updatedCard);
    });

    it('should clear status when "None" is selected', async () => {
      const updatedCard = { ...mockCard, status: null };
      cardAPI.updateStatus.mockResolvedValue({
        data: { success: true, data: updatedCard },
      });

      const onUpdate = vi.fn();
      const user = userEvent.setup();

      render(<StatusSelector card={mockCard} onUpdate={onUpdate} />);

      const selectButton = screen.getByRole('combobox');
      await user.click(selectButton);

      const noneOption = screen.getByRole('option', { name: /none/i });
      await user.click(noneOption);

      await waitFor(() => {
        expect(cardAPI.updateStatus).toHaveBeenCalledWith('card123', null);
      });

      expect(onUpdate).toHaveBeenCalledWith(updatedCard);
    });
  });

  describe('Error handling', () => {
    it('should show error message if update fails', async () => {
      cardAPI.updateStatus.mockRejectedValue({
        response: { data: { message: 'Failed to update status' } },
      });

      const user = userEvent.setup();
      render(<StatusSelector card={mockCard} />);

      const selectButton = screen.getByRole('combobox');
      await user.click(selectButton);

      const doneOption = screen.getByRole('option', { name: /done/i });
      await user.click(doneOption);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to update status/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Visual styling', () => {
    it('should display status with appropriate color coding', async () => {
      const user = userEvent.setup();
      render(<StatusSelector card={mockCard} />);

      const selectButton = screen.getByRole('combobox');
      await user.click(selectButton);

      await waitFor(() => {
        // Verify all options are present with data-testid containing status value
        expect(screen.getByTestId('status-option-todo')).toBeInTheDocument();
        expect(
          screen.getByTestId('status-option-in-progress')
        ).toBeInTheDocument();
        expect(screen.getByTestId('status-option-done')).toBeInTheDocument();
        expect(screen.getByTestId('status-option-blocked')).toBeInTheDocument();
        expect(screen.getByTestId('status-option-none')).toBeInTheDocument();
      });
    });
  });
});
