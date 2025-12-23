import {
  ValidationError,
  AuthError,
  NotFoundError,
  ForbiddenError,
} from '../errors.js';

describe('Custom Error Classes', () => {
  describe('ValidationError', () => {
    it('should create a ValidationError with correct status code', () => {
      const error = new ValidationError('Invalid input');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should be catchable as an Error', () => {
      expect(() => {
        throw new ValidationError('Test error');
      }).toThrow(Error);
    });
  });

  describe('AuthError', () => {
    it('should create an AuthError with status code 401', () => {
      const error = new AuthError('Unauthorized');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthError');
    });

    it('should have default message when not provided', () => {
      const error = new AuthError();
      expect(error.message).toBe('Authentication failed');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create a ForbiddenError with status code 403', () => {
      const error = new ForbiddenError('Access denied');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });

    it('should have default message when not provided', () => {
      const error = new ForbiddenError();
      expect(error.message).toBe('Access forbidden');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with status code 404', () => {
      const error = new NotFoundError('Resource not found');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should have default message when not provided', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('Error inheritance', () => {
    it('should maintain stack trace', () => {
      const error = new ValidationError('Test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ValidationError');
    });
  });
});
