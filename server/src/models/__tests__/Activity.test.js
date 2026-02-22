import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Activity from '../Activity.js';
import Card from '../Card.js';
import List from '../List.js';
import Board from '../Board.js';
import Workspace from '../Workspace.js';
import User from '../User.js';

let mongoServer;
let testUser;
let testWorkspace;
let testBoard;
let testList;
let testCard;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
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
});

afterEach(async () => {
  await Activity.deleteMany({});
  await Card.deleteMany({});
  await List.deleteMany({});
  await Board.deleteMany({});
  await Workspace.deleteMany({});
  await User.deleteMany({});
});

describe('Activity Model', () => {
  describe('Required Fields Validation', () => {
    it('should require workspaceId', async () => {
      const activity = new Activity({
        userId: testUser._id,
        action: 'created',
        entityType: 'card',
      });
      await expect(activity.save()).rejects.toThrow();
    });

    it('should require userId', async () => {
      const activity = new Activity({
        workspaceId: testWorkspace._id,
        action: 'created',
        entityType: 'card',
      });
      await expect(activity.save()).rejects.toThrow();
    });

    it('should require action', async () => {
      const activity = new Activity({
        workspaceId: testWorkspace._id,
        userId: testUser._id,
        entityType: 'card',
      });
      await expect(activity.save()).rejects.toThrow();
    });

    it('should require entityType', async () => {
      const activity = new Activity({
        workspaceId: testWorkspace._id,
        userId: testUser._id,
        action: 'created',
      });
      await expect(activity.save()).rejects.toThrow();
    });
  });

  describe('Valid Activity Creation', () => {
    it('should create activity with required fields', async () => {
      const activity = await Activity.create({
        workspaceId: testWorkspace._id,
        userId: testUser._id,
        action: 'created',
        entityType: 'card',
      });

      expect(activity.workspaceId.toString()).toBe(
        testWorkspace._id.toString()
      );
      expect(activity.userId.toString()).toBe(testUser._id.toString());
      expect(activity.action).toBe('created');
      expect(activity.entityType).toBe('card');
      expect(activity.createdAt).toBeInstanceOf(Date);
    });

    it('should create activity with all optional fields', async () => {
      const activity = await Activity.create({
        workspaceId: testWorkspace._id,
        boardId: testBoard._id,
        cardId: testCard._id,
        userId: testUser._id,
        action: 'moved',
        entityType: 'card',
        details: {
          from: { listId: testList._id, position: 0 },
          to: { listId: testList._id, position: 1 },
        },
      });

      expect(activity.boardId.toString()).toBe(testBoard._id.toString());
      expect(activity.cardId.toString()).toBe(testCard._id.toString());
      expect(activity.details).toEqual({
        from: { listId: testList._id, position: 0 },
        to: { listId: testList._id, position: 1 },
      });
    });
  });

  describe('Action Enum Validation', () => {
    const validActions = [
      'created',
      'updated',
      'moved',
      'deleted',
      'commented',
      'assigned',
      'archived',
    ];

    validActions.forEach(action => {
      it(`should accept valid action: ${action}`, async () => {
        const activity = await Activity.create({
          workspaceId: testWorkspace._id,
          userId: testUser._id,
          action,
          entityType: 'card',
        });
        expect(activity.action).toBe(action);
      });
    });

    it('should reject invalid action', async () => {
      const activity = new Activity({
        workspaceId: testWorkspace._id,
        userId: testUser._id,
        action: 'invalid_action',
        entityType: 'card',
      });
      await expect(activity.save()).rejects.toThrow();
    });
  });

  describe('EntityType Enum Validation', () => {
    const validEntityTypes = [
      'workspace',
      'board',
      'list',
      'card',
      'comment',
      'member',
      'label',
    ];

    validEntityTypes.forEach(entityType => {
      it(`should accept valid entityType: ${entityType}`, async () => {
        const activity = await Activity.create({
          workspaceId: testWorkspace._id,
          userId: testUser._id,
          action: 'created',
          entityType,
        });
        expect(activity.entityType).toBe(entityType);
      });
    });

    it('should reject invalid entityType', async () => {
      const activity = new Activity({
        workspaceId: testWorkspace._id,
        userId: testUser._id,
        action: 'created',
        entityType: 'invalid_type',
      });
      await expect(activity.save()).rejects.toThrow();
    });
  });

  describe('Details Field', () => {
    it('should store complex details object', async () => {
      const details = {
        oldValue: 'Old Title',
        newValue: 'New Title',
        field: 'title',
        metadata: {
          timestamp: new Date(),
          ip: '127.0.0.1',
        },
      };

      const activity = await Activity.create({
        workspaceId: testWorkspace._id,
        userId: testUser._id,
        action: 'updated',
        entityType: 'card',
        details,
      });

      expect(activity.details).toMatchObject({
        oldValue: 'Old Title',
        newValue: 'New Title',
        field: 'title',
      });
    });

    it('should allow empty details', async () => {
      const activity = await Activity.create({
        workspaceId: testWorkspace._id,
        userId: testUser._id,
        action: 'created',
        entityType: 'board',
      });

      expect(activity.details).toBeUndefined();
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt', async () => {
      const beforeCreate = new Date();
      const activity = await Activity.create({
        workspaceId: testWorkspace._id,
        userId: testUser._id,
        action: 'created',
        entityType: 'card',
      });
      const afterCreate = new Date();

      expect(activity.createdAt).toBeInstanceOf(Date);
      expect(activity.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(activity.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
    });
  });

  describe('Querying Activities', () => {
    beforeEach(async () => {
      // Create sample activities
      await Activity.create([
        {
          workspaceId: testWorkspace._id,
          boardId: testBoard._id,
          cardId: testCard._id,
          userId: testUser._id,
          action: 'created',
          entityType: 'card',
        },
        {
          workspaceId: testWorkspace._id,
          boardId: testBoard._id,
          userId: testUser._id,
          action: 'created',
          entityType: 'list',
        },
        {
          workspaceId: testWorkspace._id,
          userId: testUser._id,
          action: 'updated',
          entityType: 'workspace',
        },
      ]);
    });

    it('should find activities by workspaceId', async () => {
      const activities = await Activity.find({
        workspaceId: testWorkspace._id,
      });
      expect(activities).toHaveLength(3);
    });

    it('should find activities by boardId', async () => {
      const activities = await Activity.find({ boardId: testBoard._id });
      expect(activities).toHaveLength(2);
    });

    it('should find activities by cardId', async () => {
      const activities = await Activity.find({ cardId: testCard._id });
      expect(activities).toHaveLength(1);
    });

    it('should find activities by userId', async () => {
      const activities = await Activity.find({ userId: testUser._id });
      expect(activities).toHaveLength(3);
    });

    it('should find activities by action', async () => {
      const activities = await Activity.find({ action: 'created' });
      expect(activities).toHaveLength(2);
    });

    it('should find activities by entityType', async () => {
      const activities = await Activity.find({ entityType: 'card' });
      expect(activities).toHaveLength(1);
    });

    it('should sort activities by createdAt descending', async () => {
      const activities = await Activity.find({
        workspaceId: testWorkspace._id,
      }).sort({ createdAt: -1 });

      expect(activities).toHaveLength(3);
      // Verify sorting: each activity should be >= the next one in time
      for (let i = 0; i < activities.length - 1; i++) {
        expect(activities[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          activities[i + 1].createdAt.getTime()
        );
      }
    });
  });
});
