/**
 * Example usage of the payment processing module
 * This file demonstrates how to use the payment processing components
 */
const { AddressGenerator, PaymentSessionManager, PaymentProcessor } = require('./index');
const ListenerManager = require('../listeners/ListenerManager');

// In a real application, these would be database connections and configurations
const mockDb = {
  // Mock database methods would go here
};

const mockConfig = {
  // Mock configuration would go here
};

/**
 * Initialize the payment system
 */
async function initializePaymentSystem() {
  try {
    // Create the listener manager
    const listenerManager = new ListenerManager(mockDb);
    
    // Create the payment session manager
    const sessionManager = new PaymentSessionManager(mockDb, mockConfig);
    
    // Create the payment processor
    const paymentProcessor = new PaymentProcessor(mockDb, sessionManager, listenerManager);
    
    // Initialize the payment processor
    await paymentProcessor.initialize();
    
    // Register event handlers
    paymentProcessor.on('payment.session_created', handleSessionCreated);
    paymentProcessor.on('payment.transaction_detected', handleTransactionDetected);
    paymentProcessor.on('payment.completed', handlePaymentCompleted);
    
    console.log('Payment system initialized');
    
    return paymentProcessor;
  } catch (error) {
    console.error('Failed to initialize payment system:', error);
    throw error;
  }
}

/**
 * Handle session created event
 * @param {Object} data - Event data
 */
function handleSessionCreated(data) {
  console.log('Payment session created:', data);
  // In a real application, you might update UI, send notifications, etc.
}

/**
 * Handle transaction detected event
 * @param {Object} data - Event data
 */
function handleTransactionDetected(data) {
  console.log('Transaction detected for payment:', data);
  // In a real application, you might update UI, send notifications, etc.
}

/**
 * Handle payment completed event
 * @param {Object} data - Event data
 */
function handlePaymentCompleted(data) {
  console.log('Payment completed:', data);
  // In a real application, you might update UI, send notifications, etc.
}

/**
 * Create a payment session example
 * @param {Object} paymentProcessor - The payment processor
 */
async function createPaymentSessionExample(paymentProcessor) {
  try {
    const session = await paymentProcessor.createPaymentSession({
      amount: '100.00',
      currency: 'USDT',
      network: 'BEP20',
      client_reference_id: 'order_123456',
      metadata: {
        customer_id: 'cust_123',
        product_id: 'prod_456'
      },
      expiration_minutes: 30
    });
    
    console.log('Created payment session:', session);
    
    return session;
  } catch (error) {
    console.error('Failed to create payment session:', error);
    throw error;
  }
}

// Export the functions
module.exports = {
  initializePaymentSystem,
  createPaymentSessionExample
};
