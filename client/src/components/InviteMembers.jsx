import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-members-title"
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
      >
        <h2
          id="invite-members-title"
          className="text-2xl font-bold mb-4 dark:text-white"
        >
          {t('workspace:members.inviteMembers', {
            defaultValue: 'Invite Members',
          })}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label
            htmlFor="member-email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {t('workspace:members.emailAddress', {
              defaultValue: 'Email Address',
            })}
          </label>
          <input
            id="member-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('workspace:members.emailPlaceholder', {
              defaultValue: 'Enter member email address',
            })}
            autoFocus
            disabled={loading}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common:buttons.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            onClick={handleInvite}
            disabled={!email || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>📧</span>
            <span>
              {loading
                ? t('common:messages.loading', { defaultValue: 'Sending...' })
                : t('workspace:members.sendInvite', {
                    defaultValue: 'Send Invite',
                  })}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteMembers;
