import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { listCardRouter, cardRouter } from '../../routes/cardRoutes.js';
import auth from '../../middlewares/auth.js';
import User from '../../models/User.js';
import Workspace from '../../models/Workspace.js';
import Board from '../../models/Board.js';
import List from '../../models/List.js';
import Card from '../../models/Card.js';

const app = express();
app.use(express.json());
app.use('/api/lists/:listId/cards', auth, listCardRouter);
app.use('/api/cards', auth, cardRouter);

describe('POST /api/lists/:listId/cards', () => {
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
      name: 'Test List',
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
  });

  afterEach(async () => {
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Input Validation', () => {
    it('should fail when title is missing', async () => {
      const res = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Some description' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail when title exceeds 200 characters', async () => {
      const res = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'a'.repeat(201) });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail when description exceeds 2000 characters', async () => {
      const res = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Card', description: 'a'.repeat(2001) });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail when position is negative or non-integer', async () => {
      const res1 = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Card', position: -1 });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Card', position: 1.5 });
      expect(res2.status).toBe(400);
    });

    it('should accept valid input with title only (position defaults)', async () => {
      const res = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Card' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Card');
      expect(res.body.data.position).toBe(0);
    });

    it('should accept valid input with title, description and position', async () => {
      const res = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Card', description: 'Description', position: 3 });
      expect(res.status).toBe(201);
      expect(res.body.data.description).toBe('Description');
      expect(res.body.data.position).toBe(3);
    });
  });

  describe('Authentication and List Validation', () => {
    it('should fail without authentication token', async () => {
      const res = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .send({ title: 'Test Card' });
      expect(res.status).toBe(401);
    });

    it('should fail with invalid list id format', async () => {
      const res = await request(app)
        .post('/api/lists/invalid-id/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Card' });
      expect(res.status).toBe(400);
    });

    it('should fail when list does not exist', async () => {
      const fakeListId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/lists/${fakeListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Card' });
      expect(res.status).toBe(404);
    });

    it('should fail when user does not own the list', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123',
      });
      const otherToken = jwt.sign(
        { id: otherUser._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const res = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Test Card' });
      expect(res.status).toBe(403);
    });
  });

  describe('Position Management', () => {
    it('should auto-increment position when not provided', async () => {
      await Card.create({
        title: 'Card 1',
        listId: testList._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 0,
      });

      const res = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Card 2' });

      expect(res.status).toBe(201);
      expect(res.body.data.position).toBe(1);
    });

    it('should use provided position even if other cards exist', async () => {
      await Card.create({
        title: 'Card 1',
        listId: testList._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 0,
      });

      const res = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Card 2', position: 5 });

      expect(res.status).toBe(201);
      expect(res.body.data.position).toBe(5);
    });
  });

  describe('Card Data Integrity', () => {
    it('should trim whitespace from title and description', async () => {
      const res = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '  Test Card  ', description: '  Test Description  ' });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Test Card');
      expect(res.body.data.description).toBe('Test Description');
    });

    it('should store correct references (listId, boardId, userId)', async () => {
      const res = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Card' });

      expect(res.status).toBe(201);
      expect(res.body.data.listId).toBe(testList._id.toString());
      expect(res.body.data.boardId).toBe(testBoard._id.toString());
      expect(res.body.data.userId).toBe(testUser._id.toString());
    });

    it('should include timestamps (createdAt, updatedAt)', async () => {
      const res = await request(app)
        .post(`/api/lists/${testList._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Card' });

      expect(res.status).toBe(201);
      expect(res.body.data.createdAt).toBeDefined();
      expect(res.body.data.updatedAt).toBeDefined();
    });
  });
});

describe('GET /api/lists/:listId/cards', () => {
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
      name: 'Test List',
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
  });

  afterEach(async () => {
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should return empty array when list has no cards', async () => {
    const res = await request(app)
      .get(`/api/lists/${testList._id}/cards`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('should return all cards for a list sorted by position', async () => {
    await Card.create([
      {
        title: 'Card 3',
        listId: testList._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 2,
      },
      {
        title: 'Card 1',
        listId: testList._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 0,
      },
      {
        title: 'Card 2',
        listId: testList._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 1,
      },
    ]);

    const res = await request(app)
      .get(`/api/lists/${testList._id}/cards`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].title).toBe('Card 1');
    expect(res.body.data[1].title).toBe('Card 2');
    expect(res.body.data[2].title).toBe('Card 3');
  });

  it('should only return cards for the specified list', async () => {
    const otherList = await List.create({
      name: 'Other List',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 1,
    });

    await Card.create({
      title: 'Card in Test List',
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 0,
    });

    await Card.create({
      title: 'Card in Other List',
      listId: otherList._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 0,
    });

    const res = await request(app)
      .get(`/api/lists/${testList._id}/cards`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Card in Test List');
  });

  it('should fail with invalid list id format', async () => {
    const res = await request(app)
      .get('/api/lists/invalid-id/cards')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
  });

  it('should fail when list does not exist', async () => {
    const fakeListId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/lists/${fakeListId}/cards`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  it('should fail when user does not own the list', async () => {
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = jwt.sign(
      { id: otherUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .get(`/api/lists/${testList._id}/cards`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/cards/:id', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let testCard;
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
      name: 'Test List',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 0,
    });
    testCard = await Card.create({
      title: 'Test Card',
      description: 'Test Description',
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
  });

  afterEach(async () => {
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should return card by id', async () => {
    const res = await request(app)
      .get(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Card');
    expect(res.body.data.description).toBe('Test Description');
  });

  it('should fail with invalid card id format', async () => {
    const res = await request(app)
      .get('/api/cards/invalid-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
  });

  it('should fail when card does not exist', async () => {
    const fakeCardId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/cards/${fakeCardId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  it('should fail when user does not own the card', async () => {
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = jwt.sign(
      { id: otherUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .get(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/cards/:id', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let testCard;
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
      name: 'Test List',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 0,
    });
    testCard = await Card.create({
      title: 'Original Title',
      description: 'Original Description',
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
  });

  afterEach(async () => {
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should update card title', async () => {
    const res = await request(app)
      .put(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('should update card description', async () => {
    const res = await request(app)
      .put(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'Updated Description' });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated Description');
  });

  it('should update multiple fields at once', async () => {
    const res = await request(app)
      .put(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'New Title', description: 'New Description' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('New Title');
    expect(res.body.data.description).toBe('New Description');
  });

  it('should fail when title exceeds 200 characters', async () => {
    const res = await request(app)
      .put(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'a'.repeat(201) });

    expect(res.status).toBe(400);
  });

  it('should fail when description exceeds 2000 characters', async () => {
    const res = await request(app)
      .put(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'a'.repeat(2001) });

    expect(res.status).toBe(400);
  });

  it('should trim whitespace from updated values', async () => {
    const res = await request(app)
      .put(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: '  Trimmed Title  ' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Trimmed Title');
  });

  it('should fail with invalid card id format', async () => {
    const res = await request(app)
      .put('/api/cards/invalid-id')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(400);
  });

  it('should fail when card does not exist', async () => {
    const fakeCardId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/cards/${fakeCardId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(404);
  });

  it('should fail when user does not own the card', async () => {
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = jwt.sign(
      { id: otherUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .put(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(403);
  });

  it('should not allow updating position via PUT (use reorder endpoint)', async () => {
    const res = await request(app)
      .put(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 5 });

    expect(res.status).toBe(200);
    // Position should remain unchanged
    expect(res.body.data.position).toBe(0);
  });
});

describe('DELETE /api/cards/:id', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let testCard;
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
      name: 'Test List',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 0,
    });
    testCard = await Card.create({
      title: 'Card to Delete',
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
  });

  afterEach(async () => {
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should delete card successfully', async () => {
    const res = await request(app)
      .delete(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);

    const deletedCard = await Card.findById(testCard._id);
    expect(deletedCard).toBeNull();
  });

  it('should adjust positions of remaining cards after deletion', async () => {
    await Card.create([
      {
        title: 'Card 1',
        listId: testList._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 1,
      },
      {
        title: 'Card 2',
        listId: testList._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 2,
      },
    ]);

    // Delete card at position 0
    await request(app)
      .delete(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    const remainingCards = await Card.find({ listId: testList._id }).sort({
      position: 1,
    });

    expect(remainingCards).toHaveLength(2);
    expect(remainingCards[0].position).toBe(0);
    expect(remainingCards[1].position).toBe(1);
  });

  it('should fail with invalid card id format', async () => {
    const res = await request(app)
      .delete('/api/cards/invalid-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
  });

  it('should fail when card does not exist', async () => {
    const fakeCardId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/cards/${fakeCardId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  it('should fail when user does not own the card', async () => {
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = jwt.sign(
      { id: otherUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .delete(`/api/cards/${testCard._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/cards/:id/reorder', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let cards;
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
      name: 'Test List',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 0,
    });

    cards = await Card.create([
      {
        title: 'Card 0',
        listId: testList._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 0,
      },
      {
        title: 'Card 1',
        listId: testList._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 1,
      },
      {
        title: 'Card 2',
        listId: testList._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 2,
      },
    ]);

    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should reorder card to a new position', async () => {
    const res = await request(app)
      .put(`/api/cards/${cards[0]._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 2 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const reorderedCards = await Card.find({ listId: testList._id }).sort({
      position: 1,
    });

    expect(reorderedCards[0].title).toBe('Card 1');
    expect(reorderedCards[1].title).toBe('Card 2');
    expect(reorderedCards[2].title).toBe('Card 0');
  });

  it('should fail when position is missing', async () => {
    const res = await request(app)
      .put(`/api/cards/${cards[0]._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('should fail when position is negative', async () => {
    const res = await request(app)
      .put(`/api/cards/${cards[0]._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: -1 });

    expect(res.status).toBe(400);
  });

  it('should fail when position is not an integer', async () => {
    const res = await request(app)
      .put(`/api/cards/${cards[0]._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 1.5 });

    expect(res.status).toBe(400);
  });

  it('should handle moving card down (increasing position)', async () => {
    const res = await request(app)
      .put(`/api/cards/${cards[0]._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 1 });

    expect(res.status).toBe(200);

    const reorderedCards = await Card.find({ listId: testList._id }).sort({
      position: 1,
    });

    expect(reorderedCards[0].title).toBe('Card 1');
    expect(reorderedCards[1].title).toBe('Card 0');
    expect(reorderedCards[2].title).toBe('Card 2');
  });

  it('should handle moving card up (decreasing position)', async () => {
    const res = await request(app)
      .put(`/api/cards/${cards[2]._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 0 });

    expect(res.status).toBe(200);

    const reorderedCards = await Card.find({ listId: testList._id }).sort({
      position: 1,
    });

    expect(reorderedCards[0].title).toBe('Card 2');
    expect(reorderedCards[1].title).toBe('Card 0');
    expect(reorderedCards[2].title).toBe('Card 1');
  });

  it('should fail with invalid card id format', async () => {
    const res = await request(app)
      .put('/api/cards/invalid-id/reorder')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 1 });

    expect(res.status).toBe(400);
  });

  it('should fail when card does not exist', async () => {
    const fakeCardId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/cards/${fakeCardId}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 1 });

    expect(res.status).toBe(404);
  });

  it('should fail when user does not own the card', async () => {
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = jwt.sign(
      { id: otherUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .put(`/api/cards/${cards[0]._id}/reorder`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ position: 1 });

    expect(res.status).toBe(403);
  });

  it('should move card to another list', async () => {
    // Create a second list
    const secondList = await List.create({
      name: 'Second List',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 1,
    });

    // Create cards in second list
    await Card.create([
      {
        title: 'Card in List 2 - 0',
        listId: secondList._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 0,
      },
      {
        title: 'Card in List 2 - 1',
        listId: secondList._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 1,
      },
    ]);

    // Move Card 0 from testList to secondList at position 1
    const res = await request(app)
      .put(`/api/cards/${cards[0]._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 1, listId: secondList._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Check source list - Card 0 should be removed
    const sourceCards = await Card.find({ listId: testList._id }).sort({
      position: 1,
    });
    expect(sourceCards.length).toBe(2);
    expect(sourceCards[0].title).toBe('Card 1');
    expect(sourceCards[1].title).toBe('Card 2');

    // Check destination list - Card 0 should be at position 1
    const destCards = await Card.find({ listId: secondList._id }).sort({
      position: 1,
    });
    expect(destCards.length).toBe(3);
    expect(destCards[0].title).toBe('Card in List 2 - 0');
    expect(destCards[1].title).toBe('Card 0');
    expect(destCards[2].title).toBe('Card in List 2 - 1');

    // Verify the moved card has the correct listId
    const movedCard = await Card.findById(cards[0]._id);
    expect(movedCard.listId.toString()).toBe(secondList._id.toString());
  });

  it('should move card to empty list', async () => {
    const emptyList = await List.create({
      name: 'Empty List',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 1,
    });

    const res = await request(app)
      .put(`/api/cards/${cards[0]._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 0, listId: emptyList._id.toString() });

    expect(res.status).toBe(200);

    // Check card is in the new list
    const movedCard = await Card.findById(cards[0]._id);
    expect(movedCard.listId.toString()).toBe(emptyList._id.toString());
    expect(movedCard.position).toBe(0);

    // Check source list
    const sourceCards = await Card.find({ listId: testList._id }).sort({
      position: 1,
    });
    expect(sourceCards.length).toBe(2);
  });

  it('should fail when moving to non-existent list', async () => {
    const fakeListId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/cards/${cards[0]._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 0, listId: fakeListId.toString() });

    expect(res.status).toBe(404);
  });

  it('should fail when moving to list owned by another user', async () => {
    const otherUser = await User.create({
      username: 'otheruser2',
      email: 'other2@example.com',
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
      workspaceId: otherWorkspace._id,
      boardId: otherBoard._id,
      userId: otherUser._id,
      position: 0,
    });

    const res = await request(app)
      .put(`/api/cards/${cards[0]._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 0, listId: otherList._id.toString() });

    expect(res.status).toBe(403);
  });

  it('should fail with invalid listId format', async () => {
    const res = await request(app)
      .put(`/api/cards/${cards[0]._id}/reorder`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 0, listId: 'invalid-id' });

    expect(res.status).toBe(400);
  });
});
