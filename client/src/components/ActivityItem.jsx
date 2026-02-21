import PropTypes from 'prop-types';
import { Box, Typography, Avatar } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as MoveIcon,
  Comment as CommentIcon,
  PersonAdd as AssignIcon,
  PersonRemove as UnassignIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

/**
 * Format relative time from timestamp
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Relative time string
 */
const formatRelativeTime = timestamp => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 10) return 'just now';
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12)
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

/**
 * Get icon based on action type
 * @param {string} action - Activity action
 * @returns {JSX.Element} Icon component
 */
const getActionIcon = action => {
  const iconProps = { fontSize: 'small' };

  switch (action) {
    case 'created':
      return <AddIcon {...iconProps} color="success" />;
    case 'updated':
      return <EditIcon {...iconProps} color="primary" />;
    case 'deleted':
      return <DeleteIcon {...iconProps} color="error" />;
    case 'moved':
      return <MoveIcon {...iconProps} color="info" />;
    case 'commented':
      return <CommentIcon {...iconProps} color="action" />;
    case 'assigned':
      return <AssignIcon {...iconProps} color="primary" />;
    case 'unassigned':
      return <UnassignIcon {...iconProps} color="action" />;
    default:
      return <EditIcon {...iconProps} />;
  }
};

/**
 * Format activity message based on action and entity type
 * @param {object} activity - Activity object
 * @returns {JSX.Element} Formatted message
 */
const formatActivityMessage = activity => {
  const { action, entityType, userId, details } = activity;
  const username = userId?.username || 'Unknown user';

  // Card activities
  if (entityType === 'card') {
    const cardTitle = details?.cardTitle || 'a card';

    switch (action) {
      case 'created':
        return (
          <>
            <strong>{username}</strong> created card{' '}
            <strong>{cardTitle}</strong>
          </>
        );
      case 'updated':
        return (
          <>
            <strong>{username}</strong> updated card{' '}
            <strong>{cardTitle}</strong>
          </>
        );
      case 'deleted':
        return (
          <>
            <strong>{username}</strong> deleted card{' '}
            <strong>{cardTitle}</strong>
          </>
        );
      case 'moved':
        return (
          <>
            <strong>{username}</strong> moved card <strong>{cardTitle}</strong>{' '}
            from <strong>{details.fromList}</strong> to{' '}
            <strong>{details.toList}</strong>
          </>
        );
      case 'assigned':
        return (
          <>
            <strong>{username}</strong> assigned{' '}
            <strong>{details.assignedUser}</strong> to{' '}
            <strong>{cardTitle}</strong>
          </>
        );
      case 'unassigned':
        return (
          <>
            <strong>{username}</strong> unassigned{' '}
            <strong>{details.unassignedUser}</strong> from{' '}
            <strong>{cardTitle}</strong>
          </>
        );
      default:
        return (
          <>
            <strong>{username}</strong> modified <strong>{cardTitle}</strong>
          </>
        );
    }
  }

  // List activities
  if (entityType === 'list') {
    const listName = details?.listName || 'a list';

    switch (action) {
      case 'created':
        return (
          <>
            <strong>{username}</strong> created list <strong>{listName}</strong>
          </>
        );
      case 'updated':
        return (
          <>
            <strong>{username}</strong> updated list <strong>{listName}</strong>
          </>
        );
      case 'moved':
        return (
          <>
            <strong>{username}</strong> moved list <strong>{listName}</strong>
          </>
        );
      case 'deleted':
        return (
          <>
            <strong>{username}</strong> deleted list <strong>{listName}</strong>
          </>
        );
      default:
        return (
          <>
            <strong>{username}</strong> modified <strong>{listName}</strong>
          </>
        );
    }
  }

  // Comment activities
  if (entityType === 'comment') {
    const cardTitle = details?.cardTitle || 'a card';

    if (action === 'commented') {
      return (
        <>
          <strong>{username}</strong> commented on <strong>{cardTitle}</strong>
        </>
      );
    }
  }

  // Board activities
  if (entityType === 'board') {
    const boardName = details?.boardName || 'a board';

    switch (action) {
      case 'created':
        return (
          <>
            <strong>{username}</strong> created board{' '}
            <strong>{boardName}</strong>
          </>
        );
      case 'updated':
        return (
          <>
            <strong>{username}</strong> updated board{' '}
            <strong>{boardName}</strong>
          </>
        );
      case 'deleted':
        return (
          <>
            <strong>{username}</strong> deleted board{' '}
            <strong>{boardName}</strong>
          </>
        );
      default:
        return (
          <>
            <strong>{username}</strong> modified <strong>{boardName}</strong>
          </>
        );
    }
  }

  // Workspace activities
  if (entityType === 'workspace') {
    const workspaceName = details?.workspaceName || 'a workspace';

    switch (action) {
      case 'created':
        return (
          <>
            <strong>{username}</strong> created workspace{' '}
            <strong>{workspaceName}</strong>
          </>
        );
      case 'updated':
        return (
          <>
            <strong>{username}</strong> updated workspace{' '}
            <strong>{workspaceName}</strong>
          </>
        );
      case 'deleted':
        return (
          <>
            <strong>{username}</strong> deleted workspace{' '}
            <strong>{workspaceName}</strong>
          </>
        );
      default:
        return (
          <>
            <strong>{username}</strong> modified{' '}
            <strong>{workspaceName}</strong>
          </>
        );
    }
  }

  // Default fallback
  return (
    <>
      <strong>{username}</strong> {action} {entityType}
    </>
  );
};

/**
 * ActivityItem - Display a single activity entry
 * @param {object} props - Component props
 * @param {object} props.activity - Activity object from API
 * @returns {JSX.Element}
 */
const ActivityItem = ({ activity }) => {
  const { t } = useTranslation();

  if (!activity) return null;

  const { action, createdAt, userId } = activity;
  const relativeTime = formatRelativeTime(createdAt);
  const actionIcon = getActionIcon(action);
  const message = formatActivityMessage(activity);

  return (
    <Box
      data-testid="activity-item"
      className="activity-item"
      sx={{
        display: 'flex',
        gap: 2,
        py: 1.5,
        px: 2,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      {/* Icon Avatar */}
      <Avatar
        sx={{
          width: 32,
          height: 32,
          backgroundColor: 'background.paper',
          border: 1,
          borderColor: 'divider',
        }}
      >
        {actionIcon}
      </Avatar>

      {/* Activity Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            wordBreak: 'break-word',
            '& strong': {
              fontWeight: 600,
            },
          }}
        >
          {message}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.5 }}
        >
          {relativeTime}
        </Typography>
      </Box>
    </Box>
  );
};

ActivityItem.propTypes = {
  activity: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    action: PropTypes.string.isRequired,
    entityType: PropTypes.string.isRequired,
    userId: PropTypes.shape({
      username: PropTypes.string,
    }),
    details: PropTypes.object,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
};

export default ActivityItem;
