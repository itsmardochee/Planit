import { cardAPI } from '../utils/api';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const KanbanCard = ({ card, onClick, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: card._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = async e => {
    e.stopPropagation();
    try {
      await cardAPI.delete(card._id);
      onDelete(card._id);
    } catch (err) {
      console.error('Erreur lors de la suppression de la carte', err);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white rounded-lg p-3 shadow hover:shadow-md cursor-pointer transition border-l-4 border-trello-blue"
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-800 text-sm break-words">
            {card.title}
          </h4>
          {card.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {card.description}
            </p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-500 transition text-sm"
          title="Supprimer"
        >
          ✕
        </button>
      </div>

      {/* Card Badges */}
      <div className="mt-2 flex gap-1 text-xs">
        {card.labels && card.labels.length > 0 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
            {card.labels.length} label{card.labels.length > 1 ? 's' : ''}
          </span>
        )}
        {card.dueDate && (
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
            📅
          </span>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
