import { createServer } from 'http';
import { io as ioc } from 'socket.io-client';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { initSocket } from '../index.js';
import User from '../../models/User.js';

let mongoServer;
let httpServer;
let port;
let testUser;
let authToken;

// Helper: create a socket.io-client connected to the test server
const connectSocket = (token) => {
  return ioc(`http://localhost:${port}`, {
    auth: token !== undefined ? { token } : {},
    transports: ['websocket'],
    autoConnect: false,
    reconnection: false,
  });
};

// Helper: wait for a socket event with optional timeout
const waitForEvent = (socket, event, timeout = 3000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for "${event}"`)),
      timeout
    );
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

// Helper: connect socket and wait for 'connect' event
const connectAndWait = (socket) =>
  new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
    socket.connect();
  });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.JWT_SECRET = 'test_secret_key';

  testUser = await User.create({
    username: 'socketuser',
    email: 'socket@example.com',
    password: 'password123',
  });

  authToken = jwt.sign(
    { id: testUser._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  httpServer = createServer();
  initSocket(httpServer);
  await new Promise((resolve) => httpServer.listen(0, resolve));
  port = httpServer.address().port;
}, 30000);

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
  await mongoose.disconnect();
  await mongoServer.stop();
  delete process.env.JWT_SECRET;
});

// ============================================================
// Authentication tests
// ============================================================
describe('Socket.IO Authentication', () => {
  it('should reject connection without token', (done) => {
    const socket = connectSocket(undefined);
    socket.on('connect_error', (err) => {
      expect(err.message).toContain('Authentication error');
      socket.disconnect();
      done();
    });
    socket.connect();
  });

  it('should reject connection with invalid token', (done) => {
    const socket = connectSocket('invalid-token-xyz');
    socket.on('connect_error', (err) => {
      expect(err.message).toContain('Authentication error');
      socket.disconnect();
      done();
    });
    socket.connect();
  });

  it('should accept connection with valid JWT', (done) => {
    const socket = connectSocket(authToken);
    socket.on('connect', () => {
      expect(socket.connected).toBe(true);
      socket.disconnect();
      done();
    });
    socket.on('connect_error', done);
    socket.connect();
  });
});

// ============================================================
// Room management tests
// ============================================================
describe('Socket.IO board:join / board:leave', () => {
  const boardId = 'board-room-test';
  let socket1;
  let socket2;

  beforeEach(async () => {
    socket1 = connectSocket(authToken);
    socket2 = connectSocket(authToken);
    await Promise.all([connectAndWait(socket1), connectAndWait(socket2)]);
  });

  afterEach(() => {
    socket1.disconnect();
    socket2.disconnect();
  });

  it('should emit user:joined to other board members when a user joins', (done) => {
    // socket1 joins the board first
    socket1.emit('board:join', { boardId });

    // After a small delay, socket2 joins → socket1 receives user:joined
    setTimeout(() => {
      socket1.once('user:joined', (data) => {
        expect(data.userId).toBe(testUser._id.toString());
        expect(data.username).toBe('socketuser');
        done();
      });
      socket2.emit('board:join', { boardId });
    }, 100);
  });

  it('should emit user:left to other board members when a user leaves', (done) => {
    // Both join the board
    socket1.emit('board:join', { boardId });
    socket2.emit('board:join', { boardId });

    setTimeout(() => {
      socket1.once('user:left', (data) => {
        expect(data.username).toBe('socketuser');
        done();
      });
      socket2.emit('board:leave', { boardId });
    }, 100);
  });

  it('should emit user:left to board members on disconnect', (done) => {
    socket1.emit('board:join', { boardId });
    socket2.emit('board:join', { boardId });

    setTimeout(() => {
      socket1.once('user:left', (data) => {
        expect(data.username).toBe('socketuser');
        done();
      });
      socket2.disconnect();
    }, 100);
  });
});

// ============================================================
// member:typing relay tests
// ============================================================
describe('Socket.IO member:typing relay', () => {
  const boardId = 'board-typing-test';
  let socket1;
  let socket2;

  beforeEach(async () => {
    socket1 = connectSocket(authToken);
    socket2 = connectSocket(authToken);
    await Promise.all([connectAndWait(socket1), connectAndWait(socket2)]);
    // Both join the board
    socket1.emit('board:join', { boardId });
    socket2.emit('board:join', { boardId });
    // Wait for room joins to propagate
    await new Promise((r) => setTimeout(r, 100));
  });

  afterEach(() => {
    socket1.disconnect();
    socket2.disconnect();
  });

  it('should relay member:typing to other board members', (done) => {
    const typingData = {
      userId: testUser._id.toString(),
      username: 'socketuser',
      cardId: 'card-abc',
      isTyping: true,
      boardId,
    };

    socket1.once('member:typing', (data) => {
      expect(data.isTyping).toBe(true);
      expect(data.cardId).toBe('card-abc');
      expect(data.username).toBe('socketuser');
      done();
    });

    socket2.emit('member:typing', typingData);
  });

  it('should not relay member:typing back to the sender', (done) => {
    const typingData = {
      userId: testUser._id.toString(),
      username: 'socketuser',
      cardId: 'card-xyz',
      isTyping: false,
      boardId,
    };

    let receivedBySender = false;
    socket2.on('member:typing', () => {
      receivedBySender = true;
    });

    socket1.once('member:typing', () => {
      // socket2 should NOT have received this
      expect(receivedBySender).toBe(false);
      done();
    });

    socket2.emit('member:typing', typingData);
  });
});
