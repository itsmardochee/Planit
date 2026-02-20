import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import {
  cardCommentRouter,
  commentRouter,
} from '../../routes/commentRoutes.js';
import auth from '../../middlewares/auth.js';
import User from '../../models/User.js';
import Workspace from '../../models/Workspace.js';
import WorkspaceMember from '../../models/WorkspaceMember.js';
import Board from '../../models/Board.js';
import List from '../../models/List.js';
import Card from '../../models/Card.js';
import Comment from '../../models/Comment.js';
import errorHandler from '../../middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/cards/:cardId/comments', auth, cardCommentRouter);
app.use('/api/comments', auth, commentRouter);
app.use(errorHandler);

// ============================================================
// POST /api/cards/:cardId/comments
// ============================================================
describe('POST /api/cards/:cardId/comments', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let testCard;
  let authToken;

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
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await Comment.deleteMany({});
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should create a comment on a card', async () => {
    const res = await request(app)
      .post(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'This is a test comment' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('This is a test comment');
    expect(res.body.data.cardId).toBe(testCard._id.toString());
    expect(res.body.data.userId._id).toBe(testUser._id.toString());
    expect(res.body.data.userId.username).toBe('testuser');
  });

  it('should trim whitespace from content', async () => {
    const res = await request(app)
      .post(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: '  trimmed comment  ' });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('trimmed comment');
  });

  it('should fail when content is missing', async () => {
    const res = await request(app)
      .post(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail when content is empty string', async () => {
    const res = await request(app)
      .post(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail when content is only whitespace', async () => {
    const res = await request(app)
      .post(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail when content exceeds 5000 characters', async () => {
    const res = await request(app)
      .post(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'a'.repeat(5001) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail with invalid card ID format', async () => {
    const res = await request(app)
      .post('/api/cards/invalid-id/comments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'test' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail when card does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/cards/${fakeId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'test' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should fail without authentication', async () => {
    const res = await request(app)
      .post(`/api/cards/${testCard._id}/comments`)
      .send({ content: 'test' });

    expect(res.status).toBe(401);
  });

  it('should fail when user is not workspace member', async () => {
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = jwt.sign(
      { id: otherUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .post(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'test' });

    expect(res.status).toBe(403);
  });

  it('should allow workspace member to create comment', async () => {
    const memberUser = await User.create({
      username: 'memberuser',
      email: 'member@example.com',
      password: 'password123',
    });
    await WorkspaceMember.create({
      workspaceId: testWorkspace._id,
      userId: memberUser._id,
      role: 'member',
      invitedBy: testUser._id,
    });
    const memberToken = jwt.sign(
      { id: memberUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .post(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ content: 'Member comment' });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('Member comment');
    expect(res.body.data.userId._id).toBe(memberUser._id.toString());
  });
});

// ============================================================
// GET /api/cards/:cardId/comments
// ============================================================
describe('GET /api/cards/:cardId/comments', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let testCard;
  let authToken;

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
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await Comment.deleteMany({});
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should return empty array when no comments', async () => {
    const res = await request(app)
      .get(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('should return all comments for a card', async () => {
    await Comment.create([
      { content: 'First comment', cardId: testCard._id, userId: testUser._id },
      { content: 'Second comment', cardId: testCard._id, userId: testUser._id },
      { content: 'Third comment', cardId: testCard._id, userId: testUser._id },
    ]);

    const res = await request(app)
      .get(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  it('should return comments sorted by createdAt descending (newest first)', async () => {
    const c1 = await Comment.create({
      content: 'First',
      cardId: testCard._id,
      userId: testUser._id,
    });
    const c2 = await Comment.create({
      content: 'Second',
      cardId: testCard._id,
      userId: testUser._id,
    });

    const res = await request(app)
      .get(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0]._id).toBe(c2._id.toString());
    expect(res.body.data[1]._id).toBe(c1._id.toString());
  });

  it('should populate user info (username, email)', async () => {
    await Comment.create({
      content: 'Populated comment',
      cardId: testCard._id,
      userId: testUser._id,
    });

    const res = await request(app)
      .get(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].userId.username).toBe('testuser');
    expect(res.body.data[0].userId.email).toBe('test@example.com');
    expect(res.body.data[0].userId.password).toBeUndefined();
  });

  it('should not return comments from other cards', async () => {
    const otherCard = await Card.create({
      title: 'Other Card',
      listId: testList._id,
      boardId: testBoard._id,
      userId: testUser._id,
      position: 1,
    });
    await Comment.create({
      content: 'On other card',
      cardId: otherCard._id,
      userId: testUser._id,
    });
    await Comment.create({
      content: 'On test card',
      cardId: testCard._id,
      userId: testUser._id,
    });

    const res = await request(app)
      .get(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].content).toBe('On test card');
  });

  it('should fail with invalid card ID format', async () => {
    const res = await request(app)
      .get('/api/cards/invalid-id/comments')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
  });

  it('should fail when card does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/cards/${fakeId}/comments`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  it('should fail without authentication', async () => {
    const res = await request(app).get(`/api/cards/${testCard._id}/comments`);

    expect(res.status).toBe(401);
  });

  it('should fail when user is not workspace member', async () => {
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = jwt.sign(
      { id: otherUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .get(`/api/cards/${testCard._id}/comments`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

// ============================================================
// PUT /api/comments/:id
// ============================================================
describe('PUT /api/comments/:id', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let testCard;
  let testComment;
  let authToken;

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
    testComment = await Comment.create({
      content: 'Original comment',
      cardId: testCard._id,
      userId: testUser._id,
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await Comment.deleteMany({});
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should update comment content', async () => {
    const res = await request(app)
      .put(`/api/comments/${testComment._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Updated comment' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Updated comment');
    expect(res.body.data.userId.username).toBe('testuser');
  });

  it('should trim whitespace from updated content', async () => {
    const res = await request(app)
      .put(`/api/comments/${testComment._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: '  trimmed  ' });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe('trimmed');
  });

  it('should fail when content is missing', async () => {
    const res = await request(app)
      .put(`/api/comments/${testComment._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail when content is empty', async () => {
    const res = await request(app)
      .put(`/api/comments/${testComment._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });

  it('should fail when content is only whitespace', async () => {
    const res = await request(app)
      .put(`/api/comments/${testComment._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: '   ' });

    expect(res.status).toBe(400);
  });

  it('should fail when another user tries to update', async () => {
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = jwt.sign(
      { id: otherUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .put(`/api/comments/${testComment._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'Hacked!' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Only the author');
  });

  it('should fail with invalid comment ID format', async () => {
    const res = await request(app)
      .put('/api/comments/invalid-id')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'test' });

    expect(res.status).toBe(400);
  });

  it('should fail when comment does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/comments/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'test' });

    expect(res.status).toBe(404);
  });

  it('should fail without authentication', async () => {
    const res = await request(app)
      .put(`/api/comments/${testComment._id}`)
      .send({ content: 'test' });

    expect(res.status).toBe(401);
  });
});

// ============================================================
// DELETE /api/comments/:id
// ============================================================
describe('DELETE /api/comments/:id', () => {
  let mongoServer;
  let testUser;
  let testWorkspace;
  let testBoard;
  let testList;
  let testCard;
  let testComment;
  let authToken;

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
    testComment = await Comment.create({
      content: 'Comment to delete',
      cardId: testCard._id,
      userId: testUser._id,
    });
    authToken = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await Comment.deleteMany({});
    await Card.deleteMany({});
    await List.deleteMany({});
    await Board.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
  });

  it('should delete a comment', async () => {
    const res = await request(app)
      .delete(`/api/comments/${testComment._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('deleted');

    const deleted = await Comment.findById(testComment._id);
    expect(deleted).toBeNull();
  });

  it('should fail when another user tries to delete', async () => {
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = jwt.sign(
      { id: otherUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .delete(`/api/comments/${testComment._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Only the author');

    // Comment should still exist
    const stillExists = await Comment.findById(testComment._id);
    expect(stillExists).not.toBeNull();
  });

  it('should fail with invalid comment ID format', async () => {
    const res = await request(app)
      .delete('/api/comments/invalid-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
  });

  it('should fail when comment does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/comments/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  it('should fail without authentication', async () => {
    const res = await request(app).delete(`/api/comments/${testComment._id}`);

    expect(res.status).toBe(401);
  });

  it('should not affect other comments when deleting one', async () => {
    const otherComment = await Comment.create({
      content: 'Other comment',
      cardId: testCard._id,
      userId: testUser._id,
    });

    await request(app)
      .delete(`/api/comments/${testComment._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    const remaining = await Comment.findById(otherComment._id);
    expect(remaining).not.toBeNull();
    expect(remaining.content).toBe('Other comment');
  });
});
