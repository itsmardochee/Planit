import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import List from '../List.js';
import Board from '../Board.js';
import Workspace from '../Workspace.js';
import User from '../User.js';

let mongoServer;
let testUser;
let testWorkspace;
let testBoard;

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
});

afterEach(async () => {
  await List.deleteMany({});
  await Board.deleteMany({});
  await Workspace.deleteMany({});
  await User.deleteMany({});
});

describe('List Model - Schema Validation', () => {
  it('should create a valid list with all required fields', async () => {
    const list = await List.create({
      name: 'Todo',
      description: 'Tasks to do',
      position: 0,
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    expect(list.name).toBe('Todo');
    expect(list.description).toBe('Tasks to do');
    expect(list.position).toBe(0);
    expect(list.workspaceId.toString()).toBe(testWorkspace._id.toString());
    expect(list.boardId.toString()).toBe(testBoard._id.toString());
    expect(list.userId.toString()).toBe(testUser._id.toString());
    expect(list.createdAt).toBeDefined();
    expect(list.updatedAt).toBeDefined();
  });

  it('should default position to 0 when not provided', async () => {
    const list = await List.create({
      name: 'Backlog',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    expect(list.position).toBe(0);
  });

  it('should fail validation when name is missing', async () => {
    const list = new List({
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    await expect(list.save()).rejects.toThrow();
  });

  it('should fail validation when workspaceId is missing', async () => {
    const list = new List({
      name: 'Todo',
      boardId: testBoard._id,
      userId: testUser._id,
    });

    await expect(list.save()).rejects.toThrow();
  });

  it('should fail validation when boardId is missing', async () => {
    const list = new List({
      name: 'Todo',
      workspaceId: testWorkspace._id,
      userId: testUser._id,
    });

    await expect(list.save()).rejects.toThrow();
  });

  it('should fail validation when userId is missing', async () => {
    const list = new List({
      name: 'Todo',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
    });

    await expect(list.save()).rejects.toThrow();
  });

  it('should enforce name max length of 100 characters', async () => {
    const list = new List({
      name: 'a'.repeat(101),
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    await expect(list.save()).rejects.toThrow();
  });

  it('should accept valid name with max length', async () => {
    const list = await List.create({
      name: 'a'.repeat(100),
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    expect(list.name).toHaveLength(100);
  });

  it('should enforce description max length of 500 characters', async () => {
    const list = new List({
      name: 'Todo',
      description: 'a'.repeat(501),
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    await expect(list.save()).rejects.toThrow();
  });

  it('should accept valid description with max length', async () => {
    const list = await List.create({
      name: 'Todo',
      description: 'a'.repeat(500),
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    expect(list.description).toHaveLength(500);
  });

  it('should enforce non-negative integer position', async () => {
    const list = new List({
      name: 'Todo',
      position: -1,
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    await expect(list.save()).rejects.toThrow();

    const list2 = new List({
      name: 'Todo',
      position: 1.5,
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    await expect(list2.save()).rejects.toThrow();
  });
});

describe('List Model - Relationships', () => {
  it('should populate workspace and board', async () => {
    const list = await List.create({
      name: 'Todo',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    const found = await List.findById(list._id)
      .populate('workspaceId')
      .populate('boardId')
      .populate('userId');

    expect(found.workspaceId._id.toString()).toBe(testWorkspace._id.toString());
    expect(found.boardId._id.toString()).toBe(testBoard._id.toString());
    expect(found.userId._id.toString()).toBe(testUser._id.toString());
  });

  it('should fail with invalid ObjectId types', async () => {
    await expect(
      new List({
        name: 'Todo',
        workspaceId: 'invalid',
        boardId: testBoard._id,
        userId: testUser._id,
      }).save()
    ).rejects.toThrow();

    await expect(
      new List({
        name: 'Todo',
        workspaceId: testWorkspace._id,
        boardId: 'invalid',
        userId: testUser._id,
      }).save()
    ).rejects.toThrow();

    await expect(
      new List({
        name: 'Todo',
        workspaceId: testWorkspace._id,
        boardId: testBoard._id,
        userId: 'invalid',
      }).save()
    ).rejects.toThrow();
  });
});

describe('List Model - Indexes and Timestamps', () => {
  it('should have indexes on (boardId, userId) and (boardId, position)', async () => {
    const indexes = List.schema.indexes();
    const idx1 = indexes.find(
      index => index[0].boardId !== undefined && index[0].userId !== undefined
    );
    const idx2 = indexes.find(
      index => index[0].boardId !== undefined && index[0].position !== undefined
    );
    expect(idx1).toBeDefined();
    expect(idx2).toBeDefined();
  });

  it('should add timestamps and update updatedAt on save', async () => {
    const list = await List.create({
      name: 'Todo',
      workspaceId: testWorkspace._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    expect(list.createdAt).toBeInstanceOf(Date);
    expect(list.updatedAt).toBeInstanceOf(Date);

    const oldUpdated = list.updatedAt;
    await new Promise(r => setTimeout(r, 100));
    list.name = 'Doing';
    await list.save();
    expect(list.updatedAt.getTime()).toBeGreaterThan(oldUpdated.getTime());
  });
});
