import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cardAPI } from '../utils/api';
import MemberSelector from './MemberSelector';
import LabelPicker from './LabelPicker';
import StatusSelector from './StatusSelector';

const CardModal = ({ card, boardId, members, onClose, onCardUpdate }) => {
  const { t } = useTranslation(['cards', 'common']);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [assignedMembers, setAssignedMembers] = useState(card.assignedTo || []);
  const [currentCard, setCurrentCard] = useState(card);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update title and description
      await cardAPI.update(card._id, {
        title,
        description,
      });

      // Process member assignment changes
      const initialMemberIds = (card.assignedTo || []).map(m => m._id);
      const currentMemberIds = assignedMembers.map(m => m._id);

      // Find members to add (in current but not in initial)
      const toAdd = currentMemberIds.filter(
        id => !initialMemberIds.includes(id)
      );

      // Find members to remove (in initial but not in current)
      const toRemove = initialMemberIds.filter(
        id => !currentMemberIds.includes(id)
      );

      // Execute assignment API calls
      for (const userId of toAdd) {
        await cardAPI.assign(card._id, userId);
      }

      // Execute unassignment API calls
      for (const userId of toRemove) {
        await cardAPI.unassign(card._id, userId);
      }

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

  const handleAssignMember = async userId => {
    // Find the full member object from members list
    const memberToAdd = members.find(m => m.userId._id === userId);
    if (memberToAdd) {
      // Add to local state (pending changes)
      setAssignedMembers(prev => [
        ...prev,
        {
          _id: memberToAdd.userId._id,
          username: memberToAdd.userId.username,
          email: memberToAdd.userId.email,
        },
      ]);
    }
  };

  const handleUnassignMember = async userId => {
    // Remove from local state (pending changes)
    setAssignedMembers(prev => prev.filter(m => m._id !== userId));
  };

  const handleCardChange = updatedCard => {
    // Update local card state when labels or status change
    setCurrentCard(updatedCard);
  };

  // Sync currentCard when prop card changes
  useEffect(() => {
    setCurrentCard(card);
  }, [card]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {t('cards:detailsTitle')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('cards:titleLabel')}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-trello-blue outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('cards:descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows="6"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-trello-blue outline-none"
              placeholder={t('cards:descriptionPlaceholder')}
            />
          </div>

          {/* Member Assignment */}
          {members && members.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('cards:assignedTo', 'Assigned To')}
              </label>
              <MemberSelector
                members={members}
                assignedMembers={assignedMembers}
                onAssign={handleAssignMember}
                onUnassign={handleUnassignMember}
              />
            </div>
          )}

          {/* Labels */}
          {boardId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('cards:labels', 'Labels')}
              </label>
              <LabelPicker
                boardId={boardId}
                card={currentCard}
                onUpdate={handleCardChange}
              />
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('cards:status', 'Status')}
            </label>
            <StatusSelector card={currentCard} onUpdate={handleCardChange} />
          </div>

          {/* Card Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              {t('cards:informationTitle')}
            </h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
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
        <div className="flex justify-between gap-2 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
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
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg transition"
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
