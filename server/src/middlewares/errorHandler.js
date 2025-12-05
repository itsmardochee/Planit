/**
 * Global error handling middleware
 * Must be placed after all routes
 * Signature: (err, req, res, _next)
 */
const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
