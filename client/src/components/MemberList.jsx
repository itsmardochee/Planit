import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
} from '@mui/material';
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
      {/* Member cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(member => (
          <div
            key={member._id}
            className="group relative flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-150"
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

            {/* Remove button — appears on card hover */}
            {canRemoveMember(member) && (
              <button
                aria-label={`remove ${member.userId?.username || 'member'}`}
                onClick={() => handleRemoveClick(member)}
                title={t('workspace:members.remove', {
                  defaultValue: 'Remove member',
                })}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-150"
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

      {/* Confirmation Dialog (MUI for proper aria-modal behavior in tests) */}
      <Dialog open={!!confirmDialog} onClose={handleCancelRemove}>
        <DialogTitle>
          {t('workspace:members.confirmRemoveTitle', {
            defaultValue: 'Remove Member',
          })}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography>
            {t('workspace:members.confirmRemoveMessage', {
              username: confirmDialog?.userId?.username || 'this member',
              defaultValue: `Are you sure you want to remove ${confirmDialog?.userId?.username || 'this member'} from this workspace?`,
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRemove} disabled={loading}>
            {t('common:buttons.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleConfirmRemove}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading
              ? t('common:messages.loading', { defaultValue: 'Removing...' })
              : t('common:buttons.remove', { defaultValue: 'Remove' })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MemberList;
