import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { IconButton, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { notificationAPI } from '../utils/api';

const NotificationList = ({ notifications, onRefetch, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNotificationClick = async notificationId => {
    try {
      await notificationAPI.markAsRead(notificationId);
      const notification = notifications.find(n => n._id === notificationId);
      if (notification?.cardId) {
        // Navigate to the board containing the card
        // Note: We'll need to get the boardId from the card
        navigate(`/board/${notification.cardId._id}`);
      }
      onRefetch();
      onClose();
    } catch (error) {
      console.error('Error marking notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      onRefetch();
    } catch (error) {
      console.error('Error marking all notifications as read', error);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation(); // Prevent triggering notification click
    try {
      await notificationAPI.delete(notificationId);
      onRefetch();
    } catch (error) {
      console.error('Error deleting notification', error);
    }
  };

  const formatRelativeTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div
      data-testid="notification-list"
      className="absolute right-0 top-12 w-96 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {t('notifications:title', 'Notifications')}
          </h3>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              {t('notifications:markAllAsRead', 'Mark all as read')}
            </Button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {t('notifications:noNotifications', 'No notifications')}
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification._id}
              data-unread={!notification.isRead}
              onClick={() => handleNotificationClick(notification._id)}
              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start gap-3 ${
                !notification.isRead
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    !notification.isRead
                      ? 'font-semibold text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatRelativeTime(notification.createdAt)}
                </p>
              </div>
              <IconButton
                size="small"
                onClick={e => handleDelete(e, notification._id)}
                aria-label={t('notifications:delete', 'Delete')}
                className="text-gray-400 hover:text-red-500"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;
