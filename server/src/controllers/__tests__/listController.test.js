import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { boardListRouter, listRouter } from '../../routes/listRoutes.js';
import auth from '../../middlewares/auth.js';
import User from '../../models/User.js';
import Workspace from '../../models/Workspace.js';
import Board from '../../models/Board.js';
import List from '../../models/List.js';

const app = express();
app.use(express.json());
app.use('/api/boards/:boardId/lists', auth, boardListRouter);
app.use('/api/lists', auth, listRouter);

describe('POST /api/boards/:boardId/lists', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let authToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    process.env.JWT_SECRET = 'test_secret_key';
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      userId: testUser._id,
    });
    testBoard = await Board.create({
      name: 'Test Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Input Validation', () => {
    it('should fail when name is missing', async () => {
      const res = await request(app)
        .post(`/api/boards/${testBoard._id}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Tasks' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail when name exceeds 100 characters', async () => {
      const res = await request(app)
        .post(`/api/boards/${testBoard._id}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'a'.repeat(101) });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail when description exceeds 500 characters', async () => {
      const res = await request(app)
        .post(`/api/boards/${testBoard._id}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Todo', description: 'a'.repeat(501) });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail when position is negative or non-integer', async () => {
      const res1 = await request(app)
        .post(`/api/boards/${testBoard._id}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Todo', position: -1 });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post(`/api/boards/${testBoard._id}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Todo', position: 1.5 });
      expect(res2.status).toBe(400);
    });

    it('should accept valid input with name only (position defaults)', async () => {
      const res = await request(app)
        .post(`/api/boards/${testBoard._id}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Todo' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Todo');
      expect(res.body.data.position).toBe(0);
    });

    it('should accept valid input with name, description and position', async () => {
      const res = await request(app)
        .post(`/api/boards/${testBoard._id}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Todo', description: 'Tasks', position: 3 });
      expect(res.status).toBe(201);
      expect(res.body.data.description).toBe('Tasks');
      expect(res.body.data.position).toBe(3);
    });
  });

  describe('Authentication and Board Validation', () => {
    it('should fail without authentication token', async () => {
      const res = await request(app)
        .post(`/api/boards/${testBoard._id}/lists`)
        .send({ name: 'Todo' });
      expect(res.status).toBe(401);
    });

    it('should fail with invalid board id format', async () => {
      const res = await request(app)
        .post('/api/boards/invalid-id/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Todo' });
      expect(res.status).toBe(400);
    });

    it('should fail when board does not exist', async () => {
      const fakeBoardId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/boards/${fakeBoardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Todo' });
      expect(res.status).toBe(404);
    });

    it('should fail when board is owned by another user', async () => {
      const otherUser = await User.create({
        username: 'other',
        email: 'other@example.com',
        password: 'password123',
      });
      const otherWorkspace = await Workspace.create({
        name: 'W',
        userId: otherUser._id,
      });
      const otherBoard = await Board.create({
        name: 'B',
        workspaceId: otherWorkspace._id,
        userId: otherUser._id,
      });
      const res = await request(app)
        .post(`/api/boards/${otherBoard._id}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Todo' });
      expect(res.status).toBe(403);
    });
  });

  describe('List Creation behavior', () => {
    it('should trim whitespace from name and description', async () => {
      const res = await request(app)
        .post(`/api/boards/${testBoard._id}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '  Todo  ', description: '  Tasks  ' });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Todo');
      expect(res.body.data.description).toBe('Tasks');
    });

    it('should append position when not provided based on existing lists', async () => {
      await List.create({
        name: 'A',
        workspaceId: testWorkspace._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 0,
      });
      await List.create({
        name: 'B',
        workspaceId: testWorkspace._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 5,
      });
      const res = await request(app)
        .post(`/api/boards/${testBoard._id}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'C' });
      expect(res.status).toBe(201);
      expect(res.body.data.position).toBe(6);
    });
  });
});

describe('GET /api/boards/:boardId/lists', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let authToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    process.env.JWT_SECRET = 'test_secret_key';
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      userId: testUser._id,
    });
    testBoard = await Board.create({
      name: 'Test Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should fail without authentication', async () => {
    const res = await request(app).get(`/api/boards/${testBoard._id}/lists`);
    expect(res.status).toBe(401);
  });

  it('should return empty array when no lists', async () => {
    const res = await request(app)
      .get(`/api/boards/${testBoard._id}/lists`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return lists sorted by position', async () => {
    await List.create({
      name: 'C',
      position: 2,
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });
    await List.create({
      name: 'A',
      position: 0,
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });
    await List.create({
      name: 'B',
      position: 1,
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    const res = await request(app)
      .get(`/api/boards/${testBoard._id}/lists`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map(l => l.name)).toEqual(['A', 'B', 'C']);
  });

  it('should fail when board owned by another user', async () => {
    const otherUser = await User.create({
      username: 'other',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherWorkspace = await Workspace.create({
      name: 'W',
      userId: otherUser._id,
    });
    const otherBoard = await Board.create({
      name: 'B',
      workspaceId: otherWorkspace._id,
      userId: otherUser._id,
    });

    const res = await request(app)
      .get(`/api/boards/${otherBoard._id}/lists`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/lists/:id', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let authToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    process.env.JWT_SECRET = 'test_secret_key';
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      userId: testUser._id,
    });
    testBoard = await Board.create({
      name: 'Test Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });
    testList = await List.create({
      name: 'Todo',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should fail without authentication', async () => {
    const res = await request(app).get(`/api/lists/${testList._id}`);
    expect(res.status).toBe(401);
  });

  it('should return list by id', async () => {
    const res = await request(app)
      .get(`/api/lists/${testList._id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id.toString()).toBe(testList._id.toString());
  });

  it('should fail with invalid list id format', async () => {
    const res = await request(app)
      .get('/api/lists/invalid-id')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(400);
  });

  it('should fail when accessing list owned by another user', async () => {
    const otherUser = await User.create({
      username: 'other',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherWorkspace = await Workspace.create({
      name: 'W',
      userId: otherUser._id,
    });
    const otherBoard = await Board.create({
      name: 'B',
      workspaceId: otherWorkspace._id,
      userId: otherUser._id,
    });
    const otherList = await List.create({
      name: 'X',
      workspaceId: otherWorkspace._id,
      boardId: otherBoard._id,
      userId: otherUser._id,
    });

    const res = await request(app)
      .get(`/api/lists/${otherList._id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/lists/:id', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let authToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    process.env.JWT_SECRET = 'test_secret_key';
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      userId: testUser._id,
    });
    testBoard = await Board.create({
      name: 'Test Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });
    testList = await List.create({
      name: 'Todo',
      description: 'Tasks',
      position: 0,
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should fail without authentication', async () => {
    const res = await request(app)
      .put(`/api/lists/${testList._id}`)
      .send({ name: 'New' });
    expect(res.status).toBe(401);
  });

  it('should fail when name exceeds 100 characters', async () => {
    const res = await request(app)
      .put(`/api/lists/${testList._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'a'.repeat(101) });
    expect(res.status).toBe(400);
  });

  it('should fail when description exceeds 500 characters', async () => {
    const res = await request(app)
      .put(`/api/lists/${testList._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'a'.repeat(501) });
    expect(res.status).toBe(400);
  });

  it('should fail when position invalid', async () => {
    const res = await request(app)
      .put(`/api/lists/${testList._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: -2 });
    expect(res.status).toBe(400);
  });

  it('should update name', async () => {
    const res = await request(app)
      .put(`/api/lists/${testList._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Doing' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Doing');
    expect(res.body.data.description).toBe('Tasks');
  });

  it('should update description', async () => {
    const res = await request(app)
      .put(`/api/lists/${testList._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated');
  });

  it('should update position', async () => {
    const res = await request(app)
      .put(`/api/lists/${testList._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 3 });
    expect(res.status).toBe(200);
    expect(res.body.data.position).toBe(3);
  });

  it('should fail with invalid list id format', async () => {
    const res = await request(app)
      .put('/api/lists/invalid-id')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'X' });
    expect(res.status).toBe(400);
  });

  it('should fail when updating list owned by another user', async () => {
    const otherUser = await User.create({
      username: 'other',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherWorkspace = await Workspace.create({
      name: 'W',
      userId: otherUser._id,
    });
    const otherBoard = await Board.create({
      name: 'B',
      workspaceId: otherWorkspace._id,
      userId: otherUser._id,
    });
    const otherList = await List.create({
      name: 'X',
      workspaceId: otherWorkspace._id,
      boardId: otherBoard._id,
      userId: otherUser._id,
    });

    const res = await request(app)
      .put(`/api/lists/${otherList._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'New' });
    expect(res.status).toBe(403);
  });

  it('should update updatedAt timestamp', async () => {
    const original = await List.findById(testList._id);
    const originalUpdatedAt = original.updatedAt;
    await new Promise(r => setTimeout(r, 100));

    const res = await request(app)
      .put(`/api/lists/${testList._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'New' });

    expect(res.status).toBe(200);
    expect(new Date(res.body.data.updatedAt).getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    );
  });
});

describe('DELETE /api/lists/:id', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let authToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    process.env.JWT_SECRET = 'test_secret_key';
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      userId: testUser._id,
    });
    testBoard = await Board.create({
      name: 'Test Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });
    testList = await List.create({
      name: 'Todo',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should fail without authentication', async () => {
    const res = await request(app).delete(`/api/lists/${testList._id}`);
    expect(res.status).toBe(401);
  });

  it('should delete list by id', async () => {
    const res = await request(app)
      .delete(`/api/lists/${testList._id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deleted = await List.findById(testList._id);
    expect(deleted).toBeNull();
  });

  it('should fail with invalid list id format', async () => {
    const res = await request(app)
      .delete('/api/lists/invalid-id')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(400);
  });

  it('should fail when deleting list owned by another user', async () => {
    const otherUser = await User.create({
      username: 'other',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherWorkspace = await Workspace.create({
      name: 'W',
      userId: otherUser._id,
    });
    const otherBoard = await Board.create({
      name: 'B',
      workspaceId: otherWorkspace._id,
      userId: otherUser._id,
    });
    const otherList = await List.create({
      name: 'X',
      workspaceId: otherWorkspace._id,
      boardId: otherBoard._id,
      userId: otherUser._id,
    });

    const res = await request(app)
      .delete(`/api/lists/${otherList._id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/lists/:id/reorder', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let list1, list2, list3;
  let authToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    process.env.JWT_SECRET = 'test_secret_key';
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      userId: testUser._id,
    });
    testBoard = await Board.create({
      name: 'Test Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });
    list1 = await List.create({
      name: 'List 1',
      position: 0,
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });
    list2 = await List.create({
      name: 'List 2',
      position: 1,
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });
    list3 = await List.create({
      name: 'List 3',
      position: 2,
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Authentication', () => {
    it('should fail without authentication token', async () => {
      const res = await request(app)
        .put(`/api/lists/${list1._id}/reorder`)
        .send({ position: 2 });
      expect(res.status).toBe(401);
    });
  });

  describe('Reordering Lists', () => {
    it('should reorder list from position 0 to 2', async () => {
      const res = await request(app)
        .put(`/api/lists/${list1._id}/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.position).toBe(2);

      // Verify other lists were adjusted
      const updatedList2 = await List.findById(list2._id);
      const updatedList3 = await List.findById(list3._id);
      expect(updatedList2.position).toBe(0);
      expect(updatedList3.position).toBe(1);
    });

    it('should reorder list from position 2 to 0', async () => {
      const res = await request(app)
        .put(`/api/lists/${list3._id}/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: 0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.position).toBe(0);

      // Verify other lists were adjusted
      const updatedList1 = await List.findById(list1._id);
      const updatedList2 = await List.findById(list2._id);
      expect(updatedList1.position).toBe(1);
      expect(updatedList2.position).toBe(2);
    });

    it('should handle reordering to same position', async () => {
      const res = await request(app)
        .put(`/api/lists/${list2._id}/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.position).toBe(1);

      // Verify other lists unchanged
      const updatedList1 = await List.findById(list1._id);
      const updatedList3 = await List.findById(list3._id);
      expect(updatedList1.position).toBe(0);
      expect(updatedList3.position).toBe(2);
    });

    it('should fail with missing position', async () => {
      const res = await request(app)
        .put(`/api/lists/${list1._id}/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Position is required');
    });

    it('should fail with negative position', async () => {
      const res = await request(app)
        .put(`/api/lists/${list1._id}/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: -1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('non-negative integer');
    });

    it('should fail with non-integer position', async () => {
      const res = await request(app)
        .put(`/api/lists/${list1._id}/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: 1.5 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('non-negative integer');
    });

    it('should fail with invalid list id format', async () => {
      const res = await request(app)
        .put('/api/lists/invalid-id/reorder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid list ID format');
    });

    it('should fail when list does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/lists/${fakeId}/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: 1 });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('List not found');
    });

    it('should fail when reordering list owned by another user', async () => {
      const otherUser = await User.create({
        username: 'other',
        email: 'other@example.com',
        password: 'password123',
      });
      const otherWorkspace = await Workspace.create({
        name: 'Other Workspace',
        userId: otherUser._id,
      });
      const otherBoard = await Board.create({
        name: 'Other Board',
        workspaceId: otherWorkspace._id,
        userId: otherUser._id,
      });
      const otherList = await List.create({
        name: 'Other List',
        position: 0,
        workspaceId: otherWorkspace._id,
        boardId: otherBoard._id,
        userId: otherUser._id,
      });

      const res = await request(app)
        .put(`/api/lists/${otherList._id}/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: 1 });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Not authorized');
    });
  });
});
