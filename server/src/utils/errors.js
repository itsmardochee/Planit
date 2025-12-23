/**
 * Base class for custom API errors
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400)
 * Used for invalid input, missing required fields, etc.
 */
export class ValidationError extends ApiError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

/**
 * Authentication error (401)
 * Used for invalid/missing credentials, expired tokens, etc.
 */
export class AuthError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * Forbidden error (403)
 * Used when user is authenticated but lacks permission
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
}

/**
 * Not found error (404)
 * Used when a resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export default ApiError;
