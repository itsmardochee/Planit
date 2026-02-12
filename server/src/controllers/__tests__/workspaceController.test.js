import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import workspaceRoutes from '../../routes/workspaceRoutes.js';
import auth from '../../middlewares/auth.js';
import User from '../../models/User.js';
import Workspace from '../../models/Workspace.js';
import WorkspaceMember from '../../models/WorkspaceMember.js';
import Board from '../../models/Board.js';
import List from '../../models/List.js';
import Card from '../../models/Card.js';
import errorHandler from '../../middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/workspaces', auth, workspaceRoutes);
app.use(errorHandler);

describe('POST /api/workspaces', () => {
  let mongoServer;
  let testUser;
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
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );
  });

  afterEach(async () => {
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Input Validation', () => {
    it('should fail when name is missing', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'A test workspace',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('name');
    });

    it('should fail when name exceeds 100 characters', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'a'.repeat(101),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toContain('name');
    });

    it('should fail when description exceeds 500 characters', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Workspace',
          description: 'a'.repeat(501),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toContain('description');
    });

    it('should accept valid input with name only', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Workspace',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should accept valid input with name and description', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Workspace',
          description: 'A test workspace',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should fail without authentication token', async () => {
      const response = await request(app).post('/api/workspaces').send({
        name: 'My Workspace',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should attach userId from authenticated user', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Workspace',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.userId).toBe(testUser._id.toString());
    });
  });

  describe('Workspace Creation', () => {
    it('should create workspace with name and description', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Workspace',
          description: 'A test workspace',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('My Workspace');
      expect(response.body.data.description).toBe('A test workspace');
    });

    it('should create workspace with name only', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Workspace',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('My Workspace');
      expect(response.body.data.description).toBeUndefined();
    });

    it('should trim whitespace from name and description', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '  My Workspace  ',
          description: '  A test workspace  ',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('My Workspace');
      expect(response.body.data.description).toBe('A test workspace');
    });
  });

  describe('Response Format', () => {
    it('should return workspace with all fields', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Workspace',
          description: 'A test workspace',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBeDefined();
      expect(response.body.data.name).toBeDefined();
      expect(response.body.data.description).toBeDefined();
      expect(response.body.data.userId).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });
  });
});

describe('GET /api/workspaces', () => {
  let mongoServer;
  let testUser;
  let otherUser;
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
    otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );
  });

  afterEach(async () => {
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Authentication', () => {
    it('should fail without authentication token', async () => {
      const response = await request(app).get('/api/workspaces');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Fetching Workspaces', () => {
    it('should return empty array when user has no workspaces', async () => {
      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return all workspaces for authenticated user', async () => {
      await Workspace.create({
        name: 'Workspace 1',
        userId: testUser._id,
      });
      await Workspace.create({
        name: 'Workspace 2',
        userId: testUser._id,
      });

      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should only return workspaces owned by authenticated user', async () => {
      await Workspace.create({
        name: 'My Workspace',
        userId: testUser._id,
      });
      await Workspace.create({
        name: 'Other Workspace',
        userId: otherUser._id,
      });

      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('My Workspace');
    });

    it('should return workspaces with all fields', async () => {
      await Workspace.create({
        name: 'My Workspace',
        description: 'A test workspace',
        userId: testUser._id,
      });

      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0]._id).toBeDefined();
      expect(response.body.data[0].name).toBe('My Workspace');
      expect(response.body.data[0].description).toBe('A test workspace');
      expect(response.body.data[0].userId).toBeDefined();
      expect(response.body.data[0].createdAt).toBeDefined();
      expect(response.body.data[0].updatedAt).toBeDefined();
    });

    it('should return workspaces where user is a member', async () => {
      // Workspace owned by testUser
      await Workspace.create({
        name: 'My Workspace',
        userId: testUser._id,
      });

      // Workspace owned by otherUser where testUser is a member
      const sharedWorkspace = await Workspace.create({
        name: 'Shared Workspace',
        userId: otherUser._id,
      });

      await WorkspaceMember.create({
        workspaceId: sharedWorkspace._id,
        userId: testUser._id,
        role: 'member',
        invitedBy: otherUser._id,
      });

      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);

      const workspaceNames = response.body.data.map((w) => w.name).sort();
      expect(workspaceNames).toEqual(['My Workspace', 'Shared Workspace']);
    });

    it('should not return duplicate workspaces', async () => {
      // Create workspace owned by testUser
      const workspace = await Workspace.create({
        name: 'My Workspace',
        userId: testUser._id,
      });

      // Create membership entry for owner (shouldn't happen but test for it)
      await WorkspaceMember.create({
        workspaceId: workspace._id,
        userId: testUser._id,
        role: 'owner',
        invitedBy: testUser._id,
      });

      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('My Workspace');
    });
  });
});

