import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LabelManager from '../LabelManager';
import { labelAPI } from '../../utils/api';

// Mock the API
vi.mock('../../utils/api', () => ({
  labelAPI: {
    getByBoard: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('LabelManager', () => {
  const mockBoardId = 'board123';
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
  });

  describe('Display labels', () => {
    it('should fetch and display all labels for the board', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      render(<LabelManager boardId={mockBoardId} open={true} />);

      await waitFor(() => {
        expect(labelAPI.getByBoard).toHaveBeenCalledWith(mockBoardId);
      });

      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
    });

    it('should display label colors correctly', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      render(<LabelManager boardId={mockBoardId} open={true} />);

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Check that label badges have the correct background colors
      const bugLabel = screen
        .getByText('Bug')
        .closest('[data-testid*="label"]');
      const featureLabel = screen
        .getByText('Feature')
        .closest('[data-testid*="label"]');

      expect(bugLabel).toHaveStyle({ backgroundColor: '#FF0000' });
      expect(featureLabel).toHaveStyle({ backgroundColor: '#00FF00' });
    });
  });

  describe('Create label', () => {
    it('should create a new label with valid data', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });
      const newLabel = {
        _id: 'label3',
        name: 'Documentation',
        color: '#0000FF',
        boardId: mockBoardId,
      };
      labelAPI.create.mockResolvedValue({
        data: { success: true, data: newLabel },
      });

      const user = userEvent.setup();
      render(<LabelManager boardId={mockBoardId} open={true} />);

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Click "Add Label" button
      const addButton = screen.getByRole('button', { name: /add new label/i });
      await user.click(addButton);

      // Fill in the form
      const nameInput = screen.getByLabelText(/label name/i);
      await user.type(nameInput, 'Documentation');

      const colorInput = screen.getByLabelText(/color/i);
      fireEvent.change(colorInput, { target: { value: '#0000FF' } });

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(labelAPI.create).toHaveBeenCalledWith(mockBoardId, {
          name: 'Documentation',
          color: '#0000FF',
        });
      });

      // Verify the new label appears in the list
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('should show error if label name is empty', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      const user = userEvent.setup();
      render(<LabelManager boardId={mockBoardId} open={true} />);

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add new label/i });
      await user.click(addButton);

      // Try to save without entering a name
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/label name is required/i)).toBeInTheDocument();
      });

      expect(labelAPI.create).not.toHaveBeenCalled();
    });

    it('should show error if label name exceeds 50 characters', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      const user = userEvent.setup();
      render(<LabelManager boardId={mockBoardId} open={true} />);

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add new label/i });
      await user.click(addButton);

      const nameInput = screen.getByLabelText(/label name/i);
      await user.type(
        nameInput,
        'This is a very long label name that exceeds the maximum allowed length of fifty characters'
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/label name cannot exceed 50 characters/i)
        ).toBeInTheDocument();
      });

      expect(labelAPI.create).not.toHaveBeenCalled();
    });

    it('should use a valid color input that prevents invalid formats', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      const user = userEvent.setup();
      render(<LabelManager boardId={mockBoardId} open={true} />);

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add new label/i });
      await user.click(addButton);

      // Verify that the color input is of type "color" which prevents invalid input
      const colorTextInput = screen.getByLabelText(/color/i);
      const colorInput = colorTextInput
        .closest('div')
        .querySelector('input[type="color"]');
      expect(colorInput).toHaveAttribute('type', 'color');

      // HTML color inputs only accept valid hex colors, so we verify it has a default valid color
      expect(colorTextInput.value).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('Edit label', () => {
    it('should update an existing label', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });
      const updatedLabel = {
        ...mockLabels[0],
        name: 'Critical Bug',
        color: '#FF5500',
      };
      labelAPI.update.mockResolvedValue({
        data: { success: true, data: updatedLabel },
      });

      const user = userEvent.setup();
      render(<LabelManager boardId={mockBoardId} open={true} />);

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Click edit button for the first label
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      // Modify the name
      const nameInput = screen.getByLabelText(/label name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Critical Bug');

      // Modify the color
      const colorInput = screen.getByLabelText(/color/i);
      fireEvent.change(colorInput, { target: { value: '#FF5500' } });

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(labelAPI.update).toHaveBeenCalledWith('label1', {
          name: 'Critical Bug',
          color: '#FF5500',
        });
      });

      // Verify the updated label appears in the list
      expect(screen.getByText('Critical Bug')).toBeInTheDocument();
    });

    it('should cancel editing and revert changes', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      const user = userEvent.setup();
      render(<LabelManager boardId={mockBoardId} open={true} />);

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      // Modify the name
      const nameInput = screen.getByLabelText(/label name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Modified Name');

      // Cancel editing
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify original name is still displayed
      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.queryByText('Modified Name')).not.toBeInTheDocument();
      expect(labelAPI.update).not.toHaveBeenCalled();
    });
  });

  describe('Delete label', () => {
    it('should delete a label', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });
      labelAPI.delete.mockResolvedValue({
        data: { success: true, message: 'Label deleted successfully' },
      });

      const user = userEvent.setup();
      render(<LabelManager boardId={mockBoardId} open={true} />);

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Click delete button for the first label
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Wait for confirmation dialog and confirm deletion
      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to delete this label/i)
        ).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole('button', {
        name: /confirm delete/i,
      });
      await user.click(confirmDeleteButton);

      await waitFor(() => {
        expect(labelAPI.delete).toHaveBeenCalledWith('label1');
      });

      // Verify the label is removed from the list
      expect(screen.queryByText('Bug')).not.toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
    });

    it('should show confirmation dialog before deleting', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });

      const user = userEvent.setup();
      render(<LabelManager boardId={mockBoardId} open={true} />);

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Verify confirmation dialog appears
      expect(
        screen.getByText(/are you sure you want to delete this label/i)
      ).toBeInTheDocument();

      // Cancel deletion
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify label is still in the list
      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(labelAPI.delete).not.toHaveBeenCalled();
    });
  });

  describe('Close dialog', () => {
    it('should call onClose when close button is clicked', async () => {
      labelAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLabels },
      });
      const onClose = vi.fn();

      const user = userEvent.setup();
      render(
        <LabelManager boardId={mockBoardId} open={true} onClose={onClose} />
      );

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });
});
