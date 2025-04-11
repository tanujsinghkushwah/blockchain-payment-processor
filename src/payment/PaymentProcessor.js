/**
 * Payment Processor
 * This module handles the processing of cryptocurrency payments
 */
const EventEmitter = require('events');

class PaymentProcessor {
  /**
   * Constructor for the payment processor
   * @param {Object} db - Database connection object (optional)
   * @param {Object} sessionManager - Payment session manager (optional)
   * @param {Object} listenerManager - Blockchain listener manager (optional)
   */
  constructor(db = null, sessionManager = null, listenerManager = null) {
    this.db = db;
    this.sessionManager = sessionManager;
    this.listenerManager = listenerManager;
    this.eventEmitter = new EventEmitter();
    
    // Store local transactions in memory for simple tests
    this.transactions = {};
    
    // Set up event handlers for blockchain events
    this.setupEventHandlers();
  }

  /**
   * Initialize the payment processor
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Initialize blockchain listeners - REMOVED (Done externally now)
      // await this.listenerManager.initializeAll(); // Ensure this is removed/commented

      // Start blockchain listeners - REMOVED (Done externally now)
      // await this.listenerManager.startAll();

      console.log('Payment processor initialized');
    } catch (error) {
      console.error('Failed to initialize payment processor:', error);
      throw error;
    }
  }

  /**
   * Set up event handlers for blockchain events
   */
  setupEventHandlers() {
    // Only set up event handlers if listenerManager is provided
    if (!this.listenerManager) {
      console.log('No listenerManager provided to PaymentProcessor. Skipping event handler setup.');
      return;
    }

    // Handle transaction detection
    this.listenerManager.on('transaction.detected', async (data) => {
      try {
        console.log('Transaction detected:', data);
        
        // Get the transaction details
        const transaction = await this.getTransaction(data.transactionId);
        
        if (!transaction) {
          console.error(`Transaction ${data.transactionId} not found`);
          return;
        }
        
        // Get the payment session
        const session = await this.sessionManager.getSession(data.sessionId);
        
        if (!session) {
          console.error(`Session ${data.sessionId} not found`);
          return;
        }
        
        // Verify the payment amount
        if (this.verifyPaymentAmount(transaction, session)) {
          console.log(`Payment amount verified for session ${data.sessionId}`);
          
          // If transaction has enough confirmations, complete the payment
          if (transaction.confirmations >= this.getRequiredConfirmations(session.network)) {
            await this.completePayment(session.id, transaction.id);
          }
        } else {
          console.log(`Payment amount mismatch for session ${data.sessionId}`);
          // Handle underpayment or overpayment
          await this.handlePaymentAmountMismatch(session, transaction);
        }
        
        // Emit event for transaction detection
        this.eventEmitter.emit('payment.transaction_detected', {
          sessionId: session.id,
          transactionId: transaction.id,
          status: session.status
        });
      } catch (error) {
        console.error('Error handling transaction detection:', error);
      }
    });

    // Handle transaction confirmation
    this.listenerManager.on('transaction.confirmed', async (data) => {
      try {
        console.log('Transaction confirmed:', data);
        
        // Get the transaction details
        const transaction = await this.getTransaction(data.transactionId);
        
        if (!transaction) {
          console.error(`Transaction ${data.transactionId} not found`);
          return;
        }
        
        // Get the payment session
        const session = await this.sessionManager.getSession(data.sessionId);
        
        if (!session) {
          console.error(`Session ${data.sessionId} not found`);
          return;
        }
        
        // Complete the payment
        await this.completePayment(session.id, transaction.id);
        
        // Emit event for payment completion
        this.eventEmitter.emit('payment.completed', {
          sessionId: session.id,
          transactionId: transaction.id
        });
      } catch (error) {
        console.error('Error handling transaction confirmation:', error);
      }
    });
  }

