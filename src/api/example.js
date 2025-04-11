/**
 * API Example
 * Example of how to use the API components
 */
const { initializeApiServer } = require('./server');
const { PaymentProcessor, PaymentSessionManager } = require('../payment');
const ListenerManager = require('../listeners/ListenerManager');

/**
 * Initialize the API server with all necessary components
 * @param {Array} networksToStart - Optional array of network names to start listeners for
 * @param {Object} networkConfigs - Network configurations object
 * @returns {Promise<Object>} - Object containing the initialized components
 */
async function initializeApi(networksToStart = [], networkConfigs) {
  try {
    // Create a session manager for the payment processor
    const sessionManager = new PaymentSessionManager(null, networkConfigs);
    
    // Create a payment processor with the session manager
    const paymentProcessor = new PaymentProcessor(null, sessionManager);
    
    // Initialize the payment processor
    await paymentProcessor.initialize();
    
    // Create and initialize the listener manager
    const listenerManager = new ListenerManager();
    
    // Initialize and start listeners based on network configuration and active networks list
    const networksToInitialize = [];
    
    Object.keys(networkConfigs).forEach(networkName => {
      const networkConfig = networkConfigs[networkName];
      
      // Only add the listener if the network should be active and is in the list of networks to start
      // If networksToStart is empty, we use the isActive flag from the network config
      const shouldStart = networksToStart.length === 0 
        ? networkConfig.isActive 
        : networksToStart.includes(networkName) && networkConfig.isActive;
      
      if (shouldStart) {
        console.log(`Preparing to initialize listener for ${networkName}`);
        networksToInitialize.push(networkName);
      } else {
        console.log(`Skipping listener for ${networkName}`);
      }
    });
    
    // Initialize listeners
    if (networksToInitialize.length > 0) {
      await listenerManager.initialize(networksToInitialize);
    }
    
    // Initialize the API server with the payment processor and listener manager
    // We're passing null for the db parameter as it's not implemented in this example
    // We're passing the networks config for the transaction storage to use for status updates
    const { app, server, transactionStorage } = await initializeApiServer(paymentProcessor, listenerManager, null, networkConfigs);
    
    // Start the listeners
    if (networksToInitialize.length > 0) {
      await listenerManager.start(networksToInitialize);
    }
    
    // Connect the listener manager's transaction events to the payment processor
    listenerManager.on('transaction.detected', (data) => {
      // Process detected transactions
      console.log(`Processing transaction ${data.transactionId} for session ${data.sessionId}`);
      paymentProcessor.processTransaction(data);
    });
    
    listenerManager.on('transaction.confirmed', (data) => {
      // Process confirmed transactions
      console.log(`Transaction ${data.transactionId} has been confirmed`);
      paymentProcessor.confirmTransaction(data);
    });
    
    return { app, server, paymentProcessor, listenerManager, transactionStorage };
  } catch (error) {
    console.error('Failed to initialize API:', error);
    throw error;
  }
}

module.exports = {
  initializeApiServer: initializeApi
};