describe('GET /api/workspaces/:id', () => {
  let mongoServer;
  let testUser;
  let otherUser;
  let authToken;
  let testWorkspace;

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
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );
    testWorkspace = await Workspace.create({
      name: 'My Workspace',
      description: 'A test workspace',
      userId: testUser._id,
    });
  });

  afterEach(async () => {
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Authentication', () => {
    it('should fail without authentication token', async () => {
      const response = await request(app).get(
        `/api/workspaces/${testWorkspace._id}`
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Fetching Single Workspace', () => {
    it('should return workspace by id', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('My Workspace');
      expect(response.body.data.description).toBe('A test workspace');
    });

    it('should fail with invalid workspace id format', async () => {
      const response = await request(app)
        .get('/api/workspaces/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should fail when workspace does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/workspaces/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should fail when accessing workspace owned by another user', async () => {
      const otherWorkspace = await Workspace.create({
        name: 'Other Workspace',
        userId: otherUser._id,
      });

      const response = await request(app)
        .get(`/api/workspaces/${otherWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return workspace with all fields', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBeDefined();
      expect(response.body.data.name).toBeDefined();
      expect(response.body.data.description).toBeDefined();
      expect(response.body.data.userId).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });
  });
});

describe('PUT /api/workspaces/:id', () => {
  let mongoServer;
  let testUser;
  let otherUser;
  let authToken;
  let testWorkspace;

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
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );
    testWorkspace = await Workspace.create({
      name: 'My Workspace',
      description: 'A test workspace',
      userId: testUser._id,
    });
  });

  afterEach(async () => {
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Authentication', () => {
    it('should fail without authentication token', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}`)
        .send({
          name: 'Updated Workspace',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should fail when name exceeds 100 characters', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'a'.repeat(101),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toContain('name');
    });

    it('should fail when description exceeds 500 characters', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'a'.repeat(501),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toContain('description');
    });
  });

  describe('Updating Workspace', () => {
    it('should update workspace name', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Workspace',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Workspace');
      expect(response.body.data.description).toBe('A test workspace');
    });

    it('should update workspace description', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.name).toBe('My Workspace');
    });

    it('should update both name and description', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Workspace',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Workspace');
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should fail with invalid workspace id format', async () => {
      const response = await request(app)
        .put('/api/workspaces/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Workspace',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when workspace does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/workspaces/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Workspace',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail when updating workspace owned by another user', async () => {
      const otherWorkspace = await Workspace.create({
        name: 'Other Workspace',
        userId: otherUser._id,
      });

      const response = await request(app)
        .put(`/api/workspaces/${otherWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Workspace',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should update updatedAt timestamp', async () => {
      const originalUpdatedAt = testWorkspace.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Workspace',
        });

      expect(response.status).toBe(200);
      expect(new Date(response.body.data.updatedAt).getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });
});

describe('DELETE /api/workspaces/:id', () => {
  let mongoServer;
  let testUser;
  let otherUser;
  let authToken;
  let testWorkspace;

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
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );
    testWorkspace = await Workspace.create({
      name: 'My Workspace',
      description: 'A test workspace',
      userId: testUser._id,
    });
  });

  afterEach(async () => {
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Authentication', () => {
    it('should fail without authentication token', async () => {
      const response = await request(app).delete(
        `/api/workspaces/${testWorkspace._id}`
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Deleting Workspace', () => {
    it('should delete workspace by id', async () => {
      const response = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      const deletedWorkspace = await Workspace.findById(testWorkspace._id);
      expect(deletedWorkspace).toBeNull();
    });

    it('should fail with invalid workspace id format', async () => {
      const response = await request(app)
        .delete('/api/workspaces/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when workspace does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/workspaces/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail when deleting workspace owned by another user', async () => {
      const otherWorkspace = await Workspace.create({
        name: 'Other Workspace',
        userId: otherUser._id,
      });

      const response = await request(app)
        .delete(`/api/workspaces/${otherWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should cascade delete all boards, lists, and cards when deleting workspace', async () => {
      // Create a board in the workspace
      const board = await Board.create({
        name: 'Test Board',
        workspaceId: testWorkspace._id,
        userId: testUser._id,
      });

      // Create lists in the board
      const list1 = await List.create({
        name: 'Test List 1',
        workspaceId: testWorkspace._id,
        boardId: board._id,
        userId: testUser._id,
        position: 0,
      });

      const list2 = await List.create({
        name: 'Test List 2',
        workspaceId: testWorkspace._id,
        boardId: board._id,
        userId: testUser._id,
        position: 1,
      });

      // Create cards in the lists
      await Card.create({
        title: 'Card 1',
        listId: list1._id,
        boardId: board._id,
        userId: testUser._id,
        position: 0,
      });

      await Card.create({
        title: 'Card 2',
        listId: list2._id,
        boardId: board._id,
        userId: testUser._id,
        position: 0,
      });

      // Delete the workspace
      const response = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify workspace is deleted
      const deletedWorkspace = await Workspace.findById(testWorkspace._id);
      expect(deletedWorkspace).toBeNull();

      // Verify boards are deleted
      const deletedBoards = await Board.find({
        workspaceId: testWorkspace._id,
      });
      expect(deletedBoards).toHaveLength(0);

      // Verify lists are deleted
      const deletedLists = await List.find({ boardId: board._id });
      expect(deletedLists).toHaveLength(0);

      // Verify cards are deleted
      const deletedCards = await Card.find({ boardId: board._id });
      expect(deletedCards).toHaveLength(0);
    });
  });
});
