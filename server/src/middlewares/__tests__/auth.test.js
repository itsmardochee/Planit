import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import auth from '../auth.js';
import User from '../../models/User.js';

describe('Auth Middleware', () => {
  let mongoServer;
  let req, res, next;

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
    await User.deleteMany({});
  });

  beforeEach(() => {
    // Setup mock request, response, and next
    req = {
      header: name => req.headers?.[name],
      headers: {},
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

    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test_secret_key';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('Token Extraction', () => {
    it('should fail if no Authorization header is provided', async () => {
      await auth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'No token, authorization denied',
      });
      expect(next.called).toBe(false);
    });

    it('should fail if Authorization header is empty string', async () => {
      req.headers.Authorization = '';

      await auth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'No token, authorization denied',
      });
      expect(next.called).toBe(false);
    });

    it('should fail if Authorization header does not start with "Bearer "', async () => {
      req.headers.Authorization = 'InvalidFormat token123';

      await auth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'No token, authorization denied',
      });
      expect(next.called).toBe(false);
    });

    it('should extract token correctly from "Bearer <token>" format', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const token = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      req.headers.Authorization = `Bearer ${token}`;

      await auth(req, res, next);

      expect(next.called).toBe(true);
      expect(req.user).toBeDefined();
      expect(req.user.username).toBe('testuser');
      expect(req.user.password).toBeUndefined(); // Password should be excluded
    });
  });

  describe('Token Verification', () => {
    it('should fail with invalid JWT token', async () => {
      req.headers.Authorization = 'Bearer invalid.jwt.token';

      await auth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Token is not valid',
      });
      expect(next.called).toBe(false);
    });

    it('should fail with expired JWT token', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const expiredToken = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );
      req.headers.Authorization = `Bearer ${expiredToken}`;

      await auth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Token is not valid',
      });
      expect(next.called).toBe(false);
    });

    it('should fail if token is signed with wrong secret', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const wrongSecretToken = jwt.sign(
        { id: user._id.toString() },
        'wrong_secret',
        { expiresIn: '7d' }
      );
      req.headers.Authorization = `Bearer ${wrongSecretToken}`;

      await auth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Token is not valid',
      });
      expect(next.called).toBe(false);
    });

    it('should successfully verify valid JWT token', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const validToken = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      req.headers.Authorization = `Bearer ${validToken}`;

      await auth(req, res, next);

      expect(next.called).toBe(true);
      expect(res.statusCode).toBeNull();
      expect(res.body).toBeNull();
    });

    it('should fail when JWT_SECRET is missing', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const validToken = jwt.sign({ id: user._id.toString() }, 'temp_secret', {
        expiresIn: '7d',
      });
      req.headers.Authorization = `Bearer ${validToken}`;

      // Temporarily remove JWT_SECRET
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      await auth(req, res, next);

      // jwt.verify() throws error when secret is missing, caught as invalid token
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Token is not valid');
      expect(next.called).toBe(false);

      // Restore JWT_SECRET
      process.env.JWT_SECRET = originalSecret;
    });

    it('should fail with invalid ObjectId format in token', async () => {
      const invalidToken = jwt.sign(
        { id: 'invalid-objectid-format' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      req.headers.Authorization = `Bearer ${invalidToken}`;

      await auth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Token is not valid',
      });
      expect(next.called).toBe(false);
    });
  });

  describe('User Lookup', () => {
    it('should fail if user is not found in database', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const validToken = jwt.sign(
        { id: fakeUserId.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      req.headers.Authorization = `Bearer ${validToken}`;

      await auth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'User not found',
      });
      expect(next.called).toBe(false);
    });

    it('should attach user to request object when found', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const validToken = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      req.headers.Authorization = `Bearer ${validToken}`;

      await auth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user._id.toString());
      expect(req.user._id.toString()).toBe(user._id.toString());
      expect(req.user.username).toBe('testuser');
      expect(req.user.email).toBe('test@example.com');
      expect(next.called).toBe(true);
    });

    it('should exclude password from user object', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const validToken = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      req.headers.Authorization = `Bearer ${validToken}`;

      await auth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.password).toBeUndefined();
      expect(next.called).toBe(true);
    });

    it('should include id field for API consistency', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const validToken = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      req.headers.Authorization = `Bearer ${validToken}`;

      await auth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user._id.toString());
      expect(typeof req.user.id).toBe('string');
      expect(next.called).toBe(true);
    });
  });

  describe('JWT Payload Structure', () => {
    it('should work with token containing id field', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const validToken = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      req.headers.Authorization = `Bearer ${validToken}`;

      await auth(req, res, next);

      expect(next.called).toBe(true);
      expect(req.user).toBeDefined();
    });

    it('should fail if token payload is missing id field', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const invalidToken = jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      req.headers.Authorization = `Bearer ${invalidToken}`;

      await auth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Token is not valid',
      });
      expect(next.called).toBe(false);
    });
  });
});
