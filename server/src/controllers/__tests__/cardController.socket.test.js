/**
 * Socket.IO emission tests for cardController.
 * Uses jest.unstable_mockModule + dynamic imports (required for ESM mocking).
 */
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from '@jest/globals';
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
const { listCardRouter, cardRouter } =
  await import('../../routes/cardRoutes.js');
const { default: auth } = await import('../../middlewares/auth.js');
const { default: errorHandler } =
  await import('../../middlewares/errorHandler.js');
const { default: User } = await import('../../models/User.js');
const { default: Workspace } = await import('../../models/Workspace.js');
const { default: Board } = await import('../../models/Board.js');
const { default: List } = await import('../../models/List.js');
const { default: Card } = await import('../../models/Card.js');

const app = express();
app.use(express.json());
app.use('/api/lists/:listId/cards', auth, listCardRouter);
app.use('/api/cards', auth, cardRouter);
app.use(errorHandler);

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Card Controller — Socket.IO emissions', () => {
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
      username: 'sockettest',
      email: 'sockettest@example.com',
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
    // Ensure getIO returns the mock object
    mockGetIO.mockReturnValue({ to: mockToFn });
    mockToFn.mockReturnValue({ emit: mockEmitFn });
  });

  afterEach(async () => {
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should emit card:created after creating a card', async () => {
    const res = await request(app)
      .post(`/api/lists/${testList._id}/cards`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'New Socket Card' });

    expect(res.status).toBe(201);
    expect(mockEmitFn).toHaveBeenCalledWith(
      'card:created',
      expect.objectContaining({
        card: expect.objectContaining({ title: 'New Socket Card' }),
        listId: testList._id.toString(),
      })
    );
  });

  it('should emit card:updated after updating a card', async () => {
    const res = await request(app)
      .put(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(mockEmitFn).toHaveBeenCalledWith(
      'card:updated',
      expect.objectContaining({
        card: expect.objectContaining({ title: 'Updated Title' }),
      })
    );
  });

  it('should emit card:deleted after deleting a card', async () => {
    const res = await request(app)
      .delete(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(mockEmitFn).toHaveBeenCalledWith(
      'card:deleted',
      expect.objectContaining({
        cardId: testCard._id.toString(),
        listId: testList._id,
        boardId: testBoard._id,
      })
    );
  });

  it('should emit card:moved after reordering a card within same list', async () => {
    await Card.create({
      title: 'Card 2',
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 1,
    });

    const res = await request(app)
      .put(`/api/cards/${testCard._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 1 });

    expect(res.status).toBe(200);
    expect(mockEmitFn).toHaveBeenCalledWith(
      'card:moved',
      expect.objectContaining({
        card: expect.objectContaining({ _id: testCard._id }),
        fromListId: testList._id.toString(),
      })
    );
  });

  it('should not throw when getIO returns null (no socket server)', async () => {
    mockGetIO.mockReturnValue(null);

    const res = await request(app)
      .post(`/api/lists/${testList._id}/cards`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Card Without Socket' });

    expect(res.status).toBe(201);
    // No error should have been thrown
  });
});
