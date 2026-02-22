import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import {
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  HourglassEmpty as HourglassEmptyIcon,
  RemoveCircle as RemoveCircleIcon,
} from '@mui/icons-material';
import { cardAPI } from '../utils/api';

const STATUS_OPTIONS = [
  {
    value: 'todo',
    label: 'To Do',
    color: '#9CA3AF', // gray
    icon: HourglassEmptyIcon,
  },
  {
    value: 'in-progress',
    label: 'In Progress',
    color: '#3B82F6', // blue
    icon: CircleIcon,
  },
  {
    value: 'done',
    label: 'Done',
    color: '#10B981', // green
    icon: CheckCircleIcon,
  },
  {
    value: 'blocked',
    label: 'Blocked',
    color: '#EF4444', // red
    icon: BlockIcon,
  },
  {
    value: null,
    label: 'None',
    color: '#6B7280', // gray
    icon: RemoveCircleIcon,
  },
];

const StatusSelector = ({ card, onUpdate }) => {
  const [error, setError] = useState('');

  const handleStatusChange = async event => {
    const newStatus = event.target.value === 'null' ? null : event.target.value;

    try {
      setError('');
      const response = await cardAPI.updateStatus(card._id, newStatus);
      onUpdate?.(response.data?.data);
    } catch (err) {
      console.error('Error updating status:', err);
      const message = err.response?.data?.message || 'Failed to update status';
      setError(message);
    }
  };

  const currentStatus =
    STATUS_OPTIONS.find(s => s.value === card.status) ||
    STATUS_OPTIONS.find(s => s.value === null);

  const StatusIcon = currentStatus.icon;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth size="small">
        <Select
          value={card.status === null ? 'null' : card.status || 'null'}
          onChange={handleStatusChange}
          displayEmpty
          renderValue={value => {
            const status = STATUS_OPTIONS.find(
              s => s.value === (value === 'null' ? null : value)
            );
            if (!status) return 'None';

            const Icon = status.icon;
            return (
              <Box display="flex" alignItems="center" gap={1}>
                <Icon fontSize="small" sx={{ color: status.color }} />
                <Typography variant="body2">{status.label}</Typography>
              </Box>
            );
          }}
        >
          {STATUS_OPTIONS.map(option => {
            const Icon = option.icon;
            return (
              <MenuItem
                key={option.value || 'none'}
                value={option.value === null ? 'null' : option.value}
                data-testid={`status-option-${option.value === null ? 'none' : option.value}`}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Icon fontSize="small" sx={{ color: option.color }} />
                  <Typography variant="body2">{option.label}</Typography>
                </Box>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
};

StatusSelector.propTypes = {
  card: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['todo', 'in-progress', 'done', 'blocked', null]),
  }).isRequired,
  onUpdate: PropTypes.func,
};

export default StatusSelector;
