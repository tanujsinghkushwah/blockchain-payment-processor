/**
 * Example usage of the blockchain listeners
 * This file demonstrates how to use the ListenerManager to monitor blockchain transactions
 */
const ListenerManager = require('./listeners/ListenerManager');

// In a real application, this would be a database connection
// For this example, we'll use a mock database object
const mockDb = {
  // Mock database methods would go here
  // These would be implemented to interact with your actual database
};

/**
 * Initialize and start the blockchain listeners
 */
async function initializeBlockchainListeners() {
  try {
    // Create the listener manager
    const listenerManager = new ListenerManager(mockDb);
    
    // Initialize all supported network listeners
    await listenerManager.initializeAll();
    
    // Register event handlers
    listenerManager.on('transaction.detected', handleTransactionDetected);
    listenerManager.on('transaction.confirmed', handleTransactionConfirmed);
    
    // Start all listeners
    await listenerManager.startAll();
    
    // Get the status of all listeners
    const status = listenerManager.getStatus();
    console.log('Listener status:', status);
    
    return listenerManager;
  } catch (error) {
    console.error('Failed to initialize blockchain listeners:', error);
    throw error;
  }
}

/**
 * Handle transaction detected event
 * @param {Object} data - Event data
 */
function handleTransactionDetected(data) {
  console.log('Transaction detected event handler:', data);
  // In a real application, you might update UI, send notifications, etc.
}

/**
 * Handle transaction confirmed event
 * @param {Object} data - Event data
 */
function handleTransactionConfirmed(data) {
  console.log('Transaction confirmed event handler:', data);
  // In a real application, you might update UI, send notifications, etc.
}

// Export the initialization function
module.exports = {
  initializeBlockchainListeners
};
