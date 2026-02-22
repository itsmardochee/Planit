import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

let io;

/**
 * Initialize Socket.IO on the given HTTP server.
 * Sets up JWT auth middleware and board room management.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // JWT authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
        return next(new Error('Authentication error: Invalid token'));
      }

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const { username } = socket.user;

    socket.on('board:join', ({ boardId }) => {
      socket.join(`board:${boardId}`);
      socket.to(`board:${boardId}`).emit('user:joined', { userId, username });
    });

    socket.on('board:leave', ({ boardId }) => {
      socket.leave(`board:${boardId}`);
      socket.to(`board:${boardId}`).emit('user:left', { userId, username });
    });

    socket.on('member:typing', (data) => {
      socket.to(`board:${data.boardId}`).emit('member:typing', data);
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('board:')) {
          socket.to(room).emit('user:left', { userId, username });
        }
      }
    });
  });

  return io;
};

/**
 * Returns the Socket.IO server instance (may be undefined if not initialized).
 */
export const getIO = () => io;
