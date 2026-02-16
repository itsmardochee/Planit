import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Comment from '../Comment.js';
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
let testCard;

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
    boardId: testBoard._id,
    workspaceId: testWorkspace._id,
    userId: testUser._id,
    position: 0,
  });
  testCard = await Card.create({
    title: 'Test Card',
    listId: testList._id,
    boardId: testBoard._id,
    userId: testUser._id,
    position: 0,
  });
});

afterEach(async () => {
  await Comment.deleteMany({});
  await Card.deleteMany({});
  await List.deleteMany({});
  await Board.deleteMany({});
  await Workspace.deleteMany({});
  await User.deleteMany({});
});

describe('Comment Model - Schema Validation', () => {
  it('should create a valid comment with all required fields', async () => {
    const comment = await Comment.create({
      content: 'This is a comment',
      cardId: testCard._id,
      userId: testUser._id,
    });

    expect(comment.content).toBe('This is a comment');
    expect(comment.cardId.toString()).toBe(testCard._id.toString());
    expect(comment.userId.toString()).toBe(testUser._id.toString());
    expect(comment.createdAt).toBeDefined();
    expect(comment.updatedAt).toBeDefined();
  });

  it('should fail validation when content is missing', async () => {
    const comment = new Comment({
      cardId: testCard._id,
      userId: testUser._id,
    });

    await expect(comment.validate()).rejects.toThrow();
  });

  it('should fail validation when cardId is missing', async () => {
    const comment = new Comment({
      content: 'A comment',
      userId: testUser._id,
    });

    await expect(comment.validate()).rejects.toThrow();
  });

  it('should fail validation when userId is missing', async () => {
    const comment = new Comment({
      content: 'A comment',
      cardId: testCard._id,
    });

    await expect(comment.validate()).rejects.toThrow();
  });

  it('should fail validation when content exceeds 5000 characters', async () => {
    const comment = new Comment({
      content: 'a'.repeat(5001),
      cardId: testCard._id,
      userId: testUser._id,
    });

    await expect(comment.validate()).rejects.toThrow();
  });

  it('should accept content at exactly 5000 characters', async () => {
    const comment = await Comment.create({
      content: 'a'.repeat(5000),
      cardId: testCard._id,
      userId: testUser._id,
    });

    expect(comment.content).toHaveLength(5000);
  });

  it('should trim content whitespace', async () => {
    const comment = await Comment.create({
      content: '  trimmed content  ',
      cardId: testCard._id,
      userId: testUser._id,
    });

    expect(comment.content).toBe('trimmed content');
  });

  it('should have timestamps enabled', async () => {
    const comment = await Comment.create({
      content: 'Timestamped comment',
      cardId: testCard._id,
      userId: testUser._id,
    });

    expect(comment.createdAt).toBeInstanceOf(Date);
    expect(comment.updatedAt).toBeInstanceOf(Date);
  });
});

describe('Comment Model - Index', () => {
  it('should have an index on cardId and createdAt', () => {
    const indexes = Comment.schema.indexes();
    const hasIndex = indexes.some(
      ([fields]) => fields.cardId === 1 && fields.createdAt === -1
    );
    expect(hasIndex).toBe(true);
  });
});
