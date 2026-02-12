import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { memberAPI } from '../utils/api';

const InviteMembers = ({ open, workspaceId, onClose, onMemberInvited }) => {
  const { t } = useTranslation(['workspace', 'common']);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) {
    return null;
  }

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInvite = async () => {
    setError('');

    // Validate email format
    if (!validateEmail(email)) {
      setError(
        t('workspace:members.errors.invalidEmail', {
          defaultValue: 'Invalid email address',
        })
      );
      return;
    }

    setLoading(true);

    try {
      await memberAPI.invite(workspaceId, { email });
      setEmail(''); // Clear input on success
      if (onMemberInvited) {
        onMemberInvited();
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('common:messages.error', { defaultValue: 'An error occurred' });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' && email && !loading) {
      handleInvite();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('workspace:members.inviteMembers', {
          defaultValue: 'Invite Members',
        })}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label={t('workspace:members.emailAddress', {
              defaultValue: 'Email Address',
            })}
            placeholder={t('workspace:members.emailPlaceholder', {
              defaultValue: 'Enter member email address',
            })}
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            type="email"
            autoFocus
            disabled={loading}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('common:buttons.cancel', { defaultValue: 'Cancel' })}
        </Button>
        <Button
          variant="contained"
          onClick={handleInvite}
          disabled={!email || loading}
          startIcon={<SendIcon />}
        >
          {loading
            ? t('common:messages.loading', { defaultValue: 'Sending...' })
            : t('workspace:members.sendInvite', {
                defaultValue: 'Send Invite',
              })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteMembers;
