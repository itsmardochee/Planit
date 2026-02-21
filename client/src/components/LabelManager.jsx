import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-800">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500 p-2 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Manage Labels
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Create and organize board labels
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full p-2 transition-all"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Error Alert */}
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Create/Edit Form */}
              {isEditing ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 border border-blue-200 dark:border-gray-600 mb-5">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    {editingLabel ? (
                      <>
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit Label
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Create New Label
                      </>
                    )}
                  </h3>

                  <div className="space-y-4">
                    {/* Label Name */}
                    <div>
                      <label htmlFor="label-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Label Name
                      </label>
                      <input
                        id="label-name"
                        type="text"
                        value={formData.name}
                        onChange={e =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        maxLength={51}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="e.g., Urgent, In Progress, Done..."
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formData.name.length}/50 characters
                      </p>
                    </div>

                    {/* Color Picker */}
                    <div>
                      <label htmlFor="label-color-hex" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.color}
                          onChange={e =>
                            setFormData({ ...formData, color: e.target.value })
                          }
                          className="h-12 w-20 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                        />
                        <input
                          id="label-color-hex"
                          type="text"
                          value={formData.color}
                          onChange={e =>
                            setFormData({ ...formData, color: e.target.value })
                          }
                          className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Preview
                      </label>
                      <div
                        className="inline-block px-4 py-2 rounded-lg text-white font-semibold shadow-md"
                        style={{ backgroundColor: formData.color }}
                      >
                        {formData.name || 'Label Preview'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Save Label
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-all font-medium shadow-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Add Label Button */}
                  <button
                    onClick={handleAddLabel}
                    className="w-full px-4 py-3 mb-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add New Label
                  </button>

                  {/* Labels List */}
                  <div className="space-y-3">
                    {labels.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                          <svg
                            className="w-8 h-8 text-gray-400 dark:text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          No labels yet
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          Create your first label to organize cards
                        </p>
                      </div>
                    ) : (
                      labels.map(label => (
                        <div
                          key={label._id}
                          className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-all group"
                        >
                          <div
                            className="px-4 py-2 rounded-lg text-white font-semibold shadow-sm"
                            style={{ backgroundColor: label.color }}
                            data-testid={`label-${label._id}`}
                          >
                            {label.name}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditLabel(label)}
                              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                              aria-label="edit"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(label._id)}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              aria-label="delete"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={handleClose}
                aria-label="Close dialog"
                className="w-full px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full animate-fadeIn">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Confirm Delete
              </h3>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete this label? It will be removed
                from all cards.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                aria-label="Confirm delete"
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

LabelManager.propTypes = {
  boardId: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
};

export default LabelManager;
