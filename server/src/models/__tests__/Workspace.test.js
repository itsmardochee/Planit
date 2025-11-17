import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Workspace from '../Workspace.js';
import User from '../User.js';

describe('Workspace Model - Schema Validation', () => {
  let mongoServer;
  let testUser;

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
    // Create a test user for workspace relationships
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  afterEach(async () => {
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should create a valid workspace with all required fields', async () => {
    const workspace = await Workspace.create({
      name: 'My Workspace',
      description: 'A test workspace',
      userId: testUser._id,
    });

    expect(workspace.name).toBe('My Workspace');
    expect(workspace.description).toBe('A test workspace');
    expect(workspace.userId.toString()).toBe(testUser._id.toString());
    expect(workspace.createdAt).toBeDefined();
    expect(workspace.updatedAt).toBeDefined();
  });

  it('should fail validation when name is missing', async () => {
    const workspace = new Workspace({
      description: 'A test workspace',
      userId: testUser._id,
    });

    await expect(workspace.save()).rejects.toThrow();
  });

  it('should fail validation when userId is missing', async () => {
    const workspace = new Workspace({
      name: 'My Workspace',
      description: 'A test workspace',
    });

    await expect(workspace.save()).rejects.toThrow();
  });

  it('should allow description to be optional', async () => {
    const workspace = await Workspace.create({
      name: 'My Workspace',
      userId: testUser._id,
    });

    expect(workspace.description).toBeUndefined();
    expect(workspace.name).toBe('My Workspace');
  });

  it('should enforce name max length of 100 characters', async () => {
    const workspace = new Workspace({
      name: 'a'.repeat(101),
      userId: testUser._id,
    });

    await expect(workspace.save()).rejects.toThrow();
  });

  it('should accept valid name with max length', async () => {
    const workspace = await Workspace.create({
      name: 'a'.repeat(100),
      userId: testUser._id,
    });

    expect(workspace.name).toHaveLength(100);
  });

  it('should enforce description max length of 500 characters', async () => {
    const workspace = new Workspace({
      name: 'My Workspace',
      description: 'a'.repeat(501),
      userId: testUser._id,
    });

    await expect(workspace.save()).rejects.toThrow();
  });

  it('should accept valid description with max length', async () => {
    const workspace = await Workspace.create({
      name: 'My Workspace',
      description: 'a'.repeat(500),
      userId: testUser._id,
    });

    expect(workspace.description).toHaveLength(500);
  });
});

describe('Workspace Model - User Relationship', () => {
  let mongoServer;
  let testUser;

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
  });

  afterEach(async () => {
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should reference a valid user', async () => {
    const workspace = await Workspace.create({
      name: 'My Workspace',
      userId: testUser._id,
    });

    const foundWorkspace = await Workspace.findById(workspace._id).populate(
      'userId'
    );

    expect(foundWorkspace.userId._id.toString()).toBe(testUser._id.toString());
    expect(foundWorkspace.userId.username).toBe('testuser');
  });

  it('should fail validation with invalid ObjectId for userId', async () => {
    const workspace = new Workspace({
      name: 'My Workspace',
      userId: 'invalid-id',
    });

    await expect(workspace.save()).rejects.toThrow();
  });

  it('should allow multiple workspaces for the same user', async () => {
    await Workspace.create({
      name: 'Workspace 1',
      userId: testUser._id,
    });

    await Workspace.create({
      name: 'Workspace 2',
      userId: testUser._id,
    });

    const workspaces = await Workspace.find({ userId: testUser._id });
    expect(workspaces).toHaveLength(2);
  });
});

describe('Workspace Model - Timestamps', () => {
  let mongoServer;
  let testUser;

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
  });

  afterEach(async () => {
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should automatically add createdAt and updatedAt timestamps', async () => {
    const workspace = await Workspace.create({
      name: 'My Workspace',
      userId: testUser._id,
    });

    expect(workspace.createdAt).toBeInstanceOf(Date);
    expect(workspace.updatedAt).toBeInstanceOf(Date);
  });

  it('should update updatedAt timestamp on modification', async () => {
    const workspace = await Workspace.create({
      name: 'My Workspace',
      userId: testUser._id,
    });

    const originalUpdatedAt = workspace.updatedAt;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));

    workspace.name = 'Updated Workspace';
    await workspace.save();

    expect(workspace.updatedAt.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    );
  });
});
