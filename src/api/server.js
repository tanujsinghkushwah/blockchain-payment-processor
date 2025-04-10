/**
 * API Server
 * Main entry point for the API server
 */
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { errorHandler, notFound } = require('./middleware');
const createRoutes = require('./routes');

/**
 * Create and configure the API server
 * @param {Object} paymentProcessor - Payment processor instance
 * @param {Object} listenerManager - Blockchain listener manager instance
 * @param {Object} db - Database connection object
 * @returns {Object} - Express app
 */
function createServer(paymentProcessor, listenerManager, db) {
  const app = express();
  
  // Apply middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Apply CORS
  app.use(cors(config.cors));
  
  // Apply rate limiting
  app.use(rateLimit(config.api.rateLimits));
  
  // Apply routes
  app.use(config.api.prefix, createRoutes(paymentProcessor, listenerManager, db));
  
  // Apply error handling
  app.use(notFound);
  app.use(errorHandler);
  
  return app;
}

/**
 * Start the API server
 * @param {Object} app - Express app
 * @returns {Promise<Object>} - Promise resolving with the HTTP server instance
 */
function startServer(app) {
  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(config.server.port, config.server.host, () => {
        // Use setImmediate to allow the event loop to process the 'listening' state fully
        setImmediate(() => {
            if (server.address()) {
                console.log(`API server listening on ${config.server.host}:${server.address().port}`);
                resolve(server); // Resolve ONLY after confirming address is available
            } else {
                // This case should ideally not happen if the callback fired, but handle defensively
                console.error('Server listening callback fired, but server.address() is still null!');
                reject(new Error('Server failed to bind address after listening callback.'));
            }
        });
      });

      server.on('error', (error) => {
          console.error('Server startup error:', error);
          reject(error); // Reject the promise on error
      });

    } catch (error) {
        console.error('Error initiating server listen:', error);
        reject(error);
    }
  });
}

module.exports = {
  createServer,
  startServer
};
