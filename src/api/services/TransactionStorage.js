/**
 * Transaction Storage Service
 * Keeps track of all detected transaction in memory while the server is running
 */

const axios = require('axios');

class TransactionStorage {
  constructor(networkConfig) {
    this.transactions = [];
    this.networkConfig = networkConfig;
  }

  /**
   * Add a new transaction to the storage
   * @param {Object} transaction - Transaction object to store
   */
  addTransaction(transaction) {
    // Check if transaction already exists
    const existingTxIndex = this.transactions.findIndex(tx => tx.txHash === transaction.txHash);
    
    // Ensure we have all required fields with proper defaults
    const txData = {
      id: transaction.id,
      sessionId: transaction.sessionId,
      txHash: transaction.txHash,
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount: transaction.amount,
      currency: transaction.currency,
      network: transaction.network,
      confirmations: transaction.confirmations || 0,
      status: transaction.status || 'PENDING',
      blockNumber: transaction.blockNumber,
      detectedAt: transaction.detectedAt || new Date(),
      confirmedAt: transaction.confirmedAt || null,
      updatedAt: new Date()
    };
    
    if (existingTxIndex !== -1) {
      // Update existing transaction
      this.transactions[existingTxIndex] = {
        ...this.transactions[existingTxIndex],
        ...txData
      };
    } else {
      // Add new transaction
      this.transactions.push(txData);
    }
  }

  /**
   * Get all stored transactions
   * @returns {Array} All transactions
   */
  getAllTransactions() {
    return this.transactions;
  }

  /**
   * Get transaction by hash
   * @param {string} txHash - Transaction hash to find
   * @returns {Object|null} Transaction or null if not found
   */
  getTransactionByHash(txHash) {
    return this.transactions.find(tx => tx.txHash === txHash) || null;
  }

  /**
   * Update transaction status by checking the blockchain explorer
   * @param {string} txHash - Transaction hash to update
   * @param {string} network - Network name (e.g., 'POLYGON', 'BEP20')
   * @returns {Promise<Object|null>} Updated transaction or null if not found
   */
  async updateTransactionStatus(txHash, network) {
    const txIndex = this.transactions.findIndex(tx => tx.txHash === txHash);
    if (txIndex === -1) return null;

    const tx = this.transactions[txIndex];
    const networkSettings = this.networkConfig[network];

    if (!networkSettings) {
      console.error(`Network ${network} not found in configuration`);
      return tx;
    }

    try {
      let apiUrl, params;
      const Web3 = require('web3');
      const web3 = new Web3(networkSettings.rpcUrl);

      // First, get current block number from the network
      const currentBlockNumber = await web3.eth.getBlockNumber();
      
      // Then check transaction receipt
      const receipt = await web3.eth.getTransactionReceipt(txHash);
      
      // Calculate confirmations if we have a receipt and block number
      let confirmations = 0;
      let status = tx.status;
      
      if (receipt) {
        // Calculate confirmations based on current block and transaction block
        confirmations = receipt.blockNumber ? currentBlockNumber - receipt.blockNumber + 1 : 0;
        
        // Update status based on receipt status and confirmations
        if (receipt.status) {
          if (confirmations >= networkSettings.requiredConfirmations) {
            status = 'CONFIRMED';
          } else {
            status = 'PENDING';
          }
        } else {
          status = 'FAILED';
        }
        
        // Update transaction
        const updatedTx = {
          ...tx,
          status,
          confirmations,
          blockNumber: receipt.blockNumber,
          confirmedAt: status === 'CONFIRMED' && !tx.confirmedAt ? new Date() : tx.confirmedAt,
          updatedAt: new Date()
        };
        
        this.transactions[txIndex] = updatedTx;
        return updatedTx;
      }
      
      // Fallback to explorer API if RPC doesn't provide enough info
      if (network === 'POLYGON' || network === 'BEP20' || network === 'BEP20_TESTNET') {
        apiUrl = networkSettings.explorerApiUrl;
        params = {
          module: 'transaction',
          action: 'gettxreceiptstatus',
          txhash: txHash,
          apikey: networkSettings.explorerApiKey
        };

        const response = await axios.get(apiUrl, { params });
        
        if (response.data.status === '1') {
          // Transaction confirmed according to explorer
          const updatedTx = {
            ...tx,
            status: 'CONFIRMED',
            confirmations: networkSettings.requiredConfirmations,
            confirmedAt: tx.confirmedAt || new Date(),
            updatedAt: new Date()
          };
          
          this.transactions[txIndex] = updatedTx;
          return updatedTx;
        }
      }
      
      // No updates, return current transaction
      return tx;
    } catch (error) {
      console.error(`Error updating transaction status: ${error.message}`);
      return tx;
    }
  }

  /**
   * Update all transactions by checking blockchain explorers
   * @returns {Promise<Array>} Updated transactions
   */
  async updateAllTransactions() {
    const updatePromises = this.transactions
      .filter(tx => tx.network && this.networkConfig[tx.network]) // Only update transactions with valid network
      .map(tx => this.updateTransactionStatus(tx.txHash, tx.network));
    
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }
    
    return this.transactions;
  }
}

module.exports = TransactionStorage; 