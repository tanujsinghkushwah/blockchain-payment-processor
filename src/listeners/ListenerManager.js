/**
 * Blockchain Listener Manager
 * This module manages multiple blockchain listeners and provides a unified interface
 */
const EventEmitter = require('events');
const { createListener, supportedNetworks } = require('./index');

class ListenerManager {
  /**
   * Constructor for the listener manager
   * @param {Object} db - Database connection object
   */
  constructor(db) {
    this.db = db;
    this.listeners = {};
    this.eventEmitter = new EventEmitter();
    
    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize all supported network listeners
   * @returns {Promise<void>}
   */
  async initializeAll() {
    try {
      for (const network of supportedNetworks) {
        await this.initialize(network);
      }
      console.log('All blockchain listeners initialized');
    } catch (error) {
      console.error('Failed to initialize all listeners:', error);
      throw error;
    }
  }

  /**
   * Initialize a specific network listener
   * @param {string} networkType - The network type (BEP20 or POLYGON)
   * @returns {Promise<void>}
   */
  async initialize(networkType) {
    try {
      if (this.listeners[networkType]) {
        console.log(`Listener for ${networkType} already initialized`);
        return;
      }
      
      const listener = createListener(networkType, this.db, this.eventEmitter);
      await listener.initialize();
      
      this.listeners[networkType] = listener;
      console.log(`Listener for ${networkType} initialized`);
    } catch (error) {
      console.error(`Failed to initialize ${networkType} listener:`, error);
      throw error;
    }
  }

  /**
   * Start all initialized listeners
   * @returns {Promise<void>}
   */
  async startAll() {
    try {
      const promises = Object.values(this.listeners).map(listener => listener.start());
      await Promise.all(promises);
      console.log('All blockchain listeners started');
    } catch (error) {
      console.error('Failed to start all listeners:', error);
      throw error;
    }
  }

  /**
   * Start a specific network listener
   * @param {string} networkType - The network type (BEP20 or POLYGON)
   * @returns {Promise<void>}
   */
  async start(networkType) {
    try {
      const listener = this.listeners[networkType];
      
      if (!listener) {
        throw new Error(`Listener for ${networkType} not initialized`);
      }
      
      await listener.start();
      console.log(`Listener for ${networkType} started`);
    } catch (error) {
      console.error(`Failed to start ${networkType} listener:`, error);
      throw error;
    }
  }

  /**
   * Stop all running listeners
   */
  stopAll() {
    Object.values(this.listeners).forEach(listener => {
      if (listener.isRunning) {
        listener.stop();
      }
    });
    console.log('All blockchain listeners stopped');
  }

  /**
   * Stop a specific network listener
   * @param {string} networkType - The network type (BEP20 or POLYGON)
   */
  stop(networkType) {
    const listener = this.listeners[networkType];
    
    if (!listener) {
      console.log(`Listener for ${networkType} not initialized`);
      return;
    }
    
    if (listener.isRunning) {
      listener.stop();
      console.log(`Listener for ${networkType} stopped`);
    } else {
      console.log(`Listener for ${networkType} is not running`);
    }
  }

  /**
   * Set up event handlers for blockchain events
   */
  setupEventHandlers() {
    // Handle transaction detection
    this.eventEmitter.on('transaction.detected', async (data) => {
      console.log('Transaction detected:', data);
      // In a real implementation, this would update the payment session status
      // and potentially trigger notifications
    });

    // Handle transaction confirmation
    this.eventEmitter.on('transaction.confirmed', async (data) => {
      console.log('Transaction confirmed:', data);
      // In a real implementation, this would update the payment session status,
      // mark the payment as completed, and trigger notifications
    });
  }

  /**
   * Register an external event handler
   * @param {string} event - The event name
   * @param {Function} handler - The event handler function
   */
  on(event, handler) {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Get the status of all listeners
   * @returns {Object} - Status object with network types as keys
   */
  getStatus() {
    const status = {};
    
    for (const [networkType, listener] of Object.entries(this.listeners)) {
      status[networkType] = {
        isRunning: listener.isRunning,
        lastCheckedBlock: listener.lastCheckedBlock,
        networkConfig: {
          name: listener.config.name,
          displayName: listener.config.displayName,
          pollingInterval: listener.config.pollingInterval,
          requiredConfirmations: listener.config.requiredConfirmations
        }
      };
    }
    
    return status;
  }
}

module.exports = ListenerManager;
