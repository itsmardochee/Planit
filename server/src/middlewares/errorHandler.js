import logger from '../utils/logger.js';

/**
 * Global error handling middleware
 * Must be placed after all routes
 * Signature: (err, req, res, _next)
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error with context
  const metadata = {
    userId: req.user?.id || req.user?._id,
    route: req.path,
    method: req.method,
    error: message,
  };

  if (process.env.NODE_ENV === 'development') {
    metadata.stack = err.stack;
  }

  logger.error(`Error ${statusCode}: ${message}`, metadata);

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
