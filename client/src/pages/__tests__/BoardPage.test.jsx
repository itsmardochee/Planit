import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BoardPage from '../BoardPage';
import * as boardAPI from '../../utils/api';
import * as listAPI from '../../utils/api';
import * as cardAPI from '../../utils/api';
import * as memberAPI from '../../utils/api';

// Mock the API modules
vi.mock('../../utils/api', async () => {
  const actual = await vi.importActual('../../utils/api');
  return {
    ...actual,
    boardAPI: {
      getById: vi.fn(),
    },
    listAPI: {
      getByBoard: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      reorder: vi.fn(),
    },
    cardAPI: {
      getByList: vi.fn(),
      reorder: vi.fn(),
    },
    memberAPI: {
      getByWorkspace: vi.fn(),
    },
    labelAPI: {
      getByBoard: vi.fn(),
    },
  };
});

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ boardId: 'board123' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock @dnd-kit components to avoid complex DOM setup
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

// Mock child components to simplify testing
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

describe('BoardPage Integration Tests', () => {
  const mockBoard = {
    _id: 'board123',
    name: 'Test Board',
    workspaceId: 'workspace123',
    userId: 'user123',
  };

  const mockMembers = [
    {
      _id: 'member1',
      userId: { _id: 'user1', name: 'Alice', email: 'alice@test.com' },
    },
  ];

  const mockLists = [
    { _id: 'list1', name: 'To Do', position: 0, boardId: 'board123' },
  ];

  const mockCards = {
    list1: [
      {
        _id: 'card1',
        title: 'Card 1',
        listId: 'list1',
        position: 0,
        assignedTo: [],
        dueDate: null,
      },
    ],
  };

  beforeEach(() => {
    // Setup default mocks
    boardAPI.boardAPI.getById.mockResolvedValue({
      data: { success: true, data: mockBoard },
    });
    memberAPI.memberAPI.getByWorkspace.mockResolvedValue({
      data: { success: true, data: mockMembers },
    });
    listAPI.listAPI.getByBoard.mockResolvedValue({
      data: { success: true, data: mockLists },
    });
    cardAPI.cardAPI.getByList.mockImplementation(listId => {
      const cards = mockCards[listId] || [];
      return Promise.resolve({ data: { success: true, data: cards } });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderBoardPage = () => {
    return render(
      <BrowserRouter>
        <BoardPage />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should show loading state initially', () => {
      renderBoardPage();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should call correct APIs on mount', async () => {
      renderBoardPage();

      await waitFor(() => {
        expect(boardAPI.boardAPI.getById).toHaveBeenCalledWith('board123');
        expect(listAPI.listAPI.getByBoard).toHaveBeenCalledWith('board123');
        expect(memberAPI.memberAPI.getByWorkspace).toHaveBeenCalledWith(
          'workspace123'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle board fetch error gracefully', async () => {
      boardAPI.boardAPI.getById.mockRejectedValue(
        new Error('Failed to load board')
      );

      renderBoardPage();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch board data on mount', async () => {
      renderBoardPage();

      await waitFor(() => {
        expect(boardAPI.boardAPI.getById).toHaveBeenCalledTimes(1);
      });
    });

    it('should fetch lists for the board', async () => {
      renderBoardPage();

      await waitFor(() => {
        expect(listAPI.listAPI.getByBoard).toHaveBeenCalledWith('board123');
      });
    });

    it('should fetch cards for each list', async () => {
      renderBoardPage();

      await waitFor(() => {
        expect(cardAPI.cardAPI.getByList).toHaveBeenCalled();
      });
    });
  });
});
