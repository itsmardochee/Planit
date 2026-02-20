import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { notificationAPI } from '../utils/api';
import NotificationList from './NotificationList';

const NotificationBell = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const badgeContent = unreadCount > 9 ? '9+' : unreadCount;

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div ref={bellRef} className="relative">
      <IconButton
        onClick={handleBellClick}
        aria-label={t('notifications:bell', 'Notifications')}
        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
      >
        {unreadCount > 0 ? (
          <Badge badgeContent={badgeContent} color="error">
            <NotificationsIcon />
          </Badge>
        ) : (
          <NotificationsIcon />
        )}
      </IconButton>

      {isOpen && (
        <NotificationList
          notifications={notifications}
          onRefetch={fetchNotifications}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
