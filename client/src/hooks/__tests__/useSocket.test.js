import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSocket from '../useSocket';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Helper: get the handler registered for a specific event
const getHandler = (event) => {
  const call = mockSocket.on.mock.calls.find(([e]) => e === event);
  return call?.[1];
};

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock socket state
    mockSocket.connected = false;
    // Mock localStorage to return a valid token by default
    vi.spyOn(globalThis.localStorage, 'getItem').mockReturnValue('mock-jwt-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Connection Guard', () => {
    it('should not connect when boardId is null', () => {
      renderHook(() => useSocket(null, {}));
      // io() should not be called, therefore no socket.on() calls
      expect(mockSocket.on).not.toHaveBeenCalled();
    });

    it('should not connect when token is absent', () => {
      vi.spyOn(globalThis.localStorage, 'getItem').mockReturnValue(null);
      renderHook(() => useSocket('board123', {}));
      // socket.on should not be called since no token
      expect(mockSocket.on).not.toHaveBeenCalled();
    });

    it('should connect when boardId and token are present', () => {
      renderHook(() => useSocket('board123', {}));
      expect(mockSocket.on).toHaveBeenCalled();
    });
  });

  describe('Initial State', () => {
    it('should return empty onlineUsers and isConnected=false initially', () => {
      vi.spyOn(globalThis.localStorage, 'getItem').mockReturnValue(null);
      const { result } = renderHook(() => useSocket('board123', {}));
      expect(result.current.onlineUsers).toEqual([]);
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Connect / Disconnect Lifecycle', () => {
    it('should emit board:join on connect', () => {
      renderHook(() => useSocket('board123', {}));

      const connectHandler = getHandler('connect');
      act(() => connectHandler?.());

      expect(mockSocket.emit).toHaveBeenCalledWith('board:join', { boardId: 'board123' });
    });

    it('should set isConnected to true on connect', () => {
      const { result } = renderHook(() => useSocket('board123', {}));

      const connectHandler = getHandler('connect');
      act(() => connectHandler?.());

      expect(result.current.isConnected).toBe(true);
    });

    it('should set isConnected to false on disconnect', () => {
      const { result } = renderHook(() => useSocket('board123', {}));

      const connectHandler = getHandler('connect');
      const disconnectHandler = getHandler('disconnect');
      act(() => connectHandler?.());
      act(() => disconnectHandler?.());

      expect(result.current.isConnected).toBe(false);
    });

    it('should emit board:leave and disconnect on unmount', () => {
      const { unmount } = renderHook(() => useSocket('board123', {}));

      unmount();

      expect(mockSocket.emit).toHaveBeenCalledWith('board:leave', { boardId: 'board123' });
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Online Users', () => {
    it('should add a user to onlineUsers on user:joined', () => {
      const { result } = renderHook(() => useSocket('board123', {}));

      const userJoinedHandler = getHandler('user:joined');
      act(() => userJoinedHandler?.({ userId: 'u1', username: 'Alice' }));

      expect(result.current.onlineUsers).toHaveLength(1);
      expect(result.current.onlineUsers[0]).toEqual({ userId: 'u1', username: 'Alice' });
    });

    it('should not duplicate users on repeated user:joined for same userId', () => {
      const { result } = renderHook(() => useSocket('board123', {}));

      const userJoinedHandler = getHandler('user:joined');
      act(() => {
        userJoinedHandler?.({ userId: 'u1', username: 'Alice' });
        userJoinedHandler?.({ userId: 'u1', username: 'Alice' });
      });

      expect(result.current.onlineUsers).toHaveLength(1);
    });

    it('should remove a user from onlineUsers on user:left', () => {
      const { result } = renderHook(() => useSocket('board123', {}));

      const userJoinedHandler = getHandler('user:joined');
      const userLeftHandler = getHandler('user:left');

      act(() => userJoinedHandler?.({ userId: 'u1', username: 'Alice' }));
      act(() => userLeftHandler?.({ userId: 'u1', username: 'Alice' }));

      expect(result.current.onlineUsers).toHaveLength(0);
    });
  });

  describe('Event Handlers', () => {
    it('should call onCardCreated handler when card:created event fires', () => {
      const onCardCreated = vi.fn();
      renderHook(() => useSocket('board123', { onCardCreated }));

      const handler = getHandler('card:created');
      const data = { card: { _id: 'c1', title: 'New Card' }, listId: 'l1', boardId: 'b1' };
      act(() => handler?.(data));

      expect(onCardCreated).toHaveBeenCalledWith(data);
    });

    it('should call onCardUpdated handler when card:updated event fires', () => {
      const onCardUpdated = vi.fn();
      renderHook(() => useSocket('board123', { onCardUpdated }));

      const handler = getHandler('card:updated');
      const data = { card: { _id: 'c1', title: 'Updated' } };
      act(() => handler?.(data));

      expect(onCardUpdated).toHaveBeenCalledWith(data);
    });

    it('should call onCardMoved handler when card:moved event fires', () => {
      const onCardMoved = vi.fn();
      renderHook(() => useSocket('board123', { onCardMoved }));

      const handler = getHandler('card:moved');
      const data = { card: { _id: 'c1' }, fromListId: 'l1', toListId: 'l2', boardId: 'b1' };
      act(() => handler?.(data));

      expect(onCardMoved).toHaveBeenCalledWith(data);
    });

    it('should call onCardDeleted handler when card:deleted event fires', () => {
      const onCardDeleted = vi.fn();
      renderHook(() => useSocket('board123', { onCardDeleted }));

      const handler = getHandler('card:deleted');
      const data = { cardId: 'c1', listId: 'l1', boardId: 'b1' };
      act(() => handler?.(data));

      expect(onCardDeleted).toHaveBeenCalledWith(data);
    });

    it('should call onListCreated handler when list:created event fires', () => {
      const onListCreated = vi.fn();
      renderHook(() => useSocket('board123', { onListCreated }));

      const handler = getHandler('list:created');
      const data = { list: { _id: 'l1', name: 'New List' }, boardId: 'b1' };
      act(() => handler?.(data));

      expect(onListCreated).toHaveBeenCalledWith(data);
    });

    it('should call onCommentCreated handler when comment:created event fires', () => {
      const onCommentCreated = vi.fn();
      renderHook(() => useSocket('board123', { onCommentCreated }));

      const handler = getHandler('comment:created');
      const data = { comment: { _id: 'cm1', content: 'Hello' }, cardId: 'c1' };
      act(() => handler?.(data));

      expect(onCommentCreated).toHaveBeenCalledWith(data);
    });

    it('should call onCommentDeleted handler when comment:deleted event fires', () => {
      const onCommentDeleted = vi.fn();
      renderHook(() => useSocket('board123', { onCommentDeleted }));

      const handler = getHandler('comment:deleted');
      const data = { commentId: 'cm1', cardId: 'c1' };
      act(() => handler?.(data));

      expect(onCommentDeleted).toHaveBeenCalledWith(data);
    });

    it('should not throw if handler is not provided for an event', () => {
      renderHook(() => useSocket('board123', {}));

      const handler = getHandler('card:created');
      expect(() => act(() => handler?.({ card: {} }))).not.toThrow();
    });
  });

  describe('Stale Closure Prevention', () => {
    it('should use the latest handlers after they change', () => {
      const onCardCreated1 = vi.fn();
      const onCardCreated2 = vi.fn();

      const { rerender } = renderHook(
        ({ handlers }) => useSocket('board123', handlers),
        { initialProps: { handlers: { onCardCreated: onCardCreated1 } } }
      );

      rerender({ handlers: { onCardCreated: onCardCreated2 } });

      const handler = getHandler('card:created');
      const data = { card: { _id: 'c1' } };
      act(() => handler?.(data));

      // Should call the LATEST handler
      expect(onCardCreated2).toHaveBeenCalledWith(data);
      expect(onCardCreated1).not.toHaveBeenCalled();
    });
  });

  describe('BoardId Changes', () => {
    it('should reconnect when boardId changes', () => {
      const { rerender } = renderHook(
        ({ boardId }) => useSocket(boardId, {}),
        { initialProps: { boardId: 'board123' } }
      );

      vi.clearAllMocks();

      rerender({ boardId: 'board456' });

      // After boardId change, board:leave should have been emitted for old board
      // and a new connection should have been created
      expect(mockSocket.emit).toHaveBeenCalledWith('board:leave', { boardId: 'board123' });
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
});
