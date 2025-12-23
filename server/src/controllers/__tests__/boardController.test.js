import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { workspaceBoardRouter, boardRouter } from '../../routes/boardRoutes.js';
import auth from '../../middlewares/auth.js';
import User from '../../models/User.js';
import Workspace from '../../models/Workspace.js';
import Board from '../../models/Board.js';
import List from '../../models/List.js';
import Card from '../../models/Card.js';
import errorHandler from '../../middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/workspaces/:workspaceId/boards', auth, workspaceBoardRouter);
app.use('/api/boards', auth, boardRouter);
app.use(errorHandler);

describe('POST /api/workspaces/:workspaceId/boards', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
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
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );
  });

  afterEach(async () => {
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Input Validation', () => {
    it('should fail when name is missing', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'A test board',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('name');
    });

    it('should fail when name exceeds 100 characters', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/boards`)
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
        .post(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Board',
          description: 'a'.repeat(501),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toContain('description');
    });

    it('should accept valid input with name only', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Board',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('My Board');
    });

    it('should accept valid input with name and description', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Board',
          description: 'A test board',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('My Board');
      expect(response.body.data.description).toBe('A test board');
    });
  });

  describe('Authentication', () => {
    it('should fail without authentication token', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/boards`)
        .send({
          name: 'My Board',
        });

      expect(response.status).toBe(401);
    });

    it('should attach userId from authenticated user', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Board',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.userId.toString()).toBe(
        testUser._id.toString()
      );
    });
  });

  describe('Workspace Validation', () => {
    it('should fail with invalid workspace id format', async () => {
      const response = await request(app)
        .post('/api/workspaces/invalid-id/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Board',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when workspace does not exist', async () => {
      const fakeWorkspaceId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/workspaces/${fakeWorkspaceId}/boards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Board',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail when workspace is owned by another user', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123',
      });
      const otherWorkspace = await Workspace.create({
        name: 'Other Workspace',
        userId: otherUser._id,
      });

      const response = await request(app)
        .post(`/api/workspaces/${otherWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Board',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Board Creation', () => {
    it('should create board with name and description', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Board',
          description: 'A test board',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('My Board');
      expect(response.body.data.description).toBe('A test board');
      expect(response.body.data.workspaceId.toString()).toBe(
        testWorkspace._id.toString()
      );
    });

    it('should create board with name only', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Board',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('My Board');
      expect(response.body.data.description).toBeUndefined();
    });

    it('should trim whitespace from name and description', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '  My Board  ',
          description: '  A test board  ',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('My Board');
      expect(response.body.data.description).toBe('A test board');
    });
  });

  describe('Response Format', () => {
    it('should return board with all fields', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Board',
          description: 'A test board',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('workspaceId');
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });
  });
});

describe('GET /api/workspaces/:workspaceId/boards', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
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
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );
  });

  afterEach(async () => {
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Authentication', () => {
    it('should fail without authentication token', async () => {
      const response = await request(app).get(
        `/api/workspaces/${testWorkspace._id}/boards`
      );

      expect(response.status).toBe(401);
    });
  });

  describe('Fetching Boards', () => {
    it('should return empty array when workspace has no boards', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return all boards for workspace', async () => {
      await Board.create({
        name: 'Board 1',
        workspaceId: testWorkspace._id,
        userId: testUser._id,
      });
      await Board.create({
        name: 'Board 2',
        workspaceId: testWorkspace._id,
        userId: testUser._id,
      });

      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should only return boards from specified workspace', async () => {
      const otherWorkspace = await Workspace.create({
        name: 'Other Workspace',
        userId: testUser._id,
      });

      await Board.create({
        name: 'Board 1',
        workspaceId: testWorkspace._id,
        userId: testUser._id,
      });
      await Board.create({
        name: 'Board 2',
        workspaceId: otherWorkspace._id,
        userId: testUser._id,
      });

      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Board 1');
    });

    it('should return boards with all fields', async () => {
      await Board.create({
        name: 'My Board',
        description: 'A test board',
        workspaceId: testWorkspace._id,
        userId: testUser._id,
      });

      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty('_id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('workspaceId');
      expect(response.body.data[0]).toHaveProperty('userId');
      expect(response.body.data[0]).toHaveProperty('createdAt');
      expect(response.body.data[0]).toHaveProperty('updatedAt');
    });

    it('should fail when workspace is owned by another user', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123',
      });
      const otherWorkspace = await Workspace.create({
        name: 'Other Workspace',
        userId: otherUser._id,
      });

      const response = await request(app)
        .get(`/api/workspaces/${otherWorkspace._id}/boards`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('GET /api/boards/:id', () => {
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
      name: 'My Board',
      description: 'A test board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
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
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Authentication', () => {
    it('should fail without authentication token', async () => {
      const response = await request(app).get(`/api/boards/${testBoard._id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Fetching Single Board', () => {
    it('should return board by id', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id.toString()).toBe(testBoard._id.toString());
      expect(response.body.data.name).toBe('My Board');
    });

    it('should fail with invalid board id format', async () => {
      const response = await request(app)
        .get('/api/boards/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when board does not exist', async () => {
      const fakeBoardId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/boards/${fakeBoardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail when accessing board owned by another user', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
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

      const response = await request(app)
        .get(`/api/boards/${otherBoard._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return board with all fields', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('workspaceId');
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });
  });
});

describe('PUT /api/boards/:id', () => {
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
      name: 'My Board',
      description: 'A test board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
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
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Authentication', () => {
    it('should fail without authentication token', async () => {
      const response = await request(app)
        .put(`/api/boards/${testBoard._id}`)
        .send({
          name: 'Updated Board',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Input Validation', () => {
    it('should fail when name exceeds 100 characters', async () => {
      const response = await request(app)
        .put(`/api/boards/${testBoard._id}`)
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
        .put(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'a'.repeat(501),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toContain('description');
    });
  });

  describe('Updating Board', () => {
    it('should update board name', async () => {
      const response = await request(app)
        .put(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Board',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Board');
      expect(response.body.data.description).toBe('A test board');
    });

    it('should update board description', async () => {
      const response = await request(app)
        .put(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('My Board');
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should update both name and description', async () => {
      const response = await request(app)
        .put(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Board',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Board');
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should fail with invalid board id format', async () => {
      const response = await request(app)
        .put('/api/boards/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Board',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when board does not exist', async () => {
      const fakeBoardId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/boards/${fakeBoardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Board',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail when updating board owned by another user', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
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

      const response = await request(app)
        .put(`/api/boards/${otherBoard._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Board',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should update updatedAt timestamp', async () => {
      const originalBoard = await Board.findById(testBoard._id);
      const originalUpdatedAt = originalBoard.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .put(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Board',
        });

      expect(response.status).toBe(200);
      expect(new Date(response.body.data.updatedAt).getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });
});

describe('DELETE /api/boards/:id', () => {
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
      name: 'My Board',
      description: 'A test board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
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
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Authentication', () => {
    it('should fail without authentication token', async () => {
      const response = await request(app).delete(
        `/api/boards/${testBoard._id}`
      );

      expect(response.status).toBe(401);
    });
  });

  describe('Deleting Board', () => {
    it('should delete board by id', async () => {
      const response = await request(app)
        .delete(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      const deletedBoard = await Board.findById(testBoard._id);
      expect(deletedBoard).toBeNull();
    });

    it('should fail with invalid board id format', async () => {
      const response = await request(app)
        .delete('/api/boards/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when board does not exist', async () => {
      const fakeBoardId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/boards/${fakeBoardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail when deleting board owned by another user', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
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

      const response = await request(app)
        .delete(`/api/boards/${otherBoard._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should cascade delete all lists and cards when deleting board', async () => {
      // Create lists in the board
      const list1 = await List.create({
        name: 'Test List 1',
        workspaceId: testWorkspace._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 0,
      });

      const list2 = await List.create({
        name: 'Test List 2',
        workspaceId: testWorkspace._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 1,
      });

      // Create cards in the lists
      await Card.create({
        title: 'Card 1',
        listId: list1._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 0,
      });

      await Card.create({
        title: 'Card 2',
        listId: list2._id,
        boardId: testBoard._id,
        userId: testUser._id,
        position: 0,
      });

      // Delete the board
      const response = await request(app)
        .delete(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify board is deleted
      const deletedBoard = await Board.findById(testBoard._id);
      expect(deletedBoard).toBeNull();

      // Verify lists are deleted
      const deletedLists = await List.find({ boardId: testBoard._id });
      expect(deletedLists).toHaveLength(0);

      // Verify cards are deleted
      const deletedCards = await Card.find({ boardId: testBoard._id });
      expect(deletedCards).toHaveLength(0);
    });
  });
});
