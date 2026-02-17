import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Chip,
  IconButton,
  Typography,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { labelAPI } from '../utils/api';

const LabelManager = ({ boardId, open, onClose }) => {
  const [labels, setLabels] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' });
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    if (open && boardId) {
      fetchLabels();
    }
  }, [open, boardId]);

  const fetchLabels = async () => {
    try {
      const response = await labelAPI.getByBoard(boardId);
      setLabels(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching labels:', err);
      setError('Failed to load labels');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Label name is required');
      return false;
    }
    if (formData.name.trim().length > 50) {
      setError('Label name cannot exceed 50 characters');
      return false;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      setError('Color must be a valid hex color (e.g. #FF0000)');
      return false;
    }
    return true;
  };

  const handleAddLabel = () => {
    setIsEditing(true);
    setEditingLabel(null);
    setFormData({ name: '', color: '#3B82F6' });
    setError('');
  };

  const handleEditLabel = label => {
    setIsEditing(true);
    setEditingLabel(label);
    setFormData({ name: label.name, color: label.color });
    setError('');
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (editingLabel) {
        // Update existing label
        const response = await labelAPI.update(editingLabel._id, {
          name: formData.name.trim(),
          color: formData.color,
        });
        setLabels(prev =>
          prev.map(l => (l._id === editingLabel._id ? response.data.data : l))
        );
      } else {
        // Create new label
        const response = await labelAPI.create(boardId, {
          name: formData.name.trim(),
          color: formData.color,
        });
        setLabels(prev => [...prev, response.data.data]);
      }
      setIsEditing(false);
      setFormData({ name: '', color: '#3B82F6' });
      setError('');
    } catch (err) {
      console.error('Error saving label:', err);
      setError(
        err.response?.data?.message || 'Failed to save label. Please try again.'
      );
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingLabel(null);
    setFormData({ name: '', color: '#3B82F6' });
    setError('');
  };

  const handleDeleteClick = labelId => {
    setDeleteConfirmId(labelId);
  };

  const handleDeleteConfirm = async () => {
    try {
      await labelAPI.delete(deleteConfirmId);
      setLabels(prev => prev.filter(l => l._id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting label:', err);
      setError('Failed to delete label');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditingLabel(null);
    setFormData({ name: '', color: '#3B82F6' });
    setError('');
    setDeleteConfirmId(null);
    onClose?.();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Manage Labels</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {isEditing ? (
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Label Name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                fullWidth
                margin="normal"
                inputProps={{ maxLength: 51 }}
              />
              <TextField
                label="Color"
                type="color"
                value={formData.color}
                onChange={e =>
                  setFormData({ ...formData, color: e.target.value })
                }
                fullWidth
                margin="normal"
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button onClick={handleSave} variant="contained">
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outlined">
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddLabel}
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
              >
                Add Label
              </Button>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {labels.map(label => (
                  <Box
                    key={label._id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Chip
                      label={label.name}
                      data-testid={`label-${label._id}`}
                      sx={{
                        backgroundColor: label.color,
                        color: '#fff',
                        fontWeight: 'bold',
                      }}
                    />
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditLabel(label)}
                        aria-label="edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(label._id)}
                        aria-label="delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this label? It will be removed from
            all cards.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

LabelManager.propTypes = {
  boardId: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
};

export default LabelManager;
