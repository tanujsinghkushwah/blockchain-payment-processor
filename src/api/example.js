/**
 * Example usage of the API server
 * This file demonstrates how to set up and start the API server
 */
const { createServer, startServer } = require('./index');
const { PaymentProcessor } = require('../payment');
const ListenerManager = require('../listeners/ListenerManager');
const { PaymentSessionManager } = require('../payment');

// In a real application, these would be database connections and configurations
const mockDb = {
  // Mock database methods would go here
};

const mockConfig = {
  // Mock configuration would go here
};

/**
 * Initialize and start the API server
 */
async function initializeApiServer() {
  try {
    // Create the listener manager
    const listenerManager = new ListenerManager(mockDb);
    
    // Initialize blockchain listeners - ONLY TESTNET FOR NOW
    await listenerManager.initialize('BEP20_TESTNET');
    // Start the specific listener
    await listenerManager.start('BEP20_TESTNET'); 
    
    // Create the payment session manager
    const sessionManager = new PaymentSessionManager(mockDb, mockConfig);
    
    // Create the payment processor
    const paymentProcessor = new PaymentProcessor(mockDb, sessionManager, listenerManager);
    
    // Initialize the payment processor
    await paymentProcessor.initialize();
    
    // Create the API server
    const app = createServer(paymentProcessor, listenerManager, mockDb);
    
    // Start the API server
    const server = await startServer(app);
    
    console.log('API server initialized and started');
    
    return {
      app,
      server,
      paymentProcessor,
      listenerManager
    };
  } catch (error) {
    console.error('Failed to initialize API server:', error);
    throw error;
  }
}

// Export the initialization function
module.exports = {
  initializeApiServer
};
