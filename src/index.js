/**
 * Main application entry point
 * This file demonstrates how to set up and run the complete blockchain payment system
 */
const { initializeApiServer } = require('./api/example');
const { AddressGenerator, PaymentSessionManager, PaymentProcessor } = require('./payment');
const ListenerManager = require('./listeners/ListenerManager');

/**
 * Initialize and start the blockchain payment system
 */
async function startBlockchainPaymentSystem() {
  try {
    console.log('Starting blockchain payment system...');
    
    // Initialize the API server (which also initializes the payment processor and blockchain listeners)
    const { app, server, paymentProcessor, listenerManager } = await initializeApiServer();
    
    // --- DEBUG LOG --- Check server object
    console.log('DEBUG: Received server object:', server);
    if (server && server.address) {
      console.log('DEBUG: Server address():', server.address());
    } else {
      console.log('DEBUG: Server object or server.address is null/undefined!');
    }
    // --- END DEBUG LOG ---
    
    console.log('Blockchain payment system started successfully');
    console.log(`API server is running on http://localhost:${server.address().port}`);
    
    // Return the initialized components
    return {
      app,
      server,
      paymentProcessor,
      listenerManager
    };
  } catch (error) {
    console.error('Failed to start blockchain payment system:', error);
    throw error;
  }
}

// If this file is run directly, start the system
if (require.main === module) {
  startBlockchainPaymentSystem()
    .then(() => {
      console.log('Blockchain payment system is ready to accept payments');
    })
    .catch(error => {
      console.error('Failed to start blockchain payment system:', error);
      process.exit(1);
    });
}

// Export the start function
module.exports = {
  startBlockchainPaymentSystem
};
