import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KanbanList from '../KanbanList';
import { cardAPI, listAPI } from '../../utils/api';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => (opts?.name ? opts.name : key),
    i18n: { changeLanguage: vi.fn() },
  }),
}));

// Mock API
vi.mock('../../utils/api', () => ({
  cardAPI: {
    create: vi.fn(),
  },
  listAPI: {
    delete: vi.fn(),
  },
}));

// Mock DnD Kit
vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
}));

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  SortableContext: ({ children }) => <>{children}</>,
  verticalListSortingStrategy: {},
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: { toString: vi.fn(() => '') },
  },
}));

// Mock KanbanCard to avoid its own DnD dependencies
vi.mock('../KanbanCard', () => ({
  default: ({ card, onClick, onDelete }) => (
    <div data-testid={`card-${card._id}`} onClick={onClick}>
      <span>{card.title}</span>
      <button
        data-testid={`delete-card-${card._id}`}
        onClick={e => {
          e.stopPropagation();
          onDelete(card._id);
        }}
      >
        Delete Card
      </button>
    </div>
  ),
}));

describe('KanbanList', () => {
  const mockList = {
    _id: 'list-1',
    name: 'Todo',
    cards: [],
  };

  const mockListWithCards = {
    _id: 'list-1',
    name: 'Todo',
    cards: [
      { _id: 'card-1', title: 'Card 1' },
      { _id: 'card-2', title: 'Card 2' },
    ],
  };

  const mockOnCardClick = vi.fn();
  const mockOnListUpdate = vi.fn();
  const mockOnEditList = vi.fn();

  function renderKanbanList(listProp = mockList, extraProps = {}) {
    return render(
      <KanbanList
        list={listProp}
        boardId="board-1"
        onCardClick={mockOnCardClick}
        onListUpdate={mockOnListUpdate}
        {...extraProps}
      />
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the list name', () => {
      renderKanbanList();
      expect(screen.getByText('Todo')).toBeInTheDocument();
    });

    it('renders cards when list has cards', () => {
      renderKanbanList(mockListWithCards);
      expect(screen.getByTestId('card-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-card-2')).toBeInTheDocument();
    });

    it('renders card count text', () => {
      renderKanbanList(mockListWithCards);
      expect(screen.getByText('lists:cardsCount')).toBeInTheDocument();
    });

    it('shows add card button when form is hidden', () => {
      renderKanbanList();
      expect(screen.getByText(/lists:addAnotherCard/)).toBeInTheDocument();
    });

    it('renders empty list without cards container margin', () => {
      renderKanbanList();
      // No mb-4 class when no cards - just verify no card elements
      expect(screen.queryByTestId(/^card-/)).not.toBeInTheDocument();
    });

    it('shows edit button when onEditList prop is provided', () => {
      renderKanbanList(mockList, { onEditList: mockOnEditList });
      expect(screen.getByTitle('lists:edit')).toBeInTheDocument();
    });

    it('does not show edit button when onEditList is not provided', () => {
      renderKanbanList();
      expect(screen.queryByText('lists:edit')).not.toBeInTheDocument();
    });
  });

  describe('Add Card Form', () => {
    it('shows form when add card button is clicked', () => {
      renderKanbanList();
      fireEvent.click(screen.getByText(/lists:addAnotherCard/));
      expect(
        screen.getByPlaceholderText('lists:cardTitlePlaceholder')
      ).toBeInTheDocument();
    });

    it('hides form and shows add button when cancel is clicked', () => {
      renderKanbanList();
      fireEvent.click(screen.getByText(/lists:addAnotherCard/));
      fireEvent.click(screen.getByText('lists:cancel'));
      expect(
        screen.queryByPlaceholderText('lists:cardTitlePlaceholder')
      ).not.toBeInTheDocument();
      expect(screen.getByText(/lists:addAnotherCard/)).toBeInTheDocument();
    });

    it('resets title when cancel is clicked', () => {
      renderKanbanList();
      fireEvent.click(screen.getByText(/lists:addAnotherCard/));
      const textarea = screen.getByPlaceholderText(
        'lists:cardTitlePlaceholder'
      );
      fireEvent.change(textarea, { target: { value: 'Some text' } });
      fireEvent.click(screen.getByText('lists:cancel'));
      // Re-open form
      fireEvent.click(screen.getByText(/lists:addAnotherCard/));
      expect(
        screen.getByPlaceholderText('lists:cardTitlePlaceholder').value
      ).toBe('');
    });

    it('does not submit form when title is empty', async () => {
      renderKanbanList();
      fireEvent.click(screen.getByText(/lists:addAnotherCard/));
      fireEvent.click(screen.getByText('lists:addCard'));
      expect(cardAPI.create).not.toHaveBeenCalled();
    });

    it('does not submit form when title is whitespace only', async () => {
      renderKanbanList();
      fireEvent.click(screen.getByText(/lists:addAnotherCard/));
      const textarea = screen.getByPlaceholderText(
        'lists:cardTitlePlaceholder'
      );
      fireEvent.change(textarea, { target: { value: '   ' } });
      fireEvent.click(screen.getByText('lists:addCard'));
      expect(cardAPI.create).not.toHaveBeenCalled();
    });

    it('creates card and notifies parent on successful submit', async () => {
      cardAPI.create.mockResolvedValue({ data: { success: true } });
      renderKanbanList();
      fireEvent.click(screen.getByText(/lists:addAnotherCard/));
      const textarea = screen.getByPlaceholderText(
        'lists:cardTitlePlaceholder'
      );
      fireEvent.change(textarea, { target: { value: 'New Card' } });
      fireEvent.click(screen.getByText('lists:addCard'));

      await waitFor(() => {
        expect(cardAPI.create).toHaveBeenCalledWith('list-1', {
          title: 'New Card',
          description: '',
          position: 0,
          boardId: 'board-1',
          listId: 'list-1',
        });
        expect(mockOnListUpdate).toHaveBeenCalled();
      });

      // Form should be hidden after success
      expect(
        screen.queryByPlaceholderText('lists:cardTitlePlaceholder')
      ).not.toBeInTheDocument();
    });

    it('handles card creation error gracefully', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      cardAPI.create.mockRejectedValue(new Error('API Error'));
      renderKanbanList();
      fireEvent.click(screen.getByText(/lists:addAnotherCard/));
      const textarea = screen.getByPlaceholderText(
        'lists:cardTitlePlaceholder'
      );
      fireEvent.change(textarea, { target: { value: 'New Card' } });
      fireEvent.click(screen.getByText('lists:addCard'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error creating card',
          expect.any(Error)
        );
      });
      consoleSpy.mockRestore();
    });
  });

  describe('Card Interactions', () => {
    it('calls onCardClick when a card is clicked', () => {
      renderKanbanList(mockListWithCards);
      fireEvent.click(screen.getByTestId('card-card-1'));
      expect(mockOnCardClick).toHaveBeenCalledWith(mockListWithCards.cards[0]);
    });

    it('calls onListUpdate when a card delete is triggered', () => {
      renderKanbanList(mockListWithCards);
      fireEvent.click(screen.getByTestId('delete-card-card-1'));
      expect(mockOnListUpdate).toHaveBeenCalled();
    });
  });

  describe('Delete List', () => {
    it('deletes list and notifies parent when confirmed', async () => {
      listAPI.delete.mockResolvedValue({ data: { success: true } });

      renderKanbanList();
      fireEvent.click(screen.getByTitle('lists:delete'));

      // Confirm in the modal
      const confirmBtn = await screen.findByRole('button', {
        name: /confirm/i,
      });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(listAPI.delete).toHaveBeenCalledWith('list-1');
        expect(mockOnListUpdate).toHaveBeenCalled();
      });
    });

    it('does not delete list when confirmation is cancelled', async () => {
      renderKanbanList();
      fireEvent.click(screen.getByTitle('lists:delete'));

      // Cancel in the modal
      const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(listAPI.delete).not.toHaveBeenCalled();
      });
    });

    it('handles delete error gracefully', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      listAPI.delete.mockRejectedValue(new Error('API Error'));

      renderKanbanList();
      fireEvent.click(screen.getByTitle('lists:delete'));

      // Confirm in the modal
      const confirmBtn = await screen.findByRole('button', {
        name: /confirm/i,
      });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error deleting list',
          expect.any(Error)
        );
      });
      consoleSpy.mockRestore();
    });
  });

  describe('Edit List Button', () => {
    it('calls onEditList with the list when edit button is clicked', () => {
      renderKanbanList(mockList, { onEditList: mockOnEditList });
      fireEvent.click(screen.getByTitle('lists:edit'));
      expect(mockOnEditList).toHaveBeenCalledWith(mockList);
    });
  });

  describe('Drag State Styling', () => {
    it('applies isOver styling when a card is dragged over the list', () => {
      useDroppable.mockReturnValueOnce({ setNodeRef: vi.fn(), isOver: true });

      const { container } = renderKanbanList();
      const listDiv = container.firstChild;

      expect(listDiv.className).toContain('ring-2');
      expect(listDiv.className).toContain('ring-blue-500');
    });

    it('applies isDragging styling when the list is being dragged', () => {
      useSortable.mockReturnValueOnce({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: true,
      });

      const { container } = renderKanbanList();
      const listDiv = container.firstChild;

      expect(listDiv.className).toContain('cursor-grabbing');
    });

    it('applies reduced opacity when the list is being dragged', () => {
      useSortable.mockReturnValueOnce({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: true,
      });

      const { container } = renderKanbanList();
      const listDiv = container.firstChild;

      expect(listDiv.style.opacity).toBe('0.5');
    });
  });
});
