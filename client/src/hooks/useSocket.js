import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const EVENT_HANDLER_MAP = {
  'card:created': 'onCardCreated',
  'card:updated': 'onCardUpdated',
  'card:moved': 'onCardMoved',
  'card:deleted': 'onCardDeleted',
  'list:created': 'onListCreated',
  'list:updated': 'onListUpdated',
  'list:deleted': 'onListDeleted',
  'list:reordered': 'onListReordered',
  'comment:created': 'onCommentCreated',
  'comment:deleted': 'onCommentDeleted',
  'member:typing': 'onMemberTyping',
};

/**
 * Hook for Socket.IO real-time collaboration on a board.
 *
 * @param {string|null} boardId - The board to join. Connection is skipped if null.
 * @param {object} handlers - Event handler callbacks (e.g. { onCardCreated, onCardDeleted, ... })
 * @returns {{ onlineUsers: Array, isConnected: boolean }}
 */
const useSocket = (boardId, handlers = {}) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef(handlers);

  // Keep the handlers ref up to date on every render to avoid stale closures
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!boardId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Strip the /api suffix so the socket connects to the base server URL,
    // not the REST API path (e.g. http://localhost:5000 not http://localhost:5000/api)
    const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
    const serverUrl = apiUrl.replace(/\/api\/?$/, '');

    const socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('board:join', { boardId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('user:joined', (data) => {
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.userId === data.userId)) return prev;
        return [...prev, data];
      });
    });

    socket.on('user:left', (data) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    // Register all domain event handlers via the ref to prevent stale closures
    Object.entries(EVENT_HANDLER_MAP).forEach(([event, handlerName]) => {
      socket.on(event, (data) => {
        handlersRef.current[handlerName]?.(data);
      });
    });

    return () => {
      socket.emit('board:leave', { boardId });
      socket.disconnect();
      setIsConnected(false);
    };
  }, [boardId]);

  return { onlineUsers, isConnected };
};

export default useSocket;
