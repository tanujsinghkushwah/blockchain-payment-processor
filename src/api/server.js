/**
 * API Server
 * Creates and configures the Express server for the API
 */
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware');
const createRoutes = require('./routes');
const config = require('./config');
const TransactionStorage = require('./services/TransactionStorage');

/**
 * Create and configure the Express server
 * @param {Object} networkConfig - Network configuration
 * @returns {Object} - Express app
 */
function createServer(networkConfig) {
  const app = express();
  
  // Initialize the transaction storage
  const transactionStorage = new TransactionStorage(networkConfig);
  
  // Add transaction storage to the app for direct access in other modules
  app.locals.transactionStorage = transactionStorage;
  
  // Configure middleware
  app.use(cors());
  app.use(express.json());
  
  // Add simple request logger middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
  
  // Set up rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);
  
  // Add app info endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Blockchain Payment System API',
      version: '1.0.0',
      status: 'running'
    });
  });
  
  // Add error handler
  app.use(errorHandler);
  
  return { app, transactionStorage };
}

/**
 * Initialize and start the Express server for the API
 * @param {Object} paymentProcessor - Payment processor instance
 * @param {Object} listenerManager - Blockchain listener manager instance
 * @param {Object} db - Database connection object 
 * @param {Object} networkConfig - Network configuration
 * @returns {Promise<Object>} - Express app and server objects
 */
async function initializeApiServer(paymentProcessor, listenerManager, db, networkConfig) {
  const { app, transactionStorage } = createServer(networkConfig);
  
  // Create API routes
  const router = createRoutes(paymentProcessor, listenerManager, db, transactionStorage, networkConfig);
  
  // Use API routes
  app.use('/api', router);

  // Start the server
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`API server started on port ${PORT}`);
  });
  
  // Listen for blockchain transactions and store them locally
  if (listenerManager) {
    listenerManager.on('transaction.detected', (data) => {
      console.log('Transaction detected:', data);
      
      // If the data contains a complete transaction object, use it directly
      if (data.transaction) {
        const txData = {
          id: data.transactionId,
          sessionId: data.sessionId,
          ...data.transaction
        };
        console.log('Storing complete transaction data:', txData);
        transactionStorage.addTransaction(txData);
      } else {
        // Otherwise try to find the transaction in the payment processor
        const transaction = paymentProcessor.getTransactionById(data.transactionId);
        if (transaction) {
          console.log('Retrieved transaction from payment processor:', transaction);
          transactionStorage.addTransaction(transaction);
        } else {
          console.warn(`Transaction ${data.transactionId} not found in payment processor`);
          // Store minimal transaction data
          const minimalTxData = {
            id: data.transactionId,
            sessionId: data.sessionId,
            txHash: data.txHash || `unknown_${data.transactionId}`,
            fromAddress: data.fromAddress || 'unknown',
            toAddress: data.toAddress || 'unknown',
            amount: data.amount || '0',
            currency: data.currency || 'unknown',
            network: data.network || 'unknown',
            status: 'PENDING',
            detectedAt: new Date()
          };
          console.log('Storing minimal transaction data:', minimalTxData);
          transactionStorage.addTransaction(minimalTxData);
        }
      }
    });
  }
  
  return { app, server, paymentProcessor, listenerManager, transactionStorage };
}

module.exports = {
  createServer,
  initializeApiServer
};
