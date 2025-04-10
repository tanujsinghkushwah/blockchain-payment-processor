/**
 * Polygon blockchain listener implementation
 * This class extends the BaseBlockchainListener to provide Polygon-specific functionality
 */
const axios = require('axios');
const BaseBlockchainListener = require('./BaseBlockchainListener');

class PolygonListener extends BaseBlockchainListener {
  /**
   * Constructor for the Polygon listener
   * @param {Object} config - Network configuration object
   * @param {Object} db - Database connection object
   * @param {Object} eventEmitter - Event emitter for publishing events
   */
  constructor(config, db, eventEmitter) {
    super(config, db, eventEmitter);
    this.apiClient = axios.create({
      baseURL: this.config.explorerApiUrl,
      timeout: 10000,
    });
  }

  /**
   * Poll for new transactions
   * @returns {Promise<void>}
   */
  async poll() {
    if (!this.isRunning) {
      return;
    }

    try {
      // Get current block number
      const currentBlock = await this.getCurrentBlockNumber();
      
      // If no new blocks, skip
      if (currentBlock <= this.lastCheckedBlock) {
        console.log(`[${this.config.name}] No new blocks since last check (${this.lastCheckedBlock})`);
        return;
      }

      console.log(`[${this.config.name}] Checking blocks from ${this.lastCheckedBlock + 1} to ${currentBlock}`);

      // Get all active payment addresses for this network
      const activeAddresses = await this.getActivePaymentAddresses();
      
      // If no active addresses, update last checked block and return
      if (!activeAddresses || activeAddresses.length === 0) {
        await this.updateLastCheckedBlock(currentBlock);
        return;
      }

      // Check for transactions to each address
      for (const address of activeAddresses) {
        const transactions = await this.checkAddressTransactions(
          address.address,
          this.lastCheckedBlock + 1,
          currentBlock
        );

        // Process each transaction
        for (const tx of transactions) {
          await this.processTransaction(tx);
        }
      }

      // Update last checked block
      await this.updateLastCheckedBlock(currentBlock);
    } catch (error) {
      console.error(`[${this.config.name}] Error during polling:`, error);
      // Don't update last checked block on error to retry on next poll
    }
  }

  /**
   * Get the current block number from the blockchain
   * @returns {Promise<number>}
   */
  async getCurrentBlockNumber() {
    try {
      const response = await this.apiClient.get('', {
        params: {
          module: 'proxy',
          action: 'eth_blockNumber',
          apikey: this.config.explorerApiKey,
        },
      });

      if (response.data.status === '1' || response.data.result) {
        // Convert hex block number to decimal
        const blockNumber = parseInt(response.data.result, 16);
        return blockNumber;
      } else {
        throw new Error(`Failed to get current block number: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`[${this.config.name}] Error getting current block number:`, error);
      throw error;
    }
  }

  /**
   * Check for USDT transactions to a specific address
   * @param {string} address - The address to check for transactions
   * @param {number} fromBlock - The block to start checking from
   * @param {number} toBlock - The block to stop checking at
   * @returns {Promise<Array>} - Array of transactions
   */
  async checkAddressTransactions(address, fromBlock, toBlock) {
    try {
      // First, check for token transfers to this address
      const response = await this.apiClient.get('', {
        params: {
          module: 'account',
          action: 'tokentx',
          address: address,
          startblock: fromBlock,
          endblock: toBlock,
          sort: 'asc',
          contractaddress: this.config.tokenContractAddress, // USDT contract address
          apikey: this.config.explorerApiKey,
        },
      });

      if (response.data.status === '1' && Array.isArray(response.data.result)) {
        // Filter for incoming transactions to our address
        const incomingTransactions = response.data.result.filter(tx => 
          tx.to.toLowerCase() === address.toLowerCase() && 
          tx.contractAddress.toLowerCase() === this.config.tokenContractAddress.toLowerCase()
        );

        // Map to our transaction format
        return incomingTransactions.map(tx => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          blockNumber: parseInt(tx.blockNumber),
          timeStamp: parseInt(tx.timeStamp),
          confirmations: parseInt(tx.confirmations),
        }));
      } else if (response.data.status === '0' && response.data.message === 'No transactions found') {
        return [];
      } else {
        throw new Error(`Failed to check address transactions: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`[${this.config.name}] Error checking address transactions:`, error);
      throw error;
    }
  }

  /**
   * Get all active payment addresses for this network
   * This would typically query the database
   * @returns {Promise<Array>} - Array of payment addresses
   */
  async getActivePaymentAddresses() {
    // This would typically query the database for active payment addresses
    // For now, we'll return a placeholder
    // In a real implementation, this would query the database
    return [];
  }
}

module.exports = PolygonListener;
