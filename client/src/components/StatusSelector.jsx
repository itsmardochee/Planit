const STATUS_OPTIONS = [
  { value: '', label: 'None', testId: 'status-option-none' },
  { value: 'todo', label: 'To Do', testId: 'status-option-todo' },
  {
    value: 'in-progress',
    label: 'In Progress',
    testId: 'status-option-in-progress',
  },
  { value: 'done', label: 'Done', testId: 'status-option-done' },
  { value: 'blocked', label: 'Blocked', testId: 'status-option-blocked' },
];

const StatusSelector = ({ value, onChange, disabled = false }) => (
  <select
    value={value ?? ''}
    onChange={e => onChange(e.target.value || null)}
    disabled={disabled}
    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm transition-all${disabled ? ' bg-gray-50 dark:bg-gray-900 cursor-default opacity-70' : ' bg-white'}`}
  >
    {STATUS_OPTIONS.map(opt => (
      <option key={opt.value} value={opt.value} data-testid={opt.testId}>
        {opt.label}
      </option>
    ))}
  </select>
);

export default StatusSelector;
