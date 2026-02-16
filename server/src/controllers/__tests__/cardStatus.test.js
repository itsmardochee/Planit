import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { cardRouter } from '../../routes/cardRoutes.js';
import auth from '../../middlewares/auth.js';
import User from '../../models/User.js';
import Workspace from '../../models/Workspace.js';
import Board from '../../models/Board.js';
import List from '../../models/List.js';
import Card from '../../models/Card.js';
import errorHandler from '../../middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/cards', auth, cardRouter);
app.use(errorHandler);

describe('PATCH /api/cards/:id/status', () => {
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

  it('should update status to todo', async () => {
    const res = await request(app)
      .patch(`/api/cards/${testCard._id}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'todo' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('todo');
  });

  it('should update status to in-progress', async () => {
    const res = await request(app)
      .patch(`/api/cards/${testCard._id}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'in-progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in-progress');
  });

  it('should update status to done', async () => {
    const res = await request(app)
      .patch(`/api/cards/${testCard._id}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('done');
  });

  it('should update status to blocked', async () => {
    const res = await request(app)
      .patch(`/api/cards/${testCard._id}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'blocked' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('blocked');
  });

  it('should clear status with null', async () => {
    testCard.status = 'todo';
    await testCard.save();

    const res = await request(app)
      .patch(`/api/cards/${testCard._id}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: null });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBeNull();
  });

  it('should fail with invalid status value', async () => {
    const res = await request(app)
      .patch(`/api/cards/${testCard._id}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'invalid' });

    expect(res.status).toBe(400);
  });

  it('should fail when status is missing from body', async () => {
    const res = await request(app)
      .patch(`/api/cards/${testCard._id}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('should fail when card does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/cards/${fakeId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'todo' });

    expect(res.status).toBe(404);
  });

  it('should fail with invalid card ID format', async () => {
    const res = await request(app)
      .patch('/api/cards/invalid-id/status')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'todo' });

    expect(res.status).toBe(400);
  });

  it('should fail without authentication', async () => {
    const res = await request(app)
      .patch(`/api/cards/${testCard._id}/status`)
      .send({ status: 'todo' });

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
      .patch(`/api/cards/${testCard._id}/status`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ status: 'todo' });

    expect(res.status).toBe(403);
  });
});
