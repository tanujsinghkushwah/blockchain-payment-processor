/**
 * Integration with Main Application
 * This file demonstrates how to integrate the payment verification system with the main application
 */
// IMPORTANT: Load .env variables AFTER checking command line arguments
// require('dotenv').config(); // MOVED - Will be loaded after command line parsing

const { startBlockchainPaymentSystem } = require('../index');
const { PaymentVerificationSystem } = require('./index');

// --- Environment Variable Parsing ---
function getActiveNetworksFromEnv() {
  const networksEnv = process.env.ACTIVE_NETWORKS || '';
  // console.log(`DEBUG: Read ACTIVE_NETWORKS from env: \"${networksEnv}\"`); // Debug log - Removed for security
  const networks = networksEnv.split(',').map(n => n.trim()).filter(n => n); // Split, trim, remove empty strings
  // console.log('DEBUG: Parsed active networks from env:', networks); // Debug log - Removed for security
  return networks;
}

// --- Parse arguments for TARGET_USDT_AMOUNT ---
function parseArguments() {
  // console.log('DEBUG: Parsing command line arguments...'); // Removed for security
  // console.log('DEBUG: process.argv =', process.argv); // Removed for security
  
  // Important - store original values before any .env file loading
  const originalEnv = {
    targetAmount: process.env.TARGET_USDT_AMOUNT,
    senderAddress: process.env.SENDER_ADDRESS,
    recipientAddressBnb: process.env.RECIPIENT_ADDRESS_BNB_MAINNET,
    recipientAddressPolygon: process.env.RECIPIENT_ADDRESS_POLYGON_MAINNET,
  };
  
  // Now load .env file AFTER storing original command line values
  require('dotenv').config();
  
  // Check if TARGET_USDT_AMOUNT exists in env before parsing
  // console.log(`DEBUG: TARGET_USDT_AMOUNT in env before parsing: ${process.env.TARGET_USDT_AMOUNT}`); // Removed for security
  // console.log(`DEBUG: SENDER_ADDRESS in env before parsing: ${process.env.SENDER_ADDRESS}`); // Removed for security
  
  // Extract all arguments potentially containing TARGET_USDT_AMOUNT or recipient addresses
  // This includes directly from argv as well as from npm_config_* env variables
  const args = {};
  
  // Check normal command line arguments
  process.argv.forEach((arg) => {
    if (arg.startsWith('--TARGET_USDT_AMOUNT=')) {
      args.targetAmount = arg.split('=')[1];
      // console.log(`DEBUG: Found TARGET_USDT_AMOUNT in direct arguments: ${args.targetAmount}`); // Removed for security
    }
    if (arg.startsWith('--SENDER_ADDRESS=')) {
      args.senderAddress = arg.split('=')[1];
      // console.log(`DEBUG: Found SENDER_ADDRESS in direct arguments: ${args.senderAddress}`); // Removed for security
    }
    if (arg.startsWith('--RECIPIENT_ADDRESS_BNB_MAINNET=')) {
      args.recipientAddressBnb = arg.split('=')[1];
      // console.log(`DEBUG: Found RECIPIENT_ADDRESS_BNB_MAINNET in direct arguments: ${args.recipientAddressBnb}`); // Removed for security
    }
    if (arg.startsWith('--RECIPIENT_ADDRESS_POLYGON_MAINNET=')) {
      args.recipientAddressPolygon = arg.split('=')[1];
      // console.log(`DEBUG: Found RECIPIENT_ADDRESS_POLYGON_MAINNET in direct arguments: ${args.recipientAddressPolygon}`); // Removed for security
    }
    if (arg.startsWith('--BSCSCAN_API_KEY=')) {
      args.bscscanApiKey = arg.split('=')[1];
      // console.log(`DEBUG: Found BSCSCAN_API_KEY in direct arguments`); // Removed for security
    }
    if (arg.startsWith('--POLYGONSCAN_API_KEY=')) {
      args.polygonscanApiKey = arg.split('=')[1];
      // console.log(`DEBUG: Found POLYGONSCAN_API_KEY in direct arguments`); // Removed for security
    }
    if (arg.startsWith('--BSC_MAINNET_HTTPS_URL=')) {
      args.bscMainnetUrl = arg.split('=')[1];
      // console.log(`DEBUG: Found BSC_MAINNET_HTTPS_URL in direct arguments`); // Removed for security
    }
    if (arg.startsWith('--POLYGON_MAINNET_HTTPS_URL=')) {
      args.polygonMainnetUrl = arg.split('=')[1];
      // console.log(`DEBUG: Found POLYGON_MAINNET_HTTPS_URL in direct arguments`); // Removed for security
    }
  });
  
  // Check npm_config_* environment variables (npm passes arguments this way)
  const npmConfigPrefix = 'npm_config_';
  Object.keys(process.env).forEach(key => {
    if (key.toLowerCase() === 'npm_config_target_usdt_amount') {
      args.targetAmount = process.env[key];
      // console.log(`DEBUG: Found TARGET_USDT_AMOUNT in npm config env: ${args.targetAmount}`); // Removed for security
    }
    if (key.toLowerCase() === 'npm_config_sender_address') {
      args.senderAddress = process.env[key];
      // console.log(`DEBUG: Found SENDER_ADDRESS in npm config env: ${args.senderAddress}`); // Removed for security
    }
    if (key.toLowerCase() === 'npm_config_recipient_address_bnb_mainnet') {
      args.recipientAddressBnb = process.env[key];
      // console.log(`DEBUG: Found RECIPIENT_ADDRESS_BNB_MAINNET in npm config env: ${args.recipientAddressBnb}`); // Removed for security
    }
    if (key.toLowerCase() === 'npm_config_recipient_address_polygon_mainnet') {
      args.recipientAddressPolygon = process.env[key];
      // console.log(`DEBUG: Found RECIPIENT_ADDRESS_POLYGON_MAINNET in npm config env: ${args.recipientAddressPolygon}`); // Removed for security
    }
    if (key.toLowerCase() === 'npm_config_bscscan_api_key') {
      args.bscscanApiKey = process.env[key];
      // console.log(`DEBUG: Found BSCSCAN_API_KEY in npm config env`); // Removed for security
    }
    if (key.toLowerCase() === 'npm_config_polygonscan_api_key') {
      args.polygonscanApiKey = process.env[key];
      // console.log(`DEBUG: Found POLYGONSCAN_API_KEY in npm config env`); // Removed for security
    }
    if (key.toLowerCase() === 'npm_config_bsc_mainnet_https_url') {
      args.bscMainnetUrl = process.env[key];
      // console.log(`DEBUG: Found BSC_MAINNET_HTTPS_URL in npm config env`); // Removed for security
    }
    if (key.toLowerCase() === 'npm_config_polygon_mainnet_https_url') {
      args.polygonMainnetUrl = process.env[key];
      // console.log(`DEBUG: Found POLYGON_MAINNET_HTTPS_URL in npm config env`); // Removed for security
    }
  });
  
  // RESTORE command line values that were saved before loading .env
  // These should have higher priority than .env settings
  if (originalEnv.targetAmount) {
    args.targetAmount = originalEnv.targetAmount;
    // console.log(`DEBUG: Restoring original TARGET_USDT_AMOUNT from command line: ${args.targetAmount}`); // Removed for security
  }
  
  if (originalEnv.senderAddress) {
    args.senderAddress = originalEnv.senderAddress;
    // console.log(`DEBUG: Restoring original SENDER_ADDRESS from command line: ${args.senderAddress}`); // Removed for security
  }
  
  if (originalEnv.recipientAddressBnb) {
    args.recipientAddressBnb = originalEnv.recipientAddressBnb;
    // console.log(`DEBUG: Restoring original RECIPIENT_ADDRESS_BNB_MAINNET from command line: ${args.recipientAddressBnb}`); // Removed for security
  }
  
  if (originalEnv.recipientAddressPolygon) {
    args.recipientAddressPolygon = originalEnv.recipientAddressPolygon;
    // console.log(`DEBUG: Restoring original RECIPIENT_ADDRESS_POLYGON_MAINNET from command line: ${args.recipientAddressPolygon}`); // Removed for security
  }
  
  // Only check environment variables as a last resort if nothing was found in command line arguments
  // We check these AFTER the originals to ensure command line args have highest priority
  if (!args.targetAmount && process.env.TARGET_USDT_AMOUNT) {
    args.targetAmount = process.env.TARGET_USDT_AMOUNT;
    // console.log(`DEBUG: Using TARGET_USDT_AMOUNT from .env file: ${args.targetAmount}`); // Removed for security
  }
  
  if (!args.senderAddress && process.env.SENDER_ADDRESS) {
    args.senderAddress = process.env.SENDER_ADDRESS;
    // console.log(`DEBUG: Using SENDER_ADDRESS from .env file: ${args.senderAddress}`); // Removed for security
  }
  
  if (!args.recipientAddressBnb && process.env.RECIPIENT_ADDRESS_BNB_MAINNET) {
    args.recipientAddressBnb = process.env.RECIPIENT_ADDRESS_BNB_MAINNET;
    // console.log(`DEBUG: Using RECIPIENT_ADDRESS_BNB_MAINNET from .env file: ${args.recipientAddressBnb}`); // Removed for security
  }
  
  if (!args.recipientAddressPolygon && process.env.RECIPIENT_ADDRESS_POLYGON_MAINNET) {
    args.recipientAddressPolygon = process.env.RECIPIENT_ADDRESS_POLYGON_MAINNET;
    // console.log(`DEBUG: Using RECIPIENT_ADDRESS_POLYGON_MAINNET from .env file: ${args.recipientAddressPolygon}`); // Removed for security
  }
  
  // Handle API keys and URLs with correct priority
  if (!args.bscscanApiKey && process.env.BSCSCAN_API_KEY) {
    args.bscscanApiKey = process.env.BSCSCAN_API_KEY;
    // console.log(`DEBUG: Using BSCSCAN_API_KEY from .env file`); // Removed for security
  }
  
  if (!args.polygonscanApiKey && process.env.POLYGONSCAN_API_KEY) {
    args.polygonscanApiKey = process.env.POLYGONSCAN_API_KEY;
    // console.log(`DEBUG: Using POLYGONSCAN_API_KEY from .env file`); // Removed for security
  }
  
  if (!args.bscMainnetUrl && process.env.BSC_MAINNET_HTTPS_URL) {
    args.bscMainnetUrl = process.env.BSC_MAINNET_HTTPS_URL;
    // console.log(`DEBUG: Using BSC_MAINNET_HTTPS_URL from .env file`); // Removed for security
  }
  
  if (!args.polygonMainnetUrl && process.env.POLYGON_MAINNET_HTTPS_URL) {
    args.polygonMainnetUrl = process.env.POLYGON_MAINNET_HTTPS_URL;
    // console.log(`DEBUG: Using POLYGON_MAINNET_HTTPS_URL from .env file`); // Removed for security
  }
  
  // Set the environment variables with command line args having highest priority
  
  // If TARGET_USDT_AMOUNT was found, override the env var
  if (args.targetAmount) {
    process.env.TARGET_USDT_AMOUNT = args.targetAmount;
    console.log(`Setting TARGET_USDT_AMOUNT to ${args.targetAmount}`);
    
    // Verify it was set
    // console.log(`DEBUG: TARGET_USDT_AMOUNT in env after setting: ${process.env.TARGET_USDT_AMOUNT}`); // Removed for security
  } else {
    // console.log('DEBUG: No TARGET_USDT_AMOUNT found in command line arguments or environment'); // Removed for security
  }
  
  // If SENDER_ADDRESS was found, override the env var
  if (args.senderAddress) {
    process.env.SENDER_ADDRESS = args.senderAddress;
    console.log(`Setting SENDER_ADDRESS to ${args.senderAddress}`);
    
    // Verify it was set
    // console.log(`DEBUG: SENDER_ADDRESS in env after setting: ${process.env.SENDER_ADDRESS}`); // Removed for security
  } else {
    // console.log('DEBUG: No SENDER_ADDRESS found in command line arguments or environment'); // Removed for security
  }
  
  // If RECIPIENT_ADDRESS_BNB_MAINNET was found, override the env var
  if (args.recipientAddressBnb) {
    process.env.RECIPIENT_ADDRESS_BNB_MAINNET = args.recipientAddressBnb;
    console.log(`Setting RECIPIENT_ADDRESS_BNB_MAINNET to ${args.recipientAddressBnb}`);
    
    // Verify it was set
    // console.log(`DEBUG: RECIPIENT_ADDRESS_BNB_MAINNET in env after setting: ${process.env.RECIPIENT_ADDRESS_BNB_MAINNET}`); // Removed for security
  } else {
    // console.log('DEBUG: No RECIPIENT_ADDRESS_BNB_MAINNET found in command line arguments or environment'); // Removed for security
  }
  
  // If RECIPIENT_ADDRESS_POLYGON_MAINNET was found, override the env var
  if (args.recipientAddressPolygon) {
    process.env.RECIPIENT_ADDRESS_POLYGON_MAINNET = args.recipientAddressPolygon;
    console.log(`Setting RECIPIENT_ADDRESS_POLYGON_MAINNET to ${args.recipientAddressPolygon}`);
    
    // Verify it was set
    // console.log(`DEBUG: RECIPIENT_ADDRESS_POLYGON_MAINNET in env after setting: ${process.env.RECIPIENT_ADDRESS_POLYGON_MAINNET}`); // Removed for security
  } else {
    // console.log('DEBUG: No RECIPIENT_ADDRESS_POLYGON_MAINNET found in command line arguments or environment'); // Removed for security
  }
  
  // If BSCSCAN_API_KEY was found, override the env var
  if (args.bscscanApiKey) {
    process.env.BSCSCAN_API_KEY = args.bscscanApiKey;
    console.log(`Setting BSCSCAN_API_KEY to new value`);
    
    // Verify it was set
    // console.log(`DEBUG: BSCSCAN_API_KEY in env after setting is present: ${!!process.env.BSCSCAN_API_KEY}`); // Removed for security
  } else {
    // console.log('DEBUG: No BSCSCAN_API_KEY found in command line arguments'); // Removed for security
  }
  
  // If POLYGONSCAN_API_KEY was found, override the env var
  if (args.polygonscanApiKey) {
    process.env.POLYGONSCAN_API_KEY = args.polygonscanApiKey;
    console.log(`Setting POLYGONSCAN_API_KEY to new value`);
    
    // Verify it was set
    // console.log(`DEBUG: POLYGONSCAN_API_KEY in env after setting is present: ${!!process.env.POLYGONSCAN_API_KEY}`); // Removed for security
  } else {
    // console.log('DEBUG: No POLYGONSCAN_API_KEY found in command line arguments'); // Removed for security
  }
  
  // If BSC_MAINNET_HTTPS_URL was found, override the env var
  if (args.bscMainnetUrl) {
    process.env.BSC_MAINNET_HTTPS_URL = args.bscMainnetUrl;
    console.log(`Setting BSC_MAINNET_HTTPS_URL to new value`);
    
    // Verify it was set
    // console.log(`DEBUG: BSC_MAINNET_HTTPS_URL in env after setting is present: ${!!process.env.BSC_MAINNET_HTTPS_URL}`); // Removed for security
  } else {
    // console.log('DEBUG: No BSC_MAINNET_HTTPS_URL found in command line arguments'); // Removed for security
  }
  
  // If POLYGON_MAINNET_HTTPS_URL was found, override the env var
  if (args.polygonMainnetUrl) {
    process.env.POLYGON_MAINNET_HTTPS_URL = args.polygonMainnetUrl;
    console.log(`Setting POLYGON_MAINNET_HTTPS_URL to new value`);
    
    // Verify it was set
    // console.log(`DEBUG: POLYGON_MAINNET_HTTPS_URL in env after setting is present: ${!!process.env.POLYGON_MAINNET_HTTPS_URL}`); // Removed for security
  } else {
    // console.log('DEBUG: No POLYGON_MAINNET_HTTPS_URL found in command line arguments'); // Removed for security
  }
  
  return args;
}
// --- End Parse arguments ---
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
  // Parse command line arguments before we check for networks
  parseArguments();
  
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
