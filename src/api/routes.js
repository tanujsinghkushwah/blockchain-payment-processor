/**
 * API Routes
 * Defines all API routes and connects them to controllers
 */
const express = require('express');
const { authenticate } = require('./middleware');
const PaymentSessionsController = require('./controllers/PaymentSessionsController');
const TransactionsController = require('./controllers/TransactionsController');
const WebhooksController = require('./controllers/WebhooksController');
const SystemController = require('./controllers/SystemController');
const LocalTransactionsController = require('./controllers/LocalTransactionsController');

/**
 * Create API routes
 * @param {Object} paymentProcessor - Payment processor instance
 * @param {Object} listenerManager - Blockchain listener manager instance
 * @param {Object} db - Database connection object
 * @param {Object} transactionStorage - Transaction storage instance
 * @param {Object} networkConfig - Network configuration object
 * @returns {Object} - Express router
 */
function createRoutes(paymentProcessor, listenerManager, db, transactionStorage, networkConfig) {
  const router = express.Router();
  
  // Initialize controllers
  const paymentSessionsController = new PaymentSessionsController(paymentProcessor);
  const transactionsController = new TransactionsController(paymentProcessor);
  const webhooksController = new WebhooksController(db);
  const systemController = new SystemController(listenerManager);
  const localTransactionsController = new LocalTransactionsController(transactionStorage, networkConfig);
  
  // Create local transactions routes without authentication
  router.get('/local-transactions', localTransactionsController.getAllTransactions.bind(localTransactionsController));
  router.get('/local-transactions/:txHash', localTransactionsController.getTransactionByHash.bind(localTransactionsController));
  
  // Apply authentication middleware to all authenticated routes
  router.use(authenticate);
  
  // Payment Sessions routes
  router.post('/payment-sessions', paymentSessionsController.createSession.bind(paymentSessionsController));
  router.get('/payment-sessions', paymentSessionsController.listSessions.bind(paymentSessionsController));
  router.get('/payment-sessions/:id', paymentSessionsController.getSession.bind(paymentSessionsController));
  router.post('/payment-sessions/:id/recreate', paymentSessionsController.recreateSession.bind(paymentSessionsController));
  
  // Transactions routes
  router.get('/transactions', transactionsController.listTransactions.bind(transactionsController));
  router.get('/transactions/:id', transactionsController.getTransaction.bind(transactionsController));
  
  // Webhooks routes
  router.post('/webhooks', webhooksController.createWebhook.bind(webhooksController));
  router.get('/webhooks', webhooksController.listWebhooks.bind(webhooksController));
  router.delete('/webhooks/:id', webhooksController.deleteWebhook.bind(webhooksController));
  
  // System routes
  router.get('/system/network-status', systemController.getNetworkStatus.bind(systemController));
  
  return router;
}

module.exports = createRoutes;
