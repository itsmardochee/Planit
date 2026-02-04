import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BoardEditModal from '../BoardEditModal';

describe('BoardEditModal', () => {
  const mockBoard = {
    _id: '123',
    name: 'Test Board',
    description: 'Test Description',
  };

  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when board is null', () => {
    const { container } = render(
      <BoardEditModal board={null} onClose={mockOnClose} onSave={mockOnSave} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with board data', () => {
    render(
      <BoardEditModal
        board={mockBoard}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Edit Board')).toBeInTheDocument();
    expect(screen.getByLabelText('Board Name *')).toHaveValue('Test Board');
    expect(screen.getByLabelText('Description')).toHaveValue(
      'Test Description'
    );
  });

  it('updates name input value on change', () => {
    render(
      <BoardEditModal
        board={mockBoard}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText('Board Name *');
    fireEvent.change(nameInput, { target: { value: 'New Board Name' } });
    expect(nameInput).toHaveValue('New Board Name');
  });

  it('updates description input value on change', () => {
    render(
      <BoardEditModal
        board={mockBoard}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'New Description' },
    });
    expect(descriptionInput).toHaveValue('New Description');
  });

  it('shows error when submitting with empty name', async () => {
    render(
      <BoardEditModal
        board={mockBoard}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText('Board Name *');
    fireEvent.change(nameInput, { target: { value: '   ' } });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Board name is required')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('calls onSave with trimmed values on valid submit', async () => {
    mockOnSave.mockResolvedValue({});

    render(
      <BoardEditModal
        board={mockBoard}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText('Board Name *');
    const descriptionInput = screen.getByLabelText('Description');

    fireEvent.change(nameInput, { target: { value: '  Updated Board  ' } });
    fireEvent.change(descriptionInput, {
      target: { value: '  Updated Description  ' },
    });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: 'Updated Board',
        description: 'Updated Description',
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <BoardEditModal
        board={mockBoard}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('shows loading state during save', async () => {
    mockOnSave.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <BoardEditModal
        board={mockBoard}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();
  });

  it('displays error message when save fails', async () => {
    const errorMessage = 'Failed to update board';
    mockOnSave.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    render(
      <BoardEditModal
        board={mockBoard}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('displays generic error message when error has no response', async () => {
    mockOnSave.mockRejectedValue(new Error('Network error'));

    render(
      <BoardEditModal
        board={mockBoard}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update board')).toBeInTheDocument();
    });
  });
});
