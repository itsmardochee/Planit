import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../User.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('User Model - Schema Validation', () => {
  it('should create a valid user with all required fields', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.password).not.toBe(userData.password); // Should be hashed
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
  });

  it('should fail validation when username is missing', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const user = new User(userData);

    await expect(user.save()).rejects.toThrow();
  });

  it('should fail validation when email is missing', async () => {
    const userData = {
      username: 'testuser',
      password: 'password123',
    };

    const user = new User(userData);

    await expect(user.save()).rejects.toThrow();
  });

  it('should fail validation when password is missing', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
    };

    const user = new User(userData);

    await expect(user.save()).rejects.toThrow();
  });

  it('should enforce username max length of 50 characters', async () => {
    const userData = {
      username: 'a'.repeat(51),
      email: 'test@example.com',
      password: 'password123',
    };

    const user = new User(userData);

    await expect(user.save()).rejects.toThrow();
  });

  it('should accept valid username with max length', async () => {
    const userData = {
      username: 'a'.repeat(50),
      email: 'test@example.com',
      password: 'password123',
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.username).toBe(userData.username);
  });
});

describe('User Model - Email Validation', () => {
  it('should accept valid email format', async () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.com',
    ];

    for (const email of validEmails) {
      const userData = {
        username: `user${validEmails.indexOf(email)}`,
        email,
        password: 'password123',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe(email);
    }
  });

  it('should reject invalid email format', async () => {
    const invalidEmails = [
      'notanemail',
      'missing@domain',
      '@nodomain.com',
      'spaces in@email.com',
    ];

    for (const email of invalidEmails) {
      const userData = {
        username: `user${invalidEmails.indexOf(email)}`,
        email,
        password: 'password123',
      };

      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    }
  });
});

describe('User Model - Unique Constraints', () => {
  it('should enforce unique email constraint', async () => {
    const userData1 = {
      username: 'user1',
      email: 'duplicate@example.com',
      password: 'password123',
    };

    const userData2 = {
      username: 'user2',
      email: 'duplicate@example.com',
      password: 'password456',
    };

    await new User(userData1).save();

    await expect(new User(userData2).save()).rejects.toThrow();
  });

  it('should enforce unique username constraint', async () => {
    const userData1 = {
      username: 'duplicateuser',
      email: 'user1@example.com',
      password: 'password123',
    };

    const userData2 = {
      username: 'duplicateuser',
      email: 'user2@example.com',
      password: 'password456',
    };

    await new User(userData1).save();

    await expect(new User(userData2).save()).rejects.toThrow();
  });
});

describe('User Model - Password Hashing', () => {
  it('should hash password before saving', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'plainPassword123',
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.password).not.toBe(userData.password);
    expect(savedUser.password).toMatch(/^\$2[ayb]\$.{56}$/); // Bcrypt hash pattern
  });

  it('should not rehash password if not modified', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await new User(userData).save();
    const firstHash = user.password;

    user.username = 'updateduser';
    await user.save();

    expect(user.password).toBe(firstHash);
  });

  it('should rehash password if modified', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await new User(userData).save();
    const firstHash = user.password;

    user.password = 'newPassword456';
    await user.save();

    expect(user.password).not.toBe(firstHash);
    expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/);
  });
});

describe('User Model - comparePassword Method', () => {
  it('should return true for correct password', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'correctPassword123',
    };

    const user = await new User(userData).save();
    const isMatch = await user.comparePassword('correctPassword123');

    expect(isMatch).toBe(true);
  });

  it('should return false for incorrect password', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'correctPassword123',
    };

    const user = await new User(userData).save();
    const isMatch = await user.comparePassword('wrongPassword');

    expect(isMatch).toBe(false);
  });

  it('should handle empty password comparison', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await new User(userData).save();
    const isMatch = await user.comparePassword('');

    expect(isMatch).toBe(false);
  });
});

describe('User Model - Timestamps', () => {
  it('should automatically add createdAt and updatedAt timestamps', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await new User(userData).save();

    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
    expect(user.createdAt.getTime()).toBeLessThanOrEqual(
      user.updatedAt.getTime()
    );
  });

  it('should update updatedAt timestamp on modification', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await new User(userData).save();
    const originalUpdatedAt = user.updatedAt;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    user.username = 'updateduser';
    await user.save();

    expect(user.updatedAt.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    );
  });
});
