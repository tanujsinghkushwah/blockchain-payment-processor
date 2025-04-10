/**
 * Payment Sessions API Controller
 * Handles API endpoints for payment sessions
 */
const { ValidationError, NotFoundError } = require('../utils/errors');

class PaymentSessionsController {
  /**
   * Constructor for the payment sessions controller
   * @param {Object} paymentProcessor - Payment processor instance
   */
  constructor(paymentProcessor) {
    this.paymentProcessor = paymentProcessor;
  }

  /**
   * Create a new payment session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async createSession(req, res, next) {
    try {
      const { amount, currency, network, client_reference_id, metadata, expiration_minutes } = req.body;
      
      // Validate required fields
      if (!amount) {
        throw new ValidationError('Amount is required', { amount: ['Amount is required'] });
      }
      
      if (!currency) {
        throw new ValidationError('Currency is required', { currency: ['Currency is required'] });
      }
      
      if (!network) {
        throw new ValidationError('Network is required', { network: ['Network is required'] });
      }
      
      // Create the payment session
      const session = await this.paymentProcessor.createPaymentSession({
        amount,
        currency,
        network,
        client_reference_id,
        metadata,
        expiration_minutes
      });
      
      // Return the session data
      res.status(200).json(session);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a payment session by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getSession(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the payment session
      const session = await this.paymentProcessor.getPaymentSession(id);
      
      if (!session) {
        throw new NotFoundError(`Payment session ${id} not found`);
      }
      
      // Return the session data
      res.status(200).json(session);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List payment sessions with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async listSessions(req, res, next) {
    try {
      const { status, network, client_reference_id, from_date, to_date, page, limit } = req.query;
      
      // Build filters object
      const filters = {};
      
      if (status) filters.status = status;
      if (network) filters.network = network;
      if (client_reference_id) filters.client_reference_id = client_reference_id;
      if (from_date) filters.from_date = new Date(from_date);
      if (to_date) filters.to_date = new Date(to_date);
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);
      
      // Get the payment sessions
      const sessions = await this.paymentProcessor.listPaymentSessions(filters);
      
      // Return the sessions data
      res.status(200).json({
        data: sessions,
        pagination: {
          total: sessions.length, // In a real implementation, this would be the total count
          page: filters.page || 1,
          limit: filters.limit || 10,
          pages: Math.ceil(sessions.length / (filters.limit || 10))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recreate an expired session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async recreateSession(req, res, next) {
    try {
      const { id } = req.params;
      
      // Recreate the payment session
      const session = await this.paymentProcessor.recreatePaymentSession(id);
      
      // Return the new session data
      res.status(200).json(session);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentSessionsController;
