import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import checkWorkspaceAccess from '../checkWorkspaceAccess.js';
import User from '../../models/User.js';
import Workspace from '../../models/Workspace.js';
import WorkspaceMember from '../../models/WorkspaceMember.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await WorkspaceMember.deleteMany({});
  await Workspace.deleteMany({});
  await User.deleteMany({});
});

describe('checkWorkspaceAccess Middleware', () => {
  let owner;
  let member;
  let nonMember;
  let workspace;
  let req;
  let res;
  let next;

  beforeEach(async () => {
    // Create test users
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

    nonMember = await User.create({
      username: 'nonmember',
      email: 'nonmember@example.com',
      password: 'password123',
    });

    // Create test workspace
    workspace = await Workspace.create({
      name: 'Test Workspace',
      description: 'A test workspace',
      userId: owner._id,
    });

    // Add member to workspace
    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: member._id,
      role: 'member',
      invitedBy: owner._id,
    });

    // Mock Express req, res, next
    req = {
      params: {},
      user: {},
    };

    res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      },
    };

    next = () => {
      next.called = true;
    };
    next.called = false;
  });

  describe('Workspace Owner Access', () => {
    it('should allow workspace owner to access', async () => {
      req.params.workspaceId = workspace._id.toString();
      req.user._id = owner._id;

      await checkWorkspaceAccess(req, res, next);

      expect(next.called).toBe(true);
      expect(res.statusCode).toBeNull();
      expect(req.workspace).toBeDefined();
      expect(req.workspace._id.toString()).toBe(workspace._id.toString());
      expect(req.isWorkspaceOwner).toBe(true);
    });

    it('should set isWorkspaceOwner to true for owner', async () => {
      req.params.workspaceId = workspace._id.toString();
      req.user._id = owner._id;

      await checkWorkspaceAccess(req, res, next);

      expect(req.isWorkspaceOwner).toBe(true);
    });
  });

  describe('Workspace Member Access', () => {
    it('should allow workspace member to access', async () => {
      req.params.workspaceId = workspace._id.toString();
      req.user._id = member._id;

      await checkWorkspaceAccess(req, res, next);

      expect(next.called).toBe(true);
      expect(res.statusCode).toBeNull();
      expect(req.workspace).toBeDefined();
      expect(req.isWorkspaceOwner).toBe(false);
    });

    it('should set member role in request', async () => {
      req.params.workspaceId = workspace._id.toString();
      req.user._id = member._id;

      await checkWorkspaceAccess(req, res, next);

      expect(req.memberRole).toBe('member');
    });

    it('should allow admin member to access', async () => {
      // Create admin member
      const admin = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
      });

      await WorkspaceMember.create({
        workspaceId: workspace._id,
        userId: admin._id,
        role: 'admin',
        invitedBy: owner._id,
      });

      req.params.workspaceId = workspace._id.toString();
      req.user._id = admin._id;

      await checkWorkspaceAccess(req, res, next);

      expect(next.called).toBe(true);
      expect(req.memberRole).toBe('admin');
    });

    it('should allow viewer member to access', async () => {
      // Create viewer member
      const viewer = await User.create({
        username: 'viewer',
        email: 'viewer@example.com',
        password: 'password123',
      });

      await WorkspaceMember.create({
        workspaceId: workspace._id,
        userId: viewer._id,
        role: 'viewer',
        invitedBy: owner._id,
      });

      req.params.workspaceId = workspace._id.toString();
      req.user._id = viewer._id;

      await checkWorkspaceAccess(req, res, next);

      expect(next.called).toBe(true);
      expect(req.memberRole).toBe('viewer');
    });
  });

  describe('Non-Member Access Denial', () => {
    it('should deny access to non-member', async () => {
      req.params.workspaceId = workspace._id.toString();
      req.user._id = nonMember._id;

      await checkWorkspaceAccess(req, res, next);

      expect(next.called).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual({
        success: false,
        message: 'You do not have access to this workspace',
      });
    });

    it('should not set workspace in request for non-member', async () => {
      req.params.workspaceId = workspace._id.toString();
      req.user._id = nonMember._id;

      await checkWorkspaceAccess(req, res, next);

      expect(req.workspace).toBeUndefined();
    });
  });

  describe('Validation and Error Handling', () => {
    it('should return 400 for invalid workspace ID format', async () => {
      req.params.workspaceId = 'invalid-id';
      req.user._id = owner._id;

      await checkWorkspaceAccess(req, res, next);

      expect(next.called).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Invalid workspace ID format',
      });
    });

    it('should return 404 if workspace does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      req.params.workspaceId = fakeId.toString();
      req.user._id = owner._id;

      await checkWorkspaceAccess(req, res, next);

      expect(next.called).toBe(false);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({
        success: false,
        message: 'Workspace not found',
      });
    });

    it('should handle missing workspaceId parameter', async () => {
      req.params.workspaceId = undefined;
      req.user._id = owner._id;

      await checkWorkspaceAccess(req, res, next);

      expect(res.statusCode).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      req.params.workspaceId = workspace._id.toString();
      req.user._id = owner._id;

      // Mock Workspace.findById to throw an error
      const originalFindById = Workspace.findById;
      Workspace.findById = () => Promise.reject(new Error('Database error'));

      await checkWorkspaceAccess(req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Database error',
      });

      // Restore original method
      Workspace.findById = originalFindById;
    });
  });

  describe('Alternative Parameter Names', () => {
    it('should check :id parameter if workspaceId not present', async () => {
      req.params.id = workspace._id.toString();
      req.user._id = owner._id;

      await checkWorkspaceAccess(req, res, next);

      expect(next.called).toBe(true);
      expect(req.workspace).toBeDefined();
    });

    it('should prioritize workspaceId over id parameter', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      req.params.workspaceId = workspace._id.toString();
      req.params.id = fakeId.toString();
      req.user._id = owner._id;

      await checkWorkspaceAccess(req, res, next);

      expect(next.called).toBe(true);
      expect(req.workspace._id.toString()).toBe(workspace._id.toString());
    });
  });

  describe('Board-level access via boardId', () => {
    it('should resolve workspace from boardId parameter', async () => {
      const Board = (await import('../../models/Board.js')).default;
      
      const board = await Board.create({
        name: 'Test Board',
        workspaceId: workspace._id,
        userId: owner._id,
      });

      req.params.boardId = board._id.toString();
      req.user._id = member._id;

      await checkWorkspaceAccess(req, res, next);

      expect(next.called).toBe(true);
      expect(req.workspace).toBeDefined();
      expect(req.workspace._id.toString()).toBe(workspace._id.toString());
    });
  });
});
