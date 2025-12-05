import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
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
  activeCardId,
  overId,
}) => {
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: `list-${list._id}`,
    data: {
      type: 'list',
      listId: list._id,
    },
  });

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
      console.error('Erreur lors de la création de la carte', err);
    }
  };

  const handleDeleteCard = _cardId => {
    // Notify parent to refresh after deletion
    onListUpdate();
  };

  return (
    <div className="flex-shrink-0 w-80 bg-gray-200 rounded-lg p-4 shadow">
      {/* List Header */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 text-lg">{list.name}</h3>
        <p className="text-xs text-gray-600">{cards.length} cartes</p>
      </div>

      {/* Cards Container - Droppable Zone */}
      <div
        ref={setNodeRef}
        className={`space-y-2 mb-4 max-h-[calc(100vh-350px)] overflow-y-auto min-h-[50px] rounded-lg transition-all duration-200 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500 pr-1 ${
          isOver
            ? 'bg-blue-50 border-2 border-dashed border-blue-500 shadow-inner scale-[1.02]'
            : 'border-2 border-transparent'
        }`}
      >
        <SortableContext
          items={cards.map(c => c._id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card, index) => {
            const isOverThisCard = overId === card._id;
            const isDraggingThisCard = activeCardId === card._id;

            return (
              <div key={card._id} className="relative">
                {/* Drop indicator line */}
                {isOverThisCard && !isDraggingThisCard && (
                  <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-lg z-10" />
                )}
                <KanbanCard
                  card={card}
                  onClick={() => onCardClick(card)}
                  onDelete={() => handleDeleteCard(card._id)}
                />
              </div>
            );
          })}
        </SortableContext>
      </div>

      {/* Add New Card */}
      {showNewCardForm ? (
        <form onSubmit={handleCreateCard} className="space-y-2">
          <textarea
            value={newCardTitle}
            onChange={e => setNewCardTitle(e.target.value)}
            placeholder="Entrez le titre de la carte..."
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-trello-blue outline-none text-sm"
            rows="2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-2 bg-trello-green hover:bg-green-600 text-white rounded-lg text-sm font-medium transition"
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewCardForm(false);
                setNewCardTitle('');
              }}
              className="px-3 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-sm transition"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowNewCardForm(true)}
          className="w-full text-left px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition"
        >
          + Ajouter une carte
        </button>
      )}
    </div>
  );
};

export default KanbanList;
