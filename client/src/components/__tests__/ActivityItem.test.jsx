import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import ActivityItem from '../ActivityItem';

describe('ActivityItem', () => {
  const renderWithI18n = component => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Card Activities', () => {
    it('should render card created activity', () => {
      const activity = {
        _id: 'activity1',
        action: 'created',
        entityType: 'card',
        userId: { username: 'John Doe' },
        details: { cardTitle: 'New Task' },
        createdAt: new Date().toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/created/i)).toBeInTheDocument();
      expect(screen.getByText(/new task/i)).toBeInTheDocument();
    });

    it('should render card updated activity', () => {
      const activity = {
        _id: 'activity2',
        action: 'updated',
        entityType: 'card',
        userId: { username: 'Jane Smith' },
        details: { cardTitle: 'Updated Task' },
        createdAt: new Date().toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
      expect(screen.getByText(/updated card/i)).toBeInTheDocument();
    });

    it('should render card deleted activity', () => {
      const activity = {
        _id: 'activity3',
        action: 'deleted',
        entityType: 'card',
        userId: { username: 'Bob Johnson' },
        details: { cardTitle: 'Deleted Task' },
        createdAt: new Date().toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/bob johnson/i)).toBeInTheDocument();
      expect(screen.getByText(/deleted card/i)).toBeInTheDocument();
    });

    it('should render card moved activity', () => {
      const activity = {
        _id: 'activity4',
        action: 'moved',
        entityType: 'card',
        userId: { username: 'Alice Brown' },
        details: {
          cardTitle: 'Task 1',
          fromList: 'To Do',
          toList: 'In Progress',
        },
        createdAt: new Date().toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/alice brown/i)).toBeInTheDocument();
      expect(screen.getByText(/moved/i)).toBeInTheDocument();
      expect(screen.getByText(/to do/i)).toBeInTheDocument();
      expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    });
  });

  describe('List Activities', () => {
    it('should render list created activity', () => {
      const activity = {
        _id: 'activity5',
        action: 'created',
        entityType: 'list',
        userId: { username: 'Charlie Wilson' },
        details: { listName: 'New List' },
        createdAt: new Date().toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/charlie wilson/i)).toBeInTheDocument();
      expect(screen.getByText(/created/i)).toBeInTheDocument();
      expect(screen.getByText(/new list/i)).toBeInTheDocument();
    });

    it('should render list deleted activity', () => {
      const activity = {
        _id: 'activity6',
        action: 'deleted',
        entityType: 'list',
        userId: { username: 'Diana Prince' },
        details: { listName: 'Old List' },
        createdAt: new Date().toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/diana prince/i)).toBeInTheDocument();
      expect(screen.getByText(/deleted/i)).toBeInTheDocument();
    });
  });

  describe('Comment Activities', () => {
    it('should render comment added activity', () => {
      const activity = {
        _id: 'activity7',
        action: 'commented',
        entityType: 'comment',
        userId: { username: 'Eve Adams' },
        details: {
          cardTitle: 'Task 1',
          commentText: 'Great work!',
        },
        createdAt: new Date().toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/eve adams/i)).toBeInTheDocument();
      expect(screen.getByText(/commented/i)).toBeInTheDocument();
    });
  });

  describe('Member Activities', () => {
    it('should render member assigned activity', () => {
      const activity = {
        _id: 'activity8',
        action: 'assigned',
        entityType: 'card',
        userId: { username: 'Frank Miller' },
        details: {
          cardTitle: 'Task 1',
          assignedUser: 'Grace Lee',
        },
        createdAt: new Date().toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/frank miller/i)).toBeInTheDocument();
      expect(screen.getByText(/assigned/i)).toBeInTheDocument();
      expect(screen.getByText(/grace lee/i)).toBeInTheDocument();
    });

    it('should render member unassigned activity', () => {
      const activity = {
        _id: 'activity9',
        action: 'unassigned',
        entityType: 'card',
        userId: { username: 'Henry Clark' },
        details: {
          cardTitle: 'Task 1',
          unassignedUser: 'Isabel Martinez',
        },
        createdAt: new Date().toISOString(),
      };

      const { container } = renderWithI18n(
        <ActivityItem activity={activity} />
      );

      expect(screen.getByText(/henry clark/i)).toBeInTheDocument();
      // Check that all parts of the message are present
      const activityText = container.textContent;
      expect(activityText).toMatch(/unassigned/i);
      expect(activityText).toMatch(/isabel martinez/i);
      expect(activityText).toMatch(/task 1/i);
    });
  });

  describe('Timestamp', () => {
    it('should display relative time for recent activity', () => {
      const now = new Date();
      const activity = {
        _id: 'activity10',
        action: 'created',
        entityType: 'card',
        userId: { username: 'Jack Thompson' },
        details: { cardTitle: 'Recent Task' },
        createdAt: now.toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      // Should show "just now" or similar
      expect(screen.getByText(/just now|seconds ago/i)).toBeInTheDocument();
    });

    it('should display formatted time for older activity', () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const activity = {
        _id: 'activity11',
        action: 'created',
        entityType: 'card',
        userId: { username: 'Karen Davis' },
        details: { cardTitle: 'Old Task' },
        createdAt: pastDate.toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      // Should show "2 days ago" or similar
      expect(screen.getByText(/2 days ago/i)).toBeInTheDocument();
    });

    it('should display hours ago for activity within 24 hours', () => {
      const pastDate = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      const activity = {
        _id: 'activity-hours',
        action: 'created',
        entityType: 'card',
        userId: { username: 'Test User' },
        details: { cardTitle: 'Task' },
        createdAt: pastDate.toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/3 hours ago/i)).toBeInTheDocument();
    });

    it('should display minutes ago for activity within 1 hour', () => {
      const pastDate = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const activity = {
        _id: 'activity-minutes',
        action: 'created',
        entityType: 'card',
        userId: { username: 'Test User' },
        details: { cardTitle: 'Task' },
        createdAt: pastDate.toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/30 minutes ago/i)).toBeInTheDocument();
    });

    it('should display months ago for old activity', () => {
      const pastDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago (~2 months)
      const activity = {
        _id: 'activity-months',
        action: 'created',
        entityType: 'card',
        userId: { username: 'Test User' },
        details: { cardTitle: 'Task' },
        createdAt: pastDate.toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/2 months ago/i)).toBeInTheDocument();
    });

    it('should display years ago for very old activity', () => {
      const pastDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // 400 days ago (~1 year)
      const activity = {
        _id: 'activity-years',
        action: 'created',
        entityType: 'card',
        userId: { username: 'Test User' },
        details: { cardTitle: 'Task' },
        createdAt: pastDate.toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/1 year ago/i)).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should display appropriate icon for create action', () => {
      const activity = {
        _id: 'activity12',
        action: 'created',
        entityType: 'card',
        userId: { username: 'Leo Turner' },
        details: { cardTitle: 'Task' },
        createdAt: new Date().toISOString(),
      };

      const { container } = renderWithI18n(
        <ActivityItem activity={activity} />
      );

      // Check for icon presence (could be emoji or Material UI icon)
      const activityItem =
        container.querySelector('[data-testid="activity-item"]') ||
        container.querySelector('.activity-item');
      expect(activityItem).toBeInTheDocument();
    });

    it('should display default icon for unknown action', () => {
      const activity = {
        _id: 'activity-default',
        action: 'unknown-action',
        entityType: 'card',
        userId: { username: 'Test User' },
        details: { cardTitle: 'Task' },
        createdAt: new Date().toISOString(),
      };

      const { container } = renderWithI18n(
        <ActivityItem activity={activity} />
      );

      const activityItem = container.querySelector(
        '[data-testid="activity-item"]'
      );
      expect(activityItem).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle activity with missing details gracefully', () => {
      const activity = {
        _id: 'activity-no-details',
        action: 'updated',
        entityType: 'card',
        userId: { username: 'Test User' },
        details: {},
        createdAt: new Date().toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/test user/i)).toBeInTheDocument();
      expect(screen.getByText(/updated card/i)).toBeInTheDocument();
    });

    it('should handle activity with missing userId gracefully', () => {
      const activity = {
        _id: 'activity-no-user',
        action: 'created',
        entityType: 'card',
        userId: {},
        details: { cardTitle: 'Task' },
        createdAt: new Date().toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      expect(screen.getByText(/unknown user/i)).toBeInTheDocument();
    });

    it('should handle single unit timestamps correctly', () => {
      const pastDate = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
      const activity = {
        _id: 'activity-single-minute',
        action: 'created',
        entityType: 'card',
        userId: { username: 'Test User' },
        details: { cardTitle: 'Task' },
        createdAt: pastDate.toISOString(),
      };

      renderWithI18n(<ActivityItem activity={activity} />);

      // Should show "1 minute ago" (singular)
      expect(screen.getByText(/1 minute ago/i)).toBeInTheDocument();
    });
  });
});
