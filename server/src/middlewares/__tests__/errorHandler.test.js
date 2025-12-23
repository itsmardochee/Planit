import errorHandler from '../errorHandler.js';
import {
  ValidationError,
  AuthError,
  NotFoundError,
  ForbiddenError,
} from '../../utils/errors.js';

describe('Error Handler Middleware', () => {
  let req, res, next, originalEnv, consoleErrorLogs;

  beforeEach(() => {
    req = {
      path: '/api/test',
      method: 'GET',
      user: { id: 'user-123' },
    };
    res = {
      statusCode: 200,
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
    next = () => {};
    originalEnv = process.env.NODE_ENV;

    // Mock console.error to capture logs
    consoleErrorLogs = [];
    console.error = (...args) => consoleErrorLogs.push(args.join(' '));
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('Custom error handling', () => {
    it('should handle ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid input data');

      errorHandler(error, req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Invalid input data',
      });
    });

    it('should handle AuthError with 401 status', () => {
      const error = new AuthError('Invalid token');

      errorHandler(error, req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Invalid token',
      });
    });

    it('should handle ForbiddenError with 403 status', () => {
      const error = new ForbiddenError('Access denied');

      errorHandler(error, req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual({
        success: false,
        message: 'Access denied',
      });
    });

    it('should handle NotFoundError with 404 status', () => {
      const error = new NotFoundError('Workspace not found');

      errorHandler(error, req, res, next);

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({
        success: false,
        message: 'Workspace not found',
      });
    });
  });

  describe('Generic error handling', () => {
    it('should handle errors with status code and message', () => {
      const error = new Error('Test error');
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Test error',
      });
    });

    it('should default to 500 status code if not specified', () => {
      const error = new Error('Internal server error');

      errorHandler(error, req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Internal server error',
      });
    });

    it('should use default message for 500 errors without message', () => {
      const error = new Error();

      errorHandler(error, req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');
    });
  });

  describe('Logging', () => {
    it('should log error with request context', () => {
      const error = new Error('Test error');
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      expect(consoleErrorLogs.length).toBeGreaterThan(0);
      const log = consoleErrorLogs.join(' ');
      expect(log).toContain('[ERROR]');
      expect(log).toContain('Test error');
    });

    it('should include userId in logs when available', () => {
      const error = new Error('Test error');
      req.user = { id: 'user-456' };

      errorHandler(error, req, res, next);

      const log = consoleErrorLogs.join(' ');
      expect(log).toContain('user-456');
    });

    it('should include route in logs', () => {
      const error = new Error('Test error');
      req.path = '/api/workspaces';

      errorHandler(error, req, res, next);

      const log = consoleErrorLogs.join(' ');
      expect(log).toContain('/api/workspaces');
    });
  });

  describe('Stack trace handling', () => {
    it('should include stack trace in development mode', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Dev error');

      errorHandler(error, req, res, next);

      expect(res.body.stack).toBeDefined();
      expect(res.body.stack).toContain('Error');
    });

    it('should not include stack trace in production mode', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Prod error');

      errorHandler(error, req, res, next);

      expect(res.body.stack).toBeUndefined();
    });

    it('should not include stack trace in test mode', () => {
      process.env.NODE_ENV = 'test';
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(res.body.stack).toBeUndefined();
    });
  });
});
