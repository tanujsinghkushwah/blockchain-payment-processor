/**
 * API middleware for authentication and error handling
 */
const config = require('./config');

/**
 * API key authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticate(req, res, next) {
  const authHeader = req.headers[config.auth.apiKeyHeader.toLowerCase()];
  
  if (!authHeader) {
    return res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'API key is required'
      }
    });
  }
  
  // Check if the header starts with the expected prefix
  if (!authHeader.startsWith(config.auth.apiKeyPrefix)) {
    return res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Invalid API key format'
      }
    });
  }
  
  // Extract the API key
  const apiKey = authHeader.substring(config.auth.apiKeyPrefix.length);
  
  // Validate the API key
  if (apiKey !== config.auth.apiKey) {
    return res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Invalid API key'
      }
    });
  }
  
  // API key is valid, proceed
  next();
}

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  console.error('API Error:', err);
  
  // Determine the status code
  let statusCode = 500;
  let errorCode = 'server_error';
  let message = 'An unexpected error occurred';
  let details = null;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'invalid_request';
    message = 'Invalid request parameters';
    details = err.details;
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = 'not_found';
    message = err.message || 'Resource not found';
  } else if (err.name === 'AuthenticationError') {
    statusCode = 401;
    errorCode = 'unauthorized';
    message = err.message || 'Authentication failed';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'forbidden';
    message = err.message || 'Access denied';
  }
  
  // Send the error response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: message,
      details: details
    }
  });
}

/**
 * Not found middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFound(req, res) {
  res.status(404).json({
    error: {
      code: 'not_found',
      message: 'The requested resource was not found'
    }
  });
}

module.exports = {
  authenticate,
  errorHandler,
  notFound
};
