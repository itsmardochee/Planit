import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const BoardEditModal = ({ board, onClose, onSave }) => {
  const { t } = useTranslation(['modals', 'common']);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (board) {
      setName(board.name || '');
      setDescription(board.description || '');
    }
  }, [board]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t('modals:board.requiredError'));
      return;
    }

    setLoading(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('modals:board.updateError'));
    } finally {
      setLoading(false);
    }
  };

  if (!board) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">
          {t('modals:board.title')}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="board-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('modals:board.nameLabel')}
            </label>
            <input
              id="board-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('modals:board.namePlaceholder')}
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="board-description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('modals:board.descriptionLabel')}
            </label>
            <textarea
              id="board-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('modals:board.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {t('modals:board.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? t('modals:board.saving') : t('modals:board.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

BoardEditModal.propTypes = {
  board: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default BoardEditModal;
