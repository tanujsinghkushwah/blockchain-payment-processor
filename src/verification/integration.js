/**
 * Integration with Main Application
 * This file demonstrates how to integrate the payment verification system with the main application
 */
require('dotenv').config(); // Load .env variables AT THE VERY START

const { startBlockchainPaymentSystem } = require('../index');
const { PaymentVerificationSystem } = require('./index');

/**
 * Initialize and start the complete blockchain payment system with verification
 */
async function startCompleteSystem() {
  try {
    console.log('Starting complete blockchain payment system with verification...');
    
    // Start the blockchain payment system (which initializes the payment processor and blockchain listeners)
    const { paymentProcessor, listenerManager, server } = await startBlockchainPaymentSystem();
    
    // Create and configure the payment verification system
    const verificationConfig = {
      requiredConfirmations: {
        BEP20: 10,
        POLYGON: 15
      },
      verificationInterval: 30000, // 30 seconds
      paymentExpirationTime: 30 * 60 * 1000 // 30 minutes
    };
    
    const verificationSystem = new PaymentVerificationSystem(
      paymentProcessor,
      listenerManager,
      verificationConfig
    );
    
    // Register event handlers
    verificationSystem.on('payment.verified', (data) => {
      console.log('Payment verified:', data);
      // In a real application, you might update UI, send notifications, etc.
    });
    
    verificationSystem.on('payment.verification_pending', (data) => {
      console.log('Payment verification pending:', data);
      // In a real application, you might update UI, send notifications, etc.
    });
    
    verificationSystem.on('payment.verification_failed', (data) => {
      console.log('Payment verification failed:', data);
      // In a real application, you might update UI, send notifications, etc.
    });
    
    verificationSystem.on('payment.session_expired', (data) => {
      console.log('Payment session expired:', data);
      // In a real application, you might update UI, send notifications, etc.
    });
    
    // Start the verification system
    await verificationSystem.start();
    
    console.log('Complete blockchain payment system with verification started successfully');
    console.log(`API server is running on http://localhost:${server.address().port}`);
    
    // Return all components
    return {
      paymentProcessor,
      listenerManager,
      verificationSystem,
      server
    };
  } catch (error) {
    console.error('Failed to start complete system:', error);
    throw error;
  }
}

// If this file is run directly, start the system
if (require.main === module) {
  startCompleteSystem()
    .then(() => {
      console.log('Complete blockchain payment system is ready to accept and verify payments');
    })
    .catch(error => {
      console.error('Failed to start complete system:', error);
      process.exit(1);
    });
}

// Export the start function
module.exports = {
  startCompleteSystem
};
