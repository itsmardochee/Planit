/**
 * Lightweight structured logging utility
 * Provides info and error level logging with metadata support
 */

/**
 * Format metadata object for logging
 * @param {Object} metadata - Additional context (requestId, userId, route, etc.)
 * @returns {string} Formatted metadata string
 */
const formatMetadata = metadata => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return '';
  }

  const parts = [];

  // Request ID is high priority
  if (metadata.requestId) {
    parts.push(`[${metadata.requestId}]`);
  }

  // Add userId if available
  if (metadata.userId) {
    parts.push(`userId=${metadata.userId}`);
  }

  // Add route/method if available
  if (metadata.route) {
    parts.push(`route=${metadata.route}`);
  }
  if (metadata.method) {
    parts.push(`method=${metadata.method}`);
  }

  // Handle error objects
  if (metadata.error) {
    const err = metadata.error;
    parts.push(`error=${err.message}`);
    // Include stack trace only in development
    if (process.env.NODE_ENV === 'development' && err.stack) {
      parts.push(`stack=${err.stack}`);
    }
  }

  // Add any remaining metadata
  Object.keys(metadata).forEach(key => {
    if (!['requestId', 'userId', 'route', 'method', 'error'].includes(key)) {
      parts.push(`${key}=${JSON.stringify(metadata[key])}`);
    }
  });

  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
};

/**
 * Get current timestamp in ISO format
 * @returns {string} ISO timestamp
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Log info level message
 * @param {string} message - Log message
 * @param {Object} metadata - Additional context
 */
const info = (message, metadata = {}) => {
  const timestamp = getTimestamp();
  const metadataStr = formatMetadata(metadata);
  console.info(`[${timestamp}] [INFO] ${message}${metadataStr}`);
};

/**
 * Log error level message
 * @param {string} message - Error message
 * @param {Object} metadata - Additional context (should include error object)
 */
const error = (message, metadata = {}) => {
  const timestamp = getTimestamp();
  const metadataStr = formatMetadata(metadata);
  console.error(`[${timestamp}] [ERROR] ${message}${metadataStr}`);
};

const logger = {
  info,
  error,
};

export default logger;
