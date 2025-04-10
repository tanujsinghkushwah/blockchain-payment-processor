/**
 * Payment Verification System
 * This module handles the verification of cryptocurrency payments
 */
const EventEmitter = require('events');

class PaymentVerificationSystem {
  /**
   * Constructor for the payment verification system
   * @param {Object} paymentProcessor - Payment processor instance
   * @param {Object} listenerManager - Blockchain listener manager instance
   * @param {Object} config - Configuration object
   */
  constructor(paymentProcessor, listenerManager, config) {
    this.paymentProcessor = paymentProcessor;
    this.listenerManager = listenerManager;
    this.config = config || {};
    this.eventEmitter = new EventEmitter();
    
    // Default configuration
    this.config.requiredConfirmations = this.config.requiredConfirmations || {
      BEP20: 10,
      POLYGON: 15
    };
    
    this.config.verificationInterval = this.config.verificationInterval || 30000; // 30 seconds
    this.config.paymentExpirationTime = this.config.paymentExpirationTime || 30 * 60 * 1000; // 30 minutes
    
    this.verificationInterval = null;
    this.isRunning = false;
    
    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize the verification system
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('Initializing payment verification system');
      
      // Ensure the payment processor and listener manager are initialized
      if (!this.paymentProcessor || !this.listenerManager) {
        throw new Error('Payment processor and listener manager are required');
      }
      
      console.log('Payment verification system initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize payment verification system:', error);
      throw error;
    }
  }

  /**
   * Start the verification system
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isRunning) {
      console.log('Payment verification system is already running');
      return;
    }

    try {
      await this.initialize();
      this.isRunning = true;
      
      // Start verification interval
      this.verificationInterval = setInterval(() => {
        this.verifyPendingPayments();
      }, this.config.verificationInterval);
      
      console.log(`Payment verification system started with interval of ${this.config.verificationInterval}ms`);
    } catch (error) {
      console.error('Failed to start payment verification system:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the verification system
   */
  stop() {
    if (!this.isRunning) {
      console.log('Payment verification system is not running');
      return;
    }

    clearInterval(this.verificationInterval);
    this.verificationInterval = null;
    this.isRunning = false;
    console.log('Payment verification system stopped');
  }

  /**
   * Set up event handlers for payment events
   */
  setupEventHandlers() {
    // Handle transaction detection
    this.paymentProcessor.on('payment.transaction_detected', async (data) => {
      try {
        console.log('Transaction detected for verification:', data);
        await this.verifyTransaction(data.transactionId, data.sessionId);
      } catch (error) {
        console.error('Error handling transaction detection:', error);
      }
    });
  }

  /**
   * Verify pending payments
   * @returns {Promise<void>}
   */
  async verifyPendingPayments() {
    try {
      console.log('Verifying pending payments');
      
      // Get all pending payment sessions
      const pendingSessions = await this.paymentProcessor.listPaymentSessions({
        status: 'PENDING'
      });
      
      console.log(`Found ${pendingSessions.length} pending payment sessions`);
      
      // Check each pending session
      for (const session of pendingSessions) {
        // Check if the session has expired
        if (this.hasSessionExpired(session)) {
          console.log(`Session ${session.id} has expired`);
          await this.paymentProcessor.sessionManager.expireSession(session.id);
          
          // Emit event for session expiration
          this.eventEmitter.emit('payment.session_expired', {
            sessionId: session.id
          });
          
          continue;
        }
        
        // Check if there are any transactions for this session
        // In a real implementation, this would query the database
        // For this example, we'll skip this step
      }
    } catch (error) {
      console.error('Error verifying pending payments:', error);
    }
  }

  /**
   * Verify a specific transaction
   * @param {string} transactionId - Transaction ID
   * @param {string} sessionId - Payment session ID
   * @returns {Promise<boolean>} - Whether the transaction is valid
   */
  async verifyTransaction(transactionId, sessionId) {
    try {
      console.log(`Verifying transaction ${transactionId} for session ${sessionId}`);
      
      // Get the transaction
      const transaction = await this.paymentProcessor.getTransaction(transactionId);
      
      if (!transaction) {
        console.error(`Transaction ${transactionId} not found`);
        return false;
      }
      
      // Get the session
      const session = await this.paymentProcessor.getPaymentSession(sessionId);
      
      if (!session) {
        console.error(`Session ${sessionId} not found`);
        return false;
      }
      
      // Verify the transaction
      const isValid = await this.validateTransaction(transaction, session);
      
      if (isValid) {
        console.log(`Transaction ${transactionId} is valid for session ${sessionId}`);
        
        // Check if the transaction has enough confirmations
        if (transaction.confirmations >= this.getRequiredConfirmations(session.network)) {
          console.log(`Transaction ${transactionId} has enough confirmations`);
          
          // Complete the payment
          await this.paymentProcessor.completePayment(sessionId, transactionId);
          
          // Emit event for payment verification
          this.eventEmitter.emit('payment.verified', {
            sessionId,
            transactionId,
            status: 'COMPLETED'
          });
        } else {
          console.log(`Transaction ${transactionId} needs more confirmations`);
          
          // Emit event for payment verification
          this.eventEmitter.emit('payment.verification_pending', {
            sessionId,
            transactionId,
            confirmations: transaction.confirmations,
            requiredConfirmations: this.getRequiredConfirmations(session.network)
          });
        }
        
        return true;
      } else {
        console.log(`Transaction ${transactionId} is invalid for session ${sessionId}`);
        
        // Emit event for payment verification failure
        this.eventEmitter.emit('payment.verification_failed', {
          sessionId,
          transactionId,
          reason: 'Invalid transaction'
        });
        
        return false;
      }
    } catch (error) {
      console.error(`Error verifying transaction ${transactionId}:`, error);
      
      // Emit event for payment verification error
      this.eventEmitter.emit('payment.verification_error', {
        sessionId,
        transactionId,
        error: error.message
      });
      
      return false;
    }
  }

  /**
   * Validate a transaction against a payment session
   * @param {Object} transaction - Transaction object
   * @param {Object} session - Payment session object
   * @returns {Promise<boolean>} - Whether the transaction is valid
   */
  async validateTransaction(transaction, session) {
    try {
      // Check if the transaction is for the correct network
      if (transaction.network !== session.network) {
        console.log(`Network mismatch: expected ${session.network}, got ${transaction.network}`);
        return false;
      }
      
      // Check if the transaction is for the correct currency
      if (transaction.currency !== session.currency) {
        console.log(`Currency mismatch: expected ${session.currency}, got ${transaction.currency}`);
        return false;
      }
      
      // Check if the transaction amount matches the expected amount
      const isAmountValid = this.verifyPaymentAmount(transaction, session);
      
      if (!isAmountValid) {
        console.log(`Amount mismatch: expected ${session.amount}, got ${transaction.amount}`);
        return false;
      }
      
      // Check if the transaction is to the correct address
      const sessionAddress = await this.getSessionAddress(session.id);
      
      if (!sessionAddress) {
        console.log(`No address found for session ${session.id}`);
        return false;
      }
      
      if (transaction.toAddress.toLowerCase() !== sessionAddress.toLowerCase()) {
        console.log(`Address mismatch: expected ${sessionAddress}, got ${transaction.toAddress}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating transaction:', error);
      return false;
    }
  }

  /**
   * Verify that the payment amount matches the expected amount
   * @param {Object} transaction - The transaction
   * @param {Object} session - The payment session
   * @returns {boolean} - Whether the payment amount is correct
   */
  verifyPaymentAmount(transaction, session) {
    // Convert amounts to numbers for comparison
    const transactionAmount = parseFloat(transaction.amount);
    const sessionAmount = parseFloat(session.amount);
    
    // Allow a small tolerance for rounding errors (0.1%)
    const tolerance = sessionAmount * 0.001;
    
    return Math.abs(transactionAmount - sessionAmount) <= tolerance;
  }

  /**
   * Get the required confirmations for a network
   * @param {string} network - The network type
   * @returns {number} - The required confirmations
   */
  getRequiredConfirmations(network) {
    return this.config.requiredConfirmations[network] || 10;
  }

  /**
   * Check if a session has expired
   * @param {Object} session - The payment session
   * @returns {boolean} - Whether the session has expired
   */
  hasSessionExpired(session) {
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    return now > expiresAt;
  }

  /**
   * Get the address for a payment session
   * @param {string} sessionId - The payment session ID
   * @returns {Promise<string|null>} - The address or null if not found
   */
  async getSessionAddress(sessionId) {
    // In a real implementation, this would query the database
    // For this example, we'll return a mock address
    return '0x1234567890abcdef1234567890abcdef12345678';
  }

  /**
   * Register an event handler
   * @param {string} event - The event name
   * @param {Function} handler - The event handler function
   */
  on(event, handler) {
    this.eventEmitter.on(event, handler);
  }
}

module.exports = PaymentVerificationSystem;
