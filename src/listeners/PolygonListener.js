/**
 * Polygon blockchain listener implementation
 * This class extends the BaseBlockchainListener to provide Polygon-specific functionality
 */
const { ethers } = require('ethers'); // Import ethers
const BaseBlockchainListener = require('./BaseBlockchainListener');

// Define the Transfer event interface for parsing logs
// Using a standard ABI string - ensure this matches your token
const transferEventInterface = new ethers.Interface([
  'event Transfer(address indexed from, address indexed to, uint256 value)'
]);

class PolygonListener extends BaseBlockchainListener {
  /**
   * Constructor for the Polygon listener
   * @param {Object} config - Network configuration object
   * @param {Object} db - Database connection object
   * @param {Object} eventEmitter - Event emitter for publishing events
   */
  constructor(config, db, eventEmitter) {
    super(config, db, eventEmitter);
    this.provider = null; // Initialize provider

    // --- Check for required config ---
    if (!this.config.rpcUrl) {
        throw new Error(`[${this.config.name}] Missing rpcUrl in configuration.`);
    }
    if (!this.config.tokenContractAddress) {
        throw new Error(`[${this.config.name}] Missing tokenContractAddress in configuration.`);
    }
    if (!this.config.recipientAddress) {
        throw new Error(`[${this.config.name}] Missing recipientAddress in configuration.`);
    }
    // --- Removed axios client initialization ---

    console.log(`[${this.config.name}] Configured for RPC Polling: ${this.config.rpcUrl}`);
  }

  /**
   * Initialize the JsonRpcProvider.
   * Overrides BaseBlockchainListener.initialize
   * @returns {Promise<boolean>} - True on success
   */
  async initialize() {
    try {
        console.log(`[${this.config.name}] Initializing JsonRpcProvider...`);
        this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
        // Test connection by getting block number
        this.lastCheckedBlock = await this.provider.getBlockNumber();
        console.log(`[${this.config.name}] Initialized JsonRpcProvider, starting from block ${this.lastCheckedBlock}`);
        return true;
      } catch (error) {
        console.error(`[${this.config.name}] Failed to initialize JsonRpcProvider:`, error);
        throw error;
      }
  }


  /**
   * Poll for new transactions using provider.getLogs().
   * Overrides BaseBlockchainListener.poll
   * @returns {Promise<void>}
   */
  async poll() {
    // console.log(`[${this.config.name}] DEBUG: Entering poll() method.`); // Optional debug log
    if (!this.isRunning || !this.provider) {
        console.warn(`[${this.config.name}] Poll skipped: Listener not running or provider not initialized.`);
        return;
    }

    try {
      // Get current block number using the new provider method
      // console.log(`[${this.config.name}] DEBUG: Calling provider.getBlockNumber...`); // Optional debug log
      const currentBlock = await this.getCurrentBlockNumber(); // Uses the new implementation
      // console.log(`[${this.config.name}] DEBUG: Got currentBlock: ${currentBlock}`); // Optional debug log

      let fromBlock = this.lastCheckedBlock + 1;

      // Avoid polling huge ranges on the first run after restart/initialization
      const blockRangeLimit = 500; // Limit block range to prevent overwhelming the RPC node
      if (currentBlock > fromBlock + blockRangeLimit) {
          console.warn(`[${this.config.name}] Large block range detected (${fromBlock} to ${currentBlock}). Polling limited range initially.`);
          fromBlock = currentBlock - (blockRangeLimit - 1); // Poll last N blocks
      }

      // If no new blocks, skip
      if (currentBlock < fromBlock) {
        // console.log(`[${this.config.name}] No new blocks since last check (${this.lastCheckedBlock})`); // Can be noisy
        return;
      }

      const toBlock = currentBlock;
      console.log(`[${this.config.name}] Checking blocks ${fromBlock} to ${toBlock} for recipient ${this.config.recipientAddress}`);

      // console.log(`[${this.config.name}] DEBUG: Calling checkAddressTransactions...`); // Optional debug log
      // Use the new checkAddressTransactions implementation targeting the configured recipient
      const transactions = await this.checkAddressTransactions(
        this.config.recipientAddress, // Pass recipient directly
        fromBlock,
        toBlock
      );
      // console.log(`[${this.config.name}] DEBUG: Got transactions count: ${transactions.length}`); // Optional debug log

      // Process each transaction
      for (const tx of transactions) {
        // console.log(`[${this.config.name}] DEBUG: Calling processTransaction for hash: ${tx.hash}`); // Optional debug log
        await this.processTransaction(tx);
        // console.log(`[${this.config.name}] DEBUG: Finished processTransaction for hash: ${tx.hash}`); // Optional debug log
      }

      // Update last checked block
      // console.log(`[${this.config.name}] DEBUG: Calling updateLastCheckedBlock with: ${toBlock}`); // Optional debug log
      await this.updateLastCheckedBlock(toBlock);
      // console.log(`[${this.config.name}] DEBUG: Finished updateLastCheckedBlock.`); // Optional debug log

    } catch (error) {
      console.error(`[${this.config.name}] Error during polling:`, error);
      // Decide whether to stop polling or just log and continue
      // Don't update last checked block on error to retry on next poll
    }
  }

