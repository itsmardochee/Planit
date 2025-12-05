import logger from '../logger.js';

describe('Logger Utility', () => {
  let consoleInfoSpy;
  let consoleErrorSpy;
  let originalEnv;

  beforeEach(() => {
    // Mock console methods
    consoleInfoSpy = console.info;
    consoleErrorSpy = console.error;
    console.info = () => {};
    console.error = () => {};
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    console.info = consoleInfoSpy;
    console.error = consoleErrorSpy;
    process.env.NODE_ENV = originalEnv;
  });

  describe('info', () => {
    it('should log info messages with timestamp', () => {
      const logs = [];
      console.info = msg => logs.push(msg);
      logger.info('Test info message');
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('[INFO]');
      expect(logs[0]).toContain('Test info message');
    });

    it('should log info with metadata', () => {
      const logs = [];
      console.info = msg => logs.push(msg);
      logger.info('Test info', { userId: '123', route: '/api/test' });
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('userId');
      expect(logs[0]).toContain('123');
      expect(logs[0]).toContain('/api/test');
    });

    it('should include request ID when provided', () => {
      const logs = [];
      console.info = msg => logs.push(msg);
      logger.info('Test info', { requestId: 'req-abc-123' });
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('req-abc-123');
    });
  });

  describe('error', () => {
    it('should log error messages with timestamp', () => {
      const logs = [];
      console.error = msg => logs.push(msg);
      logger.error('Test error message');
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('[ERROR]');
      expect(logs[0]).toContain('Test error message');
    });

    it('should log error with stack trace in development', () => {
      process.env.NODE_ENV = 'development';
      const logs = [];
      console.error = msg => logs.push(msg);
      const testError = new Error('Test error');
      logger.error('Error occurred', { error: testError });
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('stack');
    });

    it('should not log stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const logs = [];
      console.error = msg => logs.push(msg);
      const testError = new Error('Test error');
      logger.error('Error occurred', { error: testError });
      expect(logs.length).toBe(1);
      expect(logs[0]).not.toContain('stack');
    });

    it('should log error with metadata', () => {
      const logs = [];
      console.error = msg => logs.push(msg);
      logger.error('Test error', { userId: '456', route: '/api/error' });
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('userId');
      expect(logs[0]).toContain('456');
      expect(logs[0]).toContain('/api/error');
    });
  });

  describe('request logging', () => {
    it('should format request metadata consistently', () => {
      const logs = [];
      console.info = msg => logs.push(msg);
      const metadata = {
        requestId: 'req-123',
        userId: 'user-456',
        route: '/api/workspaces',
        method: 'POST',
      };
      logger.info('Request received', metadata);
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('req-123');
      expect(logs[0]).toContain('user-456');
      expect(logs[0]).toContain('/api/workspaces');
      expect(logs[0]).toContain('POST');
    });
  });
});
