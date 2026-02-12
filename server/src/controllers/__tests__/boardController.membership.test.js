import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { workspaceBoardRouter, boardRouter } from '../../routes/boardRoutes.js';
import auth from '../../middlewares/auth.js';
import User from '../../models/User.js';
import Workspace from '../../models/Workspace.js';
import WorkspaceMember from '../../models/WorkspaceMember.js';
import Board from '../../models/Board.js';
import errorHandler from '../../middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/workspaces/:workspaceId/boards', auth, workspaceBoardRouter);
app.use('/api/boards', auth, boardRouter);
app.use(errorHandler);

describe('Board Access - Workspace Members', () => {
  let mongoServer;
  let owner;
  let member;
  let admin;
  let viewer;
  let nonMember;
  let workspace;
  let ownerToken;
  let memberToken;
  let adminToken;
  let viewerToken;
  let nonMemberToken;

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
    // Create users
    owner = await User.create({
      username: 'owner',
      email: 'owner@example.com',
      password: 'password123',
    });

    member = await User.create({
      username: 'member',
      email: 'member@example.com',
      password: 'password123',
    });

    admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
    });

    viewer = await User.create({
      username: 'viewer',
      email: 'viewer@example.com',
      password: 'password123',
    });

    nonMember = await User.create({
      username: 'nonmember',
      email: 'nonmember@example.com',
      password: 'password123',
    });

    // Create workspace
    workspace = await Workspace.create({
      name: 'Test Workspace',
      userId: owner._id,
    });

    // Add members
    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: member._id,
      role: 'member',
      invitedBy: owner._id,
    });

    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: admin._id,
      role: 'admin',
      invitedBy: owner._id,
    });

    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: viewer._id,
      role: 'viewer',
      invitedBy: owner._id,
    });

    // Create tokens
    ownerToken = jwt.sign({ id: owner._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    memberToken = jwt.sign(
      { id: member._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    adminToken = jwt.sign({ id: admin._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    viewerToken = jwt.sign(
      { id: viewer._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    nonMemberToken = jwt.sign(
      { id: nonMember._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await Board.deleteMany({});
    await WorkspaceMember.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/workspaces/:workspaceId/boards - Member Access', () => {
    it('should allow workspace owner to create board', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspace._id}/boards`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Owner Board',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Owner Board');
    });

    it('should allow workspace member to create board', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspace._id}/boards`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Member Board',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Member Board');
      expect(response.body.data.userId.toString()).toBe(member._id.toString());
    });

    it('should allow workspace admin to create board', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspace._id}/boards`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Board',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Admin Board');
    });

    it('should allow workspace viewer to create board', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspace._id}/boards`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Viewer Board',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Viewer Board');
    });

    it('should deny access to non-member', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspace._id}/boards`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send({
          name: 'Non-Member Board',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('access');
    });
  });

  describe('GET /api/workspaces/:workspaceId/boards - Member Access', () => {
    beforeEach(async () => {
      // Create test boards
      await Board.create({
        name: 'Board 1',
        workspaceId: workspace._id,
        userId: owner._id,
      });
      await Board.create({
        name: 'Board 2',
        workspaceId: workspace._id,
        userId: member._id,
      });
    });

    it('should allow workspace owner to list boards', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspace._id}/boards`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should allow workspace member to list boards', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspace._id}/boards`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should allow workspace admin to list boards', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspace._id}/boards`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should allow workspace viewer to list boards', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspace._id}/boards`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should deny access to non-member', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspace._id}/boards`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/boards/:id - Member Access via Board', () => {
    let testBoard;

    beforeEach(async () => {
      testBoard = await Board.create({
        name: 'Test Board',
        workspaceId: workspace._id,
        userId: owner._id,
      });
    });

    it('should allow workspace owner to get board', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Board');
    });

    it('should allow workspace member to get board', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Board');
    });

    it('should allow workspace admin to get board', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow workspace viewer to get board', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny access to non-member', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/boards/:id - Member Access', () => {
    let testBoard;

    beforeEach(async () => {
      testBoard = await Board.create({
        name: 'Test Board',
        workspaceId: workspace._id,
        userId: owner._id,
      });
    });

    it('should allow workspace member to update board', async () => {
      const response = await request(app)
        .put(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Updated Board',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Board');
    });

    it('should allow workspace admin to update board', async () => {
      const response = await request(app)
        .put(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Updated',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny access to non-member', async () => {
      const response = await request(app)
        .put(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/boards/:id - Member Access', () => {
    let testBoard;

    beforeEach(async () => {
      testBoard = await Board.create({
        name: 'Test Board',
        workspaceId: workspace._id,
        userId: owner._id,
      });
    });

    it('should allow workspace owner to delete board', async () => {
      const response = await request(app)
        .delete(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow workspace member to delete board', async () => {
      const response = await request(app)
        .delete(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny access to non-member', async () => {
      const response = await request(app)
        .delete(`/api/boards/${testBoard._id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
