import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cardAPI } from '../utils/api';
import MemberSelector from './MemberSelector';
import LabelPicker from './LabelPicker';
import StatusSelector from './StatusSelector';
import CommentSection from './CommentSection';

const CardModal = ({ card, boardId, members, onClose, onCardUpdate }) => {
  const { t } = useTranslation(['cards', 'common']);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [assignedMembers, setAssignedMembers] = useState(card.assignedTo || []);
  const [currentCard, setCurrentCard] = useState(card);
  const [dueDate, setDueDate] = useState(
    card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ''
  );
  const [activeTab, setActiveTab] = useState('details');

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update title, description, and due date
      const dueDateValue = dueDate ? new Date(dueDate).toISOString() : null;
      await cardAPI.update(card._id, {
        title,
        description,
        dueDate: dueDateValue,
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

  const handleDueDateChange = e => {
    const newDate = e.target.value;
    setDueDate(newDate);
  };

  // Sync currentCard when prop card changes
  useEffect(() => {
    setCurrentCard(card);
    setDueDate(
      card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ''
    );
  }, [card]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t('cards:detailsTitle')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('cards:cardId', 'ID')}: {card._id.slice(-8)}
            </p>
          </div>
          <button
            onClick={onClose}
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

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
              activeTab === 'details'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {t('cards:detailsTab', 'Details')}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
              activeTab === 'comments'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {t('cards:commentsTab', 'Comments')}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
              activeTab === 'info'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {t('cards:infoTab', 'Info')}
            </span>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab Panel: Details */}
          {activeTab === 'details' && (
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('cards:titleLabel')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder={t(
                    'cards:titlePlaceholder',
                    'Enter card title...'
                  )}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('cards:descriptionLabel')}
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows="5"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder={t('cards:descriptionPlaceholder')}
                />
              </div>

              {/* Grid for metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Due Date */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-600">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <svg
                      className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {t('cards:dueDate', 'Due Date')}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={handleDueDateChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Status */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-purple-200 dark:border-gray-600">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <svg
                      className="w-4 h-4 text-purple-600 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {t('cards:status', 'Status')}
                  </label>
                  <StatusSelector
                    card={currentCard}
                    onUpdate={handleCardChange}
                  />
                </div>
              </div>

              {/* Member Assignment */}
              {members && members.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-green-200 dark:border-gray-600">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
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
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-gray-600">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <svg
                      className="w-4 h-4 text-yellow-600 dark:text-yellow-400"
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
                    {t('cards:labels', 'Labels')}
                  </label>
                  <LabelPicker
                    boardId={boardId}
                    card={currentCard}
                    onUpdate={handleCardChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab Panel: Comments */}
          {activeTab === 'comments' && (
            <div className="animate-fadeIn">
              <CommentSection cardId={card._id} />
            </div>
          )}

          {/* Tab Panel: Info */}
          {activeTab === 'info' && (
            <div className="animate-fadeIn">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {t('cards:informationTitle')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('cards:idLabel')}:
                    </div>
                    <div className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 break-all">
                      {card._id}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('cards:createdOn')}:
                    </div>
                    <div className="flex-1 text-sm text-gray-800 dark:text-gray-200">
                      {new Date(card.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('cards:updatedOn')}:
                    </div>
                    <div className="flex-1 text-sm text-gray-800 dark:text-gray-200">
                      {new Date(card.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={handleDelete}
            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {t('cards:delete')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
              disabled={isSaving}
            >
              {t('cards:cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {isSaving ? t('cards:saving') : t('cards:save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
