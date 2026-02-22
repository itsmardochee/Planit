/**
 * Socket.IO emission tests for commentController.
 * Uses jest.unstable_mockModule + dynamic imports (required for ESM mocking).
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// ─── Mock socket module BEFORE any dynamic imports of controllers ─────────────
const mockEmitFn = jest.fn();
const mockToFn = jest.fn(() => ({ emit: mockEmitFn }));
const mockGetIO = jest.fn(() => ({ to: mockToFn }));

jest.unstable_mockModule('../../socket/index.js', () => ({
  getIO: mockGetIO,
  initSocket: jest.fn(),
}));

// ─── Dynamic imports (after mock is registered) ───────────────────────────────
const { cardCommentRouter, commentRouter } = await import('../../routes/commentRoutes.js');
const { default: auth } = await import('../../middlewares/auth.js');
const { default: errorHandler } = await import('../../middlewares/errorHandler.js');
const { default: User } = await import('../../models/User.js');
const { default: Workspace } = await import('../../models/Workspace.js');
const { default: Board } = await import('../../models/Board.js');
const { default: List } = await import('../../models/List.js');
const { default: Card } = await import('../../models/Card.js');
const { default: Comment } = await import('../../models/Comment.js');

const app = express();
app.use(express.json());
app.use('/api/cards/:cardId/comments', auth, cardCommentRouter);
app.use('/api/comments', auth, commentRouter);
app.use(errorHandler);

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Comment Controller — Socket.IO emissions', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let testCard;
  let authToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    process.env.JWT_SECRET = 'test_secret_key';
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    testUser = await User.create({
      username: 'sockettestcomment',
      email: 'sockettestcomment@example.com',
      password: 'password123',
    });
    testWorkspace = await Workspace.create({
      name: 'Socket Workspace',
      userId: testUser._id,
    });
    testBoard = await Board.create({
      name: 'Socket Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });
    testList = await List.create({
      name: 'Socket List',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 0,
    });
    testCard = await Card.create({
      title: 'Socket Card',
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 0,
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Reset mocks before each test
    mockEmitFn.mockClear();
    mockToFn.mockClear();
    mockGetIO.mockClear();
    mockGetIO.mockReturnValue({ to: mockToFn });
    mockToFn.mockReturnValue({ emit: mockEmitFn });
  });

  afterEach(async () => {
    await Comment.deleteMany({});
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should emit comment:created after creating a comment', async () => {
    const res = await request(app)
      .post(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Hello socket world' });

    expect(res.status).toBe(201);
    expect(mockEmitFn).toHaveBeenCalledWith(
      'comment:created',
      expect.objectContaining({
        comment: expect.objectContaining({ content: 'Hello socket world' }),
        cardId: testCard._id.toString(),
      })
    );
  });

  it('should emit comment:deleted after deleting a comment', async () => {
    const comment = await Comment.create({
      content: 'To be deleted',
      cardId: testCard._id,
      userId: testUser._id,
    });

    const res = await request(app)
      .delete(`/api/comments/${comment._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(mockEmitFn).toHaveBeenCalledWith(
      'comment:deleted',
      expect.objectContaining({
        commentId: comment._id.toString(),
        cardId: testCard._id,
      })
    );
  });

  it('should not throw when getIO returns null (no socket server)', async () => {
    mockGetIO.mockReturnValue(null);

    const res = await request(app)
      .post(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Comment without socket' });

    expect(res.status).toBe(201);
  });
});
