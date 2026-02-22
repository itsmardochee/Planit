import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationList from '../NotificationList';
import { notificationAPI } from '../../utils/api';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

// Mock the API
vi.mock('../../utils/api', () => ({
  notificationAPI: {
    getAll: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('NotificationList', () => {
  const mockNotifications = [
    {
      _id: 'notif1',
      message: 'Card "Test Card 1" is overdue',
      cardId: { _id: 'card1', title: 'Test Card 1' },
      isRead: false,
      createdAt: '2024-01-01T10:00:00Z',
    },
    {
      _id: 'notif2',
      message: 'Card "Test Card 2" is due soon',
      cardId: { _id: 'card2', title: 'Test Card 2' },
      isRead: false,
      createdAt: '2024-01-02T10:00:00Z',
    },
    {
      _id: 'notif3',
      message: 'Card "Test Card 3" was updated',
      cardId: { _id: 'card3', title: 'Test Card 3' },
      isRead: true,
      createdAt: '2024-01-03T10:00:00Z',
    },
  ];

  const mockOnRefetch = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display', () => {
    it('should render notification list dropdown', () => {
      render(
        <NotificationList
          notifications={mockNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('notification-list')).toBeInTheDocument();
    });

    it('should display notification title', () => {
      render(
        <NotificationList
          notifications={mockNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('should display "No notifications" when list is empty', () => {
      render(
        <NotificationList
          notifications={[]}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });

    it('should display all notifications', () => {
      render(
        <NotificationList
          notifications={mockNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      expect(
        screen.getByText(/Card "Test Card 1" is overdue/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Card "Test Card 2" is due soon/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Card "Test Card 3" was updated/i)
      ).toBeInTheDocument();
    });

    it('should highlight unread notifications', () => {
      const { container } = render(
        <NotificationList
          notifications={mockNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      // Unread notifications should have different styling
      // This will be validated by checking for specific CSS classes
      const notificationItems = container.querySelectorAll(
        '[data-unread="true"]'
      );
      expect(notificationItems.length).toBe(2); // notif1 and notif2 are unread
    });

    it('should display "Mark all as read" button when there are unread notifications', () => {
      render(
        <NotificationList
          notifications={mockNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Mark all as read')).toBeInTheDocument();
    });

    it('should not display "Mark all as read" button when all notifications are read', () => {
      const readNotifications = mockNotifications.map(n => ({
        ...n,
        isRead: true,
      }));

      render(
        <NotificationList
          notifications={readNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should mark notification as read when clicked', async () => {
      const user = userEvent.setup();
      notificationAPI.markAsRead.mockResolvedValue({
        data: { success: true },
      });

      render(
        <NotificationList
          notifications={mockNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      const notification = screen.getByText(/Card "Test Card 1" is overdue/i);
      await user.click(notification);

      await waitFor(() => {
        expect(notificationAPI.markAsRead).toHaveBeenCalledWith('notif1');
        expect(mockOnRefetch).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should navigate to card when notification is clicked', async () => {
      const user = userEvent.setup();
      notificationAPI.markAsRead.mockResolvedValue({
        data: { success: true },
      });

      render(
        <NotificationList
          notifications={mockNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      const notification = screen.getByText(/Card "Test Card 1" is overdue/i);
      await user.click(notification);

      await waitFor(() => {
        // Navigation will be handled by the board page
        // This test ensures the click handler is called
        expect(mockNavigate).toHaveBeenCalled();
      });
    });

    it('should mark all notifications as read when "Mark all as read" is clicked', async () => {
      const user = userEvent.setup();
      notificationAPI.markAllAsRead.mockResolvedValue({
        data: { success: true },
      });

      render(
        <NotificationList
          notifications={mockNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      const markAllButton = screen.getByText('Mark all as read');
      await user.click(markAllButton);

      await waitFor(() => {
        expect(notificationAPI.markAllAsRead).toHaveBeenCalled();
        expect(mockOnRefetch).toHaveBeenCalled();
      });
    });

    it('should delete notification when delete button is clicked', async () => {
      const user = userEvent.setup();
      notificationAPI.delete.mockResolvedValue({
        data: { success: true },
      });

      render(
        <NotificationList
          notifications={mockNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      // Find all delete buttons (should be 3, one per notification)
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(notificationAPI.delete).toHaveBeenCalledWith('notif1');
        expect(mockOnRefetch).toHaveBeenCalled();
      });
    });
  });

  describe('API Integration', () => {
    it('should handle mark as read API errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      notificationAPI.markAsRead.mockRejectedValue(new Error('API error'));

      render(
        <NotificationList
          notifications={mockNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      const notification = screen.getByText(/Card "Test Card 1" is overdue/i);
      await user.click(notification);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle mark all as read API errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      notificationAPI.markAllAsRead.mockRejectedValue(new Error('API error'));

      render(
        <NotificationList
          notifications={mockNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      const markAllButton = screen.getByText('Mark all as read');
      await user.click(markAllButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle delete API errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      notificationAPI.delete.mockRejectedValue(new Error('API error'));

      render(
        <NotificationList
          notifications={mockNotifications}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Time Formatting', () => {
    function makeNotification(msAgo) {
      return {
        _id: 'notif-time',
        message: 'Time test notification',
        cardId: { _id: 'card1', title: 'Card' },
        isRead: true,
        createdAt: new Date(Date.now() - msAgo).toISOString(),
      };
    }

    it('shows "Just now" for notifications less than 60 seconds old', () => {
      render(
        <NotificationList
          notifications={[makeNotification(30 * 1000)]}
          onRefetch={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('shows "1 minute ago" for a notification ~65 seconds old', () => {
      render(
        <NotificationList
          notifications={[makeNotification(65 * 1000)]}
          onRefetch={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('1 minute ago')).toBeInTheDocument();
    });

    it('shows "N minutes ago" for a notification several minutes old', () => {
      render(
        <NotificationList
          notifications={[makeNotification(5 * 60 * 1000)]}
          onRefetch={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });

    it('shows "1 hour ago" for a notification ~65 minutes old', () => {
      render(
        <NotificationList
          notifications={[makeNotification(65 * 60 * 1000)]}
          onRefetch={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('1 hour ago')).toBeInTheDocument();
    });

    it('shows "N hours ago" for a notification several hours old', () => {
      render(
        <NotificationList
          notifications={[makeNotification(5 * 60 * 60 * 1000)]}
          onRefetch={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('5 hours ago')).toBeInTheDocument();
    });

    it('shows "1 day ago" for a notification ~25 hours old', () => {
      render(
        <NotificationList
          notifications={[makeNotification(25 * 60 * 60 * 1000)]}
          onRefetch={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('1 day ago')).toBeInTheDocument();
    });

    it('shows "N days ago" for a notification several days old', () => {
      render(
        <NotificationList
          notifications={[makeNotification(5 * 24 * 60 * 60 * 1000)]}
          onRefetch={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('5 days ago')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('does not navigate when notification has no cardId', async () => {
      const user = userEvent.setup();
      notificationAPI.markAsRead.mockResolvedValue({
        data: { success: true },
      });

      const notificationWithoutCard = {
        _id: 'notif-no-card',
        message: 'Notification without card',
        cardId: null,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      render(
        <NotificationList
          notifications={[notificationWithoutCard]}
          onRefetch={mockOnRefetch}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByText('Notification without card'));

      await waitFor(() => {
        expect(notificationAPI.markAsRead).toHaveBeenCalledWith(
          'notif-no-card'
        );
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });
});
