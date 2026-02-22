const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-yellow-500',
  'bg-red-500',
];

const getAvatarColor = index => AVATAR_COLORS[index % AVATAR_COLORS.length];

/**
 * Displays online users for the current board as avatars,
 * plus an "En ligne" badge when connected.
 *
 * @param {{ users: Array<{userId: string, username: string}>, isConnected: boolean }} props
 */
const OnlineUsers = ({ users = [], isConnected = false }) => {
  if (!isConnected && users.length === 0) return null;

  const visibleUsers = users.slice(0, 5);
  const overflow = users.length - visibleUsers.length;

  return (
    <div className="flex items-center gap-2">
      {isConnected && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
          En ligne
        </span>
      )}
      {users.length > 0 && (
        <div className="flex -space-x-2">
          {visibleUsers.map((user, index) => (
            <div
              key={user.userId}
              data-testid="online-avatar"
              className={`w-8 h-8 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white text-xs font-medium border-2 border-white flex-shrink-0`}
              title={user.username}
            >
              {user.username?.[0]?.toUpperCase()}
            </div>
          ))}
          {overflow > 0 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white flex-shrink-0">
              +{overflow}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;
