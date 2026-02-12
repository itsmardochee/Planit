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
import errorHandler from '../../middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/workspaces', auth, workspaceRoutes);
app.use(errorHandler);

describe('POST /api/workspaces/:id/invite', () => {
  let mongoServer;
  let ownerUser;
  let invitedUser;
  let testWorkspace;
  let ownerToken;

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
    ownerUser = await User.create({
      username: 'owner',
      email: 'owner@example.com',
      password: 'password123',
    });

    invitedUser = await User.create({
      username: 'invitee',
      email: 'invitee@example.com',
      password: 'password123',
    });

    testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      description: 'A test workspace',
      userId: ownerUser._id,
    });

    ownerToken = jwt.sign(
      { id: ownerUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await WorkspaceMember.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Input Validation', () => {
    it('should fail when neither email nor username is provided', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          role: 'member',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email or username');
    });

    it('should fail when user with given email does not exist', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: 'nonexistent@example.com',
          role: 'member',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should fail when user with given username does not exist', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          username: 'nonexistent_username',
          role: 'member',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should fail when workspaceId is invalid ObjectId', async () => {
      const response = await request(app)
        .post('/api/workspaces/invalid-id/invite')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: invitedUser.email,
          role: 'member',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should fail when role is invalid', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: invitedUser.email,
          role: 'super-admin',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('role');
    });

    it('should default to "member" role when role is not specified', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: invitedUser.email,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('member');
    });
  });

  describe('Authorization', () => {
    it('should fail when user is not authenticated', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .send({
          userId: invitedUser._id.toString(),
          role: 'member',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail when workspace does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/workspaces/${fakeId}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: invitedUser.email,
          role: 'member',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Workspace not found');
    });

    it('should fail when user is not the workspace owner', async () => {
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

      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          email: invitedUser.email,
          role: 'member',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not authorized');
    });
  });

  describe('Business Logic', () => {
    it('should successfully invite a user to workspace', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: invitedUser.email,
          role: 'member',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.workspaceId).toBe(testWorkspace._id.toString());
      expect(response.body.data.userId).toBe(invitedUser._id.toString());
      expect(response.body.data.role).toBe('member');
      expect(response.body.data.invitedBy).toBe(ownerUser._id.toString());
      expect(response.body.data.invitedAt).toBeDefined();
    });

    it('should successfully invite a user by username', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          username: invitedUser.username,
          role: 'member',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.workspaceId).toBe(testWorkspace._id.toString());
      expect(response.body.data.userId).toBe(invitedUser._id.toString());
      expect(response.body.data.role).toBe('member');
      expect(response.body.data.invitedBy).toBe(ownerUser._id.toString());
      expect(response.body.data.invitedAt).toBeDefined();
    });

    it('should successfully invite a user with admin role', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: invitedUser.email,
          role: 'admin',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('admin');
    });

    it('should fail when trying to invite a user that is already a member', async () => {
      // First invitation
      await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: invitedUser.email,
          role: 'member',
        });

      // Second invitation (duplicate)
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: invitedUser.email,
          role: 'admin',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already a member');
    });

    it('should fail when invited user does not exist', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: 'nonexistent@example.com',
          role: 'member',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should save the invitation to database', async () => {
      await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: invitedUser.email,
          role: 'member',
        });

      const member = await WorkspaceMember.findOne({
        workspaceId: testWorkspace._id,
        userId: invitedUser._id,
      });

      expect(member).toBeDefined();
      expect(member.role).toBe('member');
      expect(member.invitedBy.toString()).toBe(ownerUser._id.toString());
    });
  });
});