  /**
   * Get a transaction by ID
   * @param {string} transactionId - The transaction ID
   * @returns {Promise<Object|null>} - The transaction or null if not found
   */
  async getTransaction(transactionId) {
    // In a real implementation, this would query the database
    // For this example, we'll return a mock transaction
    return {
      id: transactionId,
      txHash: 'mock_tx_hash',
      fromAddress: 'mock_from_address',
      toAddress: 'mock_to_address',
      amount: '100.00',
      currency: 'USDT',
      network: 'BEP20',
      confirmations: 12,
      status: 'CONFIRMED',
      detectedAt: new Date(),
      confirmedAt: new Date(),
      blockNumber: 12345678
    };
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
    // This would typically come from configuration
    return network === 'BEP20' ? 10 : 15;
  }

  /**
   * Complete a payment
   * @param {string} sessionId - The payment session ID
   * @param {string} transactionId - The transaction ID
   * @returns {Promise<Object>} - The updated session
   */
  async completePayment(sessionId, transactionId) {
    try {
      // Update the session status
      const updatedSession = await this.sessionManager.completeSession(sessionId, transactionId);
      
      console.log(`Payment completed for session ${sessionId}`);
      
      return updatedSession;
    } catch (error) {
      console.error(`Failed to complete payment for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Handle payment amount mismatch
   * @param {Object} session - The payment session
   * @param {Object} transaction - The transaction
   * @returns {Promise<void>}
   */
  async handlePaymentAmountMismatch(session, transaction) {
    // In a real implementation, this would handle underpayment or overpayment
    // For this example, we'll just log it
    const transactionAmount = parseFloat(transaction.amount);
    const sessionAmount = parseFloat(session.amount);
    
    if (transactionAmount < sessionAmount) {
      console.log(`Underpayment detected for session ${session.id}: expected ${sessionAmount}, received ${transactionAmount}`);
      
      // Update session metadata to track underpayment
      await this.sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          underpayment: {
            expected: sessionAmount,
            received: transactionAmount,
            transaction_id: transaction.id
          }
        }
      });
    } else {
      console.log(`Overpayment detected for session ${session.id}: expected ${sessionAmount}, received ${transactionAmount}`);
      
      // Update session metadata to track overpayment
      await this.sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          overpayment: {
            expected: sessionAmount,
            received: transactionAmount,
            transaction_id: transaction.id
          }
        }
      });
      
      // Complete the payment despite overpayment
      await this.completePayment(session.id, transaction.id);
    }
  }

  /**
   * Create a new payment session
   * @param {Object} data - Payment session data
   * @returns {Promise<Object>} - The created payment session
   */
  async createPaymentSession(data) {
    try {
      // Create a new payment session
      const session = await this.sessionManager.createSession(data);
      
      console.log(`Payment session created: ${session.id}`);
      
      // Emit event for session creation
      this.eventEmitter.emit('payment.session_created', {
        sessionId: session.id,
        amount: session.amount,
        currency: session.currency,
        network: session.network,
        address: session.address,
        expiresAt: session.expires_at
      });
      
      return session;
    } catch (error) {
      console.error('Failed to create payment session:', error);
      throw error;
    }
  }

  /**
   * Get a payment session by ID
   * @param {string} sessionId - The payment session ID
   * @returns {Promise<Object|null>} - The payment session or null if not found
   */
  async getPaymentSession(sessionId) {
    return this.sessionManager.getSession(sessionId);
  }

  /**
   * Recreate an expired payment session
   * @param {string} sessionId - The original session ID
   * @returns {Promise<Object>} - The new payment session
   */
  async recreatePaymentSession(sessionId) {
    try {
      // Recreate the session
      const newSession = await this.sessionManager.recreateSession(sessionId);
      
      console.log(`Payment session recreated: ${newSession.id} (original: ${sessionId})`);
      
      // Emit event for session recreation
      this.eventEmitter.emit('payment.session_recreated', {
        sessionId: newSession.id,
        originalSessionId: sessionId,
        amount: newSession.amount,
        currency: newSession.currency,
        network: newSession.network,
        address: newSession.address,
        expiresAt: newSession.expires_at
      });
      
      return newSession;
    } catch (error) {
      console.error(`Failed to recreate payment session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * List payment sessions with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - Array of payment sessions
   */
  async listPaymentSessions(filters = {}) {
    return this.sessionManager.listSessions(filters);
  }

  /**
   * Register an event handler
   * @param {string} event - The event name
   * @param {Function} handler - The event handler function
   */
  on(event, handler) {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Run maintenance tasks
   * @returns {Promise<void>}
   */
  async runMaintenance() {
    try {
      // Check for expired sessions
      const expiredCount = await this.sessionManager.checkExpiredSessions();
      
      if (expiredCount > 0) {
        console.log(`Expired ${expiredCount} payment sessions`);
      }
    } catch (error) {
      console.error('Failed to run maintenance tasks:', error);
      throw error;
    }
  }

  /**
   * Shutdown the payment processor
   */
  shutdown() {
    // Stop blockchain listeners
    this.listenerManager.stopAll();
    
    console.log('Payment processor shut down');
  }

  /**
   * Process a transaction directly
   * This method allows testing without the full blockchain listener
   * @param {Object} data - Transaction data from listener
   * @returns {Promise<Object>} - The processed transaction
   */
  async processTransaction(data) {
    try {
      console.log('Processing transaction:', data);
      
      // If we don't have a full sessionManager, just store the transaction
      if (!this.sessionManager) {
        // Store the transaction in memory
        this.transactions[data.transactionId] = data.transaction || {
          id: data.transactionId,
          sessionId: data.sessionId,
          // Add default values if transaction is not provided
          status: 'PENDING',
          detectedAt: new Date(),
          confirmedAt: null
        };
        
        // Emit event for payment detection
        this.eventEmitter.emit('payment.transaction_detected', {
          sessionId: data.sessionId,
          transactionId: data.transactionId,
          transaction: this.transactions[data.transactionId]
        });
        
        return this.transactions[data.transactionId];
      }
      
      // Regular processing logic with sessionManager goes here...
      // (The original code from the setupEventHandlers 'transaction.detected' listener)
      
      return null;
    } catch (error) {
      console.error('Error processing transaction:', error);
      throw error;
    }
  }

  /**
   * Get a transaction by ID
   * @param {string} transactionId - The transaction ID
   * @returns {Object|null} - The transaction or null if not found
   */
  getTransactionById(transactionId) {
    // Return from in-memory storage if exists
    if (this.transactions[transactionId]) {
      return this.transactions[transactionId];
    }
    
    // Otherwise use the regular getTransaction method
    return this.getTransaction(transactionId);
  }

  /**
   * Confirm a transaction directly
   * This method allows testing without the full blockchain listener
   * @param {Object} data - Transaction data from listener
   * @returns {Promise<Object>} - The confirmed transaction
   */
  async confirmTransaction(data) {
    try {
      console.log('Confirming transaction:', data);
      
      // If we don't have a full sessionManager, just update the transaction status
      if (!this.sessionManager) {
        if (!this.transactions[data.transactionId]) {
          console.error(`Transaction ${data.transactionId} not found`);
          return null;
        }
        
        // Update the transaction status
        this.transactions[data.transactionId].status = 'CONFIRMED';
        this.transactions[data.transactionId].confirmedAt = new Date();
        
        // Emit event for payment completion
        this.eventEmitter.emit('payment.completed', {
          sessionId: data.sessionId,
          transactionId: data.transactionId,
          transaction: this.transactions[data.transactionId]
        });
        
        return this.transactions[data.transactionId];
      }
      
      // Regular confirmation logic with sessionManager goes here...
      // (The original code from the setupEventHandlers 'transaction.confirmed' listener)
      
      return null;
    } catch (error) {
      console.error('Error confirming transaction:', error);
      throw error;
    }
  }
}

module.exports = PaymentProcessor;
