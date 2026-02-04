import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import ListEditModal from '../ListEditModal';

const renderWithI18n = ui =>
  render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);

describe('ListEditModal', () => {
  const mockList = {
    _id: '123',
    name: 'Test List',
  };

  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when list is null', () => {
    const { container } = renderWithI18n(
      <ListEditModal list={null} onClose={mockOnClose} onSave={mockOnSave} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with list data', () => {
    renderWithI18n(
      <ListEditModal
        list={mockList}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Edit List')).toBeInTheDocument();
    expect(screen.getByLabelText('List Name *')).toHaveValue('Test List');
  });

  it('updates name input value on change', () => {
    renderWithI18n(
      <ListEditModal
        list={mockList}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText('List Name *');
    fireEvent.change(nameInput, { target: { value: 'New List Name' } });
    expect(nameInput).toHaveValue('New List Name');
  });

  it('shows error when submitting with empty name', async () => {
    renderWithI18n(
      <ListEditModal
        list={mockList}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText('List Name *');
    fireEvent.change(nameInput, { target: { value: '   ' } });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('List name is required')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('calls onSave with trimmed name on valid submit', async () => {
    mockOnSave.mockResolvedValue({});

    renderWithI18n(
      <ListEditModal
        list={mockList}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText('List Name *');
    fireEvent.change(nameInput, { target: { value: '  Updated List  ' } });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: 'Updated List',
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    renderWithI18n(
      <ListEditModal
        list={mockList}
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

    renderWithI18n(
      <ListEditModal
        list={mockList}
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
    const errorMessage = 'Failed to update list';
    mockOnSave.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    renderWithI18n(
      <ListEditModal
        list={mockList}
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

    renderWithI18n(
      <ListEditModal
        list={mockList}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update list')).toBeInTheDocument();
    });
  });
});
