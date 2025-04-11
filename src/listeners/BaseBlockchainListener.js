/**
 * Base class for blockchain listeners
 * This abstract class defines the common interface and functionality for all blockchain listeners
 */
const { ethers } = require('ethers'); // Ensure ethers is required for parsing units

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
   * Store a transaction
   * @param {Object} transactionData - Transaction data to store
   * @returns {Promise<Object>} - Stored transaction with ID
   */
  async storeTransaction(transactionData) {
    // Normally this would store in a database, but for simplicity we'll just add an ID
    const id = `tx_${Date.now()}`;
    const storedTx = {
      id,
      ...transactionData
    };
    
    return storedTx;
  }

  /**
   * Process a detected transaction
   * @param {Object} transaction - The transaction object from the event log
   * @returns {Promise<void>}
   */
  async processTransaction(transaction) {
    try {
      // Find the corresponding payment address (could be the main recipient address)
      const paymentAddress = await this.findPaymentAddressByAddress(transaction.to);
      if (!paymentAddress) {
        console.log(`[${this.config.name}] Ignoring transaction ${transaction.hash} - recipient address ${transaction.to} not tracked.`);
        return; // Ignore transactions to addresses we don't track
      }

      // --- Amount Verification Logic --- 
      if (this.config.targetAmount) {
        try {
          const targetAmountString = this.config.targetAmount;
          const decimals = this.config.tokenDecimals;
          // Convert target amount (e.g., "10.50") to smallest unit (BigInt)
          const targetAmountSmallestUnit = ethers.parseUnits(targetAmountString, decimals);
          
          // Calculate the lower bound (target - 5%)
          const fivePercent = (targetAmountSmallestUnit * 5n) / 100n;
          const lowerBound = targetAmountSmallestUnit - fivePercent;
          
          const receivedAmountSmallestUnit = BigInt(transaction.value);

          console.log(`[${this.config.name}] Verifying amount for tx ${transaction.hash}: Received ${receivedAmountSmallestUnit}, Target ${targetAmountSmallestUnit}, Lower Bound (-5%) ${lowerBound}`);
          
          // Check if received amount is >= lower bound
          if (receivedAmountSmallestUnit < lowerBound) {
            console.log(`[${this.config.name}] Ignoring transaction ${transaction.hash} - received amount ${receivedAmountSmallestUnit} is less than the allowed lower bound ${lowerBound}.`);
            return; // Ignore transaction if amount is too low
          }

          console.log(`[${this.config.name}] Transaction ${transaction.hash} amount ${receivedAmountSmallestUnit} meets criteria (>= ${lowerBound}).`);

        } catch (parseError) {
          console.error(`[${this.config.name}] Error parsing target amount "${this.config.targetAmount}" or received amount "${transaction.value}". Skipping amount check. Error:`, parseError);
          // Decide how to handle parsing errors - skip check or reject transaction? 
          // For now, we log and continue processing, effectively ignoring the amount check on error.
        }
      } else {
          console.log(`[${this.config.name}] No targetAmount configured for this network. Skipping amount check.`);
      }
      // --- End Amount Verification Logic ---

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
              sessionId: paymentAddress.sessionId,
              transaction: existingTx // Include full transaction data
            });
          }
        }
        return;
      }

      // Create a new transaction record
      const formattedAmount = this.formatAmount(transaction.value, this.config.tokenDecimals);
      
      // Create transaction object to store
      const txRecord = {
        sessionId: paymentAddress.sessionId,
        txHash: transaction.hash,
        fromAddress: transaction.from,
        toAddress: transaction.to,
        amount: formattedAmount,
        currency: this.config.tokenName,
        network: this.config.name,
        confirmations: transaction.confirmations,
        status: 'PENDING',
        detectedAt: new Date(),
        confirmedAt: null,
        blockNumber: transaction.blockNumber
      };
      
      console.log(`[${this.config.name}] Created transaction record:`, txRecord);
      
      // Store transaction in database
      const storedTx = await this.storeTransaction(txRecord);
      
      // Emit event for payment detection
      this.eventEmitter.emit('transaction.detected', {
        transactionId: storedTx.id,
        sessionId: paymentAddress.sessionId,
        transaction: storedTx // Include full transaction data
      });
      
      // Check if we have enough confirmations to immediately confirm
      if (transaction.confirmations >= this.config.requiredConfirmations) {
        await this.confirmTransaction(storedTx.id);
        
        // Emit event for payment completion
        this.eventEmitter.emit('transaction.confirmed', {
          transactionId: storedTx.id,
          sessionId: paymentAddress.sessionId,
          transaction: storedTx // Include full transaction data
        });
      }
      
      console.log(`[${this.config.name}] Processed transaction ${transaction.hash} for address ${transaction.to}`);
    } catch (error) {
      console.error(`[${this.config.name}] Error processing transaction:`, error);
    }
  }

  /**
   * Format token amount from smallest unit to human-readable form
   * @param {string|number|BigInt} amount - Amount in smallest unit
   * @param {number} decimals - Token decimals
   * @returns {string} - Formatted amount
   */
  formatAmount(amount, decimals) {
    try {
      // Convert to string to handle BigInt
      const amountStr = amount.toString();
      
      // For 0 decimals, return as is
      if (decimals === 0) {
        return amountStr;
      }
      
      // For regular tokens with decimals, format properly
      const amountBigInt = BigInt(amountStr);
      const divisor = BigInt(10) ** BigInt(decimals);
      const wholePart = amountBigInt / divisor;
      const fractionalPart = amountBigInt % divisor;
      
      // Convert fractional part to string with leading zeros
      let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      
      // Remove trailing zeros from fractional part
      fractionalStr = fractionalStr.replace(/0+$/, '');
      
      if (fractionalStr === '') {
        return wholePart.toString();
      }
      
      return `${wholePart}.${fractionalStr}`;
    } catch (error) {
      console.error('Error formatting amount:', error);
      return amount.toString();
    }
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
