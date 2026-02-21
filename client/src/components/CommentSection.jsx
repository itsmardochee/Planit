import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CommentItem from './CommentItem';
import AddComment from './AddComment';
import { commentAPI } from '../utils/api';
import { usePermissions } from '../hooks/usePermissions';

const CommentSection = ({ cardId, workspaceId, workspaceId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get permissions
  const { can } = usePermissions(workspaceId);

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user._id);
      } catch (err) {
        console.error('Failed to parse user from localStorage', err);
      }
    }

    // Fetch comments
    fetchComments();
  }, [cardId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await commentAPI.getByCard(cardId);
      setComments(response.data.data || []);
    } catch (err) {
      console.error('Failed to load comments', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async content => {
    const response = await commentAPI.create(cardId, { content });
    const newComment = response.data.data;
    setComments(prev => [...prev, newComment]);
  };

  const handleEditComment = async (commentId, content) => {
    const response = await commentAPI.update(commentId, { content });
    const updatedComment = response.data.data;

    setComments(prev =>
      prev.map(comment =>
        comment._id === commentId ? updatedComment : comment
      )
    );
  };

  const handleDeleteComment = async commentId => {
    await commentAPI.delete(commentId);
    setComments(prev => prev.filter(comment => comment._id !== commentId));
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Loading comments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {comments.length === 0
            ? 'Comments'
            : `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}`}
        </h3>
      </div>

      {/* Comments list */}
      <div className="max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div>
            {comments.map(comment => (
              <CommentItem
                key={comment._id}
                comment={comment}
                currentUserId={currentUserId}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add comment form */}
      <AddComment
        onSubmit={handleAddComment}
        disabled={!can || !can('comment:create')}
      />
    </div>
  );
};

CommentSection.propTypes = {
  cardId: PropTypes.string.isRequired,
  workspaceId: PropTypes.string,
};

export default CommentSection;
