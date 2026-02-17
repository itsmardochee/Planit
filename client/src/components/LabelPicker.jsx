import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Chip, CircularProgress, Typography, Alert } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { labelAPI, cardAPI } from '../utils/api';

const LabelPicker = ({ boardId, card, onUpdate }) => {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (boardId) {
      fetchLabels();
    }
  }, [boardId]);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const response = await labelAPI.getByBoard(boardId);
      setLabels(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching labels:', err);
      setError('Failed to load labels');
    } finally {
      setLoading(false);
    }
  };

  const isLabelAssigned = labelId => {
    return card.labels?.some(
      l => (typeof l === 'string' ? l : l._id) === labelId
    );
  };

  const handleLabelClick = async label => {
    try {
      setError('');

      if (isLabelAssigned(label._id)) {
        // Remove label
        const response = await cardAPI.removeLabel(card._id, label._id);
        onUpdate?.(response.data?.data);
      } else {
        // Assign label
        const response = await cardAPI.assignLabel(card._id, label._id);
        onUpdate?.(response.data?.data);
      }
    } catch (err) {
      console.error('Error toggling label:', err);
      const message =
        err.response?.data?.message ||
        `Failed to ${isLabelAssigned(label._id) ? 'remove' : 'assign'} label`;
      setError(message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (labels.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="text.secondary">
          No labels available. Create labels in board settings.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {labels.map(label => {
          const assigned = isLabelAssigned(label._id);
          return (
            <Chip
              key={label._id}
              data-testid={`label-${label._id}`}
              label={label.name}
              onClick={() => handleLabelClick(label)}
              icon={assigned ? <CheckIcon /> : undefined}
              sx={{
                backgroundColor: label.color,
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8,
                },
                ...(assigned && {
                  border: '2px solid #fff',
                  boxShadow: '0 0 0 2px ' + label.color,
                }),
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

LabelPicker.propTypes = {
  boardId: PropTypes.string.isRequired,
  card: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    labels: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          _id: PropTypes.string,
          name: PropTypes.string,
          color: PropTypes.string,
        }),
      ])
    ),
  }).isRequired,
  onUpdate: PropTypes.func,
};

export default LabelPicker;
