import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import notificationRouter from '../../routes/notificationRoutes.js';
import auth from '../../middlewares/auth.js';
import User from '../../models/User.js';
import Workspace from '../../models/Workspace.js';
import Board from '../../models/Board.js';
import List from '../../models/List.js';
import Card from '../../models/Card.js';
import Notification from '../../models/Notification.js';
import errorHandler from '../../middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/notifications', auth, notificationRouter);
app.use(errorHandler);

describe('Notification Controller', () => {
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
    await Notification.deleteMany({});
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('GET /api/notifications', () => {
    it('should return all notifications for the authenticated user', async () => {
      await Notification.create([
        {
          userId: testUser._id,
          cardId: testCard._id,
          type: 'due-soon',
          message: 'Card is due soon',
        },
        {
          userId: testUser._id,
          cardId: testCard._id,
          type: 'overdue',
          message: 'Card is overdue',
        },
      ]);

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it('should return notifications sorted by createdAt desc', async () => {
      const older = await Notification.create({
        userId: testUser._id,
        cardId: testCard._id,
        type: 'due-soon',
        message: 'Older notification',
      });
      // Ensure timestamps differ
      await new Promise(resolve => setTimeout(resolve, 10));
      const newer = await Notification.create({
        userId: testUser._id,
        cardId: testCard._id,
        type: 'overdue',
        message: 'Newer notification',
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0]._id).toBe(newer._id.toString());
      expect(res.body.data[1]._id).toBe(older._id.toString());
    });

    it('should return only unread notifications when unreadOnly=true', async () => {
      await Notification.create([
        {
          userId: testUser._id,
          cardId: testCard._id,
          type: 'due-soon',
          message: 'Unread',
          read: false,
        },
        {
          userId: testUser._id,
          cardId: testCard._id,
          type: 'overdue',
          message: 'Read',
          read: true,
        },
      ]);

      const res = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].message).toBe('Unread');
    });

    it('should return all notifications when unreadOnly is not set', async () => {
      await Notification.create([
        {
          userId: testUser._id,
          cardId: testCard._id,
          type: 'due-soon',
          message: 'Unread',
          read: false,
        },
        {
          userId: testUser._id,
          cardId: testCard._id,
          type: 'overdue',
          message: 'Read',
          read: true,
        },
      ]);

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('should not return other users notifications', async () => {
      const otherUser = await User.create({
        username: 'other',
        email: 'other@example.com',
        password: 'password123',
      });
      await Notification.create({
        userId: otherUser._id,
        cardId: testCard._id,
        type: 'overdue',
        message: 'Other user notification',
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should return empty array when no notifications exist', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should fail without authentication', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('should populate card title', async () => {
      await Notification.create({
        userId: testUser._id,
        cardId: testCard._id,
        type: 'due-soon',
        message: 'Card due soon',
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].cardId.title).toBe('Test Card');
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    let testNotification;

    beforeEach(async () => {
      testNotification = await Notification.create({
        userId: testUser._id,
        cardId: testCard._id,
        type: 'due-soon',
        message: 'Card is due soon',
        read: false,
      });
    });

    it('should mark notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${testNotification._id}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.read).toBe(true);
    });

    it('should keep notification as read when already read', async () => {
      testNotification.read = true;
      await testNotification.save();

      const res = await request(app)
        .patch(`/api/notifications/${testNotification._id}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.read).toBe(true);
    });

    it('should fail with invalid notification ID', async () => {
      const res = await request(app)
        .patch('/api/notifications/invalid-id/read')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });

    it('should fail when notification does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    it('should not allow marking another users notification as read', async () => {
      const otherUser = await User.create({
        username: 'other',
        email: 'other@example.com',
        password: 'password123',
      });
      const otherToken = jwt.sign(
        { id: otherUser._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const res = await request(app)
        .patch(`/api/notifications/${testNotification._id}/read`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('another user');
    });

    it('should fail without authentication', async () => {
      const res = await request(app).patch(
        `/api/notifications/${testNotification._id}/read`
      );
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('should mark all unread notifications as read', async () => {
      await Notification.create([
        {
          userId: testUser._id,
          cardId: testCard._id,
          type: 'due-soon',
          message: 'Notif 1',
          read: false,
        },
        {
          userId: testUser._id,
          cardId: testCard._id,
          type: 'overdue',
          message: 'Notif 2',
          read: false,
        },
        {
          userId: testUser._id,
          cardId: testCard._id,
          type: 'reminder',
          message: 'Notif 3',
          read: true,
        },
      ]);

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.modifiedCount).toBe(2);

      // Verify all are now read
      const all = await Notification.find({ userId: testUser._id });
      expect(all.every(n => n.read)).toBe(true);
    });

    it('should return 0 modified when no unread notifications', async () => {
      await Notification.create({
        userId: testUser._id,
        cardId: testCard._id,
        type: 'due-soon',
        message: 'Already read',
        read: true,
      });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.modifiedCount).toBe(0);
    });

    it('should not mark other users notifications', async () => {
      const otherUser = await User.create({
        username: 'other',
        email: 'other@example.com',
        password: 'password123',
      });
      await Notification.create({
        userId: otherUser._id,
        cardId: testCard._id,
        type: 'overdue',
        message: 'Other user notif',
        read: false,
      });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.modifiedCount).toBe(0);

      // Other user's notification still unread
      const otherNotif = await Notification.findOne({ userId: otherUser._id });
      expect(otherNotif.read).toBe(false);
    });

    it('should fail without authentication', async () => {
      const res = await request(app).patch('/api/notifications/read-all');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    let testNotification;

    beforeEach(async () => {
      testNotification = await Notification.create({
        userId: testUser._id,
        cardId: testCard._id,
        type: 'overdue',
        message: 'Card is overdue',
      });
    });

    it('should delete a notification', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');

      const deleted = await Notification.findById(testNotification._id);
      expect(deleted).toBeNull();
    });

    it('should fail with invalid notification ID', async () => {
      const res = await request(app)
        .delete('/api/notifications/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });

    it('should fail when notification does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/notifications/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    it('should not allow deleting another users notification', async () => {
      const otherUser = await User.create({
        username: 'other',
        email: 'other@example.com',
        password: 'password123',
      });
      const otherToken = jwt.sign(
        { id: otherUser._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const res = await request(app)
        .delete(`/api/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('another user');

      // Verify not deleted
      const notif = await Notification.findById(testNotification._id);
      expect(notif).not.toBeNull();
    });

    it('should fail without authentication', async () => {
      const res = await request(app).delete(
        `/api/notifications/${testNotification._id}`
      );
      expect(res.status).toBe(401);
    });
  });
});
