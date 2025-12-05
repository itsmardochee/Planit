import logger from '../utils/logger.js';

/**
 * Global error handling middleware
 * Must be placed after all routes
 * Signature: (err, req, res, _next)
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Build metadata for logging
  const metadata = {
    error: err,
    route: req.path,
    method: req.method,
  };

  // Include userId if available (from auth middleware)
  if (req.user?.id) {
    metadata.userId = req.user.id;
  }

  // Log the error with context
  logger.error(`Error ${statusCode}: ${message}`, metadata);

  // Prepare response
  const response = {
    success: false,
    message: message,
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
