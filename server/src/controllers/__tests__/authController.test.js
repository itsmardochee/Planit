import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import authRoutes from '../../routes/authRoutes.js';
import User from '../../models/User.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('POST /api/auth/register', () => {
  let mongoServer;

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

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('Input Validation', () => {
    it('should fail when username is missing', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('username');
    });

    it('should fail when email is missing', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should fail when password is missing', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });

    it('should fail when email format is invalid', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should fail when password is less than 6 characters', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: '12345',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toContain('password');
    });

    it('should fail when username exceeds 50 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'a'.repeat(51),
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toContain('username');
    });

    it('should accept valid input with all required fields', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Duplicate Checks', () => {
    it('should fail when email already exists', async () => {
      await User.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should fail when username already exists', async () => {
      await User.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/register').send({
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('username');
    });

    it('should handle case-insensitive email duplicates', async () => {
      await User.create({
        username: 'user1',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/register').send({
        username: 'user2',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });
  });

  describe('User Creation', () => {
    it('should create user with hashed password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeDefined();
      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // Bcrypt pattern
    });

    it('should save username and email correctly', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });

    it('should convert email to lowercase', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      expect(response.status).toBe(201);

      const user = await User.findOne({ username: 'testuser' });
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('JWT Token Generation', () => {
    it('should return JWT token on successful registration', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
    });

    it('should return valid JWT token with user id', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);

      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.id).toBeDefined();

      const user = await User.findOne({ email: 'test@example.com' });
      expect(decoded.id).toBe(user._id.toString());
    });

    it('should set token expiration to 7 days', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);

      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check expiration is approximately 7 days (604800 seconds)
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBeGreaterThanOrEqual(604700);
      expect(expiresIn).toBeLessThanOrEqual(604900);
    });
  });

  describe('Response Format', () => {
    it('should return user data without password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return user id in response', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.user._id).toBeDefined();
    });

    it('should return timestamps in response', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.user.createdAt).toBeDefined();
      expect(response.body.data.user.updatedAt).toBeDefined();
    });

    it('should follow standardized response format', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Close database connection to simulate error
      await mongoose.connection.close();

      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();

      // Reconnect for other tests
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });
});

describe('POST /api/auth/login', () => {
  let mongoServer;

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

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('Input Validation', () => {
    it('should fail when email is missing', async () => {
      const response = await request(app).post('/api/auth/login').send({
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toContain('email');
    });

    it('should fail when password is missing', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toContain('password');
    });

    it('should fail when both email and password are missing', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('should fail when user does not exist', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail when password is incorrect', async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'correctpassword',
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should succeed with correct credentials', async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle case-insensitive email login', async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('JWT Token Generation', () => {
    it('should return JWT token on successful login', async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
    });

    it('should return valid JWT token with user id', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);

      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.id).toBeDefined();
      expect(decoded.id).toBe(user._id.toString());
    });

    it('should set token expiration to 7 days', async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);

      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check expiration is approximately 7 days (604800 seconds)
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBeGreaterThanOrEqual(604700);
      expect(expiresIn).toBeLessThanOrEqual(604900);
    });
  });

  describe('Response Format', () => {
    it('should return user data without password', async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return user id in response', async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.data.user._id).toBeDefined();
    });

    it('should return timestamps in response', async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.data.user.createdAt).toBeDefined();
      expect(response.body.data.user.updatedAt).toBeDefined();
    });

    it('should follow standardized response format', async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Close database connection to simulate error
      await mongoose.connection.close();

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();

      // Reconnect for other tests
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });
});
