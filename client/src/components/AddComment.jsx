import { useState } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@mui/material';

const AddComment = ({ onSubmit, disabled = false }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return; // Don't submit empty comments
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(trimmedContent);
      setContent(''); // Clear textarea on success
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = e => {
    // Submit on Ctrl+Enter
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      {disabled ? (
        <Tooltip title="You do not have permission to comment">
          <div>
            <textarea
              disabled
              placeholder="You do not have permission to comment"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-lg text-sm resize-none opacity-50 cursor-not-allowed"
              rows={3}
            />
          </div>
        </Tooltip>
      ) : (
        <>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            rows={3}
            disabled={isSubmitting}
          />

          {error && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Press Ctrl+Enter to submit
            </span>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition"
            >
              {isSubmitting ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

AddComment.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default AddComment;
