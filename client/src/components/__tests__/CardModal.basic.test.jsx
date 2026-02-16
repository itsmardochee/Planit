import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CardModal from '../CardModal';
import * as apiModule from '../../utils/api';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

// Mock API
vi.mock('../../utils/api', () => ({
  cardAPI: {
    update: vi.fn(),
    delete: vi.fn(),
    assign: vi.fn(),
    unassign: vi.fn(),
  },
}));

describe('CardModal - Basic Fields', () => {
  const mockCard = {
    _id: 'card-123',
    title: 'Test Card',
    description: 'Original description',
    listId: 'list-1',
  };

  const mockOnClose = vi.fn();
  const mockOnCardUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderCardModal(props = {}) {
    return render(
      <I18nextProvider i18n={i18n}>
        <CardModal
          open={true}
          onClose={mockOnClose}
          onCardUpdate={mockOnCardUpdate}
          onDelete={mockOnDelete}
          card={mockCard}
          {...props}
        />
      </I18nextProvider>
    );
  }

  it('renders card title in input field', () => {
    renderCardModal();

    const titleInput = screen.getByDisplayValue('Test Card');
    expect(titleInput).toBeInTheDocument();
  });

  it('renders card description in textarea', () => {
    renderCardModal();

    const descriptionTextarea = screen.getByDisplayValue(
      'Original description'
    );
    expect(descriptionTextarea).toBeInTheDocument();
  });

  it('updates title when user types', () => {
    renderCardModal();

    const titleInput = screen.getByDisplayValue('Test Card');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    expect(titleInput.value).toBe('Updated Title');
  });

  it('updates description when user types', () => {
    renderCardModal();

    const descriptionTextarea = screen.getByDisplayValue(
      'Original description'
    );
    fireEvent.change(descriptionTextarea, {
      target: { value: 'Updated description content' },
    });

    expect(descriptionTextarea.value).toBe('Updated description content');
  });

  it('saves both title and description changes when save button clicked', async () => {
    apiModule.cardAPI.update.mockResolvedValue({
      data: {
        data: {
          _id: 'card-123',
          title: 'New Title',
          description: 'New description',
        },
      },
    });

    renderCardModal();

    // Change title
    const titleInput = screen.getByDisplayValue('Test Card');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    // Change description
    const descriptionTextarea = screen.getByDisplayValue(
      'Original description'
    );
    fireEvent.change(descriptionTextarea, {
      target: { value: 'New description' },
    });

    // Click save
    const saveButton = screen.getByRole('button', {
      name: /save|enregistrer/i,
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiModule.cardAPI.update).toHaveBeenCalledWith('card-123', {
        title: 'New Title',
        description: 'New description',
      });
    });

    expect(mockOnCardUpdate).toHaveBeenCalled();
  });

  it('renders description placeholder text', () => {
    const cardWithoutDescription = {
      ...mockCard,
      description: '',
    };

    render(
      <I18nextProvider i18n={i18n}>
        <CardModal
          open={true}
          onClose={mockOnClose}
          onCardUpdate={mockOnCardUpdate}
          card={cardWithoutDescription}
        />
      </I18nextProvider>
    );

    const descriptionTextarea = screen.getByPlaceholderText(/description/i);
    expect(descriptionTextarea).toBeInTheDocument();
  });

  it('handles description with multiple lines', () => {
    const multilineDescription = 'Line 1\nLine 2\nLine 3';
    const cardWithMultiline = {
      ...mockCard,
      description: multilineDescription,
    };

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <CardModal
          open={true}
          onClose={mockOnClose}
          onCardUpdate={mockOnCardUpdate}
          card={cardWithMultiline}
        />
      </I18nextProvider>
    );

    const descriptionTextarea = container.querySelector('textarea');
    expect(descriptionTextarea).toBeInTheDocument();
    expect(descriptionTextarea.value).toContain('Line 1');
    expect(descriptionTextarea.value).toContain('Line 2');
  });
});
