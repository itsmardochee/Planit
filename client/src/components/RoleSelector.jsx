import PropTypes from 'prop-types';
import { ROLE_INFO } from '../hooks/usePermissions';

const ROLE_COLORS = {
  owner:
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
  admin:
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  member:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  viewer:
    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600',
};

const ROLE_DOT_COLORS = {
  owner: 'bg-purple-500',
  admin: 'bg-blue-500',
  member: 'bg-green-500',
  viewer: 'bg-gray-400',
};

/**
 * RoleSelector — Editable role badge that triggers a modal on click.
 * Displays the current role with an edit icon. The actual role selection
 * happens in RoleChangeModal, opened by the parent.
 */
const RoleSelector = ({ currentRole, onClick, loading = false }) => {
  const roleInfo = ROLE_INFO[currentRole] || {
    label: currentRole.charAt(0).toUpperCase() + currentRole.slice(1),
  };
  const colorClass = ROLE_COLORS[currentRole] || ROLE_COLORS.viewer;
  const dotColor = ROLE_DOT_COLORS[currentRole] || 'bg-gray-400';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={`Change role: ${roleInfo.label}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all ${colorClass} ${
        loading
          ? 'opacity-60 cursor-wait'
          : 'hover:opacity-80 cursor-pointer hover:shadow-sm'
      }`}
    >
      {loading ? (
        <svg
          className="w-3 h-3 animate-spin flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
      )}

      {roleInfo.label}

      {!loading && (
        <svg
          className="w-3 h-3 opacity-50 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      )}
    </button>
  );
};

RoleSelector.propTypes = {
  currentRole: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default RoleSelector;
