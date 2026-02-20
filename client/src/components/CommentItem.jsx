import { useState } from 'react';
import PropTypes from 'prop-types';

// Helper function to format relative time
const formatRelativeTime = dateString => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now - date; // difference in milliseconds

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  return `${years} year${years !== 1 ? 's' : ''} ago`;
};

// Helper function to get initials from username
const getInitials = username => {
  if (!username) return '?';

  // Split by common separators (underscore, hyphen, dot, space)
  const parts = username.split(/[_\-.\s]+/);

  if (parts.length >= 2) {
    // Take first letter of first two parts
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Single word username - take first letter
  return username[0].toUpperCase();
};

// Helper function to get consistent color for user
const getUserColor = userId => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-red-500',
  ];

  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

const CommentItem = ({ comment, currentUserId, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

  const isAuthor = currentUserId === comment.userId._id;
  const isEdited = comment.createdAt !== comment.updatedAt;

  const handleSave = () => {
    const trimmedContent = editedContent.trim();
    if (!trimmedContent) {
      return; // Don't save empty comments
    }

    onEdit(comment._id, trimmedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(comment._id);
  };

  return (
    <div className="flex gap-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${getUserColor(comment.userId._id)}`}
        title={comment.userId.username}
      >
        {getInitials(comment.userId.username)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: Author and timestamp */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {comment.userId.username}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {isEdited && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
              (edited)
            </span>
          )}
        </div>

        {/* Comment content or edit form */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedContent}
              onChange={e => setEditedContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
              {comment.content}
            </p>

            {/* Actions (only for author) */}
            {isAuthor && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  aria-label="Edit comment"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition"
                  aria-label="Delete comment"
                >
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

CommentItem.propTypes = {
  comment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    userId: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
    }).isRequired,
    createdAt: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
  }).isRequired,
  currentUserId: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default CommentItem;
