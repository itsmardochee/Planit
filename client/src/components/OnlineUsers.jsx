import { AvatarGroup, Avatar, Tooltip, Chip } from '@mui/material';

/**
 * Displays online users for the current board as avatars,
 * plus an "En ligne" badge when connected.
 *
 * @param {{ users: Array<{userId: string, username: string}>, isConnected: boolean }} props
 */
const OnlineUsers = ({ users = [], isConnected = false }) => {
  if (!isConnected && users.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {isConnected && (
        <Chip
          label="En ligne"
          size="small"
          color="success"
          variant="outlined"
        />
      )}
      {users.length > 0 && (
        <AvatarGroup max={5}>
          {users.map(user => (
            <Tooltip key={user.userId} title={user.username} arrow>
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                {user.username?.[0]?.toUpperCase()}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
      )}
    </div>
  );
};

export default OnlineUsers;