describe('GET /api/workspaces/:id/members', () => {
  let mongoServer;
  let ownerUser;
  let member1;
  let member2;
  let testWorkspace;
  let ownerToken;

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
    ownerUser = await User.create({
      username: 'owner',
      email: 'owner@example.com',
      password: 'password123',
    });

    member1 = await User.create({
      username: 'member1',
      email: 'member1@example.com',
      password: 'password123',
    });

    member2 = await User.create({
      username: 'member2',
      email: 'member2@example.com',
      password: 'password123',
    });

    testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      description: 'A test workspace',
      userId: ownerUser._id,
    });

    ownerToken = jwt.sign(
      { id: ownerUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await WorkspaceMember.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Authorization', () => {
    it('should fail when user is not authenticated', async () => {
      const response = await request(app).get(
        `/api/workspaces/${testWorkspace._id}/members`
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail when workspace does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/workspaces/${fakeId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail when workspaceId is invalid', async () => {
      const response = await request(app)
        .get('/api/workspaces/invalid-id/members')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Business Logic', () => {
    it('should return empty array when workspace has no members', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/members`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return all members of the workspace', async () => {
      await WorkspaceMember.create({
        workspaceId: testWorkspace._id,
        userId: member1._id,
        role: 'member',
        invitedBy: ownerUser._id,
      });

      await WorkspaceMember.create({
        workspaceId: testWorkspace._id,
        userId: member2._id,
        role: 'admin',
        invitedBy: ownerUser._id,
      });

      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/members`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should populate user information in members list', async () => {
      await WorkspaceMember.create({
        workspaceId: testWorkspace._id,
        userId: member1._id,
        role: 'member',
        invitedBy: ownerUser._id,
      });

      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/members`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].userId).toBeDefined();
      expect(response.body.data[0].userId.username).toBe('member1');
      expect(response.body.data[0].userId.email).toBe('member1@example.com');
    });

    it('should populate invitedBy information', async () => {
      await WorkspaceMember.create({
        workspaceId: testWorkspace._id,
        userId: member1._id,
        role: 'member',
        invitedBy: ownerUser._id,
      });

      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/members`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].invitedBy).toBeDefined();
      expect(response.body.data[0].invitedBy.username).toBe('owner');
    });
  });
});

describe('DELETE /api/workspaces/:id/members/:userId', () => {
  let mongoServer;
  let ownerUser;
  let memberUser;
  let testWorkspace;
  let ownerToken;
  let memberToken;

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
    ownerUser = await User.create({
      username: 'owner',
      email: 'owner@example.com',
      password: 'password123',
    });

    memberUser = await User.create({
      username: 'member',
      email: 'member@example.com',
      password: 'password123',
    });

    testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      description: 'A test workspace',
      userId: ownerUser._id,
    });

    ownerToken = jwt.sign(
      { id: ownerUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    memberToken = jwt.sign(
      { id: memberUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await WorkspaceMember.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('Authorization', () => {
    it('should fail when user is not authenticated', async () => {
      const response = await request(app).delete(
        `/api/workspaces/${testWorkspace._id}/members/${memberUser._id}`
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail when workspace does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/workspaces/${fakeId}/members/${memberUser._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail when user is not the workspace owner', async () => {
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

      const response = await request(app)
        .delete(
          `/api/workspaces/${testWorkspace._id}/members/${memberUser._id}`
        )
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail when workspaceId is invalid', async () => {
      const response = await request(app)
        .delete(`/api/workspaces/invalid-id/members/${memberUser._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when userId is invalid', async () => {
      const response = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}/members/invalid-id`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Business Logic', () => {
    beforeEach(async () => {
      await WorkspaceMember.create({
        workspaceId: testWorkspace._id,
        userId: memberUser._id,
        role: 'member',
        invitedBy: ownerUser._id,
      });
    });

    it('should successfully remove a member from workspace', async () => {
      const response = await request(app)
        .delete(
          `/api/workspaces/${testWorkspace._id}/members/${memberUser._id}`
        )
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');
    });

    it('should delete member from database', async () => {
      await request(app)
        .delete(
          `/api/workspaces/${testWorkspace._id}/members/${memberUser._id}`
        )
        .set('Authorization', `Bearer ${ownerToken}`);

      const member = await WorkspaceMember.findOne({
        workspaceId: testWorkspace._id,
        userId: memberUser._id,
      });

      expect(member).toBeNull();
    });

    it('should fail when member does not exist in workspace', async () => {
      const anotherUser = await User.create({
        username: 'another',
        email: 'another@example.com',
        password: 'password123',
      });

      const response = await request(app)
        .delete(
          `/api/workspaces/${testWorkspace._id}/members/${anotherUser._id}`
        )
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should allow member to remove themselves from workspace', async () => {
      const response = await request(app)
        .delete(
          `/api/workspaces/${testWorkspace._id}/members/${memberUser._id}`
        )
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
