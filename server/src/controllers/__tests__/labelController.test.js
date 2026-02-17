import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { boardLabelRouter, labelRouter } from '../../routes/labelRoutes.js';
import { cardRouter } from '../../routes/cardRoutes.js';
import auth from '../../middlewares/auth.js';
import User from '../../models/User.js';
import Workspace from '../../models/Workspace.js';
import Board from '../../models/Board.js';
import List from '../../models/List.js';
import Card from '../../models/Card.js';
import Label from '../../models/Label.js';
import errorHandler from '../../middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/boards/:boardId/labels', auth, boardLabelRouter);
app.use('/api/labels', auth, labelRouter);
app.use('/api/cards', auth, cardRouter);
app.use(errorHandler);

describe('POST /api/boards/:boardId/labels', () => {
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
    await Label.deleteMany({});
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should create a label successfully', async () => {
    const res = await request(app)
      .post(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Bug', color: '#FF0000' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Bug');
    expect(res.body.data.color).toBe('#FF0000');
    expect(res.body.data.boardId).toBe(testBoard._id.toString());
  });

  it('should trim label name', async () => {
    const res = await request(app)
      .post(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '  Bug  ', color: '#FF0000' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Bug');
  });

  it('should fail without authentication token', async () => {
    const res = await request(app)
      .post(`/api/boards/${testBoard._id}/labels`)
      .send({ name: 'Bug', color: '#FF0000' });

    expect(res.status).toBe(401);
  });

  it('should fail when user does not have workspace access', async () => {
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
      .post(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Bug', color: '#FF0000' });

    expect(res.status).toBe(403);
  });

  it('should fail with invalid board ID format', async () => {
    const res = await request(app)
      .post('/api/boards/invalid-id/labels')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Bug', color: '#FF0000' });

    expect(res.status).toBe(400);
  });

  it('should fail when board does not exist', async () => {
    const fakeBoardId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/boards/${fakeBoardId}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Bug', color: '#FF0000' });

    expect(res.status).toBe(404);
  });

  it('should fail when name is missing', async () => {
    const res = await request(app)
      .post(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ color: '#FF0000' });

    expect(res.status).toBe(400);
  });

  it('should fail when name exceeds 50 characters', async () => {
    const res = await request(app)
      .post(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'a'.repeat(51), color: '#FF0000' });

    expect(res.status).toBe(400);
  });

  it('should fail when color is missing', async () => {
    const res = await request(app)
      .post(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Bug' });

    expect(res.status).toBe(400);
  });

  it('should fail with invalid color format', async () => {
    const res = await request(app)
      .post(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Bug', color: 'red' });

    expect(res.status).toBe(400);
  });

  it('should fail with short hex color', async () => {
    const res = await request(app)
      .post(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Bug', color: '#FFF' });

    expect(res.status).toBe(400);
  });

  it('should fail when duplicate name on same board', async () => {
    await Label.create({
      name: 'Bug',
      color: '#FF0000',
      boardId: testBoard._id,
    });

    const res = await request(app)
      .post(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Bug', color: '#00FF00' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already exists');
  });

  it('should allow same name on different boards', async () => {
    const otherBoard = await Board.create({
      name: 'Other Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    await Label.create({
      name: 'Bug',
      color: '#FF0000',
      boardId: testBoard._id,
    });

    const res = await request(app)
      .post(`/api/boards/${otherBoard._id}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Bug', color: '#FF0000' });

    expect(res.status).toBe(201);
  });
});

describe('GET /api/boards/:boardId/labels', () => {
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
    await Label.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should return empty array when board has no labels', async () => {
    const res = await request(app)
      .get(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('should return all labels for a board sorted by name', async () => {
    await Label.create([
      { name: 'Feature', color: '#00FF00', boardId: testBoard._id },
      { name: 'Bug', color: '#FF0000', boardId: testBoard._id },
      { name: 'Enhancement', color: '#0000FF', boardId: testBoard._id },
    ]);

    const res = await request(app)
      .get(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].name).toBe('Bug');
    expect(res.body.data[1].name).toBe('Enhancement');
    expect(res.body.data[2].name).toBe('Feature');
  });

  it('should only return labels for the specified board', async () => {
    const otherBoard = await Board.create({
      name: 'Other Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    await Label.create([
      { name: 'Bug', color: '#FF0000', boardId: testBoard._id },
      { name: 'Feature', color: '#00FF00', boardId: otherBoard._id },
    ]);

    const res = await request(app)
      .get(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Bug');
  });

  it('should fail without authentication', async () => {
    const res = await request(app).get(`/api/boards/${testBoard._id}/labels`);

    expect(res.status).toBe(401);
  });

  it('should fail when user does not have workspace access', async () => {
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
      .get(`/api/boards/${testBoard._id}/labels`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it('should fail when board does not exist', async () => {
    const fakeBoardId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/boards/${fakeBoardId}/labels`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/labels/:id', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testLabel;
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
    testLabel = await Label.create({
      name: 'Bug',
      color: '#FF0000',
      boardId: testBoard._id,
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await Label.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should update label name', async () => {
    const res = await request(app)
      .put(`/api/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Feature' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Feature');
    expect(res.body.data.color).toBe('#FF0000');
  });

  it('should update label color', async () => {
    const res = await request(app)
      .put(`/api/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ color: '#00FF00' });

    expect(res.status).toBe(200);
    expect(res.body.data.color).toBe('#00FF00');
    expect(res.body.data.name).toBe('Bug');
  });

  it('should update both name and color', async () => {
    const res = await request(app)
      .put(`/api/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Feature', color: '#00FF00' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Feature');
    expect(res.body.data.color).toBe('#00FF00');
  });

  it('should fail with invalid color format', async () => {
    const res = await request(app)
      .put(`/api/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ color: 'red' });

    expect(res.status).toBe(400);
  });

  it('should fail when name exceeds 50 characters', async () => {
    const res = await request(app)
      .put(`/api/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'a'.repeat(51) });

    expect(res.status).toBe(400);
  });

  it('should fail when name is empty after trim', async () => {
    const res = await request(app)
      .put(`/api/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '   ' });

    expect(res.status).toBe(400);
  });

  it('should fail with duplicate name on same board', async () => {
    await Label.create({
      name: 'Feature',
      color: '#00FF00',
      boardId: testBoard._id,
    });

    const res = await request(app)
      .put(`/api/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Feature' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already exists');
  });

  it('should allow updating to same name (no change)', async () => {
    const res = await request(app)
      .put(`/api/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Bug' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Bug');
  });

  it('should fail with invalid label ID format', async () => {
    const res = await request(app)
      .put('/api/labels/invalid-id')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Feature' });

    expect(res.status).toBe(400);
  });

  it('should fail when label does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/labels/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Feature' });

    expect(res.status).toBe(404);
  });

  it('should fail without authentication', async () => {
    const res = await request(app)
      .put(`/api/labels/${testLabel._id}`)
      .send({ name: 'Feature' });

    expect(res.status).toBe(401);
  });

  it('should fail when user does not have workspace access', async () => {
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
      .put(`/api/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Feature' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/labels/:id', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let testLabel;
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
    testLabel = await Label.create({
      name: 'Bug',
      color: '#FF0000',
      boardId: testBoard._id,
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await Card.deleteMany({});
    await Label.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should delete label successfully', async () => {
    const res = await request(app)
      .delete(`/api/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);

    const deleted = await Label.findById(testLabel._id);
    expect(deleted).toBeNull();
  });

  it('should remove label references from cards on deletion', async () => {
    const card = await Card.create({
      title: 'Test Card',
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 0,
      labels: [testLabel._id],
    });

    await request(app)
      .delete(`/api/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    const updatedCard = await Card.findById(card._id);
    expect(updatedCard.labels).toHaveLength(0);
  });

  it('should fail with invalid label ID format', async () => {
    const res = await request(app)
      .delete('/api/labels/invalid-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
  });

  it('should fail when label does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/labels/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  it('should fail without authentication', async () => {
    const res = await request(app).delete(`/api/labels/${testLabel._id}`);

    expect(res.status).toBe(401);
  });

  it('should fail when user does not have workspace access', async () => {
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
      .delete(`/api/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/cards/:id/labels/:labelId', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let testCard;
  let testLabel;
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
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 0,
    });
    testLabel = await Label.create({
      name: 'Bug',
      color: '#FF0000',
      boardId: testBoard._id,
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await Card.deleteMany({});
    await Label.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should assign label to card successfully', async () => {
    const res = await request(app)
      .post(`/api/cards/${testCard._id}/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.labels).toHaveLength(1);
    expect(res.body.data.labels[0].name).toBe('Bug');
    expect(res.body.data.labels[0].color).toBe('#FF0000');
  });

  it('should fail when card does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/cards/${fakeId}/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  it('should fail when label does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/cards/${testCard._id}/labels/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  it('should fail when label belongs to a different board', async () => {
    const otherBoard = await Board.create({
      name: 'Other Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });
    const otherLabel = await Label.create({
      name: 'Feature',
      color: '#00FF00',
      boardId: otherBoard._id,
    });

    const res = await request(app)
      .post(`/api/cards/${testCard._id}/labels/${otherLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('same board');
  });

  it('should fail when label is already assigned', async () => {
    testCard.labels.push(testLabel._id);
    await testCard.save();

    const res = await request(app)
      .post(`/api/cards/${testCard._id}/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already assigned');
  });

  it('should fail with invalid card ID format', async () => {
    const res = await request(app)
      .post(`/api/cards/invalid-id/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
  });

  it('should fail with invalid label ID format', async () => {
    const res = await request(app)
      .post(`/api/cards/${testCard._id}/labels/invalid-id`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
  });

  it('should fail without authentication', async () => {
    const res = await request(app).post(
      `/api/cards/${testCard._id}/labels/${testLabel._id}`
    );

    expect(res.status).toBe(401);
  });

  it('should fail when user does not have workspace access', async () => {
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
      .post(`/api/cards/${testCard._id}/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/cards/:id/labels/:labelId', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let testCard;
  let testLabel;
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
    testLabel = await Label.create({
      name: 'Bug',
      color: '#FF0000',
      boardId: testBoard._id,
    });
    testCard = await Card.create({
      title: 'Test Card',
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 0,
      labels: [testLabel._id],
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await Card.deleteMany({});
    await Label.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should remove label from card successfully', async () => {
    const res = await request(app)
      .delete(`/api/cards/${testCard._id}/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.labels).toHaveLength(0);
  });

  it('should fail when label is not assigned to card', async () => {
    const otherLabel = await Label.create({
      name: 'Feature',
      color: '#00FF00',
      boardId: testBoard._id,
    });

    const res = await request(app)
      .delete(`/api/cards/${testCard._id}/labels/${otherLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('not assigned');
  });

  it('should fail when card does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/cards/${fakeId}/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  it('should fail with invalid card ID format', async () => {
    const res = await request(app)
      .delete(`/api/cards/invalid-id/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
  });

  it('should fail without authentication', async () => {
    const res = await request(app).delete(
      `/api/cards/${testCard._id}/labels/${testLabel._id}`
    );

    expect(res.status).toBe(401);
  });

  it('should fail when user does not have workspace access', async () => {
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
      .delete(`/api/cards/${testCard._id}/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it('should keep other labels when removing one', async () => {
    const secondLabel = await Label.create({
      name: 'Feature',
      color: '#00FF00',
      boardId: testBoard._id,
    });

    testCard.labels.push(secondLabel._id);
    await testCard.save();

    const res = await request(app)
      .delete(`/api/cards/${testCard._id}/labels/${testLabel._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.labels).toHaveLength(1);
    expect(res.body.data.labels[0].name).toBe('Feature');
  });
});