  /**
   * Get the current block number from the provider.
   * Overrides BaseBlockchainListener.getCurrentBlockNumber
   * @returns {Promise<number>}
   */
  async getCurrentBlockNumber() {
    if (!this.provider) {
        // If called before initialize completes, try initializing first.
        console.warn(`[${this.config.name}] getCurrentBlockNumber called before provider was ready. Attempting initialization.`);
        await this.initialize();
        if (!this.provider) throw new Error('Provider initialization failed.');
    }
    try {
        const blockNumber = await this.provider.getBlockNumber();
        // console.log(`[${this.config.name}] DEBUG: getCurrentBlockNumber successful: ${blockNumber}`); // Optional debug log
        return blockNumber;
    } catch(error) {
        console.error(`[${this.config.name}] Error getting current block number via RPC:`, error);
        throw error; // Re-throw to be handled by caller (initialize or poll)
    }
  }

  /**
   * Check for USDT transactions to a specific address using provider.getLogs().
   * Overrides BaseBlockchainListener.checkAddressTransactions
   * @param {string} address - The recipient address to check for transactions
   * @param {number} fromBlock - The block to start checking from
   * @param {number} toBlock - The block to stop checking at
   * @returns {Promise<Array>} - Array of transaction objects
   */
  async checkAddressTransactions(address, fromBlock, toBlock) {
    if (!this.provider) throw new Error('Provider not initialized');

    // Define the filter for the Transfer event targeting the recipient
    const filter = {
      address: this.config.tokenContractAddress, // USDT contract address from config
      topics: [
        transferEventInterface.getEvent('Transfer').topicHash, // Signature hash of the event
        null, // Any sender address
        ethers.zeroPadValue(address, 32) // Recipient address, padded to 32 bytes for indexed topic
      ],
      fromBlock: fromBlock,
      toBlock: toBlock
    };

    try {
      // console.log(`[${this.config.name}] RPC Request: getLogs from ${fromBlock} to ${toBlock} for recipient ${address} on contract ${this.config.tokenContractAddress}`); // Optional debug log
      const logs = await this.provider.getLogs(filter);
      // console.log(`[${this.config.name}] RPC Response: Found ${logs.length} relevant logs.`); // Optional debug log

      const transactions = [];
      const currentBlockNumber = await this.provider.getBlockNumber(); // Get latest block once for confirmations

      for (const log of logs) {
          try {
              // Basic check if log has necessary properties
              if (!log.topics || !log.data || !log.transactionHash || typeof log.blockNumber !== 'number') {
                  console.warn(`[${this.config.name}] Skipping log due to missing properties:`, log);
                  continue;
              }

              const parsedLog = transferEventInterface.parseLog({ topics: log.topics, data: log.data });
              if (!parsedLog) {
                   console.warn(`[${this.config.name}] Failed to parse log:`, log);
                   continue;
              }

              // Check if the parsed recipient matches the intended recipient (topic filter should handle this, but double-check)
              if (parsedLog.args.to.toLowerCase() !== address.toLowerCase()) {
                  console.warn(`[${this.config.name}] Log recipient mismatch (should not happen with filter): Parsed=${parsedLog.args.to}, Expected=${address}`);
                  continue;
              }

              transactions.push({
                hash: log.transactionHash,
                from: parsedLog.args.from,
                to: parsedLog.args.to,
                value: parsedLog.args.value.toString(), // Raw value from event
                blockNumber: log.blockNumber,
                confirmations: currentBlockNumber - log.blockNumber + 1 // Simple confirmation estimate
                // timeStamp: block ? block.timestamp : undefined // Requires fetching block details - adds latency
              });
          } catch(parseError) {
              console.error(`[${this.config.name}] Error parsing log data:`, parseError, log);
          }
      }
      return transactions;

    } catch (error) {
      // Handle specific RPC errors if needed, e.g., block range too large
      if (error.message && error.message.includes('block range is too wide')) {
          console.error(`[${this.config.name}] Error fetching logs via RPC: Block range too wide (${fromBlock}-${toBlock}). Consider reducing the polling range or frequency.`);
      } else {
          console.error(`[${this.config.name}] Error fetching logs via RPC:`, error);
      }
      // Depending on the error, you might want to return [] or throw
      return []; // Return empty array on error to allow polling to continue
      // throw error; // Re-throw to be caught by poll() - might stop the listener
    }
  }

  // --- Remove getActivePaymentAddresses as it's no longer used by the updated poll method ---
  // /**
  //  * Get all active payment addresses for this network
  //  * This would typically query the database
  //  * @returns {Promise<Array>} - Array of payment addresses
  //  */
  // async getActivePaymentAddresses() {
  //   // This would typically query the database for active payment addresses
  //   // For now, we'll return a placeholder
  //   // In a real implementation, this would query the database
  //   return [];
  // }
}

module.exports = PolygonListener;
