import errorHandler from '../errorHandler.js';

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
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
  });

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
});
