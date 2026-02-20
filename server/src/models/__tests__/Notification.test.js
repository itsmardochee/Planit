import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Notification from '../../models/Notification.js';
import User from '../../models/User.js';
import Card from '../../models/Card.js';
import List from '../../models/List.js';
import Board from '../../models/Board.js';
import Workspace from '../../models/Workspace.js';

describe('Notification Model', () => {
  let mongoServer;
  let testUser;
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
    const workspace = await Workspace.create({
      name: 'Test Workspace',
      userId: testUser._id,
    });
    const board = await Board.create({
      name: 'Test Board',
      workspaceId: workspace._id,
      userId: testUser._id,
    });
    const list = await List.create({
      name: 'Test List',
      workspaceId: workspace._id,
      boardId: board._id,
      userId: testUser._id,
      position: 0,
    });
    testCard = await Card.create({
      title: 'Test Card',
      listId: list._id,
      boardId: board._id,
      userId: testUser._id,
      position: 0,
    });
  });

  afterEach(async () => {
    await Notification.deleteMany({});
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should create a valid notification', async () => {
    const notification = await Notification.create({
      userId: testUser._id,
      cardId: testCard._id,
      type: 'due-soon',
      message: 'Card is due soon',
    });

    expect(notification.userId.toString()).toBe(testUser._id.toString());
    expect(notification.cardId.toString()).toBe(testCard._id.toString());
    expect(notification.type).toBe('due-soon');
    expect(notification.message).toBe('Card is due soon');
    expect(notification.read).toBe(false);
    expect(notification.createdAt).toBeDefined();
  });

  it('should default read to false', async () => {
    const notification = await Notification.create({
      userId: testUser._id,
      cardId: testCard._id,
      type: 'overdue',
      message: 'Card is overdue',
    });

    expect(notification.read).toBe(false);
  });

  it('should require userId', async () => {
    const notification = new Notification({
      cardId: testCard._id,
      type: 'due-soon',
      message: 'Missing userId',
    });

    await expect(notification.validate()).rejects.toThrow();
  });

  it('should require cardId', async () => {
    const notification = new Notification({
      userId: testUser._id,
      type: 'due-soon',
      message: 'Missing cardId',
    });

    await expect(notification.validate()).rejects.toThrow();
  });

  it('should require type', async () => {
    const notification = new Notification({
      userId: testUser._id,
      cardId: testCard._id,
      message: 'Missing type',
    });

    await expect(notification.validate()).rejects.toThrow();
  });

  it('should require message', async () => {
    const notification = new Notification({
      userId: testUser._id,
      cardId: testCard._id,
      type: 'due-soon',
    });

    await expect(notification.validate()).rejects.toThrow();
  });

  it('should reject invalid type', async () => {
    const notification = new Notification({
      userId: testUser._id,
      cardId: testCard._id,
      type: 'invalid-type',
      message: 'Bad type',
    });

    await expect(notification.validate()).rejects.toThrow(
      'due-soon, overdue, reminder'
    );
  });

  it('should accept all valid types', async () => {
    const types = ['due-soon', 'overdue', 'reminder'];

    for (const type of types) {
      const notification = await Notification.create({
        userId: testUser._id,
        cardId: testCard._id,
        type,
        message: `Notification of type ${type}`,
      });
      expect(notification.type).toBe(type);
    }
  });

  it('should trim message', async () => {
    const notification = await Notification.create({
      userId: testUser._id,
      cardId: testCard._id,
      type: 'due-soon',
      message: '  Trimmed message  ',
    });

    expect(notification.message).toBe('Trimmed message');
  });

  it('should reject message exceeding 500 characters', async () => {
    const notification = new Notification({
      userId: testUser._id,
      cardId: testCard._id,
      type: 'due-soon',
      message: 'a'.repeat(501),
    });

    await expect(notification.validate()).rejects.toThrow('500');
  });

  it('should have timestamps', async () => {
    const notification = await Notification.create({
      userId: testUser._id,
      cardId: testCard._id,
      type: 'reminder',
      message: 'Reminder notification',
    });

    expect(notification.createdAt).toBeInstanceOf(Date);
    expect(notification.updatedAt).toBeInstanceOf(Date);
  });
});
