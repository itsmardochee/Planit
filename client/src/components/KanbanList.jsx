import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cardAPI, listAPI } from '../utils/api';
import KanbanCard from './KanbanCard';
import ConfirmModal from './ConfirmModal';
import usePermissions from '../hooks/usePermissions';

const KanbanList = ({
  list,
  boardId,
  workspaceId,
  onCardClick,
  onCardCreated,
  onListUpdate,
  onEditList,
}) => {
  const { t } = useTranslation(['lists', 'common']);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get permissions
  const { can } = usePermissions(workspaceId);

  // Make the list itself draggable
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list._id,
    data: {
      type: 'list',
      list,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `list-${list._id}`,
    data: {
      type: 'list',
      listId: list._id,
    },
  });

  // Combine refs
  const setNodeRef = node => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  const cards = list.cards || [];

  const handleCreateCard = async e => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    try {
      const response = await cardAPI.create(list._id, {
        title: newCardTitle,
        description: '',
        position: cards.length,
        boardId,
        listId: list._id,
      });
      setNewCardTitle('');
      setShowNewCardForm(false);
      // Optimistic local update — no need for a full refetch
      if (response.data?.success && onCardCreated) {
        onCardCreated(response.data.data);
      }
    } catch (err) {
      console.error('Error creating card', err);
    }
  };

  const handleDeleteCard = _cardId => {
    // Notify parent to refresh after deletion
    onListUpdate();
  };

  const handleDeleteList = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteList = async () => {
    try {
      await listAPI.delete(list._id);
      onListUpdate();
    } catch (err) {
      console.error('Error deleting list', err);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-80 bg-gray-200 dark:bg-gray-800 rounded-lg p-4 shadow transition-all duration-200 ${
        isOver
          ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50 dark:bg-blue-900 scale-[1.02]'
          : ''
      } ${isDragging ? 'cursor-grabbing' : ''}`}
    >
      {/* List Header */}
      <div className="mb-4 flex justify-between items-start">
        <div
          {...attributes}
          {...listeners}
          className="flex-1 cursor-grab active:cursor-grabbing"
        >
          <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
            {list.name}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t('lists:cardsCount', { count: cards.length })}
          </p>
        </div>
        <div className="flex gap-2">
          {onEditList && (
            <button
              onClick={() => onEditList(list)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              title={t('lists:edit')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path
                  fillRule="evenodd"
                  d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          <button
            onClick={handleDeleteList}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-300 dark:border-red-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            title={t('lists:delete')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Cards Container */}
      <div
        className={`space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto rounded-lg scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500 pr-1 ${
          cards.length > 0 ? 'mb-4' : ''
        }`}
      >
        <SortableContext
          items={cards.map(c => c._id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map(card => (
            <KanbanCard
              key={card._id}
              card={card}
              onClick={() => onCardClick(card)}
              onDelete={() => handleDeleteCard(card._id)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add New Card */}
      {showNewCardForm ? (
        <form onSubmit={handleCreateCard} className="space-y-2">
          <textarea
            value={newCardTitle}
            onChange={e => setNewCardTitle(e.target.value)}
            placeholder={t('lists:cardTitlePlaceholder')}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-trello-blue outline-none text-sm"
            rows="2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              {t('lists:addCard')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewCardForm(false);
                setNewCardTitle('');
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              {t('lists:cancel')}
            </button>
          </div>
        </form>
      ) : can && can('card:create') ? (
        <button
          onClick={() => setShowNewCardForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          {t('lists:addAnotherCard')}
        </button>
      ) : (
        <Tooltip
          title={t(
            'common:messages.noPermissionCreate',
            'You do not have permission to create cards'
          )}
        >
          <span className="block">
            <button
              disabled
              className="w-full text-left px-3 py-2 bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
            >
              + {t('lists:addAnotherCard')}
            </button>
          </span>
        </Tooltip>
      )}

      <ConfirmModal
        open={showDeleteConfirm}
        title={t('common:messages.confirmDeleteList', {
          name: list.name,
          defaultValue: `Delete list "${list.name}"?`,
        })}
        message={t('lists:confirmDeleteMessage', {
          name: list.name,
          defaultValue: `Are you sure you want to delete "${list.name}" and all its cards?`,
        })}
        onConfirm={handleConfirmDeleteList}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default KanbanList;
