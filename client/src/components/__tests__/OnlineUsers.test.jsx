import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnlineUsers from '../OnlineUsers';

describe('OnlineUsers', () => {
  describe('Empty state', () => {
    it('should render nothing when users is empty and not connected', () => {
      const { container } = render(<OnlineUsers users={[]} isConnected={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render the online badge when connected even with no users', () => {
      render(<OnlineUsers users={[]} isConnected={true} />);
      expect(screen.getByText(/en ligne/i)).toBeInTheDocument();
    });
  });

  describe('User avatars', () => {
    const users = [
      { userId: 'u1', username: 'Alice' },
      { userId: 'u2', username: 'Bob' },
      { userId: 'u3', username: 'Charlie' },
    ];

    it('should render an avatar for each online user', () => {
      render(<OnlineUsers users={users} isConnected={true} />);
      // Each avatar shows the first letter of the username
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should render N avatars for N users', () => {
      const { container } = render(<OnlineUsers users={users} isConnected={true} />);
      // MUI Avatar elements
      const avatars = container.querySelectorAll('.MuiAvatar-root');
      expect(avatars.length).toBe(users.length);
    });

    it('should render user initials as avatar content', () => {
      render(<OnlineUsers users={[{ userId: 'u1', username: 'Xavier' }]} isConnected={false} />);
      expect(screen.getByText('X')).toBeInTheDocument();
    });
  });

  describe('Connection badge', () => {
    it('should show "En ligne" badge when isConnected is true', () => {
      render(<OnlineUsers users={[]} isConnected={true} />);
      expect(screen.getByText(/en ligne/i)).toBeInTheDocument();
    });

    it('should not show the online badge when isConnected is false and no users', () => {
      const { container } = render(<OnlineUsers users={[]} isConnected={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should show avatars even when isConnected is false if there are users', () => {
      render(<OnlineUsers users={[{ userId: 'u1', username: 'Alice' }]} isConnected={false} />);
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });
});
