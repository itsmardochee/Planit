import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import {
  PersonRemove as RemoveIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
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

  if (!members || members.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 4,
          color: 'text.secondary',
        }}
      >
        <PersonIcon sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="body1">
          {t('workspace:members.noMembers', {
            defaultValue: 'No members yet',
          })}
        </Typography>
      </Box>
    );
  }

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

  const getRoleLabel = role => {
    return (
      t(`workspace:members.roles.${role}`, {
        defaultValue: role.charAt(0).toUpperCase() + role.slice(1),
      }) || role
    );
  };

  const getInitials = username => {
    if (!username) return '?';
    const parts = username.split('_');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username[0].toUpperCase();
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
      if (onMemberRemoved) {
        onMemberRemoved();
      }
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

  const isCurrentUser = member => {
    return member.userId?._id === currentUserId;
  };

  const canRemoveMember = member => {
    // Cannot remove yourself
    if (isCurrentUser(member)) {
      return false;
    }
    // Additional logic: only owner/admin can remove members
    // This is simplified - in real app, check current user's role
    return true;
  };

  return (
    <>
      <List sx={{ width: '100%' }}>
        {members.map(member => (
          <ListItem
            key={member._id}
            secondaryAction={
              canRemoveMember(member) && (
                <IconButton
                  edge="end"
                  aria-label={`remove ${member.userId?.username || 'member'}`}
                  onClick={() => handleRemoveClick(member)}
                  color="error"
                >
                  <RemoveIcon />
                </IconButton>
              )
            }
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': {
                borderBottom: 'none',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: theme =>
                    member.role === 'owner'
                      ? theme.palette.error.main
                      : member.role === 'admin'
                        ? theme.palette.warning.main
                        : theme.palette.primary.main,
                }}
              >
                {getInitials(member.userId?.username || '?')}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">
                    {member.userId?.username || 'Unknown User'}
                  </Typography>
                  <Chip
                    label={getRoleLabel(member.role)}
                    size="small"
                    color={getRoleColor(member.role)}
                  />
                </Box>
              }
              secondary={
                <>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                  >
                    {member.userId?.email || 'No email'}
                  </Typography>
                  {' — '}
                  {formatJoinedDate(member.joinedAt || member.invitedAt)}
                </>
              }
            />
          </ListItem>
        ))}
      </List>

      {/* Confirmation Dialog */}
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
