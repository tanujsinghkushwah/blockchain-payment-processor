/**
 * Integration with Main Application
 * This file demonstrates how to integrate the payment verification system with the main application
 */
require('dotenv').config(); // Load .env variables AT THE VERY START

const { startBlockchainPaymentSystem } = require('../index');
const { PaymentVerificationSystem } = require('./index');

// --- Environment Variable Parsing ---
function getActiveNetworksFromEnv() {
  const networksEnv = process.env.ACTIVE_NETWORKS || '';
  console.log(`DEBUG: Read ACTIVE_NETWORKS from env: "${networksEnv}"`); // Debug log
  const networks = networksEnv.split(',').map(n => n.trim()).filter(n => n); // Split, trim, remove empty strings
  console.log('DEBUG: Parsed active networks from env:', networks); // Debug log
  return networks;
}
// --- End Environment Variable Parsing ---

/**
 * Initialize and start the complete blockchain payment system with verification
 */
async function startCompleteSystem(networksToStart) { // Accept networks argument
  try {
    console.log(`Starting complete blockchain payment system. Networks: ${networksToStart.length > 0 ? networksToStart.join(', ') : 'None Specified'}...`);
    
    // Pass networks to the underlying system start function
    const { paymentProcessor, listenerManager, server } = await startBlockchainPaymentSystem(networksToStart);
    
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
  const networksToStart = getActiveNetworksFromEnv(); // Get networks from ENV variable

  if (networksToStart.length === 0) {
    console.warn('No ACTIVE_NETWORKS environment variable set or it is empty. No listeners will be started. Set e.g., ACTIVE_NETWORKS=BEP20_TESTNET,POLYGON');
    // Decide if you want to proceed without listeners or exit
    // For now, we proceed, but API might be limited
  }

  startCompleteSystem(networksToStart) // Pass parsed networks
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
