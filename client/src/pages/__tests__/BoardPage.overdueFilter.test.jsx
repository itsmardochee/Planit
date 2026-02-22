import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BoardPage from '../../pages/BoardPage';
import * as api from '../../utils/api';

// Mock the API modules
vi.mock('../../utils/api', () => ({
  boardAPI: {
    getById: vi.fn(),
  },
  listAPI: {
    getByBoard: vi.fn(),
  },
  cardAPI: {
    getByList: vi.fn(),
  },
  memberAPI: {
    getByWorkspace: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ boardId: 'board123' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

// Mock react-redux so BoardPage can call useSelector without a Provider
vi.mock('react-redux', () => ({
  useSelector: selector =>
    selector({ auth: { user: { _id: 'current-user-id' } } }),
}));

const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('BoardPage - Overdue Filter', () => {
  const mockBoard = {
    _id: 'board123',
    name: 'Test Board',
    description: 'Test Description',
    workspaceId: 'workspace123',
  };

  const mockLists = [
    {
      _id: 'list1',
      name: 'To Do',
      position: 0,
    },
    {
      _id: 'list2',
      name: 'In Progress',
      position: 1,
    },
  ];

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const mockCardsWithDueDates = {
    list1: [
      {
        _id: 'card1',
        title: 'Overdue Card 1',
        description: 'This card is overdue',
        dueDate: yesterday,
        assignedTo: [],
        labels: [],
        status: null,
      },
      {
        _id: 'card2',
        title: 'Not Overdue Card',
        description: 'This card is not overdue',
        dueDate: nextWeek,
        assignedTo: [],
        labels: [],
        status: null,
      },
    ],
    list2: [
      {
        _id: 'card3',
        title: 'Overdue Card 2',
        description: 'This card is also overdue',
        dueDate: yesterday,
        assignedTo: [],
        labels: [],
        status: null,
      },
      {
        _id: 'card4',
        title: 'Card without due date',
        description: 'No due date',
        dueDate: null,
        assignedTo: [],
        labels: [],
        status: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.boardAPI.getById.mockResolvedValue({
      data: { success: true, data: mockBoard },
    });
    api.listAPI.getByBoard.mockResolvedValue({
      data: { success: true, data: mockLists },
    });
    api.cardAPI.getByList.mockImplementation(listId => {
      const cards = mockCardsWithDueDates[listId] || [];
      return Promise.resolve({
        data: { success: true, data: cards },
      });
    });
    api.memberAPI.getByWorkspace.mockResolvedValue({
      data: { success: true, data: [] },
    });
  });

  describe('Filter UI', () => {
    it('should display overdue filter button', async () => {
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      // Use more specific selector to find the overdue filter button
      const filterButton = screen.getByText(/Overdue.*\(\d+\)/i);
      expect(filterButton).toBeInTheDocument();
    });

    it('should toggle overdue filter when button is clicked', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      const filterButton = screen.getByText(/Overdue.*\(\d+\)/i);

      // Initially not active (should have white/gray background)
      expect(filterButton).toHaveClass('bg-white');

      // Click to activate
      await user.click(filterButton);
      expect(filterButton).toHaveClass('bg-red-600');

      // Click to deactivate
      await user.click(filterButton);
      expect(filterButton).toHaveClass('bg-white');
    });
  });

  describe('Filter Logic', () => {
    it('should display all cards when filter is off', async () => {
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
        expect(screen.getByText('Overdue Card 1')).toBeInTheDocument();
        expect(screen.getByText('Not Overdue Card')).toBeInTheDocument();
        expect(screen.getByText('Overdue Card 2')).toBeInTheDocument();
        expect(screen.getByText('Card without due date')).toBeInTheDocument();
      });
    });

    it('should filter to show only overdue cards when filter is active', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      const filterButton = screen.getByText(/Overdue.*\(\d+\)/i);
      await user.click(filterButton);

      await waitFor(() => {
        // Overdue cards should be visible
        expect(screen.getByText('Overdue Card 1')).toBeInTheDocument();
        expect(screen.getByText('Overdue Card 2')).toBeInTheDocument();

        // Non-overdue cards should not be visible
        expect(screen.queryByText('Not Overdue Card')).not.toBeInTheDocument();
        expect(
          screen.queryByText('Card without due date')
        ).not.toBeInTheDocument();
      });
    });

    it('should correctly identify overdue cards (due date in the past)', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      const filterButton = screen.getByText(/Overdue.*\(\d+\)/i);
      await user.click(filterButton);

      await waitFor(() => {
        // Only cards with due date < today should be visible
        const overdueCards = screen.getAllByText(/Overdue Card/i);
        expect(overdueCards).toHaveLength(2);
      });
    });

    it('should hide cards without due dates when filter is active', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      const filterButton = screen.getByText(/Overdue.*\(\d+\)/i);
      await user.click(filterButton);

      await waitFor(() => {
        // Card without due date should not be visible
        expect(
          screen.queryByText('Card without due date')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Filter Count', () => {
    it('should display overdue card count next to filter button', async () => {
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      // Should display "2" indicating 2 overdue cards
      const filterButton = screen.getByText(/Overdue.*\(2\)/i);
      expect(filterButton).toBeInTheDocument();
    });

    it('should update count when cards are filtered', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      const filterButton = screen.getByText(/Overdue.*\(2\)/i);
      expect(filterButton).toBeInTheDocument();

      // Count should persist after activating filter
      await user.click(filterButton);
      expect(filterButton).toBeInTheDocument();
    });

    it('should show 0 when there are no overdue cards', async () => {
      // Override mock to return cards with no overdue dates
      api.cardAPI.getByList.mockImplementation(() => {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              {
                _id: 'card1',
                title: 'Future Card',
                dueDate: nextWeek,
                assignedTo: [],
                labels: [],
                status: null,
              },
            ],
          },
        });
      });

      render(<BoardPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      const filterButton = screen.getByText(/Overdue.*\(0\)/i);
      expect(filterButton).toBeInTheDocument();
    });
  });
});
