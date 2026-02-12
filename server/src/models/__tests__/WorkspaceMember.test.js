import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import WorkspaceMember from '../WorkspaceMember.js';
import User from '../User.js';
import Workspace from '../Workspace.js';

let mongoServer;
let testUser;
let testWorkspace;
let invitedByUser;

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

  invitedByUser = await User.create({
    username: 'inviter',
    email: 'inviter@example.com',
    password: 'password123',
  });

  testWorkspace = await Workspace.create({
    name: 'Test Workspace',
    description: 'A test workspace',
    userId: invitedByUser._id,
  });
});

afterEach(async () => {
  await WorkspaceMember.deleteMany({});
  await Workspace.deleteMany({});
  await User.deleteMany({});
});

describe('WorkspaceMember Model - Schema Validation', () => {
  it('should create a valid workspace member with all required fields', async () => {
    const member = await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'member',
      invitedBy: invitedByUser._id,
    });

    expect(member.workspaceId.toString()).toBe(testWorkspace._id.toString());
    expect(member.userId.toString()).toBe(testUser._id.toString());
    expect(member.role).toBe('member');
    expect(member.invitedBy.toString()).toBe(invitedByUser._id.toString());
    expect(member.invitedAt).toBeDefined();
    expect(member.createdAt).toBeDefined();
    expect(member.updatedAt).toBeDefined();
  });

  it('should fail validation when workspaceId is missing', async () => {
    const member = new WorkspaceMember({
      userId: testUser._id,
      role: 'member',
      invitedBy: invitedByUser._id,
    });

    await expect(member.save()).rejects.toThrow();
  });

  it('should fail validation when userId is missing', async () => {
    const member = new WorkspaceMember({
      workspaceId: testWorkspace._id,
      role: 'member',
      invitedBy: invitedByUser._id,
    });

    await expect(member.save()).rejects.toThrow();
  });

  it('should fail validation when invitedBy is missing', async () => {
    const member = new WorkspaceMember({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'member',
    });

    await expect(member.save()).rejects.toThrow();
  });

  it('should default role to "member" when not specified', async () => {
    const member = await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      invitedBy: invitedByUser._id,
    });

    expect(member.role).toBe('member');
  });

  it('should accept valid role values', async () => {
    const roles = ['owner', 'admin', 'member', 'viewer'];

    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const tempUser = await User.create({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: 'password123',
      });

      const member = await WorkspaceMember.create({
        workspaceId: testWorkspace._id,
        userId: tempUser._id,
        role,
        invitedBy: invitedByUser._id,
      });

      expect(member.role).toBe(role);
    }
  });

  it('should reject invalid role values', async () => {
    const member = new WorkspaceMember({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'invalid-role',
      invitedBy: invitedByUser._id,
    });

    await expect(member.save()).rejects.toThrow();
  });

  it('should automatically set invitedAt timestamp', async () => {
    const before = new Date();
    const member = await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'member',
      invitedBy: invitedByUser._id,
    });
    const after = new Date();

    expect(member.invitedAt).toBeDefined();
    expect(member.invitedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(member.invitedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should allow joinedAt to be optional', async () => {
    const member = await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'member',
      invitedBy: invitedByUser._id,
    });

    expect(member.joinedAt).toBeUndefined();
  });

  it('should allow setting joinedAt when invitation is accepted', async () => {
    const joinedDate = new Date();
    const member = await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'member',
      invitedBy: invitedByUser._id,
      joinedAt: joinedDate,
    });

    expect(member.joinedAt).toBeDefined();
    expect(member.joinedAt.getTime()).toBe(joinedDate.getTime());
  });
});

describe('WorkspaceMember Model - Indexes', () => {
  it('should have compound index on workspaceId and userId', async () => {
    const indexes = WorkspaceMember.schema.indexes();
    const compoundIndex = indexes.find(
      index => index[0].workspaceId === 1 && index[0].userId === 1
    );

    expect(compoundIndex).toBeDefined();
  });

  it('should prevent duplicate membership for same user in same workspace', async () => {
    await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'member',
      invitedBy: invitedByUser._id,
    });

    // Try to create duplicate
    const duplicate = new WorkspaceMember({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'admin',
      invitedBy: invitedByUser._id,
    });

    await expect(duplicate.save()).rejects.toThrow();
  });
});

describe('WorkspaceMember Model - References', () => {
  it('should populate workspaceId reference', async () => {
    const member = await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'member',
      invitedBy: invitedByUser._id,
    });

    const populated = await WorkspaceMember.findById(member._id).populate(
      'workspaceId'
    );

    expect(populated.workspaceId.name).toBe('Test Workspace');
    expect(populated.workspaceId.description).toBe('A test workspace');
  });

  it('should populate userId reference', async () => {
    const member = await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'member',
      invitedBy: invitedByUser._id,
    });

    const populated = await WorkspaceMember.findById(member._id).populate(
      'userId'
    );

    expect(populated.userId.username).toBe('testuser');
    expect(populated.userId.email).toBe('test@example.com');
  });

  it('should populate invitedBy reference', async () => {
    const member = await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'member',
      invitedBy: invitedByUser._id,
    });

    const populated = await WorkspaceMember.findById(member._id).populate(
      'invitedBy'
    );

    expect(populated.invitedBy.username).toBe('inviter');
    expect(populated.invitedBy.email).toBe('inviter@example.com');
  });
});

describe('WorkspaceMember Model - Business Logic', () => {
  it('should allow querying members by workspaceId', async () => {
    const user2 = await User.create({
      username: 'user2',
      email: 'user2@example.com',
      password: 'password123',
    });

    await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'member',
      invitedBy: invitedByUser._id,
    });

    await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: user2._id,
      role: 'admin',
      invitedBy: invitedByUser._id,
    });

    const members = await WorkspaceMember.find({
      workspaceId: testWorkspace._id,
    });

    expect(members).toHaveLength(2);
  });

  it('should allow querying members by role', async () => {
    await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'admin',
      invitedBy: invitedByUser._id,
    });

    const admins = await WorkspaceMember.find({ role: 'admin' });

    expect(admins).toHaveLength(1);
    expect(admins[0].role).toBe('admin');
  });

  it('should allow updating member role', async () => {
    const member = await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: testUser._id,
      role: 'member',
      invitedBy: invitedByUser._id,
    });

    member.role = 'admin';
    await member.save();

    const updated = await WorkspaceMember.findById(member._id);
    expect(updated.role).toBe('admin');
  });
});
