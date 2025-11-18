import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
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
    workspaceId: testWorkspace._id,
    boardId: testBoard._id,
    userId: testUser._id,
    position: 0,
  });
});

afterEach(async () => {
  await Card.deleteMany({});
  await List.deleteMany({});
  await Board.deleteMany({});
  await Workspace.deleteMany({});
  await User.deleteMany({});
});

describe('Card Model - Schema Validation', () => {
  it('should create a valid card with all required fields', async () => {
    const card = await Card.create({
      title: 'Implement login',
      description: 'Create JWT-based authentication',
      position: 0,
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    expect(card.title).toBe('Implement login');
    expect(card.description).toBe('Create JWT-based authentication');
    expect(card.position).toBe(0);
    expect(card.listId.toString()).toBe(testList._id.toString());
    expect(card.boardId.toString()).toBe(testBoard._id.toString());
    expect(card.userId.toString()).toBe(testUser._id.toString());
    expect(card.createdAt).toBeDefined();
    expect(card.updatedAt).toBeDefined();
  });

  it('should default position to 0 when not provided', async () => {
    const card = await Card.create({
      title: 'Fix bug',
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    expect(card.position).toBe(0);
  });

  it('should fail validation when title is missing', async () => {
    const card = new Card({
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    await expect(card.save()).rejects.toThrow();
  });

  it('should fail validation when listId is missing', async () => {
    const card = new Card({
      title: 'Test Card',
      boardId: testBoard._id,
      userId: testUser._id,
    });

    await expect(card.save()).rejects.toThrow();
  });

  it('should fail validation when boardId is missing', async () => {
    const card = new Card({
      title: 'Test Card',
      listId: testList._id,
      userId: testUser._id,
    });

    await expect(card.save()).rejects.toThrow();
  });

  it('should fail validation when userId is missing', async () => {
    const card = new Card({
      title: 'Test Card',
      listId: testList._id,
      boardId: testBoard._id,
    });

    await expect(card.save()).rejects.toThrow();
  });

  it('should trim whitespace from title', async () => {
    const card = await Card.create({
      title: '  Implement feature  ',
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    expect(card.title).toBe('Implement feature');
  });

  it('should trim whitespace from description', async () => {
    const card = await Card.create({
      title: 'Test Card',
      description: '  Some description  ',
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    expect(card.description).toBe('Some description');
  });

  it('should enforce maximum length on title', async () => {
    const longTitle = 'a'.repeat(201);
    const card = new Card({
      title: longTitle,
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    await expect(card.save()).rejects.toThrow();
  });

  it('should enforce maximum length on description', async () => {
    const longDescription = 'a'.repeat(2001);
    const card = new Card({
      title: 'Test Card',
      description: longDescription,
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    await expect(card.save()).rejects.toThrow();
  });

  it('should require position to be a non-negative integer', async () => {
    const card = new Card({
      title: 'Test Card',
      position: -1,
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    await expect(card.save()).rejects.toThrow();
  });

  it('should require position to be an integer', async () => {
    const card = new Card({
      title: 'Test Card',
      position: 3.14,
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    await expect(card.save()).rejects.toThrow();
  });

  it('should allow description to be optional', async () => {
    const card = await Card.create({
      title: 'Simple Card',
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    expect(card.description).toBeUndefined();
  });
});

describe('Card Model - Indexes', () => {
  it('should have an index on listId and userId', async () => {
    const indexes = Card.schema.indexes();
    const hasListUserIndex = indexes.some(
      index => index[0].listId === 1 && index[0].userId === 1
    );

    expect(hasListUserIndex).toBe(true);
  });

  it('should have an index on listId and position', async () => {
    const indexes = Card.schema.indexes();
    const hasListPositionIndex = indexes.some(
      index => index[0].listId === 1 && index[0].position === 1
    );

    expect(hasListPositionIndex).toBe(true);
  });
});

describe('Card Model - Timestamps', () => {
  it('should have createdAt and updatedAt timestamps', async () => {
    const card = await Card.create({
      title: 'Timestamped Card',
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    expect(card.createdAt).toBeInstanceOf(Date);
    expect(card.updatedAt).toBeInstanceOf(Date);
  });

  it('should update updatedAt timestamp when card is modified', async () => {
    const card = await Card.create({
      title: 'Original Title',
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
    });

    const originalUpdatedAt = card.updatedAt;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    card.title = 'Updated Title';
    await card.save();

    expect(card.updatedAt.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    );
  });
});
