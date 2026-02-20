import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import auth from '../../middlewares/auth.js';
import activityRoutes from '../../routes/activityRoutes.js';
import User from '../../models/User.js';
import Workspace from '../../models/Workspace.js';
import Board from '../../models/Board.js';
import List from '../../models/List.js';
import Card from '../../models/Card.js';
import Activity from '../../models/Activity.js';
import errorHandler from '../../middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api', auth, activityRoutes);
app.use(errorHandler);

describe('Activity Controller', () => {
  let mongoServer;
  let testUser;
  let otherUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let testCard;
  let authToken;
  let otherToken;

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
    otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
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
      boardId: testBoard._id,
      workspaceId: testWorkspace._id,
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
    otherToken = jwt.sign(
      { id: otherUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create sample activities
    await Activity.create([
      {
        workspaceId: testWorkspace._id,
        boardId: testBoard._id,
        userId: testUser._id,
        action: 'created',
        entityType: 'board',
        details: { name: 'Test Board' },
      },
      {
        workspaceId: testWorkspace._id,
        boardId: testBoard._id,
        userId: testUser._id,
        action: 'created',
        entityType: 'list',
        details: { name: 'Test List' },
      },
      {
        workspaceId: testWorkspace._id,
        boardId: testBoard._id,
        cardId: testCard._id,
        userId: testUser._id,
        action: 'created',
        entityType: 'card',
        details: { title: 'Test Card' },
      },
      {
        workspaceId: testWorkspace._id,
        boardId: testBoard._id,
        cardId: testCard._id,
        userId: testUser._id,
        action: 'updated',
        entityType: 'card',
        details: { field: 'title', oldValue: 'Old', newValue: 'Test Card' },
      },
      {
        workspaceId: testWorkspace._id,
        userId: testUser._id,
        action: 'updated',
        entityType: 'workspace',
        details: {
          field: 'name',
          oldValue: 'Old Name',
          newValue: 'Test Workspace',
        },
      },
    ]);
  });

  afterEach(async () => {
    await Activity.deleteMany({});
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('GET /api/workspaces/:workspaceId/activity', () => {
    it('should get all activities for a workspace', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.data[0]).toHaveProperty('action');
      expect(response.body.data[0]).toHaveProperty('entityType');
      expect(response.body.data[0]).toHaveProperty('userId');
      expect(response.body.data[0]).toHaveProperty('createdAt');
    });

    it('should return activities sorted by createdAt descending', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const activities = response.body.data;
      for (let i = 0; i < activities.length - 1; i++) {
        const currentDate = new Date(activities[i].createdAt);
        const nextDate = new Date(activities[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(
          nextDate.getTime()
        );
      }
    });

    it('should populate userId with username', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].userId).toHaveProperty('username');
      expect(response.body.data[0].userId.username).toBe('testuser');
    });

    it('should support pagination with limit', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/activity?limit=2`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it('should support pagination with skip', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/activity?skip=3`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by action type', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/activity?action=created`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      response.body.data.forEach(activity => {
        expect(activity.action).toBe('created');
      });
    });

    it('should filter by entityType', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/activity?entityType=card`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach(activity => {
        expect(activity.entityType).toBe('card');
      });
    });

    it('should return 404 for non-existent workspace', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/workspaces/${fakeId}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-member user', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/activity`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app).get(
        `/api/workspaces/${testWorkspace._id}/activity`
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/boards/:boardId/activity', () => {
    it('should get all activities for a board', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoard._id}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4); // board, list, 2 card activities
    });

    it('should only return activities related to the board', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoard._id}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(activity => {
        expect(activity.boardId.toString()).toBe(testBoard._id.toString());
      });
    });

    it('should return 404 for non-existent board', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/boards/${fakeId}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-member user', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoard._id}/activity`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/cards/:cardId/activity', () => {
    it('should get all activities for a card', async () => {
      const response = await request(app)
        .get(`/api/cards/${testCard._id}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // created and updated
    });

    it('should only return activities related to the card', async () => {
      const response = await request(app)
        .get(`/api/cards/${testCard._id}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(activity => {
        expect(activity.cardId.toString()).toBe(testCard._id.toString());
      });
    });

    it('should return 404 for non-existent card', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/cards/${fakeId}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-member user', async () => {
      const response = await request(app)
        .get(`/api/cards/${testCard._id}/activity`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
