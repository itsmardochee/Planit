import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import ActivityFeed from '../ActivityFeed';
import { activityAPI } from '../../utils/api';

// Mock the activityAPI
vi.mock('../../utils/api', () => ({
  activityAPI: {
    getByWorkspace: vi.fn(),
    getByBoard: vi.fn(),
    getByCard: vi.fn(),
  },
}));

describe('ActivityFeed', () => {
  const renderWithI18n = component => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading state while fetching activities', () => {
      activityAPI.getByBoard.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithI18n(<ActivityFeed scope="board" scopeId="board123" />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Board Activities', () => {
    it('should fetch and display board activities', async () => {
      const mockActivities = [
        {
          _id: 'activity1',
          action: 'created',
          entityType: 'Card',
          userId: { username: 'John Doe' },
          details: { cardTitle: 'Task 1' },
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'activity2',
          action: 'updated',
          entityType: 'List',
          userId: { username: 'Jane Smith' },
          details: { listName: 'To Do' },
          createdAt: new Date().toISOString(),
        },
      ];

      activityAPI.getByBoard.mockResolvedValue({
        data: { activities: mockActivities },
      });

      renderWithI18n(<ActivityFeed scope="board" scopeId="board123" />);

      await waitFor(() => {
        expect(screen.getByText(/john doe/i)).toBeInTheDocument();
        expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
      });

      expect(activityAPI.getByBoard).toHaveBeenCalledWith('board123', {
        limit: 20,
        skip: 0,
      });
    });
  });

  describe('Workspace Activities', () => {
    it('should fetch and display workspace activities', async () => {
      const mockActivities = [
        {
          _id: 'activity1',
          action: 'created',
          entityType: 'Board',
          userId: { username: 'Alice Brown' },
          details: { boardName: 'New Board' },
          createdAt: new Date().toISOString(),
        },
      ];

      activityAPI.getByWorkspace.mockResolvedValue({
        data: { activities: mockActivities },
      });

      renderWithI18n(<ActivityFeed scope="workspace" scopeId="workspace123" />);

      await waitFor(() => {
        expect(screen.getByText(/alice brown/i)).toBeInTheDocument();
      });

      expect(activityAPI.getByWorkspace).toHaveBeenCalledWith('workspace123', {
        limit: 20,
        skip: 0,
      });
    });
  });

  describe('Card Activities', () => {
    it('should fetch and display card activities', async () => {
      const mockActivities = [
        {
          _id: 'activity1',
          action: 'commented',
          entityType: 'Comment',
          userId: { username: 'Bob Johnson' },
          details: { cardTitle: 'Task 1', commentText: 'Nice work!' },
          createdAt: new Date().toISOString(),
        },
      ];

      activityAPI.getByCard.mockResolvedValue({
        data: { activities: mockActivities },
      });

      renderWithI18n(<ActivityFeed scope="card" scopeId="card123" />);

      await waitFor(() => {
        expect(screen.getByText(/bob johnson/i)).toBeInTheDocument();
      });

      expect(activityAPI.getByCard).toHaveBeenCalledWith('card123', {
        limit: 20,
        skip: 0,
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no activities exist', async () => {
      activityAPI.getByBoard.mockResolvedValue({ data: { activities: [] } });

      renderWithI18n(<ActivityFeed scope="board" scopeId="board123" />);

      await waitFor(() => {
        expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      activityAPI.getByBoard.mockRejectedValue(
        new Error('Failed to fetch activities')
      );

      renderWithI18n(<ActivityFeed scope="board" scopeId="board123" />);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load activities/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should load more activities when limit prop is provided', async () => {
      const mockActivities = Array.from({ length: 5 }, (_, i) => ({
        _id: `activity${i}`,
        action: 'created',
        entityType: 'Card',
        userId: { username: `User ${i}` },
        details: { cardTitle: `Task ${i}` },
        createdAt: new Date().toISOString(),
      }));

      activityAPI.getByBoard.mockResolvedValue({
        data: { activities: mockActivities },
      });

      renderWithI18n(
        <ActivityFeed scope="board" scopeId="board123" limit={5} />
      );

      await waitFor(() => {
        expect(screen.getByText(/user 0/i)).toBeInTheDocument();
      });

      expect(activityAPI.getByBoard).toHaveBeenCalledWith('board123', {
        limit: 5,
        skip: 0,
      });
    });
  });

  describe('Filters', () => {
    it('should apply action filter when provided', async () => {
      const mockActivities = [
        {
          _id: 'activity1',
          action: 'created',
          entityType: 'Card',
          userId: { username: 'Charlie Wilson' },
          details: { cardTitle: 'Task 1' },
          createdAt: new Date().toISOString(),
        },
      ];

      activityAPI.getByBoard.mockResolvedValue({
        data: { activities: mockActivities },
      });

      renderWithI18n(
        <ActivityFeed
          scope="board"
          scopeId="board123"
          filters={{ action: 'created' }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/charlie wilson/i)).toBeInTheDocument();
      });

      expect(activityAPI.getByBoard).toHaveBeenCalledWith('board123', {
        limit: 20,
        skip: 0,
        action: 'created',
      });
    });

    it('should apply entityType filter when provided', async () => {
      const mockActivities = [
        {
          _id: 'activity1',
          action: 'updated',
          entityType: 'Card',
          userId: { username: 'Diana Prince' },
          details: { cardTitle: 'Task 1' },
          createdAt: new Date().toISOString(),
        },
      ];

      activityAPI.getByBoard.mockResolvedValue({
        data: { activities: mockActivities },
      });

      renderWithI18n(
        <ActivityFeed
          scope="board"
          scopeId="board123"
          filters={{ entityType: 'Card' }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/diana prince/i)).toBeInTheDocument();
      });

      expect(activityAPI.getByBoard).toHaveBeenCalledWith('board123', {
        limit: 20,
        skip: 0,
        entityType: 'Card',
      });
    });
  });

  describe('Activity Updates', () => {
    it('should refetch activities when scopeId changes', async () => {
      const mockActivities1 = [
        {
          _id: 'activity1',
          action: 'created',
          entityType: 'Card',
          userId: { username: 'Eve Adams' },
          details: { cardTitle: 'Task 1' },
          createdAt: new Date().toISOString(),
        },
      ];

      const mockActivities2 = [
        {
          _id: 'activity2',
          action: 'updated',
          entityType: 'Card',
          userId: { username: 'Frank Miller' },
          details: { cardTitle: 'Task 2' },
          createdAt: new Date().toISOString(),
        },
      ];

      activityAPI.getByBoard.mockResolvedValueOnce({
        data: { activities: mockActivities1 },
      });
      activityAPI.getByBoard.mockResolvedValueOnce({
        data: { activities: mockActivities2 },
      });

      const { rerender } = renderWithI18n(
        <ActivityFeed scope="board" scopeId="board123" />
      );

      await waitFor(() => {
        expect(screen.getByText(/eve adams/i)).toBeInTheDocument();
      });

      // Change scopeId
      rerender(
        <I18nextProvider i18n={i18n}>
          <ActivityFeed scope="board" scopeId="board456" />
        </I18nextProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/frank miller/i)).toBeInTheDocument();
      });

      expect(activityAPI.getByBoard).toHaveBeenCalledTimes(2);
    });
  });
});
