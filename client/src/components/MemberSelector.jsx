import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

/**
 * Get initials from username
 * Examples:
 * - "john_doe" -> "JD"
 * - "john-smith" -> "JS"
 * - "john.doe" -> "JD"
 * - "john" -> "J"
 */
const getInitials = username => {
  if (!username) return '?';

  // Split by underscore, hyphen, or dot
  const parts = username.split(/[_\-.]/);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return username[0].toUpperCase();
};

const MemberSelector = ({ members, assignedMembers, onAssign, onUnassign }) => {
  const { t } = useTranslation(['cards', 'common']);
  const [selectedMember, setSelectedMember] = useState('');

  // Get assigned member IDs for filtering
  const assignedMemberIds = assignedMembers.map(m => m._id);

  // Filter out already assigned members
  // Members from workspace have userId populated, so we check userId._id
  const availableMembers = members.filter(
    m => m.userId && !assignedMemberIds.includes(m.userId._id)
  );

  const handleMemberSelect = e => {
    const memberId = e.target.value;
    if (memberId) {
      onAssign(memberId);
      setSelectedMember(''); // Reset selection
    }
  };

  const handleRemoveMember = memberId => {
    onUnassign(memberId);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('cards:assignMembers', { defaultValue: 'Assign Members' })}
      </label>

      {/* Assigned Members Display */}
      {assignedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {assignedMembers.map(member => (
            <div
              key={member._id}
              className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
            >
              {/* Avatar with initials */}
              <div className="w-6 h-6 bg-blue-500 dark:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                {getInitials(member.username)}
              </div>
              <span>{member.username}</span>
              <button
                type="button"
                onClick={() => handleRemoveMember(member._id)}
                className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 font-bold"
                aria-label="Remove member"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Member Selector Dropdown */}
      <select
        value={selectedMember}
        onChange={handleMemberSelect}
        disabled={availableMembers.length === 0}
        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
      >
        <option value="">
          {availableMembers.length === 0
            ? t('cards:noMembersAvailable', {
                defaultValue: 'No members available',
              })
            : t('cards:selectMember', { defaultValue: 'Select a member...' })}
        </option>
        {availableMembers.map(member => (
          <option key={member._id} value={member.userId._id}>
            {member.userId.username} ({member.userId.email})
          </option>
        ))}
      </select>
    </div>
  );
};

MemberSelector.propTypes = {
  members: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      userId: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
      }).isRequired,
      role: PropTypes.string,
    })
  ).isRequired,
  assignedMembers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      email: PropTypes.string,
    })
  ).isRequired,
  onAssign: PropTypes.func.isRequired,
  onUnassign: PropTypes.func.isRequired,
};

export default MemberSelector;
