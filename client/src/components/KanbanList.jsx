import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cardAPI } from '../utils/api';
import KanbanCard from './KanbanCard';

const KanbanList = ({
  list,
  boardId,
  onCardClick,
  onListUpdate,
  onEditList,
  activeCardId,
  overId,
}) => {
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

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
      await cardAPI.create(list._id, {
        title: newCardTitle,
        description: '',
        position: cards.length,
        boardId,
        listId: list._id,
      });
      setNewCardTitle('');
      setShowNewCardForm(false);
      // ask parent to refresh lists/cards
      onListUpdate();
    } catch (err) {
      console.error('Error creating card', err);
    }
  };

  const handleDeleteCard = _cardId => {
    // Notify parent to refresh after deletion
    onListUpdate();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-80 bg-gray-200 rounded-lg p-4 shadow transition-all duration-200 ${
        isOver
          ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50 scale-[1.02]'
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
          <h3 className="font-semibold text-gray-800 text-lg">{list.name}</h3>
          <p className="text-xs text-gray-600">{cards.length} cards</p>
        </div>
        {onEditList && (
          <button
            onClick={() => onEditList(list)}
            className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1 rounded hover:bg-gray-300 transition"
          >
            Edit
          </button>
        )}
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
            placeholder="Enter card title..."
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-trello-blue outline-none text-sm"
            rows="2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-2 bg-trello-green hover:bg-green-600 text-white rounded-lg text-sm font-medium transition"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewCardForm(false);
                setNewCardTitle('');
              }}
              className="px-3 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-sm transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowNewCardForm(true)}
          className="w-full text-left px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition"
        >
          + Add a card
        </button>
      )}
    </div>
  );
};

export default KanbanList;
