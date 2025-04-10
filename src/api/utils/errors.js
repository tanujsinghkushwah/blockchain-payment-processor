/**
 * Custom error classes for the API
 */

/**
 * Validation Error
 * Used when request validation fails
 */
class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Not Found Error
 * Used when a requested resource is not found
 */
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Authentication Error
 * Used when authentication fails
 */
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Forbidden Error
 * Used when access is denied
 */
class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError
};
