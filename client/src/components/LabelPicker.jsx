import { useState, useEffect } from 'react';
import { labelAPI } from '../utils/api';

const LabelPicker = ({
  boardId,
  assignedLabels = [],
  onChange,
  readOnly = false,
}) => {
  const [allLabels, setAllLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    labelAPI
      .getByBoard(boardId)
      .then(res => setAllLabels(res.data?.data || []))
      .catch(() => setError('Failed to load labels'))
      .finally(() => setLoading(false));
  }, [boardId]);

  const isAssigned = labelId =>
    assignedLabels.some(l => (l._id || l) === labelId);

  const handleToggle = label => {
    if (readOnly) return;
    if (isAssigned(label._id)) {
      onChange(assignedLabels.filter(l => (l._id || l) !== label._id));
    } else {
      onChange([...assignedLabels, label]);
    }
  };

  if (loading) {
    return (
      <div role="status" className="text-sm text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (allLabels.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No labels available. Create labels in board settings.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allLabels.map(label => {
        const assigned = isAssigned(label._id);
        return (
          <button
            key={label._id}
            type="button"
            data-testid={`label-${label._id}`}
            onClick={() => handleToggle(label)}
            disabled={readOnly}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white transition-all${readOnly ? ' cursor-default' : ' cursor-pointer hover:opacity-80'}${assigned ? ' ring-2 ring-offset-1 ring-white shadow-md' : ' opacity-60'}`}
            style={{ backgroundColor: label.color }}
          >
            {assigned && (
              <svg
                data-testid="check-icon"
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {label.name}
          </button>
        );
      })}
    </div>
  );
};

export default LabelPicker;
