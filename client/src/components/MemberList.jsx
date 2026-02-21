import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip } from '@mui/material';
import { memberAPI } from '../utils/api';

const MemberList = ({
  members,
  workspaceId,
  currentUserId,
  onMemberRemoved,
}) => {
  const { t } = useTranslation(['workspace', 'common']);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getInitials = username => {
    if (!username) return '?';
    const parts = username.split('_');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username[0].toUpperCase();
  };

  const getRoleColor = role => {
    switch (role) {
      case 'owner':
        return 'error';
      case 'admin':
        return 'warning';
      case 'member':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getAvatarClasses = role => {
    switch (role) {
      case 'owner':
        return 'bg-gradient-to-br from-red-400 to-red-600';
      case 'admin':
        return 'bg-gradient-to-br from-amber-400 to-amber-600';
      case 'member':
        return 'bg-gradient-to-br from-blue-400 to-blue-600';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-600';
    }
  };

  const getRoleLabel = role => {
    return (
      t(`workspace:members.roles.${role}`, {
        defaultValue: role.charAt(0).toUpperCase() + role.slice(1),
      }) || role
    );
  };

  const formatJoinedDate = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('workspace:members.joinedToday', {
        defaultValue: 'Joined today',
      });
    } else if (diffDays === 1) {
      return t('workspace:members.joinedYesterday', {
        defaultValue: 'Joined yesterday',
      });
    } else if (diffDays < 30) {
      return t('workspace:members.joinedDaysAgo', {
        days: diffDays,
        defaultValue: `Joined ${diffDays} days ago`,
      });
    } else {
      return `${t('workspace:members.joined', { defaultValue: 'Joined' })} ${date.toLocaleDateString()}`;
    }
  };

  const isCurrentUser = member => member.userId?._id === currentUserId;

  const canRemoveMember = member => {
    if (isCurrentUser(member)) return false;
    return true;
  };

  const handleRemoveClick = member => {
    setConfirmDialog(member);
    setError('');
  };

  const handleConfirmRemove = async () => {
    if (!confirmDialog) return;
    setLoading(true);
    setError('');
    try {
      await memberAPI.remove(workspaceId, confirmDialog.userId._id);
      setConfirmDialog(null);
      if (onMemberRemoved) onMemberRemoved();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('common:messages.error', { defaultValue: 'Cannot remove member' });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRemove = () => {
    setConfirmDialog(null);
    setError('');
  };

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-600 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('workspace:members.noMembers', { defaultValue: 'No members yet' })}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Member cards grid — aria-hidden when modal is open (mirrors MUI Dialog behavior) */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        aria-hidden={!!confirmDialog}
      >
        {members.map(member => (
          <div
            key={member._id}
            className="relative flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-150"
          >
            {/* Colored avatar circle with initials */}
            <div
              className={`flex-shrink-0 w-11 h-11 rounded-full ${getAvatarClasses(member.role)} flex items-center justify-center text-white font-semibold text-sm shadow-sm select-none`}
            >
              {getInitials(member.userId?.username || null)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                  {member.userId?.username || 'Unknown User'}
                </span>
                <Chip
                  label={getRoleLabel(member.role)}
                  size="small"
                  color={getRoleColor(member.role)}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {member.userId?.email || 'No email'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {formatJoinedDate(member.joinedAt || member.invitedAt)}
              </p>
            </div>

            {/* Remove button */}
            {canRemoveMember(member) && (
              <button
                aria-label={`remove ${member.userId?.username || 'member'}`}
                onClick={() => handleRemoveClick(member)}
                title={t('workspace:members.remove', {
                  defaultValue: 'Remove member',
                })}
                className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-150"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation modal (Tailwind) */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCancelRemove}
          />

          {/* Panel */}
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {t('workspace:members.confirmRemoveTitle', {
                  defaultValue: 'Remove Member',
                })}
              </h3>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-3">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('workspace:members.confirmRemoveMessage', {
                  username: confirmDialog?.userId?.username || 'this member',
                  defaultValue: `Are you sure you want to remove ${confirmDialog?.userId?.username || 'this member'} from this workspace?`,
                })}
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancelRemove}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                {t('common:buttons.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                {loading
                  ? t('common:messages.loading', { defaultValue: 'Removing...' })
                  : t('common:buttons.remove', { defaultValue: 'Remove' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MemberList;
