/**
 * Network configuration for blockchain listeners
 */
// require('dotenv').config(); // REMOVED - Moved to main entry point

module.exports = {
  // BEP20 (Binance Smart Chain) configuration
  BEP20: {
    name: 'BEP20',
    displayName: 'Binance Smart Chain',
    tokenName: 'USDT-BEP20',
    tokenDecimals: 18,
    tokenContractAddress: '0x55d398326f99059ff775485246999027b3197955', // USDT on BSC
    requiredConfirmations: 10,
    explorerApiUrl: 'https://api.bscscan.com/api',
    explorerApiKey: process.env.BSCSCAN_API_KEY || '',
    pollingInterval: 30000, // 30 seconds
    isActive: true,
    blockTime: 3, // Average block time in seconds
  },
  
  // BEP20_TESTNET (Binance Smart Chain Testnet) configuration
  BEP20_TESTNET: {
    name: 'BEP20_TESTNET',
    displayName: 'BSC Testnet',
    rpcUrl: process.env.BSC_TESTNET_HTTPS_URL, // Use Infura HTTPS
    // wssRpcUrl: process.env.BSC_TESTNET_WSS_URL, // WSS not used for this polling approach
    tokenName: 'USDT-Testnet',
    tokenDecimals: 18, // Assuming standard 18 decimals for testnet USDT, adjust if needed
    tokenContractAddress: process.env.USDT_CONTRACT_ADDRESS_TESTNET, 
    recipientAddress: process.env.RECIPIENT_ADDRESS, 
    // Minimal ABI for Transfer event: event Transfer(address indexed from, address indexed to, uint256 value)
    abi: [
        'event Transfer(address indexed from, address indexed to, uint256 value)'
    ],
    requiredConfirmations: 2, // Lower confirmations for faster testing
    explorerApiUrl: 'https://api-testnet.bscscan.com/api', // Keep for reference
    explorerApiKey: process.env.BSCSCAN_API_KEY || '', // Keep for reference
    pollingInterval: 15000, // Poll more frequently for testing (15 seconds)
    isActive: true,
    blockTime: 3, // Average block time in seconds
  },
  
  // Polygon configuration
  POLYGON: {
    name: 'POLYGON',
    displayName: 'Polygon Network',
    tokenName: 'USDT-Polygon',
    tokenDecimals: 6,
    tokenContractAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT on Polygon
    requiredConfirmations: 15,
    explorerApiUrl: 'https://api.polygonscan.com/api',
    explorerApiKey: process.env.POLYGONSCAN_API_KEY || '',
    pollingInterval: 20000, // 20 seconds
    isActive: true,
    blockTime: 2, // Average block time in seconds
  }
};
