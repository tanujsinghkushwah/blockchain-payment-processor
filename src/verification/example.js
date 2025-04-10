/**
 * Example usage of the payment verification system
 * This file demonstrates how to set up and use the payment verification system
 */
const PaymentVerificationSystem = require('./PaymentVerificationSystem');
const { PaymentProcessor } = require('../payment');
const ListenerManager = require('../listeners/ListenerManager');

// In a real application, these would be database connections and configurations
const mockDb = {
  // Mock database methods would go here
};

const mockConfig = {
  // Verification system configuration
  requiredConfirmations: {
    BEP20: 10,
    POLYGON: 15
  },
  verificationInterval: 30000, // 30 seconds
  paymentExpirationTime: 30 * 60 * 1000 // 30 minutes
};

/**
 * Initialize the payment verification system
 */
async function initializeVerificationSystem() {
  try {
    // Create the listener manager
    const listenerManager = new ListenerManager(mockDb);
    
    // Initialize blockchain listeners
    await listenerManager.initializeAll();
    
    // Create the payment processor
    const paymentProcessor = new PaymentProcessor(mockDb, null, listenerManager);
    
    // Initialize the payment processor
    await paymentProcessor.initialize();
    
    // Create the payment verification system
    const verificationSystem = new PaymentVerificationSystem(
      paymentProcessor,
      listenerManager,
      mockConfig
    );
    
    // Register event handlers
    verificationSystem.on('payment.verified', handlePaymentVerified);
    verificationSystem.on('payment.verification_pending', handleVerificationPending);
    verificationSystem.on('payment.verification_failed', handleVerificationFailed);
    verificationSystem.on('payment.session_expired', handleSessionExpired);
    
    // Start the verification system
    await verificationSystem.start();
    
    console.log('Payment verification system initialized and started');
    
    return {
      verificationSystem,
      paymentProcessor,
      listenerManager
    };
  } catch (error) {
    console.error('Failed to initialize payment verification system:', error);
    throw error;
  }
}

/**
 * Handle payment verified event
 * @param {Object} data - Event data
 */
function handlePaymentVerified(data) {
  console.log('Payment verified:', data);
  // In a real application, you might update UI, send notifications, etc.
}

/**
 * Handle verification pending event
 * @param {Object} data - Event data
 */
function handleVerificationPending(data) {
  console.log('Payment verification pending:', data);
  // In a real application, you might update UI, send notifications, etc.
}

/**
 * Handle verification failed event
 * @param {Object} data - Event data
 */
function handleVerificationFailed(data) {
  console.log('Payment verification failed:', data);
  // In a real application, you might update UI, send notifications, etc.
}

/**
 * Handle session expired event
 * @param {Object} data - Event data
 */
function handleSessionExpired(data) {
  console.log('Payment session expired:', data);
  // In a real application, you might update UI, send notifications, etc.
}

// Export the initialization function
module.exports = {
  initializeVerificationSystem
};
