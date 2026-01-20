import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WorkspaceEditModal from '../WorkspaceEditModal';

describe('WorkspaceEditModal', () => {
  const mockWorkspace = {
    _id: '123',
    name: 'Test Workspace',
    description: 'Test Description',
  };

  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with workspace data', () => {
    render(
      <WorkspaceEditModal
        workspace={mockWorkspace}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Edit Workspace')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Workspace')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  it('does not render when workspace is null', () => {
    const { container } = render(
      <WorkspaceEditModal
        workspace={null}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('updates name input value', () => {
    render(
      <WorkspaceEditModal
        workspace={mockWorkspace}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText(/workspace name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

    expect(nameInput.value).toBe('Updated Name');
  });

  it('updates description input value', () => {
    render(
      <WorkspaceEditModal
        workspace={mockWorkspace}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, {
      target: { value: 'Updated Description' },
    });

    expect(descriptionInput.value).toBe('Updated Description');
  });

  it('shows error when name is empty', async () => {
    render(
      <WorkspaceEditModal
        workspace={mockWorkspace}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText(/workspace name/i);
    fireEvent.change(nameInput, { target: { value: '   ' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Workspace name is required')
      ).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('calls onSave with updated data on submit', async () => {
    mockOnSave.mockResolvedValueOnce();

    render(
      <WorkspaceEditModal
        workspace={mockWorkspace}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText(/workspace name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'Updated Description' },
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: 'Updated Name',
        description: 'Updated Description',
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('trims whitespace from inputs', async () => {
    mockOnSave.mockResolvedValueOnce();

    render(
      <WorkspaceEditModal
        workspace={mockWorkspace}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByLabelText(/workspace name/i);
    fireEvent.change(nameInput, { target: { value: '  Trimmed Name  ' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: 'Trimmed Name',
        description: 'Test Description',
      });
    });
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(
      <WorkspaceEditModal
        workspace={mockWorkspace}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state during save', async () => {
    mockOnSave.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <WorkspaceEditModal
        workspace={mockWorkspace}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('displays error message on save failure', async () => {
    const errorMessage = 'Failed to update workspace';
    mockOnSave.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    render(
      <WorkspaceEditModal
        workspace={mockWorkspace}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
