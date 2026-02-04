import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cardAPI } from '../utils/api';

const CardModal = ({ card, onClose, onCardUpdate }) => {
  const { t } = useTranslation(['cards', 'common']);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await cardAPI.update(card._id, {
        title,
        description,
      });
      onCardUpdate();
      onClose();
    } catch (err) {
      console.error('Error saving card', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('cards:confirmDelete'))) return;
    try {
      await cardAPI.delete(card._id);
      onCardUpdate();
      onClose();
    } catch (err) {
      console.error('Error deleting card', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {t('cards:detailsTitle')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('cards:titleLabel')}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trello-blue outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('cards:descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trello-blue outline-none"
              placeholder={t('cards:descriptionPlaceholder')}
            />
          </div>

          {/* Card Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t('cards:informationTitle')}
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">{t('cards:idLabel')}:</span>{' '}
                {card._id}
              </p>
              <p>
                <span className="font-medium">{t('cards:createdOn')}:</span>{' '}
                {new Date(card.createdAt).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">{t('cards:updatedOn')}:</span>{' '}
                {new Date(card.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-2 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
            disabled={isSaving}
          >
            {t('cards:delete')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
            >
              {t('cards:cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-trello-blue hover:bg-trello-blue-dark text-white rounded-lg transition disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? t('cards:saving') : t('cards:save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
