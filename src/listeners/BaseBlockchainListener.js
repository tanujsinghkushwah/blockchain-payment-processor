/**
 * Base class for blockchain listeners
 * This abstract class defines the common interface and functionality for all blockchain listeners
 */
class BaseBlockchainListener {
  /**
   * Constructor for the base blockchain listener
   * @param {Object} config - Network configuration object
   * @param {Object} db - Database connection object
   * @param {Object} eventEmitter - Event emitter for publishing events
   */
  constructor(config, db, eventEmitter) {
    if (this.constructor === BaseBlockchainListener) {
      throw new Error('BaseBlockchainListener is an abstract class and cannot be instantiated directly');
    }
    
    this.config = config;
    this.db = db;
    this.eventEmitter = eventEmitter;
    this.isRunning = false;
    this.pollingInterval = null;
    this.lastCheckedBlock = 0;
  }

  /**
   * Initialize the listener
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Get the last checked block from the database or use the current block
      this.lastCheckedBlock = await this.getLastCheckedBlock();
      console.log(`[${this.config.name}] Initialized listener, starting from block ${this.lastCheckedBlock}`);
      return true;
    } catch (error) {
      console.error(`[${this.config.name}] Failed to initialize listener:`, error);
      throw error;
    }
  }

  /**
   * Start the listener polling
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isRunning) {
      console.log(`[${this.config.name}] Listener is already running`);
      return;
    }

    try {
      await this.initialize();
      this.isRunning = true;
      
      // Start polling
      this.poll();
      
      // Set up interval for continuous polling
      this.pollingInterval = setInterval(() => {
        this.poll();
      }, this.config.pollingInterval);
      
      console.log(`[${this.config.name}] Listener started with polling interval of ${this.config.pollingInterval}ms`);
    } catch (error) {
      console.error(`[${this.config.name}] Failed to start listener:`, error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the listener
   */
  stop() {
    if (!this.isRunning) {
      console.log(`[${this.config.name}] Listener is not running`);
      return;
    }

    clearInterval(this.pollingInterval);
    this.pollingInterval = null;
    this.isRunning = false;
    console.log(`[${this.config.name}] Listener stopped`);
  }

  /**
   * Poll for new transactions
   * This method should be implemented by subclasses
   * @returns {Promise<void>}
   */
  async poll() {
    throw new Error('Method poll() must be implemented by subclass');
  }

  /**
   * Get the last checked block from the database
   * @returns {Promise<number>}
   */
  async getLastCheckedBlock() {
    // This would typically query the database for the last checked block
    // For now, we'll return a placeholder value
    // In a real implementation, this would be stored in the database
    return this.lastCheckedBlock || await this.getCurrentBlockNumber();
  }

  /**
   * Get the current block number from the blockchain
   * This method should be implemented by subclasses
   * @returns {Promise<number>}
   */
  async getCurrentBlockNumber() {
    throw new Error('Method getCurrentBlockNumber() must be implemented by subclass');
  }

  /**
   * Check for transactions to a specific address
   * This method should be implemented by subclasses
   * @param {string} address - The address to check for transactions
   * @param {number} fromBlock - The block to start checking from
   * @param {number} toBlock - The block to stop checking at
   * @returns {Promise<Array>} - Array of transactions
   */
  async checkAddressTransactions(address, fromBlock, toBlock) {
    throw new Error('Method checkAddressTransactions() must be implemented by subclass');
  }

