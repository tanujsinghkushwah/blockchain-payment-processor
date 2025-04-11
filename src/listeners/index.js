/**
 * Factory for creating blockchain listeners
 * This module provides a factory function to create the appropriate listener based on network type
 */
const BEP20Listener = require('./BEP20Listener');
const PolygonListener = require('./PolygonListener');
const networkLoader = require('../config/networks');

/**
 * Get the latest network configurations
 * @returns {Object} The network configurations
 */
function getLatestNetworks() {
  if (typeof networkLoader === 'function') {
    return networkLoader();
  }
  return networkLoader.configs || networkLoader;
}

/**
 * Create a blockchain listener for the specified network
 * @param {string} networkType - The network type (BEP20 or POLYGON)
 * @param {Object} db - Database connection object
 * @param {Object} eventEmitter - Event emitter for publishing events
 * @returns {Object} - The appropriate blockchain listener instance
 */
function createListener(networkType, db, eventEmitter) {
  const networks = getLatestNetworks();
  const config = networks[networkType];
  
  if (!config) {
    throw new Error(`Unknown network type: ${networkType}`);
  }
  
  // --- DEBUG LOG --- Print the config being used
  console.log(`DEBUG: createListener using config for ${networkType}:`, JSON.stringify(config, null, 2)); 
  // --- END DEBUG LOG ---
  
  switch (networkType) {
    case 'BEP20':
    case 'BEP20_TESTNET':
      return new BEP20Listener(config, db, eventEmitter);
    case 'POLYGON':
      return new PolygonListener(config, db, eventEmitter);
    default:
      throw new Error(`No listener implementation for network type: ${networkType}`);
  }
}

// Get current networks for the supportedNetworks list
const currentNetworks = getLatestNetworks();

module.exports = {
  createListener,
  supportedNetworks: Object.keys(currentNetworks)
};
