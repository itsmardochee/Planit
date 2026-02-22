import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BoardPage from '../../pages/BoardPage';
import * as api from '../../utils/api';

vi.mock('../../utils/api', () => ({
  boardAPI: {
    getById: vi.fn(),
  },
  listAPI: {
    getByBoard: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  cardAPI: {
    getByList: vi.fn(),
  },
  memberAPI: {
    getByWorkspace: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ boardId: 'board123' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

// Mock CardModal to control rendering and callbacks
vi.mock('../../components/CardModal', () => ({
  default: ({ card, onClose, onCardUpdate }) => (
    <div data-testid="card-modal">
      <span data-testid="modal-card-title">{card?.title}</span>
      <button onClick={onClose}>Close Modal</button>
      <button onClick={onCardUpdate}>Update Card</button>
    </div>
  ),
}));

// Mock ListEditModal to control save/close callbacks
vi.mock('../../components/ListEditModal', () => ({
  default: ({ list, onSave, onClose }) =>
    list ? (
      <div data-testid="list-edit-modal">
        <button onClick={() => onSave({ name: 'Updated List' })}>
          Save List
        </button>
        <button onClick={onClose}>Close List Modal</button>
      </div>
    ) : null,
}));

// Mock LabelManager to avoid extra complexity
vi.mock('../../components/LabelManager', () => ({
  default: () => null,
}));

// Mock KanbanCard so card clicks are predictable
vi.mock('../../components/KanbanCard', () => ({
  default: ({ card, onClick }) => (
    <div data-testid={`card-${card._id}`} onClick={onClick}>
      <span>{card.title}</span>
    </div>
  ),
}));

vi.mock('react-redux', () => ({
  useSelector: selector =>
    selector({ auth: { user: { _id: 'current-user-id' } } }),
}));

const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('BoardPage - Interactions', () => {
  const mockBoard = {
    _id: 'board123',
    name: 'Test Board',
    description: 'Test Description',
    workspaceId: 'workspace123',
  };

  const mockLists = [{ _id: 'list1', name: 'To Do', position: 0 }];

  const mockCards = [
    {
      _id: 'card1',
      title: 'Alice Task',
      assignedTo: [{ _id: 'user1' }],
      labels: [],
      status: null,
      dueDate: null,
    },
    {
      _id: 'card2',
      title: 'Unassigned Task',
      assignedTo: [],
      labels: [],
      status: null,
      dueDate: null,
    },
  ];

  const mockMembers = [
    {
      userId: { _id: 'user1', username: 'Alice', email: 'alice@example.com' },
      role: 'member',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    api.boardAPI.getById.mockResolvedValue({
      data: { success: true, data: mockBoard },
    });
    api.listAPI.getByBoard.mockResolvedValue({
      data: { success: true, data: mockLists },
    });
    api.cardAPI.getByList.mockResolvedValue({
      data: { success: true, data: mockCards },
    });
    api.memberAPI.getByWorkspace.mockResolvedValue({
      data: { success: true, data: mockMembers },
    });
  });

  describe('Card Modal', () => {
    it('opens card modal when a card is clicked', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('card-card1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('card-card1'));

      await waitFor(() => {
        expect(screen.getByTestId('card-modal')).toBeInTheDocument();
        expect(screen.getByTestId('modal-card-title').textContent).toBe(
          'Alice Task'
        );
      });
    });

    it('closes card modal when onClose is called', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('card-card1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('card-card1'));
      await waitFor(() =>
        expect(screen.getByTestId('card-modal')).toBeInTheDocument()
      );

      await user.click(screen.getByText('Close Modal'));

      await waitFor(() => {
        expect(screen.queryByTestId('card-modal')).not.toBeInTheDocument();
      });
    });

    it('refetches board data when onCardUpdate is called', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('card-card1')).toBeInTheDocument();
      });

      const callsBefore = api.boardAPI.getById.mock.calls.length;

      await user.click(screen.getByTestId('card-card1'));
      await waitFor(() =>
        expect(screen.getByTestId('card-modal')).toBeInTheDocument()
      );

      await user.click(screen.getByText('Update Card'));

      await waitFor(() => {
        expect(api.boardAPI.getById.mock.calls.length).toBeGreaterThan(
          callsBefore
        );
      });
    });
  });

  describe('List Edit', () => {
    it('opens list edit modal when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTitle('lists:edit')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('lists:edit'));

      await waitFor(() => {
        expect(screen.getByTestId('list-edit-modal')).toBeInTheDocument();
      });
    });

    it('calls listAPI.update and refetches when list is saved successfully', async () => {
      const user = userEvent.setup();
      api.listAPI.update.mockResolvedValue({ data: { success: true } });
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTitle('lists:edit')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('lists:edit'));
      await waitFor(() =>
        expect(screen.getByTestId('list-edit-modal')).toBeInTheDocument()
      );

      const callsBefore = api.boardAPI.getById.mock.calls.length;
      await user.click(screen.getByText('Save List'));

      await waitFor(() => {
        expect(api.listAPI.update).toHaveBeenCalledWith('list1', {
          name: 'Updated List',
        });
        expect(api.boardAPI.getById.mock.calls.length).toBeGreaterThan(
          callsBefore
        );
      });
    });

    it('does not refetch when save response is not successful', async () => {
      const user = userEvent.setup();
      api.listAPI.update.mockResolvedValue({ data: { success: false } });
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTitle('lists:edit')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('lists:edit'));
      await waitFor(() =>
        expect(screen.getByTestId('list-edit-modal')).toBeInTheDocument()
      );

      const callsBefore = api.boardAPI.getById.mock.calls.length;
      await user.click(screen.getByText('Save List'));

      await waitFor(() => {
        expect(api.listAPI.update).toHaveBeenCalled();
      });

      // fetchBoardData should NOT have been called again
      expect(api.boardAPI.getById.mock.calls.length).toBe(callsBefore);
    });

    it('closes list edit modal when close is clicked', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTitle('lists:edit')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('lists:edit'));
      await waitFor(() =>
        expect(screen.getByTestId('list-edit-modal')).toBeInTheDocument()
      );

      await user.click(screen.getByText('Close List Modal'));

      await waitFor(() => {
        expect(screen.queryByTestId('list-edit-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Member Filter - Specific Member', () => {
    it("filters to show only a specific member's cards", async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Alice Task')).toBeInTheDocument();
        expect(screen.getByText('Unassigned Task')).toBeInTheDocument();
      });

      // Select specific member (not 'unassigned')
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'user1');

      await waitFor(() => {
        expect(screen.getByText('Alice Task')).toBeInTheDocument();
        expect(screen.queryByText('Unassigned Task')).not.toBeInTheDocument();
      });
    });

    it('resets to show all cards when All Members is selected', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Alice Task')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'user1');

      await waitFor(() => {
        expect(screen.queryByText('Unassigned Task')).not.toBeInTheDocument();
      });

      // Reset to all members
      await user.selectOptions(select, '');

      await waitFor(() => {
        expect(screen.getByText('Alice Task')).toBeInTheDocument();
        expect(screen.getByText('Unassigned Task')).toBeInTheDocument();
      });
    });
  });
});