  /**
   * Process a transaction
   * @param {Object} transaction - The transaction to process
   * @returns {Promise<void>}
   */
  async processTransaction(transaction) {
    try {
      // Check if this transaction is for one of our payment addresses
      const paymentAddress = await this.findPaymentAddressByAddress(transaction.to);
      
      if (!paymentAddress) {
        // Not our address, ignore
        return;
      }

      // Check if we've already processed this transaction
      const existingTx = await this.findTransactionByHash(transaction.hash);
      
      if (existingTx) {
        // Update confirmations if needed
        if (existingTx.confirmations < transaction.confirmations) {
          await this.updateTransactionConfirmations(existingTx.id, transaction.confirmations);
          
          // If transaction now has enough confirmations, mark as confirmed
          if (transaction.confirmations >= this.config.requiredConfirmations && 
              existingTx.status !== 'CONFIRMED') {
            await this.confirmTransaction(existingTx.id);
            
            // Emit event for payment completion
            this.eventEmitter.emit('transaction.confirmed', {
              transactionId: existingTx.id,
              sessionId: paymentAddress.sessionId
            });
          }
        }
        return;
      }

      // This is a new transaction, record it
      const newTx = await this.createTransaction({
        sessionId: paymentAddress.sessionId,
        txHash: transaction.hash,
        fromAddress: transaction.from,
        toAddress: transaction.to,
        amount: this.formatTokenAmount(transaction.value, this.config.tokenDecimals),
        currency: this.config.tokenName,
        network: this.config.name,
        confirmations: transaction.confirmations,
        status: transaction.confirmations >= this.config.requiredConfirmations ? 'CONFIRMED' : 'PENDING',
        detectedAt: new Date(),
        confirmedAt: transaction.confirmations >= this.config.requiredConfirmations ? new Date() : null,
        blockNumber: transaction.blockNumber
      });

      // Emit event for new transaction
      this.eventEmitter.emit('transaction.detected', {
        transactionId: newTx.id,
        sessionId: paymentAddress.sessionId
      });

      // If transaction has enough confirmations, mark payment as completed
      if (transaction.confirmations >= this.config.requiredConfirmations) {
        // Emit event for payment completion
        this.eventEmitter.emit('transaction.confirmed', {
          transactionId: newTx.id,
          sessionId: paymentAddress.sessionId
        });
      }

      console.log(`[${this.config.name}] Processed transaction ${transaction.hash} for address ${transaction.to}`);
    } catch (error) {
      console.error(`[${this.config.name}] Failed to process transaction:`, error);
      throw error;
    }
  }

  /**
   * Format token amount based on decimals
   * @param {string} amount - The amount in smallest unit
   * @param {number} decimals - The number of decimals
   * @returns {string} - Formatted amount
   */
  formatTokenAmount(amount, decimals) {
    return (BigInt(amount) / BigInt(10 ** decimals)).toString();
  }

  /**
   * Find a payment address by blockchain address
   * This would typically query the database
   * @param {string} address - The blockchain address
   * @returns {Promise<Object|null>} - Payment address object or null
   */
  async findPaymentAddressByAddress(address) {
    // This would typically query the database for the payment address
    // MODIFIED FOR TESTING: Check against the recipientAddress in config
    if (this.config.recipientAddress && 
        address.toLowerCase() === this.config.recipientAddress.toLowerCase()) {
        console.log(`[${this.config.name}] Matched incoming address ${address} to configured recipient address.`);
        // Return a mock object indicating a match. Include a mock sessionId.
        return { 
            address: this.config.recipientAddress,
            sessionId: 'mock_session_for_' + address // Provide a mock session ID 
        };
    }
    // Original mock behavior: return null if no match
    return null;
  }

  /**
   * Find a transaction by hash
   * This would typically query the database
   * @param {string} hash - The transaction hash
   * @returns {Promise<Object|null>} - Transaction object or null
   */
  async findTransactionByHash(hash) {
    // This would typically query the database for the transaction
    // For now, we'll return a placeholder
    // In a real implementation, this would query the database
    return null;
  }

  /**
   * Update transaction confirmations
   * This would typically update the database
   * @param {string} id - The transaction ID
   * @param {number} confirmations - The new confirmation count
   * @returns {Promise<void>}
   */
  async updateTransactionConfirmations(id, confirmations) {
    // This would typically update the database
    // For now, we'll just log
    console.log(`[${this.config.name}] Updated transaction ${id} confirmations to ${confirmations}`);
  }

  /**
   * Confirm a transaction
   * This would typically update the database
   * @param {string} id - The transaction ID
   * @returns {Promise<void>}
   */
  async confirmTransaction(id) {
    // This would typically update the database
    // For now, we'll just log
    console.log(`[${this.config.name}] Confirmed transaction ${id}`);
  }

  /**
   * Create a new transaction record
   * This would typically insert into the database
   * @param {Object} data - The transaction data
   * @returns {Promise<Object>} - The created transaction
   */
  async createTransaction(data) {
    // This would typically insert into the database
    // For now, we'll just log and return a placeholder
    console.log(`[${this.config.name}] Created transaction record:`, data);
    return {
      id: 'tx_' + Date.now(),
      ...data
    };
  }

  /**
   * Update the last checked block
   * @param {number} blockNumber - The block number
   * @returns {Promise<void>}
   */
  async updateLastCheckedBlock(blockNumber) {
    this.lastCheckedBlock = blockNumber;
    // This would typically update the database
    // For now, we'll just log
    console.log(`[${this.config.name}] Updated last checked block to ${blockNumber}`);
  }
}

module.exports = BaseBlockchainListener;
