/**
 * Transactions API Controller
 * Handles API endpoints for transactions
 */
const { NotFoundError } = require('../utils/errors');

class TransactionsController {
  /**
   * Constructor for the transactions controller
   * @param {Object} paymentProcessor - Payment processor instance
   */
  constructor(paymentProcessor) {
    this.paymentProcessor = paymentProcessor;
  }

  /**
   * Get a transaction by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getTransaction(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the transaction
      const transaction = await this.paymentProcessor.getTransaction(id);
      
      if (!transaction) {
        throw new NotFoundError(`Transaction ${id} not found`);
      }
      
      // Return the transaction data
      res.status(200).json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List transactions with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async listTransactions(req, res, next) {
    try {
      const { session_id, status, network, from_date, to_date, page, limit } = req.query;
      
      // Build filters object
      const filters = {};
      
      if (session_id) filters.session_id = session_id;
      if (status) filters.status = status;
      if (network) filters.network = network;
      if (from_date) filters.from_date = new Date(from_date);
      if (to_date) filters.to_date = new Date(to_date);
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);
      
      // Get the transactions
      // In a real implementation, this would query the database
      // For this example, we'll return an empty array
      const transactions = [];
      
      // Return the transactions data
      res.status(200).json({
        data: transactions,
        pagination: {
          total: transactions.length,
          page: filters.page || 1,
          limit: filters.limit || 10,
          pages: Math.ceil(transactions.length / (filters.limit || 10))
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TransactionsController;
