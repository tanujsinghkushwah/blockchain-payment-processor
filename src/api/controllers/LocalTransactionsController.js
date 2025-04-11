/**
 * Local Transactions Controller
 * Handles API endpoints for locally stored transactions
 */

class LocalTransactionsController {
  constructor(transactionStorage, networkConfig) {
    this.transactionStorage = transactionStorage;
    this.networkConfig = networkConfig;
  }

  /**
   * Get all transactions with updated statuses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllTransactions(req, res) {
    try {
      // Update all transaction statuses from blockchain explorers
      await this.transactionStorage.updateAllTransactions();
      
      // Get all transactions from storage
      const transactions = this.transactionStorage.getAllTransactions();
      
      // Log full transaction objects for debugging
      console.log('Returning transactions:', JSON.stringify(transactions, null, 2));
      
      res.status(200).json({
        success: true,
        data: {
          count: transactions.length,
          transactions: transactions.map(tx => ({
            id: tx.id,
            sessionId: tx.sessionId,
            txHash: tx.txHash,
            fromAddress: tx.fromAddress,
            toAddress: tx.toAddress,
            amount: tx.amount,
            currency: tx.currency,
            network: tx.network,
            confirmations: tx.confirmations,
            status: tx.status,
            blockNumber: tx.blockNumber,
            detectedAt: tx.detectedAt,
            confirmedAt: tx.confirmedAt,
            updatedAt: tx.updatedAt
          }))
        }
      });
    } catch (error) {
      console.error('Error retrieving local transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transactions',
        message: error.message
      });
    }
  }

  /**
   * Get a specific transaction by hash with updated status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTransactionByHash(req, res) {
    try {
      const { txHash } = req.params;
      
      if (!txHash) {
        return res.status(400).json({
          success: false,
          error: 'Missing transaction hash parameter'
        });
      }
      
      // Get transaction from storage
      const transaction = this.transactionStorage.getTransactionByHash(txHash);
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }
      
      // Update transaction status from blockchain explorer
      const updatedTransaction = await this.transactionStorage.updateTransactionStatus(
        txHash,
        transaction.network
      );
      
      // Log full transaction object for debugging
      console.log('Returning transaction:', JSON.stringify(updatedTransaction, null, 2));
      
      // Ensure we return all transaction fields
      const fullTransaction = {
        id: updatedTransaction.id,
        sessionId: updatedTransaction.sessionId,
        txHash: updatedTransaction.txHash,
        fromAddress: updatedTransaction.fromAddress,
        toAddress: updatedTransaction.toAddress,
        amount: updatedTransaction.amount,
        currency: updatedTransaction.currency,
        network: updatedTransaction.network,
        confirmations: updatedTransaction.confirmations,
        status: updatedTransaction.status,
        blockNumber: updatedTransaction.blockNumber,
        detectedAt: updatedTransaction.detectedAt,
        confirmedAt: updatedTransaction.confirmedAt,
        updatedAt: updatedTransaction.updatedAt
      };
      
      res.status(200).json({
        success: true,
        data: fullTransaction
      });
    } catch (error) {
      console.error('Error retrieving transaction by hash:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transaction',
        message: error.message
      });
    }
  }
}

module.exports = LocalTransactionsController; 