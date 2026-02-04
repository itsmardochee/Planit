import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const ListEditModal = ({ list, onClose, onSave }) => {
  const { t } = useTranslation(['modals', 'common']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (list) {
      setName(list.name || '');
    }
  }, [list]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t('modals:list.requiredError'));
      return;
    }

    setLoading(true);
    try {
      await onSave({ name: name.trim() });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('modals:list.updateError'));
    } finally {
      setLoading(false);
    }
  };

  if (!list) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">
          {t('modals:list.title')}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="list-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('modals:list.nameLabel')}
            </label>
            <input
              id="list-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('modals:list.namePlaceholder')}
              required
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
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              {t('modals:list.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? t('modals:list.saving') : t('modals:list.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ListEditModal.propTypes = {
  list: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default ListEditModal;
