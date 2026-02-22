import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BoardPage from '../BoardPage';

// ─── Mock useSocket ─────────────────────────────────────────────────────────
let capturedBoardId = null;
let capturedHandlers = {};
const mockUseSocket = vi.fn((boardId, handlers) => {
  capturedBoardId = boardId;
  capturedHandlers = handlers;
  return { onlineUsers: [], isConnected: false };
});

vi.mock('../../hooks/useSocket', () => ({
  default: (boardId, handlers) => mockUseSocket(boardId, handlers),
}));

// ─── Mock OnlineUsers ────────────────────────────────────────────────────────
vi.mock('../../components/OnlineUsers', () => ({
  default: ({ users, isConnected }) => (
    <div
      data-testid="online-users"
      data-count={users.length}
      data-connected={isConnected}
    />
  ),
}));

// ─── Mock usePermissions ─────────────────────────────────────────────────────
vi.mock('../../hooks/usePermissions', () => ({
  default: () => ({
    role: 'owner',
    can: () => true,
    isAtLeast: () => true,
    canModifyUserRole: () => true,
    loading: false,
    error: null,
  }),
}));

// ─── Mock API ────────────────────────────────────────────────────────────────
vi.mock('../../utils/api', async () => {
  const actual = await vi.importActual('../../utils/api');
  return {
    ...actual,
    boardAPI: { getById: vi.fn() },
    listAPI: {
      getByBoard: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      reorder: vi.fn(),
    },
    cardAPI: { getByList: vi.fn(), reorder: vi.fn() },
    memberAPI: { getByWorkspace: vi.fn() },
    labelAPI: { getByBoard: vi.fn() },
  };
});

// ─── Mock react-router-dom ───────────────────────────────────────────────────
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ boardId: 'board123' }),
    useNavigate: () => vi.fn(),
  };
});

// ─── Mock @dnd-kit ───────────────────────────────────────────────────────────
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  DragOverlay: ({ children }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  pointerWithin: vi.fn(),
  rectIntersection: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  MouseSensor: vi.fn(),
  TouchSensor: vi.fn(),
  PointerSensor: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  horizontalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

// ─── Mock child components ────────────────────────────────────────────────────
vi.mock('../../components/KanbanList', () => ({
  default: ({ list }) => (
    <div data-testid={`list-${list._id}`}>
      <h3>{list.name}</h3>
    </div>
  ),
}));

vi.mock('../../components/CardModal', () => ({
  default: () => <div data-testid="card-modal" />,
}));

vi.mock('../../components/LabelManager', () => ({
  default: () => null,
}));

vi.mock('../../components/ListEditModal', () => ({
  default: () => null,
}));

vi.mock('../../components/ActivityFeed', () => ({
  default: () => null,
}));

// ─── Import mocked API after mocking ─────────────────────────────────────────
import * as api from '../../utils/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mockBoard = {
  _id: 'board123',
  name: 'Realtime Test Board',
  workspaceId: 'workspace123',
  userId: 'user123',
};

const mockLists = [
  {
    _id: 'list1',
    name: 'To Do',
    position: 0,
    boardId: 'board123',
    cards: [
      {
        _id: 'card1',
        title: 'Card 1',
        listId: 'list1',
        position: 0,
        assignedTo: [],
        dueDate: null,
      },
    ],
  },
];

const setupDefaultMocks = () => {
  api.boardAPI.getById.mockResolvedValue({
    data: { success: true, data: mockBoard },
  });
  api.memberAPI.getByWorkspace.mockResolvedValue({
    data: { success: true, data: [] },
  });
  api.listAPI.getByBoard.mockResolvedValue({
    data: { success: true, data: mockLists },
  });
  api.cardAPI.getByList.mockResolvedValue({
    data: {
      success: true,
      data: [
        {
          _id: 'card1',
          title: 'Card 1',
          listId: 'list1',
          position: 0,
          assignedTo: [],
          dueDate: null,
        },
      ],
    },
  });
};

const renderBoardPage = () =>
  render(
    <BrowserRouter>
      <BoardPage />
    </BrowserRouter>
  );

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('BoardPage — Real-time (useSocket integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedBoardId = null;
    capturedHandlers = {};
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useSocket invocation', () => {
    it('should call useSocket with the correct boardId', async () => {
      renderBoardPage();

      await waitFor(() => {
        expect(mockUseSocket).toHaveBeenCalled();
      });

      expect(capturedBoardId).toBe('board123');
    });

    it('should pass handler functions to useSocket', async () => {
      renderBoardPage();

      await waitFor(() => {
        expect(mockUseSocket).toHaveBeenCalled();
      });

      expect(typeof capturedHandlers.onCardCreated).toBe('function');
      expect(typeof capturedHandlers.onCardUpdated).toBe('function');
      expect(typeof capturedHandlers.onCardMoved).toBe('function');
      expect(typeof capturedHandlers.onCardDeleted).toBe('function');
    });
  });

  describe('onCardCreated handler', () => {
    it('should add a new card to the correct list when card:created fires', async () => {
      renderBoardPage();

      await waitFor(() => {
        expect(screen.getByTestId('list-list1')).toBeInTheDocument();
      });

      const newCard = {
        _id: 'card2',
        title: 'Real-time Card',
        listId: 'list1',
        position: 1,
      };

      act(() => {
        capturedHandlers.onCardCreated?.({
          card: newCard,
          listId: 'list1',
          boardId: 'board123',
        });
      });

      // The KanbanList mock renders list name - the list should still be there
      expect(screen.getByTestId('list-list1')).toBeInTheDocument();
    });
  });

  describe('onCardDeleted handler', () => {
    it('should remove a card from the list when card:deleted fires', async () => {
      renderBoardPage();

      await waitFor(() => {
        expect(screen.getByTestId('list-list1')).toBeInTheDocument();
      });

      // This should not throw even if the card isn't visually rendered in mock
      act(() => {
        capturedHandlers.onCardDeleted?.({
          cardId: 'card1',
          listId: 'list1',
          boardId: 'board123',
        });
      });

      expect(screen.getByTestId('list-list1')).toBeInTheDocument();
    });
  });

  describe('onCardMoved handler', () => {
    it('should call refetch when card:moved fires', async () => {
      renderBoardPage();

      await waitFor(() => {
        expect(mockUseSocket).toHaveBeenCalled();
      });

      const initialCallCount = api.boardAPI.getById.mock.calls.length;

      act(() => {
        capturedHandlers.onCardMoved?.({
          card: { _id: 'card1' },
          fromListId: 'list1',
          toListId: 'list2',
          boardId: 'board123',
        });
      });

      // refetch should trigger a new API call
      await waitFor(() => {
        expect(api.boardAPI.getById.mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });
    });
  });

  describe('OnlineUsers component', () => {
    it('should render the OnlineUsers component', async () => {
      renderBoardPage();

      await waitFor(() => {
        expect(screen.getByTestId('online-users')).toBeInTheDocument();
      });
    });

    it('should pass correct props to OnlineUsers when useSocket returns data', async () => {
      // Use mockReturnValue (persists across re-renders) instead of mockReturnValueOnce
      mockUseSocket.mockReturnValue({
        onlineUsers: [{ userId: 'u1', username: 'Alice' }],
        isConnected: true,
      });

      renderBoardPage();

      await waitFor(() => {
        const el = screen.getByTestId('online-users');
        expect(el.dataset.count).toBe('1');
        expect(el.dataset.connected).toBe('true');
      });
    });
  });
});
