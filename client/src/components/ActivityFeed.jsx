import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import { Timeline as TimelineIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ActivityItem from './ActivityItem';
import { activityAPI } from '../utils/api';

/**
 * ActivityFeed - Display a list of activities for a workspace, board, or card
 * @param {object} props - Component props
 * @param {string} props.scope - Activity scope: 'workspace', 'board', or 'card'
 * @param {string} props.scopeId - ID of the workspace, board, or card
 * @param {number} props.limit - Maximum number of activities to fetch (default: 20)
 * @param {object} props.filters - Filters to apply (action, entityType)
 * @returns {JSX.Element}
 */
const ActivityFeed = ({ scope, scopeId, limit = 20, filters = {} }) => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!scopeId) return;

      setLoading(true);
      setError(null);

      try {
        const params = {
          limit,
          skip: 0,
          ...filters,
        };

        let response;
        switch (scope) {
          case 'workspace':
            response = await activityAPI.getByWorkspace(scopeId, params);
            break;
          case 'board':
            response = await activityAPI.getByBoard(scopeId, params);
            break;
          case 'card':
            response = await activityAPI.getByCard(scopeId, params);
            break;
          default:
            throw new Error(`Invalid scope: ${scope}`);
        }

        setActivities(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
        setError(err.message || 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [scope, scopeId, limit, JSON.stringify(filters)]);

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <CircularProgress size={40} data-testid="loading-spinner" />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="body2">
          Failed to load activities
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: 'block' }}
        >
          {error}
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          px: 3,
          textAlign: 'center',
        }}
      >
        <TimelineIcon
          sx={{
            fontSize: 48,
            color: 'text.disabled',
            mb: 2,
          }}
        />
        <Typography variant="body2" color="text.secondary">
          No activity yet
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
          Activity will appear here as changes are made
        </Typography>
      </Box>
    );
  }

  // Activities list
  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: 'transparent',
      }}
    >
      {activities.map((activity, index) => (
        <Box key={activity._id}>
          <ActivityItem activity={activity} />
          {index < activities.length - 1 && <Divider sx={{ mx: 2 }} />}
        </Box>
      ))}
    </Paper>
  );
};

ActivityFeed.propTypes = {
  scope: PropTypes.oneOf(['workspace', 'board', 'card']).isRequired,
  scopeId: PropTypes.string.isRequired,
  limit: PropTypes.number,
  filters: PropTypes.shape({
    action: PropTypes.string,
    entityType: PropTypes.string,
  }),
};

export default ActivityFeed;
