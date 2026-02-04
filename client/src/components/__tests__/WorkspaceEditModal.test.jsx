import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach as vitestBeforeEach,
} from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import WorkspaceEditModal from '../WorkspaceEditModal';

describe('WorkspaceEditModal', () => {
  const mockWorkspace = {
    _id: '123',
    name: 'Test Workspace',
    description: 'Test Description',
  };

  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  vitestBeforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with workspace data', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <WorkspaceEditModal
          workspace={mockWorkspace}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </I18nextProvider>
    );

    expect(screen.getByText('Edit Workspace')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Workspace')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  it('does not render when workspace is null', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <WorkspaceEditModal
          workspace={null}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </I18nextProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('updates name input value', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <WorkspaceEditModal
          workspace={mockWorkspace}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </I18nextProvider>
    );

    const nameInput = screen.getByLabelText(/workspace name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

    expect(nameInput.value).toBe('Updated Name');
  });

  it('updates description input value', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <WorkspaceEditModal
          workspace={mockWorkspace}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </I18nextProvider>
    );

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, {
      target: { value: 'Updated Description' },
    });

    expect(descriptionInput.value).toBe('Updated Description');
  });

  it('shows error when name is empty', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <WorkspaceEditModal
          workspace={mockWorkspace}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </I18nextProvider>
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
      <I18nextProvider i18n={i18n}>
        <WorkspaceEditModal
          workspace={mockWorkspace}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </I18nextProvider>
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
      <I18nextProvider i18n={i18n}>
        <WorkspaceEditModal
          workspace={mockWorkspace}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </I18nextProvider>
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
      <I18nextProvider i18n={i18n}>
        <WorkspaceEditModal
          workspace={mockWorkspace}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </I18nextProvider>
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
      <I18nextProvider i18n={i18n}>
        <WorkspaceEditModal
          workspace={mockWorkspace}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </I18nextProvider>
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
      <I18nextProvider i18n={i18n}>
        <WorkspaceEditModal
          workspace={mockWorkspace}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </I18nextProvider>
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
