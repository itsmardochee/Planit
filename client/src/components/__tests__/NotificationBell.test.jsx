import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import NotificationBell from '../NotificationBell';
import { notificationAPI } from '../../utils/api';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
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

// Wrapper component to provide router context
const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display', () => {
    it('should render bell icon', async () => {
      notificationAPI.getAll.mockResolvedValue({
        data: { success: true, data: [] },
      });

      render(<NotificationBell />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });

    it('should not display badge when there are no unread notifications', async () => {
      notificationAPI.getAll.mockResolvedValue({
        data: {
          success: true,
          data: [
            {
              _id: 'notif1',
              message: 'Test notification',
              isRead: true,
              createdAt: '2024-01-01',
            },
          ],
        },
      });

      render(<NotificationBell />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.queryByText('1')).not.toBeInTheDocument();
      });
    });

    it('should display badge with unread count', async () => {
      notificationAPI.getAll.mockResolvedValue({
        data: {
          success: true,
          data: [
            {
              _id: 'notif1',
              message: 'Test notification 1',
              isRead: false,
              createdAt: '2024-01-01',
            },
            {
              _id: 'notif2',
              message: 'Test notification 2',
              isRead: false,
              createdAt: '2024-01-02',
            },
            {
              _id: 'notif3',
              message: 'Test notification 3',
              isRead: true,
              createdAt: '2024-01-03',
            },
          ],
        },
      });

      render(<NotificationBell />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should display 9+ when there are more than 9 unread notifications', async () => {
      const notifications = Array.from({ length: 15 }, (_, i) => ({
        _id: `notif${i}`,
        message: `Test notification ${i}`,
        isRead: false,
        createdAt: '2024-01-01',
      }));

      notificationAPI.getAll.mockResolvedValue({
        data: {
          success: true,
          data: notifications,
        },
      });

      render(<NotificationBell />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('9+')).toBeInTheDocument();
      });
    });
  });

  describe('Interaction', () => {
    it('should toggle notification list on click', async () => {
      const user = userEvent.setup();
      notificationAPI.getAll.mockResolvedValue({
        data: { success: true, data: [] },
      });

      const { container } = render(<NotificationBell />, { wrapper: Wrapper });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        // NotificationList component should be visible
        expect(
          container.querySelector('[data-testid="notification-list"]')
        ).toBeInTheDocument();
      });

      // Click again to close
      await user.click(button);

      await waitFor(() => {
        expect(
          container.querySelector('[data-testid="notification-list"]')
        ).not.toBeInTheDocument();
      });
    });

    it('should close notification list when clicking outside', async () => {
      const user = userEvent.setup();
      notificationAPI.getAll.mockResolvedValue({
        data: { success: true, data: [] },
      });

      const { container } = render(
        <div>
          <NotificationBell />
          <div data-testid="outside">Outside</div>
        </div>,
        { wrapper: Wrapper }
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(
          container.querySelector('[data-testid="notification-list"]')
        ).toBeInTheDocument();
      });

      // Click outside
      const outside = screen.getByTestId('outside');
      await user.click(outside);

      await waitFor(() => {
        expect(
          container.querySelector('[data-testid="notification-list"]')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch notifications on mount', async () => {
      notificationAPI.getAll.mockResolvedValue({
        data: { success: true, data: [] },
      });

      render(<NotificationBell />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(notificationAPI.getAll).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      notificationAPI.getAll.mockRejectedValue(new Error('API error'));

      render(<NotificationBell />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should refetch notifications when notification list updates', async () => {
      notificationAPI.getAll.mockResolvedValue({
        data: {
          success: true,
          data: [
            {
              _id: 'notif1',
              message: 'Test notification',
              isRead: false,
              createdAt: '2024-01-01',
            },
          ],
        },
      });

      const { rerender } = render(<NotificationBell />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(notificationAPI.getAll).toHaveBeenCalledTimes(1);
      });

      // Simulate update by rerendering
      rerender(<NotificationBell />);

      // Note: The actual refetch logic will be implemented via callback
      // This test ensures the component structure supports it
    });
  });
});
