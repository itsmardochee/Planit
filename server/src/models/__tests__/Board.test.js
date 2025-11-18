import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Board from '../Board.js';
import Workspace from '../Workspace.js';
import User from '../User.js';

let mongoServer;
let testUser;
let testWorkspace;

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
});

afterEach(async () => {
  await Board.deleteMany({});
  await Workspace.deleteMany({});
  await User.deleteMany({});
});

describe('Board Model - Schema Validation', () => {
  it('should create a valid board with all required fields', async () => {
    const board = await Board.create({
      name: 'My Board',
      description: 'A test board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    expect(board.name).toBe('My Board');
    expect(board.description).toBe('A test board');
    expect(board.workspaceId.toString()).toBe(testWorkspace._id.toString());
    expect(board.userId.toString()).toBe(testUser._id.toString());
    expect(board.createdAt).toBeDefined();
    expect(board.updatedAt).toBeDefined();
  });

  it('should fail validation when name is missing', async () => {
    const board = new Board({
      description: 'A test board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    await expect(board.save()).rejects.toThrow();
  });

  it('should fail validation when workspaceId is missing', async () => {
    const board = new Board({
      name: 'My Board',
      description: 'A test board',
      userId: testUser._id,
    });

    await expect(board.save()).rejects.toThrow();
  });

  it('should fail validation when userId is missing', async () => {
    const board = new Board({
      name: 'My Board',
      description: 'A test board',
      workspaceId: testWorkspace._id,
    });

    await expect(board.save()).rejects.toThrow();
  });

  it('should allow description to be optional', async () => {
    const board = await Board.create({
      name: 'My Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    expect(board.description).toBeUndefined();
    expect(board.name).toBe('My Board');
  });

  it('should enforce name max length of 100 characters', async () => {
    const board = new Board({
      name: 'a'.repeat(101),
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    await expect(board.save()).rejects.toThrow();
  });

  it('should accept valid name with max length', async () => {
    const board = await Board.create({
      name: 'a'.repeat(100),
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    expect(board.name).toHaveLength(100);
  });

  it('should enforce description max length of 500 characters', async () => {
    const board = new Board({
      name: 'My Board',
      description: 'a'.repeat(501),
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    await expect(board.save()).rejects.toThrow();
  });

  it('should accept valid description with max length', async () => {
    const board = await Board.create({
      name: 'My Board',
      description: 'a'.repeat(500),
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    expect(board.description).toHaveLength(500);
  });
});

describe('Board Model - Workspace Relationship', () => {
  it('should reference a valid workspace', async () => {
    const board = await Board.create({
      name: 'My Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    const foundBoard = await Board.findById(board._id).populate('workspaceId');

    expect(foundBoard.workspaceId._id.toString()).toBe(
      testWorkspace._id.toString()
    );
    expect(foundBoard.workspaceId.name).toBe('Test Workspace');
  });

  it('should fail validation with invalid ObjectId for workspaceId', async () => {
    const board = new Board({
      name: 'My Board',
      workspaceId: 'invalid-id',
      userId: testUser._id,
    });

    await expect(board.save()).rejects.toThrow();
  });

  it('should allow multiple boards for the same workspace', async () => {
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

    const boards = await Board.find({ workspaceId: testWorkspace._id });
    expect(boards).toHaveLength(2);
  });
});

describe('Board Model - User Relationship', () => {
  it('should reference a valid user', async () => {
    const board = await Board.create({
      name: 'My Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    const foundBoard = await Board.findById(board._id).populate('userId');

    expect(foundBoard.userId._id.toString()).toBe(testUser._id.toString());
    expect(foundBoard.userId.username).toBe('testuser');
  });

  it('should fail validation with invalid ObjectId for userId', async () => {
    const board = new Board({
      name: 'My Board',
      workspaceId: testWorkspace._id,
      userId: 'invalid-id',
    });

    await expect(board.save()).rejects.toThrow();
  });

  it('should allow multiple boards for the same user', async () => {
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

    const boards = await Board.find({ userId: testUser._id });
    expect(boards).toHaveLength(2);
  });
});

describe('Board Model - Compound Indexes', () => {
  it('should have compound index on workspaceId and userId', async () => {
    const indexes = Board.schema.indexes();
    const compoundIndex = indexes.find(
      index =>
        index[0].workspaceId !== undefined && index[0].userId !== undefined
    );

    expect(compoundIndex).toBeDefined();
  });
});

describe('Board Model - Timestamps', () => {
  it('should automatically add createdAt and updatedAt timestamps', async () => {
    const board = await Board.create({
      name: 'My Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    expect(board.createdAt).toBeInstanceOf(Date);
    expect(board.updatedAt).toBeInstanceOf(Date);
  });

  it('should update updatedAt timestamp on modification', async () => {
    const board = await Board.create({
      name: 'My Board',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    const originalUpdatedAt = board.updatedAt;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));

    board.name = 'Updated Board';
    await board.save();

    expect(board.updatedAt.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    );
  });
});
