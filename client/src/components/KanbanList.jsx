import { useState } from 'react';
import { cardAPI } from '../utils/api';
import KanbanCard from './KanbanCard';

const KanbanList = ({ list, boardId, onCardClick, onListUpdate }) => {
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

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

      {/* Cards Container */}
      <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
        {cards.map(card => (
          <KanbanCard
            key={card._id}
            card={card}
            onClick={() => onCardClick(card)}
            onDelete={() => handleDeleteCard(card._id)}
          />
        ))}
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
