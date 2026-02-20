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

describe('PATCH /api/cards/:id/due-date', () => {
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

  describe('Setting dueDate', () => {
    it('should set a due date on a card', async () => {
      const dueDate = '2026-06-15T10:00:00.000Z';
      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(new Date(res.body.data.dueDate).toISOString()).toBe(dueDate);
    });

    it('should update an existing due date', async () => {
      testCard.dueDate = new Date('2026-05-01T10:00:00.000Z');
      await testCard.save();

      const newDueDate = '2026-07-20T15:00:00.000Z';
      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate: newDueDate });

      expect(res.status).toBe(200);
      expect(new Date(res.body.data.dueDate).toISOString()).toBe(newDueDate);
    });

    it('should clear due date when null is sent', async () => {
      testCard.dueDate = new Date('2026-05-01T10:00:00.000Z');
      await testCard.save();

      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate: null });

      expect(res.status).toBe(200);
      expect(res.body.data.dueDate).toBeNull();
    });

    it('should clear reminderDate when dueDate is cleared', async () => {
      testCard.dueDate = new Date('2026-06-01T10:00:00.000Z');
      testCard.reminderDate = new Date('2026-05-31T10:00:00.000Z');
      await testCard.save();

      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate: null });

      expect(res.status).toBe(200);
      expect(res.body.data.dueDate).toBeNull();
      expect(res.body.data.reminderDate).toBeNull();
    });
  });

  describe('Setting reminderDate', () => {
    it('should set both dueDate and reminderDate', async () => {
      const dueDate = '2026-06-15T10:00:00.000Z';
      const reminderDate = '2026-06-14T10:00:00.000Z';

      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate, reminderDate });

      expect(res.status).toBe(200);
      expect(new Date(res.body.data.dueDate).toISOString()).toBe(dueDate);
      expect(new Date(res.body.data.reminderDate).toISOString()).toBe(
        reminderDate
      );
    });

    it('should reject reminderDate that is after dueDate', async () => {
      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: '2026-06-15T10:00:00.000Z',
          reminderDate: '2026-06-16T10:00:00.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('before');
    });

    it('should reject reminderDate equal to dueDate', async () => {
      const sameDate = '2026-06-15T10:00:00.000Z';
      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate: sameDate, reminderDate: sameDate });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('before');
    });

    it('should clear reminderDate with null', async () => {
      testCard.dueDate = new Date('2026-06-15T10:00:00.000Z');
      testCard.reminderDate = new Date('2026-06-14T10:00:00.000Z');
      await testCard.save();

      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate: '2026-06-15T10:00:00.000Z', reminderDate: null });

      expect(res.status).toBe(200);
      expect(res.body.data.reminderDate).toBeNull();
      expect(new Date(res.body.data.dueDate).toISOString()).toBe(
        '2026-06-15T10:00:00.000Z'
      );
    });
  });

  describe('Validation errors', () => {
    it('should fail with invalid dueDate format', async () => {
      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate: 'not-a-date' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid dueDate');
    });

    it('should fail with invalid reminderDate format', async () => {
      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate: '2026-06-15T10:00:00.000Z', reminderDate: 'bad' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid reminderDate');
    });

    it('should fail when dueDate is missing from body', async () => {
      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('dueDate');
    });

    it('should fail with invalid card ID format', async () => {
      const res = await request(app)
        .patch('/api/cards/invalid-id/due-date')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate: '2026-06-15T10:00:00.000Z' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid');
    });

    it('should fail when card does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/cards/${fakeId}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate: '2026-06-15T10:00:00.000Z' });

      expect(res.status).toBe(404);
    });
  });

  describe('isOverdue virtual', () => {
    it('should return isOverdue true for past due date', async () => {
      testCard.dueDate = new Date('2020-01-01T00:00:00.000Z');
      await testCard.save();

      const cardObj = testCard.toJSON();
      expect(cardObj.isOverdue).toBe(true);
    });

    it('should return isOverdue false for future due date', async () => {
      testCard.dueDate = new Date('2099-12-31T23:59:59.000Z');
      await testCard.save();

      const cardObj = testCard.toJSON();
      expect(cardObj.isOverdue).toBe(false);
    });

    it('should return isOverdue false when no due date', () => {
      const cardObj = testCard.toJSON();
      expect(cardObj.isOverdue).toBe(false);
    });

    it('should include isOverdue in API response', async () => {
      testCard.dueDate = new Date('2020-01-01T00:00:00.000Z');
      await testCard.save();

      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate: '2020-01-01T00:00:00.000Z' });

      expect(res.status).toBe(200);
      expect(res.body.data.isOverdue).toBe(true);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should fail without authentication', async () => {
      const res = await request(app)
        .patch(`/api/cards/${testCard._id}/due-date`)
        .send({ dueDate: '2026-06-15T10:00:00.000Z' });

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
        .patch(`/api/cards/${testCard._id}/due-date`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ dueDate: '2026-06-15T10:00:00.000Z' });

      expect(res.status).toBe(403);
    });
  });
});
