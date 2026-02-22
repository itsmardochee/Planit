import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ROLE_INFO } from '../hooks/usePermissions';

const ROLE_COLORS = {
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

// Owner cannot be re-assigned via this modal
const ASSIGNABLE_ROLES = ['admin', 'member', 'viewer'];

/**
 * RoleChangeModal — Modal for changing a workspace member's role.
 * Shows role option cards, requires explicit Save to apply the change.
 */
const RoleChangeModal = ({
  open,
  onClose,
  onSave,
  member,
  loading = false,
  canModifyUserRole,
  saveError = '',
}) => {
  const { t } = useTranslation(['common', 'workspace']);
  const [selectedRole, setSelectedRole] = useState(member?.role || 'member');

  // Reset selected role whenever the modal opens or the member changes
  useEffect(() => {
    if (open && member) {
      setSelectedRole(member.role);
    }
  }, [open, member]);

  if (!open || !member) return null;

  const username = member.userId?.username || 'Unknown User';
  const hasChanged = selectedRole !== member.role;

  const handleSave = () => {
    if (hasChanged && !loading) {
      onSave(selectedRole);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3
            id="role-modal-title"
            className="text-base font-semibold text-gray-900 dark:text-white"
          >
            {t('workspace:members.changeRole', {
              defaultValue: 'Change role for',
            })}{' '}
            <span className="text-blue-600 dark:text-blue-400">{username}</span>
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-40 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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

        {/* Body — role option cards */}
        <div className="px-6 py-5 space-y-2.5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {t('workspace:members.selectNewRole', {
              defaultValue: 'Select a new role',
            })}
          </p>
          {ASSIGNABLE_ROLES.map(role => {
            const info = ROLE_INFO[role] || {
              label: role.charAt(0).toUpperCase() + role.slice(1),
              description: '',
            };
            const canSelect = canModifyUserRole(member.role, role);
            const isSelected = selectedRole === role;
            const dotColor = ROLE_DOT_COLORS[role] || 'bg-gray-400';

            return (
              <button
                key={role}
                type="button"
                data-testid={`role-option-${role}`}
                disabled={!canSelect}
                onClick={() => canSelect && setSelectedRole(role)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                      : canSelect
                        ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer'
                        : 'border-gray-100 dark:border-gray-700 opacity-40 cursor-not-allowed'
                  }
                `}
                aria-pressed={isSelected}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`}
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-800 dark:text-white">
                    {info.label}
                  </span>
                  {info.description && (
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                      {info.description}
                    </span>
                  )}
                </span>
                <span
                  className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-500'
                    }
                  `}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}

          {/* Error message */}
          {saveError && (
            <div className="flex items-start gap-2 mt-1 px-3 py-2.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
              <svg
                className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">
                {saveError}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {t('common:buttons.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanged || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && (
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
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
            )}
            {loading
              ? t('common:messages.saving', { defaultValue: 'Saving...' })
              : t('common:buttons.save', { defaultValue: 'Save' })}
          </button>
        </div>
      </div>
    </div>
  );
};

RoleChangeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  member: PropTypes.shape({
    _id: PropTypes.string,
    role: PropTypes.string,
    userId: PropTypes.shape({
      _id: PropTypes.string,
      username: PropTypes.string,
    }),
  }),
  loading: PropTypes.bool,
  canModifyUserRole: PropTypes.func.isRequired,
  saveError: PropTypes.string,
};

export default RoleChangeModal;
