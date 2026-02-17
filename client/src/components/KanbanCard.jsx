import { cardAPI } from '../utils/api';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const KanbanCard = ({ card, onClick, onDelete }) => {
  // Generate initials from username
  const getInitials = username => {
    if (!username) return '?';
    const parts = username.split(/[_\-.]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username[0].toUpperCase();
  };

  // Get avatar color based on index
  const getAvatarColor = index => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500',
    ];
    return colors[index % colors.length];
  };
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: card._id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const handleDelete = async e => {
    e.stopPropagation();
    try {
      await cardAPI.delete(card._id);
      onDelete(card._id);
    } catch (err) {
      console.error('Error deleting card', err);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white rounded-lg p-3 shadow hover:shadow-md transition border-l-4 border-trello-blue ${
        isDragging ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      } ${isOver ? 'border-t-4 border-t-blue-500' : ''}`}
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
          title="Delete"
        >
          ✕
        </button>
      </div>

      {/* Card Badges */}
      <div className="mt-2 space-y-2">
        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1" data-testid="card-labels">
            {card.labels.slice(0, 3).map(label => (
              <span
                key={label._id}
                className="px-2 py-0.5 text-white text-[10px] font-medium rounded"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
            {card.labels.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-medium rounded">
                +{card.labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Status and Members Section */}
        <div className="flex gap-2 text-xs items-center justify-between">
          <div className="flex gap-1 items-center">
            {/* Status Badge */}
            {card.status && (
              <span
                data-testid="card-status"
                className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                  card.status === 'todo'
                    ? 'bg-gray-100 text-gray-700'
                    : card.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-700'
                      : card.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : card.status === 'blocked'
                          ? 'bg-red-100 text-red-700'
                          : ''
                }`}
              >
                {card.status === 'todo'
                  ? 'To Do'
                  : card.status === 'in-progress'
                    ? 'In Progress'
                    : card.status === 'done'
                      ? 'Done'
                      : card.status === 'blocked'
                        ? 'Blocked'
                        : ''}
              </span>
            )}

            {card.dueDate && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                📅
              </span>
            )}
          </div>

          {/* Assigned Members Avatars */}
          {card.assignedTo && card.assignedTo.length > 0 && (
            <div className="flex -space-x-2" data-testid="assigned-members">
              {card.assignedTo.slice(0, 3).map((member, index) => (
                <div
                  key={member._id}
                  data-testid={`member-avatar-${member._id}`}
                  className={`w-6 h-6 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white text-[10px] font-medium border-2 border-white`}
                  title={member.username}
                >
                  {getInitials(member.username)}
                </div>
              ))}
              {card.assignedTo.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-[10px] font-medium border-2 border-white">
                  +{card.assignedTo.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
