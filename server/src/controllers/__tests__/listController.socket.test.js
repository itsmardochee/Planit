/**
 * Socket.IO emission tests for listController.
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
const { boardListRouter, listRouter } = await import('../../routes/listRoutes.js');
const { default: auth } = await import('../../middlewares/auth.js');
const { default: errorHandler } = await import('../../middlewares/errorHandler.js');
const { default: User } = await import('../../models/User.js');
const { default: Workspace } = await import('../../models/Workspace.js');
const { default: Board } = await import('../../models/Board.js');
const { default: List } = await import('../../models/List.js');

const app = express();
app.use(express.json());
app.use('/api/boards/:boardId/lists', auth, boardListRouter);
app.use('/api/lists', auth, listRouter);
app.use(errorHandler);

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('List Controller — Socket.IO emissions', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
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
      username: 'sockettestlist',
      email: 'sockettestlist@example.com',
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
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should emit list:created after creating a list', async () => {
    const res = await request(app)
      .post(`/api/boards/${testBoard._id}/lists`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'New Socket List' });

    expect(res.status).toBe(201);
    expect(mockEmitFn).toHaveBeenCalledWith(
      'list:created',
      expect.objectContaining({
        list: expect.objectContaining({ name: 'New Socket List' }),
        boardId: testBoard._id.toString(),
      })
    );
  });

  it('should emit list:updated after updating a list', async () => {
    const res = await request(app)
      .put(`/api/lists/${testList._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated List Name' });

    expect(res.status).toBe(200);
    expect(mockEmitFn).toHaveBeenCalledWith(
      'list:updated',
      expect.objectContaining({
        list: expect.objectContaining({ name: 'Updated List Name' }),
      })
    );
  });

  it('should emit list:deleted after deleting a list', async () => {
    const res = await request(app)
      .delete(`/api/lists/${testList._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(mockEmitFn).toHaveBeenCalledWith(
      'list:deleted',
      expect.objectContaining({
        listId: testList._id.toString(),
        boardId: testBoard._id,
      })
    );
  });

  it('should emit list:reordered after reordering a list', async () => {
    await List.create({
      name: 'List 2',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 1,
    });

    const res = await request(app)
      .put(`/api/lists/${testList._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 1 });

    expect(res.status).toBe(200);
    expect(mockEmitFn).toHaveBeenCalledWith(
      'list:reordered',
      expect.objectContaining({
        list: expect.objectContaining({ _id: testList._id }),
        boardId: testBoard._id,
      })
    );
  });

  it('should not throw when getIO returns null (no socket server)', async () => {
    mockGetIO.mockReturnValue(null);

    const res = await request(app)
      .post(`/api/boards/${testBoard._id}/lists`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'List Without Socket' });

    expect(res.status).toBe(201);
  });
});
