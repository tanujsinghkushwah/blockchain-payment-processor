/**
 * Main application entry point
 * This file demonstrates how to set up and run the complete blockchain payment system
 */
const { initializeApiServer } = require('./api/example');
const { AddressGenerator, PaymentSessionManager, PaymentProcessor } = require('./payment');
const ListenerManager = require('./listeners/ListenerManager');
const networkConfigLoader = require('./config/networks');

// Function to get a fresh copy of network configurations
function getNetworkConfigs() {
  // If the exported object has a configs property, it's the new format
  if (networkConfigLoader.configs) {
    // Call the function to get fresh configs if it's a function
    if (typeof networkConfigLoader === 'function') {
      return networkConfigLoader();
    }
    // Fall back to cached configs
    return networkConfigLoader.configs;
  }
  
  // Otherwise it might be the function itself or the old format direct object
  if (typeof networkConfigLoader === 'function') {
    return networkConfigLoader();
  }
  
  // Default to the object itself
  return networkConfigLoader;
}

/**
 * Initialize and start the blockchain payment system
 */
async function startBlockchainPaymentSystem(networksToStart = []) {
  try {
    console.log('Starting blockchain payment system...');
    
    // Get a fresh copy of network configurations that will use the latest env variables
    const networks = getNetworkConfigs();
    
    // Initialize the API server (which also initializes the payment processor and blockchain listeners)
    const { app, server, paymentProcessor, listenerManager, transactionStorage } = await initializeApiServer(networksToStart, networks);
    
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
    console.log(`Local transactions endpoint: http://localhost:${server.address().port}/api/local-transactions`);
    
    // Return the initialized components
    return {
      app,
      server,
      paymentProcessor,
      listenerManager,
      transactionStorage,
      networks // Include networks config in return
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
