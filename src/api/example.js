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
async function initializeApiServer(networksToStart = []) {
  try {
    // Create the listener manager
    const listenerManager = new ListenerManager(mockDb);
    
    // Initialize and start ONLY the specified blockchain listeners
    if (networksToStart && networksToStart.length > 0) {
      console.log(`Initializing listeners for specified networks: ${networksToStart.join(', ')}`);
      // Initialize only the requested listeners
      await listenerManager.initialize(networksToStart); // Pass array to initialize
      // Start only the requested listeners
      await listenerManager.start(networksToStart); // Pass array to start
    } else {
      console.warn('No networks specified to start via command line. No listeners will be active.');
      // Optionally, initialize/start defaults if needed when none are specified
      // await listenerManager.initialize(['DEFAULT_NETWORK']); 
      // await listenerManager.start(['DEFAULT_NETWORK']); 
    }
    
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
